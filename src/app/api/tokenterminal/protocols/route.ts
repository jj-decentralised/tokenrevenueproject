import { NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// Next.js ISR: cache this route's responses for 1 hour
// ---------------------------------------------------------------------------
export const revalidate = 3600;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const TOKENTERMINAL_BASE_URL = "https://api.tokenterminal.com/v2";

// ---------------------------------------------------------------------------
// Types — shapes returned by this API route
// ---------------------------------------------------------------------------

/** Cleaned-up protocol record matching the ProtocolRevenue shape in types. */
interface ProtocolRecord {
  project_id: string;
  name: string;
  sector: string;
  revenue: number | null;
  fees: number | null;
  revenue_30d: number | null;
  revenue_90d: number | null;
  revenue_growth_yoy: number | null;
  market_cap: number | null;
  price_to_fee: number | null;
  price_to_revenue: number | null;
  logo: string | null;
}

interface ProtocolsResponse {
  source: "api" | "static";
  fetched_at: string;
  total: number;
  protocols: ProtocolRecord[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Safely extract a number from an API response field.
 * TokenTerminal may return numbers, strings, or null/undefined.
 */
function toNumber(val: unknown): number | null {
  if (val === null || val === undefined) return null;
  const n = Number(val);
  return Number.isFinite(n) ? n : null;
}

/**
 * Compute price-to-fee ratio: market_cap / annualized_fees.
 * Returns null when either value is missing or fees are zero.
 */
function computeRatio(
  marketCap: number | null,
  metric: number | null,
): number | null {
  if (marketCap === null || metric === null || metric === 0) return null;
  return Math.round((marketCap / metric) * 100) / 100;
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function GET() {
  const apiKey = process.env.TOKENTERMINAL_API_KEY;

  // No API key — signal the frontend to fall back to static data
  if (!apiKey) {
    return NextResponse.json(
      { source: "static" as const, data: null },
      { status: 200 },
    );
  }

  try {
    const res = await fetch(`${TOKENTERMINAL_BASE_URL}/projects`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
      },
      next: { revalidate: 3600 },
    } as RequestInit);

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return NextResponse.json(
        {
          error: "TokenTerminal API returned an error",
          status: res.status,
          details: body.slice(0, 500),
        },
        { status: 503 },
      );
    }

    const json = await res.json();

    // TokenTerminal v2 /projects returns { data: [...] } or a raw array
    const rawProjects: Record<string, unknown>[] = Array.isArray(json)
      ? json
      : Array.isArray(json?.data)
        ? json.data
        : [];

    const protocols: ProtocolRecord[] = rawProjects.map((p) => {
      const fees = toNumber(p.fees) ?? toNumber(p.fees_annualized);
      const revenue = toNumber(p.revenue) ?? toNumber(p.revenue_annualized);
      const marketCap = toNumber(p.market_cap);
      const revenue30d = toNumber(p.revenue_30d);
      const revenue90d = toNumber(p.revenue_90d);

      // Year-over-year growth: some responses include it directly
      let revenueGrowthYoY = toNumber(p.revenue_change_1y);
      if (revenueGrowthYoY === null) {
        revenueGrowthYoY = toNumber(p.revenue_growth_yoy);
      }

      return {
        project_id: String(p.project_id ?? p.id ?? ""),
        name: String(p.name ?? p.project_id ?? "Unknown"),
        sector: String(p.category ?? p.sector ?? "Other"),
        revenue,
        fees,
        revenue_30d: revenue30d,
        revenue_90d: revenue90d,
        revenue_growth_yoy: revenueGrowthYoY,
        market_cap: marketCap,
        price_to_fee: computeRatio(marketCap, fees),
        price_to_revenue: computeRatio(marketCap, revenue),
        logo: typeof p.logo === "string" ? p.logo : null,
      };
    });

    // Sort by revenue descending (nulls last)
    protocols.sort((a, b) => {
      const aRev = a.revenue ?? -Infinity;
      const bRev = b.revenue ?? -Infinity;
      return bRev - aRev;
    });

    const response: ProtocolsResponse = {
      source: "api",
      fetched_at: new Date().toISOString(),
      total: protocols.length,
      protocols,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      {
        error: "Failed to reach TokenTerminal API",
        message: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 503 },
    );
  }
}
