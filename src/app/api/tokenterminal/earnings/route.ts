import { NextResponse } from "next/server";

// ----------------------------------------------------------------
// GET /api/tokenterminal/earnings
//
// Fetches earnings / margin data for key protocols from the
// TokenTerminal v2 API.  For each protocol, retrieves daily
// earnings, revenue, and fees metrics (90 days) and computes
// the margin (earnings / revenue).
//
// When TOKENTERMINAL_API_KEY is not set, returns a static
// fallback so the frontend can degrade gracefully.
//
// Requests are made sequentially with a 200ms delay between
// each to respect upstream rate limits.  Cached for 1 hour.
// ----------------------------------------------------------------

export const revalidate = 3600; // 1 hour

// ---------- constants ----------

const TOKENTERMINAL_BASE_URL = "https://api.tokenterminal.com/v2";

const PROTOCOL_IDS = [
  "aave",
  "uniswap",
  "lido",
  "maker",
  "hyperliquid",
  "jupiter",
  "raydium",
] as const;

/** Human-readable names for protocol IDs. */
const PROTOCOL_NAMES: Record<string, string> = {
  aave: "Aave",
  uniswap: "Uniswap",
  lido: "Lido",
  maker: "Maker",
  hyperliquid: "Hyperliquid",
  jupiter: "Jupiter",
  raydium: "Raydium",
};

const RATE_LIMIT_DELAY_MS = 200;

// ---------- response types ----------

interface RevenueHistoryEntry {
  date: string;
  revenue: number;
  earnings: number;
  margin: number;
}

interface ProtocolEarnings {
  id: string;
  name: string;
  latestRevenue: number;
  latestEarnings: number;
  margin: number;
  revenueHistory: RevenueHistoryEntry[];
}

interface EarningsResponse {
  source: "api" | "static";
  protocols: ProtocolEarnings[];
  fetchedAt: string;
}

// ---------- helpers ----------

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function safeNum(v: unknown): number {
  if (v === undefined || v === null || v === "") return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Compute margin as earnings / revenue, clamped to [-1, 1].
 * Returns 0 when revenue is zero to avoid division errors.
 */
function computeMargin(earnings: number, revenue: number): number {
  if (revenue === 0) return 0;
  const raw = earnings / revenue;
  return Math.max(-1, Math.min(1, Math.round(raw * 10000) / 10000));
}

// ---------- per-protocol fetcher ----------

async function fetchProtocolEarnings(
  protocolId: string,
  apiKey: string,
): Promise<ProtocolEarnings | null> {
  const url = new URL(
    `${TOKENTERMINAL_BASE_URL}/projects/${protocolId}/metrics`,
  );
  url.searchParams.set("metric_ids", "earnings,revenue,fees");
  url.searchParams.set("interval", "daily");
  url.searchParams.set("limit", "90");

  try {
    const res = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
      },
      next: { revalidate: 3600 },
    } as RequestInit);

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.warn(
        `[/api/tokenterminal/earnings] ${protocolId}: HTTP ${res.status} — ${body.slice(0, 200)}`,
      );
      return null;
    }

    const json = await res.json();

    // TokenTerminal v2 returns { data: [...] } or a raw array
    const rawData: Record<string, unknown>[] = Array.isArray(json)
      ? json
      : Array.isArray(json?.data)
        ? json.data
        : [];

    if (rawData.length === 0) return null;

    // Build daily history sorted by date ascending
    const revenueHistory: RevenueHistoryEntry[] = rawData
      .map((entry) => {
        const dateStr = String(entry.timestamp ?? entry.date ?? "");
        const revenue = safeNum(entry.revenue);
        const earnings = safeNum(entry.earnings);
        return {
          date: dateStr,
          revenue,
          earnings,
          margin: computeMargin(earnings, revenue),
        };
      })
      .sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      );

    // Latest values come from the most recent entry
    const latest = revenueHistory[revenueHistory.length - 1];
    const latestRevenue = latest?.revenue ?? 0;
    const latestEarnings = latest?.earnings ?? 0;

    return {
      id: protocolId,
      name: PROTOCOL_NAMES[protocolId] ?? protocolId,
      latestRevenue,
      latestEarnings,
      margin: computeMargin(latestEarnings, latestRevenue),
      revenueHistory,
    };
  } catch (err) {
    console.warn(
      `[/api/tokenterminal/earnings] Failed to fetch "${protocolId}":`,
      err instanceof Error ? err.message : err,
    );
    return null;
  }
}

// ---------- route handler ----------

export async function GET(): Promise<NextResponse> {
  const apiKey = process.env.TOKENTERMINAL_API_KEY;

  // No API key — return static fallback
  if (!apiKey) {
    return NextResponse.json({
      source: "static" as const,
      protocols: [],
      fetchedAt: new Date().toISOString(),
    } satisfies EarningsResponse);
  }

  try {
    const protocols: ProtocolEarnings[] = [];

    // Fetch each protocol sequentially with rate-limit delay
    for (let i = 0; i < PROTOCOL_IDS.length; i++) {
      const id = PROTOCOL_IDS[i];

      // Add delay between requests (skip before the first one)
      if (i > 0) {
        await sleep(RATE_LIMIT_DELAY_MS);
      }

      const result = await fetchProtocolEarnings(id, apiKey);
      if (result) {
        protocols.push(result);
      }
    }

    const body: EarningsResponse = {
      source: "api",
      protocols,
      fetchedAt: new Date().toISOString(),
    };

    return NextResponse.json(body);
  } catch (err) {
    console.error("[/api/tokenterminal/earnings] Error:", err);
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
