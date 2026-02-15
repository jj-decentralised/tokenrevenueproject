import { NextResponse } from "next/server";

// ----------------------------------------------------------------
// GET /api/defillama/tvl
//
// Fetches total historical chain TVL and top-20 protocols by TVL
// from DefiLlama, then aggregates everything into quarterly
// buckets.  Cached for 1 hour.
//
// When DEFILLAMA_API_KEY is set, routes through the Pro API at
// https://pro-api.llama.fi/{KEY}/... for higher rate limits and
// additional data.
// ----------------------------------------------------------------

export const revalidate = 3600; // 1 hour

// ---------- Pro API helper ----------

function getBaseUrl(): string {
  const key = process.env.DEFILLAMA_API_KEY;
  if (key) {
    return `https://pro-api.llama.fi/${key}/api`;
  }
  return "https://api.llama.fi";
}

// ---------- response types ----------

interface QuarterlyTVLBucket {
  quarter: string;           // e.g. "Q1 2024"
  startDate: string;         // ISO date string for the first day of the quarter
  avgTotalTVL: number;       // average daily total TVL in the quarter ($)
  endTotalTVL: number;       // TVL on the last day of the quarter ($)
  minTotalTVL: number;
  maxTotalTVL: number;
  dataPoints: number;        // how many daily samples
}

interface ProtocolTVLSummary {
  name: string;
  slug: string;
  category: string | null;
  chains: string[];
  currentTVL: number;
  change1d: number | null;
  change7d: number | null;
  change1m: number | null;
  mcap: number | null;
  mcapTvlRatio: number | null;
  quarterlyTVL: QuarterlyTVLBucket[];
}

interface ProtocolTVLLite {
  name: string;
  slug: string;
  category: string | null;
  chains: string[];
  currentTVL: number;
  mcap: number | null;
}

interface TVLResponse {
  totalTVLCurrent: number;
  totalTVLQuarterly: QuarterlyTVLBucket[];
  topProtocols: ProtocolTVLSummary[];
  allProtocolsTVL: ProtocolTVLLite[];
  fetchedAt: string;
}

// ---------- helpers ----------

async function fetchJSON(url: string): Promise<unknown> {
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) {
    throw new Error(`DefiLlama API error: ${res.status} ${res.statusText} for ${url}`);
  }
  return res.json();
}

function safeNum(v: unknown): number | null {
  if (v === undefined || v === null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/** Return quarter label from a Date: "Q1 2024" */
function toQuarterLabel(d: Date): string {
  const q = Math.floor(d.getUTCMonth() / 3) + 1;
  return `Q${q} ${d.getUTCFullYear()}`;
}

/** Return a sort-friendly key: "2024-Q1" */
function toQuarterKey(d: Date): string {
  const q = Math.floor(d.getUTCMonth() / 3) + 1;
  return `${d.getUTCFullYear()}-Q${q}`;
}

/** ISO date for the first day of a quarter key "2024-Q1" -> "2024-01-01" */
function quarterKeyToStartDate(key: string): string {
  const [year, qPart] = key.split("-");
  const qNum = parseInt(qPart.replace("Q", ""), 10);
  const month = (qNum - 1) * 3 + 1;
  return `${year}-${String(month).padStart(2, "0")}-01`;
}

interface DailyTVL {
  date: Date;
  tvl: number;
}

function bucketize(daily: DailyTVL[]): QuarterlyTVLBucket[] {
  const grouped = new Map<
    string,
    { label: string; values: number[] }
  >();

  for (const { date, tvl } of daily) {
    const key = toQuarterKey(date);
    const existing = grouped.get(key);
    if (existing) {
      existing.values.push(tvl);
    } else {
      grouped.set(key, { label: toQuarterLabel(date), values: [tvl] });
    }
  }

  // Sort by quarter key
  const sortedKeys = [...grouped.keys()].sort();

  return sortedKeys.map((key) => {
    const { label, values } = grouped.get(key)!;
    const sum = values.reduce((a, b) => a + b, 0);
    return {
      quarter: label,
      startDate: quarterKeyToStartDate(key),
      avgTotalTVL: Math.round(sum / values.length),
      endTotalTVL: values[values.length - 1],
      minTotalTVL: Math.min(...values),
      maxTotalTVL: Math.max(...values),
      dataPoints: values.length,
    };
  });
}

// ---------- route handler ----------

export async function GET(): Promise<NextResponse> {
  try {
    const base = getBaseUrl();

    // Fire both requests in parallel
    const [historicalRaw, protocolsRaw] = await Promise.all([
      fetchJSON(`${base}/v2/historicalChainTvl`),
      fetchJSON(`${base}/protocols`),
    ]);

    // ---- Total TVL history -> quarterly buckets ----
    const historicalEntries = Array.isArray(historicalRaw) ? historicalRaw : [];
    const totalDaily: DailyTVL[] = historicalEntries
      .map((entry: unknown) => {
        if (!entry || typeof entry !== "object") return null;
        const obj = entry as Record<string, unknown>;
        const ts = safeNum(obj.date);
        const tvl = safeNum(obj.tvl);
        if (ts === null || tvl === null) return null;
        return { date: new Date(ts * 1000), tvl };
      })
      .filter(Boolean) as DailyTVL[];

    const totalTVLQuarterly = bucketize(totalDaily);
    const totalTVLCurrent = totalDaily.length > 0 ? totalDaily[totalDaily.length - 1].tvl : 0;

    // ---- All protocols by TVL ----
    const allProtocols = Array.isArray(protocolsRaw) ? protocolsRaw : [];
    const sorted = (allProtocols as Record<string, unknown>[])
      .filter((p) => {
        const tvl = safeNum(p.tvl);
        return tvl !== null && tvl > 0;
      })
      .sort((a, b) => (Number(b.tvl) || 0) - (Number(a.tvl) || 0));

    // Top 20 get full quarterly detail (expensive processing)
    const top20 = sorted.slice(0, 20);

    // Lightweight array for ALL protocols with TVL > 0
    const allProtocolsTVL: ProtocolTVLLite[] = sorted.map((p) => ({
      name: String(p.name ?? ""),
      slug: String(p.slug ?? ""),
      category: p.category ? String(p.category) : null,
      chains: Array.isArray(p.chains) ? p.chains.map(String) : [],
      currentTVL: safeNum(p.tvl) ?? 0,
      mcap: safeNum(p.mcap),
    }));

    const topProtocols: ProtocolTVLSummary[] = top20.map((p) => {
      const tvl = safeNum(p.tvl) ?? 0;
      const mcap = safeNum(p.mcap);

      // Build quarterly TVL from chainTvls or tvl history if available
      const chainTvls = p.chainTvls as Record<string, unknown> | undefined;
      let protocolDaily: DailyTVL[] = [];

      // Try to extract the combined tvl array from chainTvls
      if (chainTvls) {
        // Some protocols have a combined "tvl" key in chainTvls
        for (const chainData of Object.values(chainTvls)) {
          if (chainData && typeof chainData === "object") {
            const cd = chainData as Record<string, unknown>;
            if (Array.isArray(cd.tvl)) {
              for (const entry of cd.tvl as Record<string, unknown>[]) {
                const ts = safeNum(entry.date);
                const val = safeNum(entry.totalLiquidityUSD);
                if (ts !== null && val !== null) {
                  protocolDaily.push({ date: new Date(ts * 1000), tvl: val });
                }
              }
              break; // use the first chain's data as representative
            }
          }
        }
      }

      // If no chain-level data, build a single-point "quarterly" from current TVL
      const quarterlyTVL =
        protocolDaily.length > 0
          ? bucketize(protocolDaily)
          : [];

      return {
        name: String(p.name ?? ""),
        slug: String(p.slug ?? ""),
        category: p.category ? String(p.category) : null,
        chains: Array.isArray(p.chains) ? p.chains.map(String) : [],
        currentTVL: tvl,
        change1d: safeNum(p.change_1d),
        change7d: safeNum(p.change_7d),
        change1m: safeNum(p.change_1m),
        mcap,
        mcapTvlRatio: mcap !== null && tvl > 0 ? Math.round((mcap / tvl) * 100) / 100 : null,
        quarterlyTVL,
      };
    });

    const body: TVLResponse = {
      totalTVLCurrent,
      totalTVLQuarterly,
      topProtocols,
      allProtocolsTVL,
      fetchedAt: new Date().toISOString(),
    };

    return NextResponse.json(body);
  } catch (err) {
    console.error("[/api/defillama/tvl] Error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
