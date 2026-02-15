import { NextRequest, NextResponse } from "next/server";

// ----------------------------------------------------------------
// GET /api/defillama/protocol-history?protocols=aave,uniswap,hyperliquid
//
// Fetches historical fee/revenue data for a list of protocols
// from DefiLlama's per-protocol summary endpoint.  Returns daily
// fee and revenue history for each protocol, useful for building
// per-protocol revenue time series charts.
//
// Requests are made sequentially with a 200ms delay between each
// to avoid overwhelming the upstream API.  Cached for 1 hour.
//
// When DEFILLAMA_API_KEY is set, routes through the Pro API at
// https://pro-api.llama.fi/{KEY}/... for higher rate limits and
// enriched data.
// ----------------------------------------------------------------

export const revalidate = 3600; // 1 hour
export const dynamic = "force-dynamic";

// ---------- Pro API helper ----------

function getBaseUrl(): string {
  const key = process.env.DEFILLAMA_API_KEY;
  if (key) {
    return `https://pro-api.llama.fi/${key}`;
  }
  return "https://api.llama.fi";
}

// ---------- response types ----------

interface ProtocolHistoryEntry {
  date: number; // unix timestamp
  fees: number;
  revenue: number;
}

interface ProtocolHistoryRecord {
  name: string;
  slug: string;
  history: ProtocolHistoryEntry[];
}

interface ProtocolHistoryResponse {
  protocols: ProtocolHistoryRecord[];
  fetchedAt: string;
}

// ---------- helpers ----------

async function fetchJSON(url: string): Promise<unknown> {
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) {
    throw new Error(
      `DefiLlama protocol API error: ${res.status} ${res.statusText} for ${url}`,
    );
  }
  return res.json();
}

function safeNum(v: unknown): number {
  if (v === undefined || v === null || v === "") return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

/** Parse the totalDataChart array from DefiLlama fee summary response. */
function parseDataChart(raw: unknown): ProtocolHistoryEntry[] {
  if (!Array.isArray(raw)) return [];

  return raw
    .map((entry: unknown) => {
      // Format: [timestamp, value] (fees only) or {date, Fees, Revenue}
      if (Array.isArray(entry) && entry.length >= 2) {
        return {
          date: Number(entry[0]),
          fees: safeNum(entry[1]),
          revenue: 0,
        };
      }
      if (entry && typeof entry === "object") {
        const obj = entry as Record<string, unknown>;
        return {
          date: Number(obj.date ?? 0),
          fees: safeNum(obj.Fees ?? obj.fees ?? obj.dailyFees),
          revenue: safeNum(obj.Revenue ?? obj.revenue ?? obj.dailyRevenue),
        };
      }
      return null;
    })
    .filter(Boolean) as ProtocolHistoryEntry[];
}

/** Delay helper for sequential requests. */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------- route handler ----------

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = request.nextUrl;
    const protocolsParam = searchParams.get("protocols");

    if (!protocolsParam) {
      return NextResponse.json(
        { error: "Missing required query parameter: protocols" },
        { status: 400 },
      );
    }

    const protocolSlugs = protocolsParam
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);

    if (protocolSlugs.length === 0) {
      return NextResponse.json(
        { error: "No valid protocol slugs provided" },
        { status: 400 },
      );
    }

    // Cap at 15 protocols to avoid excessive upstream calls
    const capped = protocolSlugs.slice(0, 15);
    const base = getBaseUrl();

    // Fetch protocol summaries sequentially with 200ms delay between each
    const protocols: ProtocolHistoryRecord[] = [];

    for (let i = 0; i < capped.length; i++) {
      const slug = capped[i];

      // Add 200ms delay between requests (skip before the first one)
      if (i > 0) {
        await delay(200);
      }

      try {
        const data = (await fetchJSON(
          `${base}/summary/fees/${encodeURIComponent(slug)}`,
        )) as Record<string, unknown>;

        const name = String(data.name ?? slug);

        // DefiLlama sometimes nests chart data differently
        const chartData =
          data.totalDataChart ?? data.totalDataChartBreakdown ?? [];

        const history = parseDataChart(chartData);

        if (history.length > 0) {
          protocols.push({ name, slug, history });
        }
      } catch (err) {
        // Log but continue with remaining protocols
        console.warn(
          `[/api/defillama/protocol-history] Failed to fetch "${slug}":`,
          err instanceof Error ? err.message : err,
        );
      }
    }

    const body: ProtocolHistoryResponse = {
      protocols,
      fetchedAt: new Date().toISOString(),
    };

    return NextResponse.json(body);
  } catch (err) {
    console.error("[/api/defillama/protocol-history] Error:", err);
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
