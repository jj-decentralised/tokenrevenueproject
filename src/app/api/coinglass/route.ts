import { NextResponse } from "next/server";

// ----------------------------------------------------------------
// GET /api/coinglass
//
// Fetches derivatives data from the CoinGlass API:
//   - BTC & ETH open interest history
//   - BTC funding rate history
//   - BTC liquidation history
//   - Long/short ratio
//
// Cached for 30 minutes via ISR revalidation.
// ----------------------------------------------------------------

export const revalidate = 1800; // 30 minutes

// ---------- constants ----------

const COINGLASS_BASE_URL = "https://open-api-v3.coinglass.com/api";

/** Small delay between sequential requests to respect rate limits. */
const RATE_LIMIT_DELAY_MS = 200;

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
 * Fetch a single CoinGlass endpoint. Returns the parsed JSON on success
 * or null on failure (logging a warning rather than throwing).
 */
async function fetchCoinGlassEndpoint(
  path: string,
  apiKey: string,
  label: string,
): Promise<Record<string, unknown> | null> {
  const url = `${COINGLASS_BASE_URL}${path}`;
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "CG-API-KEY": apiKey,
        Accept: "application/json",
      },
      next: { revalidate: 1800 },
    } as RequestInit);

    if (!res.ok) {
      console.warn(
        `[/api/coinglass] ${label} returned HTTP ${res.status}: ${res.statusText}`,
      );
      return null;
    }

    const json = await res.json();

    // CoinGlass v3 wraps successful responses in { code: "0", data: ... }
    if (json && typeof json === "object") {
      return json as Record<string, unknown>;
    }

    return null;
  } catch (err) {
    console.warn(
      `[/api/coinglass] ${label} fetch failed:`,
      err instanceof Error ? err.message : err,
    );
    return null;
  }
}

// ---------- response types ----------

interface OIHistoryEntry {
  date: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface FundingRateEntry {
  date: number;
  rate: number;
}

interface LiquidationEntry {
  date: number;
  longLiquidations: number;
  shortLiquidations: number;
  totalLiquidations: number;
}

interface LongShortEntry {
  date: number;
  longRatio: number;
  shortRatio: number;
  longShortRatio: number;
}

interface CoinGlassResponse {
  source: "api";
  data: {
    openInterest: {
      btc: OIHistoryEntry[];
      eth: OIHistoryEntry[];
      btcCurrent: number;
      ethCurrent: number;
    };
    fundingRate: {
      btc: FundingRateEntry[];
      currentRate: number;
    };
    liquidations: {
      history: LiquidationEntry[];
      total24h: number;
    };
    longShortRatio: {
      history: LongShortEntry[];
      currentRatio: number;
    };
    fetchedAt: string;
  };
}

// ---------- data parsers ----------

function parseOIHistory(raw: Record<string, unknown> | null): OIHistoryEntry[] {
  if (!raw) return [];
  const data = raw.data;
  if (!Array.isArray(data)) return [];

  return data.map((entry: Record<string, unknown>) => ({
    date: safeNum(entry.t ?? entry.time ?? entry.date),
    open: safeNum(entry.o ?? entry.open),
    high: safeNum(entry.h ?? entry.high),
    low: safeNum(entry.l ?? entry.low),
    close: safeNum(entry.c ?? entry.close),
  }));
}

function parseFundingRateHistory(
  raw: Record<string, unknown> | null,
): FundingRateEntry[] {
  if (!raw) return [];
  const data = raw.data;
  if (!Array.isArray(data)) return [];

  return data.map((entry: Record<string, unknown>) => ({
    date: safeNum(entry.t ?? entry.time ?? entry.date),
    rate: safeNum(entry.c ?? entry.close ?? entry.rate ?? entry.fundingRate),
  }));
}

function parseLiquidationHistory(
  raw: Record<string, unknown> | null,
): LiquidationEntry[] {
  if (!raw) return [];
  const data = raw.data;
  if (!Array.isArray(data)) return [];

  return data.map((entry: Record<string, unknown>) => {
    const longLiq = safeNum(
      entry.longLiquidationUsd ?? entry.buyVolUsd ?? entry.longVolUsd ?? entry.longLiquidations,
    );
    const shortLiq = safeNum(
      entry.shortLiquidationUsd ?? entry.sellVolUsd ?? entry.shortVolUsd ?? entry.shortLiquidations,
    );
    return {
      date: safeNum(entry.t ?? entry.time ?? entry.date),
      longLiquidations: longLiq,
      shortLiquidations: shortLiq,
      totalLiquidations: longLiq + shortLiq,
    };
  });
}

function parseLongShortHistory(
  raw: Record<string, unknown> | null,
): LongShortEntry[] {
  if (!raw) return [];
  const data = raw.data;
  if (!Array.isArray(data)) return [];

  return data.map((entry: Record<string, unknown>) => {
    const longRatio = safeNum(entry.longRate ?? entry.longRatio ?? entry.buyRatio);
    const shortRatio = safeNum(entry.shortRate ?? entry.shortRatio ?? entry.sellRatio);
    const longShortRatio = safeNum(
      entry.longShortRatio ?? entry.longShortRation ?? (shortRatio > 0 ? longRatio / shortRatio : 0),
    );
    return {
      date: safeNum(entry.t ?? entry.time ?? entry.date),
      longRatio,
      shortRatio,
      longShortRatio,
    };
  });
}

// ---------- route handler ----------

export async function GET(): Promise<NextResponse> {
  const apiKey = process.env.COINGLASS_API_KEY;

  // No API key configured — signal frontend to fall back to static data
  if (!apiKey) {
    return NextResponse.json(
      { source: "static" as const, data: null },
      { status: 200 },
    );
  }

  try {
    // Fetch endpoints sequentially with 200ms delay to respect rate limits
    const btcOIRaw = await fetchCoinGlassEndpoint(
      "/futures/openInterest/ohlc-history?symbol=BTC&interval=1d&limit=90",
      apiKey,
      "BTC Open Interest",
    );
    await sleep(RATE_LIMIT_DELAY_MS);

    const ethOIRaw = await fetchCoinGlassEndpoint(
      "/futures/openInterest/ohlc-history?symbol=ETH&interval=1d&limit=90",
      apiKey,
      "ETH Open Interest",
    );
    await sleep(RATE_LIMIT_DELAY_MS);

    const btcFundingRaw = await fetchCoinGlassEndpoint(
      "/futures/funding-rate/ohlc-history?symbol=BTC&interval=8h&limit=90",
      apiKey,
      "BTC Funding Rate",
    );
    await sleep(RATE_LIMIT_DELAY_MS);

    const btcLiquidationRaw = await fetchCoinGlassEndpoint(
      "/futures/liquidation/v2/history?symbol=BTC&interval=1d&limit=30",
      apiKey,
      "BTC Liquidations",
    );
    await sleep(RATE_LIMIT_DELAY_MS);

    const longShortRaw = await fetchCoinGlassEndpoint(
      "/futures/longShort/chart?symbol=BTC&interval=1d&limit=30",
      apiKey,
      "Long/Short Ratio",
    );

    // Parse each endpoint's data
    const btcOI = parseOIHistory(btcOIRaw);
    const ethOI = parseOIHistory(ethOIRaw);
    const btcFunding = parseFundingRateHistory(btcFundingRaw);
    const liquidations = parseLiquidationHistory(btcLiquidationRaw);
    const longShort = parseLongShortHistory(longShortRaw);

    // Extract "current" values (most recent entry)
    const btcCurrent = btcOI.length > 0 ? btcOI[btcOI.length - 1].close : 0;
    const ethCurrent = ethOI.length > 0 ? ethOI[ethOI.length - 1].close : 0;
    const currentFundingRate =
      btcFunding.length > 0 ? btcFunding[btcFunding.length - 1].rate : 0;
    const total24hLiq =
      liquidations.length > 0
        ? liquidations[liquidations.length - 1].totalLiquidations
        : 0;
    const currentLSRatio =
      longShort.length > 0
        ? longShort[longShort.length - 1].longShortRatio
        : 0;

    const response: CoinGlassResponse = {
      source: "api",
      data: {
        openInterest: {
          btc: btcOI,
          eth: ethOI,
          btcCurrent,
          ethCurrent,
        },
        fundingRate: {
          btc: btcFunding,
          currentRate: currentFundingRate,
        },
        liquidations: {
          history: liquidations,
          total24h: total24hLiq,
        },
        longShortRatio: {
          history: longShort,
          currentRatio: currentLSRatio,
        },
        fetchedAt: new Date().toISOString(),
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (err) {
    console.error("[/api/coinglass] Error:", err);
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
