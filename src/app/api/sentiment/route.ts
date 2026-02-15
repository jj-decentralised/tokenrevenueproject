import { NextResponse } from "next/server";

// ----------------------------------------------------------------
// GET /api/sentiment
//
// Aggregates Fear & Greed Index (Alternative.me) and global
// market-cap data (CoinGecko) into a single response that
// matches the sentimentVsRevenueData shape from the static data.
//
// Cached for 30 minutes because sentiment changes faster.
// ----------------------------------------------------------------

export const revalidate = 1800; // 30 minutes

// ---------- response types ----------

interface FearGreedEntry {
  date: string;           // human-readable date (MM/DD/YYYY from the API)
  value: number;          // 0-100
  classification: string; // "Extreme Fear" | "Fear" | "Neutral" | "Greed" | "Extreme Greed"
  timestamp: number;      // Unix epoch (seconds)
}

interface SentimentSummary {
  current: number;
  classification: string;
  avg7d: number;
  avg30d: number;
  avg90d: number;
  avg365d: number;
  allTimeHigh: number;
  allTimeLow: number;
  percentileAllTime: number;   // where current sits in 0-100 percentile of all historical values
  divergenceFromATH: number;   // negative = below ATH (%)
}

interface MarketCapData {
  totalMarketCapUSD: number;
  totalVolume24hUSD: number;
  btcDominance: number;
  ethDominance: number;
  activeCryptocurrencies: number;
  marketCapChange24h: number;
}

interface SentimentDataPoint {
  date: string;
  fearGreed: number;
  classification: string;
}

interface SentimentVsRevenuePoint {
  date: string;
  fearGreed: number;
  label: string;
}

interface SentimentResponse {
  summary: SentimentSummary;
  marketCap: MarketCapData;
  fearGreedHistory: SentimentDataPoint[];
  /** Monthly samples matching sentimentVsRevenueData shape */
  sentimentTimeline: SentimentVsRevenuePoint[];
  fetchedAt: string;
}

// ---------- helpers ----------

async function fetchJSON(
  url: string,
  headers?: Record<string, string>,
): Promise<unknown> {
  const res = await fetch(url, {
    next: { revalidate: 1800 },
    headers: headers ?? {},
  });
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText} for ${url}`);
  }
  return res.json();
}

function safeNum(v: unknown): number | null {
  if (v === undefined || v === null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function classifyFearGreed(value: number): string {
  if (value <= 24) return "Extreme Fear";
  if (value <= 44) return "Fear";
  if (value <= 55) return "Neutral";
  if (value <= 74) return "Greed";
  return "Extreme Greed";
}

/**
 * Compute the percentile rank of `value` within a sorted array.
 * Returns a number 0-100 indicating what fraction of values are
 * less than or equal to `value`.
 */
function percentileOf(values: number[], value: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const belowOrEqual = sorted.filter((v) => v <= value).length;
  return Math.round((belowOrEqual / sorted.length) * 100);
}

/**
 * Compute average of an array of numbers.
 */
function average(arr: number[]): number {
  if (arr.length === 0) return 0;
  return Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
}

/**
 * Format a unix timestamp (seconds) to "MMM YYYY" for monthly bucketing.
 */
function toMonthLabel(ts: number): string {
  const d = new Date(ts * 1000);
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  return `${months[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/**
 * Pick one entry per month from the fear/greed history (first of each
 * month) to create a timeline matching sentimentVsRevenueData shape.
 */
function buildMonthlyTimeline(
  entries: FearGreedEntry[],
): SentimentVsRevenuePoint[] {
  const byMonth = new Map<string, FearGreedEntry[]>();

  for (const entry of entries) {
    const label = toMonthLabel(entry.timestamp);
    const existing = byMonth.get(label);
    if (existing) {
      existing.push(entry);
    } else {
      byMonth.set(label, [entry]);
    }
  }

  const timeline: SentimentVsRevenuePoint[] = [];

  for (const [month, monthEntries] of byMonth) {
    const avgValue = average(monthEntries.map((e) => e.value));

    let label = "";
    if (avgValue <= 15) label = "Extreme fear";
    else if (avgValue >= 80) label = "Extreme greed";

    timeline.push({
      date: month,
      fearGreed: avgValue,
      label,
    });
  }

  return timeline;
}

// ---------- route handler ----------

export async function GET(): Promise<NextResponse> {
  try {
    // Build CoinGecko headers
    const cgHeaders: Record<string, string> = {};
    const cgApiKey = process.env.COINGECKO_API_KEY;
    if (cgApiKey) {
      cgHeaders["x-cg-pro-api-key"] = cgApiKey;
    }

    // Fire both requests in parallel
    const [fngRaw, cgRaw] = await Promise.allSettled([
      fetchJSON("https://api.alternative.me/fng/?limit=365&date_format=us"),
      fetchJSON("https://api.coingecko.com/api/v3/global", cgHeaders),
    ]);

    // ---- Fear & Greed ----
    let fearGreedEntries: FearGreedEntry[] = [];
    let summaryError: string | null = null;

    if (fngRaw.status === "fulfilled") {
      const fngData = fngRaw.value as Record<string, unknown>;
      const rawEntries = Array.isArray(fngData.data) ? fngData.data : [];
      fearGreedEntries = (rawEntries as Record<string, unknown>[])
        .map((entry): FearGreedEntry | null => {
          const value = safeNum(entry.value);
          const timestamp = safeNum(entry.timestamp);
          if (value === null || timestamp === null) return null;
          return {
            date: String(entry.time_until_update ?? entry.date ?? ""),
            value,
            classification: String(
              entry.value_classification ?? classifyFearGreed(value),
            ),
            timestamp,
          };
        })
        .filter(Boolean) as FearGreedEntry[];
    } else {
      summaryError = `Fear & Greed API failed: ${fngRaw.reason}`;
      console.error("[/api/sentiment] FNG error:", fngRaw.reason);
    }

    // ---- CoinGecko Market Cap ----
    let marketCap: MarketCapData = {
      totalMarketCapUSD: 0,
      totalVolume24hUSD: 0,
      btcDominance: 0,
      ethDominance: 0,
      activeCryptocurrencies: 0,
      marketCapChange24h: 0,
    };

    if (cgRaw.status === "fulfilled") {
      const cgData = cgRaw.value as Record<string, unknown>;
      const globalData = (cgData.data ?? cgData) as Record<string, unknown>;
      const totalMcap = globalData.total_market_cap as Record<string, unknown> | undefined;
      const totalVol = globalData.total_volume as Record<string, unknown> | undefined;

      marketCap = {
        totalMarketCapUSD: safeNum(totalMcap?.usd) ?? 0,
        totalVolume24hUSD: safeNum(totalVol?.usd) ?? 0,
        btcDominance: 0,
        ethDominance: 0,
        activeCryptocurrencies: safeNum(globalData.active_cryptocurrencies) ?? 0,
        marketCapChange24h: safeNum(globalData.market_cap_change_percentage_24h_usd) ?? 0,
      };

      // Extract BTC/ETH dominance from nested object if needed
      const mcpPct = globalData.market_cap_percentage as Record<string, unknown> | undefined;
      if (mcpPct) {
        marketCap.btcDominance = safeNum(mcpPct.btc) ?? marketCap.btcDominance;
        marketCap.ethDominance = safeNum(mcpPct.eth) ?? marketCap.ethDominance;
      }
    } else {
      console.error("[/api/sentiment] CoinGecko error:", cgRaw.reason);
    }

    // ---- Compute summary stats ----
    const allValues = fearGreedEntries.map((e) => e.value);
    const currentValue =
      fearGreedEntries.length > 0 ? fearGreedEntries[0].value : 0;
    const currentClassification =
      fearGreedEntries.length > 0
        ? fearGreedEntries[0].classification
        : "Unknown";

    const allTimeHigh = allValues.length > 0 ? Math.max(...allValues) : 100;
    const allTimeLow = allValues.length > 0 ? Math.min(...allValues) : 0;

    const summary: SentimentSummary = {
      current: currentValue,
      classification: currentClassification,
      avg7d: average(allValues.slice(0, 7)),
      avg30d: average(allValues.slice(0, 30)),
      avg90d: average(allValues.slice(0, 90)),
      avg365d: average(allValues),
      allTimeHigh,
      allTimeLow,
      percentileAllTime: percentileOf(allValues, currentValue),
      divergenceFromATH:
        allTimeHigh > 0
          ? Math.round(((currentValue - allTimeHigh) / allTimeHigh) * 100)
          : 0,
    };

    // ---- Build timeline data ----
    const fearGreedHistory: SentimentDataPoint[] = fearGreedEntries.map(
      (e) => ({
        date: e.date,
        fearGreed: e.value,
        classification: e.classification,
      }),
    );

    const sentimentTimeline = buildMonthlyTimeline(fearGreedEntries);

    // ---- If both APIs failed, return 502 ----
    if (fngRaw.status === "rejected" && cgRaw.status === "rejected") {
      return NextResponse.json(
        {
          error: "All upstream APIs failed",
          details: {
            fearGreed: String(fngRaw.reason),
            coinGecko: String(cgRaw.reason),
          },
        },
        { status: 502 },
      );
    }

    const body: SentimentResponse = {
      summary,
      marketCap,
      fearGreedHistory,
      sentimentTimeline,
      fetchedAt: new Date().toISOString(),
    };

    // If one API failed, include a warning but still return partial data
    if (summaryError) {
      return NextResponse.json({ ...body, warning: summaryError });
    }

    return NextResponse.json(body);
  } catch (err) {
    console.error("[/api/sentiment] Error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
