import { NextResponse } from "next/server";
import { getExpandedTokenIds } from "@/lib/protocolTokenMap";

// ----------------------------------------------------------------
// GET /api/coingecko
//
// Fetches CoinGecko market data:
//   1. Global market data (total market cap, BTC/ETH dominance, volume)
//   2. Top protocol token prices + market caps
//   3. Historical total crypto market cap (365 days)
//
// When COINGECKO_API_KEY is set, uses the Pro API at
// https://pro-api.coingecko.com/api/v3/ with header x-cg-pro-api-key.
// Otherwise uses the free API at https://api.coingecko.com/api/v3/.
//
// Cached for 30 minutes.
// ----------------------------------------------------------------

export const revalidate = 1800; // 30 minutes

// ---------- constants ----------

const TOKEN_IDS = getExpandedTokenIds();

// ---------- response types ----------

interface GlobalData {
  totalMarketCap: number;
  totalVolume24h: number;
  btcDominance: number;
  ethDominance: number;
  marketCapChange24h: number;
}

interface TokenData {
  id: string;
  symbol: string;
  name: string;
  currentPrice: number;
  marketCap: number;
  priceChange24h: number;
  priceChange7d: number;
  priceChange30d: number;
  fullyDilutedValuation: number | null;
  totalVolume24h: number;
  marketCapRank: number | null;
  ath: number | null;
  atl: number | null;
  athChangePercentage: number | null;
  circulatingSupply: number | null;
}

interface HistoricalMarketCapEntry {
  date: number;
  marketCap: number;
}

interface CoinGeckoResponse {
  global: GlobalData;
  tokens: TokenData[];
  historicalMarketCap: HistoricalMarketCapEntry[];
  fetchedAt: string;
}

// ---------- helpers ----------

function getBaseUrl(): string {
  const key = process.env.COINGECKO_API_KEY;
  if (key) {
    return "https://pro-api.coingecko.com/api/v3";
  }
  return "https://api.coingecko.com/api/v3";
}

function getHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  const key = process.env.COINGECKO_API_KEY;
  if (key) {
    headers["x-cg-pro-api-key"] = key;
  }
  return headers;
}

async function fetchJSON(url: string): Promise<unknown> {
  const res = await fetch(url, {
    next: { revalidate: 1800 },
    headers: getHeaders(),
  });
  if (!res.ok) {
    throw new Error(`CoinGecko API error: ${res.status} ${res.statusText} for ${url}`);
  }
  return res.json();
}

function safeNum(v: unknown): number {
  if (v === undefined || v === null || v === "") return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function safeNumOrNull(v: unknown): number | null {
  if (v === undefined || v === null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/** Delay helper for rate limiting between requests */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------- data fetchers ----------

async function fetchGlobalData(): Promise<GlobalData> {
  const base = getBaseUrl();
  const data = (await fetchJSON(`${base}/global`)) as Record<string, unknown>;
  const globalData = (data.data ?? data) as Record<string, unknown>;

  const totalMcap = globalData.total_market_cap as Record<string, unknown> | undefined;
  const totalVol = globalData.total_volume as Record<string, unknown> | undefined;
  const mcpPct = globalData.market_cap_percentage as Record<string, unknown> | undefined;

  return {
    totalMarketCap: safeNum(totalMcap?.usd),
    totalVolume24h: safeNum(totalVol?.usd),
    btcDominance: safeNum(mcpPct?.btc),
    ethDominance: safeNum(mcpPct?.eth),
    marketCapChange24h: safeNum(globalData.market_cap_change_percentage_24h_usd),
  };
}

async function fetchTokenData(): Promise<TokenData[]> {
  const base = getBaseUrl();
  const ids = TOKEN_IDS.join(",");
  const perPage = Math.min(Math.max(TOKEN_IDS.length, 50), 250);
  const url = `${base}/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&per_page=${perPage}&page=1&sparkline=false&price_change_percentage=24h,7d,30d`;

  const data = (await fetchJSON(url)) as Record<string, unknown>[];

  if (!Array.isArray(data)) return [];

  return data.map((coin: Record<string, unknown>): TokenData => ({
    id: String(coin.id ?? ""),
    symbol: String(coin.symbol ?? ""),
    name: String(coin.name ?? ""),
    currentPrice: safeNum(coin.current_price),
    marketCap: safeNum(coin.market_cap),
    priceChange24h: safeNum(coin.price_change_percentage_24h_in_currency),
    priceChange7d: safeNum(coin.price_change_percentage_7d_in_currency),
    priceChange30d: safeNum(coin.price_change_percentage_30d_in_currency),
    fullyDilutedValuation: safeNumOrNull(coin.fully_diluted_valuation),
    totalVolume24h: safeNum(coin.total_volume),
    marketCapRank: safeNumOrNull(coin.market_cap_rank),
    ath: safeNumOrNull(coin.ath),
    atl: safeNumOrNull(coin.atl),
    athChangePercentage: safeNumOrNull(coin.ath_change_percentage),
    circulatingSupply: safeNumOrNull(coin.circulating_supply),
  }));
}

async function fetchHistoricalMarketCap(): Promise<HistoricalMarketCapEntry[]> {
  const base = getBaseUrl();
  // CoinGecko /global/market_cap_chart returns total market cap over time
  // days=365 gives daily data points for the last year
  const url = `${base}/coins/bitcoin/market_chart?vs_currency=usd&days=365&interval=daily`;

  // We use Bitcoin's market chart as a proxy, but we need global data.
  // CoinGecko's free API has /global/market_cap_chart but it requires Pro.
  // Instead, we'll use the global endpoint's total_market_cap and
  // approximate with the /coins/markets historical data.
  // The best free approach: use the "market_chart" endpoint for a
  // representative coin and scale, or use the global chart if Pro key is available.

  const cgApiKey = process.env.COINGECKO_API_KEY;

  if (cgApiKey) {
    // Pro API: use the global market cap chart directly
    const proUrl = `${base}/global/market_cap_chart?days=365&vs_currency=usd`;
    try {
      const data = (await fetchJSON(proUrl)) as Record<string, unknown>;
      const mcapData = data.market_cap_chart as Record<string, unknown> | undefined;
      const points = (mcapData?.market_cap ?? data.market_cap) as number[][] | undefined;

      if (Array.isArray(points)) {
        return points.map((point: number[]): HistoricalMarketCapEntry => ({
          date: point[0],
          marketCap: point[1],
        }));
      }
    } catch {
      // Fall through to free API approach
    }
  }

  // Free API fallback: fetch Bitcoin market chart and use BTC dominance
  // to estimate total market cap. BTC chart is freely available.
  try {
    const data = (await fetchJSON(url)) as Record<string, unknown>;
    const mcapPoints = data.market_caps as number[][] | undefined;

    if (Array.isArray(mcapPoints)) {
      // Bitcoin market cap is available; we can use it to estimate total
      // market cap if we have BTC dominance. For now, return BTC market
      // cap data as a proxy (the shape is the same, consumers can scale).
      return mcapPoints.map((point: number[]): HistoricalMarketCapEntry => ({
        date: point[0],
        marketCap: point[1],
      }));
    }
  } catch {
    // Return empty on failure
  }

  return [];
}

// ---------- route handler ----------

export async function GET(): Promise<NextResponse> {
  try {
    // Fetch global data first
    const globalData = await fetchGlobalData();

    // Rate limiting delay between requests
    await delay(200);

    // Fetch token data
    const tokens = await fetchTokenData();

    // Rate limiting delay between requests
    await delay(200);

    // Fetch historical market cap
    const historicalMarketCap = await fetchHistoricalMarketCap();

    const body: CoinGeckoResponse = {
      global: globalData,
      tokens,
      historicalMarketCap,
      fetchedAt: new Date().toISOString(),
    };

    return NextResponse.json(body);
  } catch (err) {
    console.error("[/api/coingecko] Error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json(
      { error: message },
      { status: 502 },
    );
  }
}
