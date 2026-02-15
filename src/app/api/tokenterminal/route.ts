import { NextRequest, NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// Next.js ISR: cache this route's responses for 1 hour
// ---------------------------------------------------------------------------
export const revalidate = 3600;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const TOKENTERMINAL_BASE_URL = "https://api.tokenterminal.com/v2";

const DEFAULT_PROJECT_IDS = [
  "aave",
  "uniswap",
  "lido",
  "maker",
  "hyperliquid",
  "jupiter",
  "raydium",
  "tether",
  "circle",
  "ethereum",
  "solana",
  "base",
] as const;

const VALID_METRICS = ["fees", "revenue", "earnings"] as const;
type ValidMetric = (typeof VALID_METRICS)[number];

/** Small delay between sequential requests to respect rate limits. */
const RATE_LIMIT_DELAY_MS = 200;

// ---------------------------------------------------------------------------
// Types — shapes returned by this API route
// ---------------------------------------------------------------------------

/** A single quarterly data point for one project. */
interface QuarterlyMetric {
  project_id: string;
  period: string; // e.g. "Q1 2024"
  timestamp: string; // ISO date
  fees: number | null;
  revenue: number | null;
  earnings: number | null;
}

/** Aggregated project-level summary. */
interface ProjectSummary {
  project_id: string;
  latest_fees: number | null;
  latest_revenue: number | null;
  latest_earnings: number | null;
  quarterly_data: QuarterlyMetric[];
}

/** The top-level response payload. */
interface TokenTerminalMetricsResponse {
  source: "api" | "static";
  fetched_at: string;
  metric_ids: string[];
  projects: ProjectSummary[];
  errors: ProjectFetchError[];
}

interface ProjectFetchError {
  project_id: string;
  message: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Parse a comma-separated query param into a validated array.
 * Returns the default list when the param is absent or empty.
 */
function parseCSV<T extends string>(
  raw: string | null,
  allowed: readonly T[],
  fallback: readonly T[],
): T[] {
  if (!raw) return [...fallback];
  const items = raw
    .split(",")
    .map((s) => s.trim().toLowerCase() as T)
    .filter((s) => allowed.includes(s));
  return items.length > 0 ? items : [...fallback];
}

function parseProjectIds(raw: string | null): string[] {
  if (!raw) return [...DEFAULT_PROJECT_IDS];
  const ids = raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return ids.length > 0 ? ids : [...DEFAULT_PROJECT_IDS];
}

/**
 * Convert a TokenTerminal timestamp (ISO string or unix) into a human-
 * readable quarter label like "Q1 2024".
 */
function toQuarterLabel(ts: string | number): string {
  const date = new Date(typeof ts === "number" ? ts * 1000 : ts);
  const q = Math.ceil((date.getUTCMonth() + 1) / 3);
  return `Q${q} ${date.getUTCFullYear()}`;
}

// ---------------------------------------------------------------------------
// TokenTerminal API interaction
// ---------------------------------------------------------------------------

async function fetchProjectMetrics(
  projectId: string,
  metricIds: ValidMetric[],
  apiKey: string,
): Promise<{ data: QuarterlyMetric[]; error: ProjectFetchError | null }> {
  const url = new URL(
    `${TOKENTERMINAL_BASE_URL}/projects/${projectId}/metrics`,
  );
  url.searchParams.set("metric_ids", metricIds.join(","));
  url.searchParams.set("interval", "quarterly");

  try {
    const res = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
      },
      // Next.js extended fetch — cache with revalidation
      next: { revalidate: 3600 },
    } as RequestInit);

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return {
        data: [],
        error: {
          project_id: projectId,
          message: `HTTP ${res.status}: ${body.slice(0, 200)}`,
        },
      };
    }

    const json = await res.json();

    // TokenTerminal v2 returns { data: [...] } for metric endpoints
    const rawData: Record<string, unknown>[] = Array.isArray(json)
      ? json
      : Array.isArray(json?.data)
        ? json.data
        : [];

    const quarterly: QuarterlyMetric[] = rawData.map((entry) => ({
      project_id: projectId,
      period: toQuarterLabel(
        (entry.timestamp as string) ?? (entry.date as string) ?? "",
      ),
      timestamp: String(entry.timestamp ?? entry.date ?? ""),
      fees: typeof entry.fees === "number" ? entry.fees : null,
      revenue: typeof entry.revenue === "number" ? entry.revenue : null,
      earnings: typeof entry.earnings === "number" ? entry.earnings : null,
    }));

    return { data: quarterly, error: null };
  } catch (err) {
    return {
      data: [],
      error: {
        project_id: projectId,
        message:
          err instanceof Error ? err.message : "Unknown error fetching project",
      },
    };
  }
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  const apiKey = process.env.TOKENTERMINAL_API_KEY;

  // No API key configured — signal the frontend to fall back to static data
  if (!apiKey) {
    return NextResponse.json(
      { source: "static" as const, data: null },
      { status: 200 },
    );
  }

  // Parse query params
  const { searchParams } = request.nextUrl;
  const metricIds = parseCSV(
    searchParams.get("metrics"),
    VALID_METRICS,
    VALID_METRICS,
  );
  const projectIds = parseProjectIds(searchParams.get("projects"));

  // Fetch each project sequentially with a small delay for rate-limiting
  const allQuarterly: QuarterlyMetric[] = [];
  const errors: ProjectFetchError[] = [];

  for (const projectId of projectIds) {
    const { data, error } = await fetchProjectMetrics(
      projectId,
      metricIds,
      apiKey,
    );
    allQuarterly.push(...data);
    if (error) errors.push(error);

    // Rate-limit awareness: small pause between requests
    await sleep(RATE_LIMIT_DELAY_MS);
  }

  // If every single request failed, the API is likely down
  if (errors.length === projectIds.length && allQuarterly.length === 0) {
    return NextResponse.json(
      {
        error: "TokenTerminal API is unavailable",
        details: errors,
      },
      { status: 503 },
    );
  }

  // Aggregate per-project summaries
  const projectMap = new Map<string, QuarterlyMetric[]>();
  for (const q of allQuarterly) {
    const existing = projectMap.get(q.project_id) ?? [];
    existing.push(q);
    projectMap.set(q.project_id, existing);
  }

  const projects: ProjectSummary[] = Array.from(projectMap.entries()).map(
    ([project_id, quarterly_data]) => {
      // Sort descending by timestamp so index 0 = most recent quarter
      const sorted = [...quarterly_data].sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );
      const latest = sorted[0] ?? null;

      return {
        project_id,
        latest_fees: latest?.fees ?? null,
        latest_revenue: latest?.revenue ?? null,
        latest_earnings: latest?.earnings ?? null,
        quarterly_data: sorted,
      };
    },
  );

  const response: TokenTerminalMetricsResponse = {
    source: "api",
    fetched_at: new Date().toISOString(),
    metric_ids: metricIds,
    projects,
    errors,
  };

  return NextResponse.json(response, { status: 200 });
}
