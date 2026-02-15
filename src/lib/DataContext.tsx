"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { PROTOCOL_TOKEN_MAP } from "@/lib/protocolTokenMap";
import { buildUnifiedTokenList, UnifiedToken } from "@/lib/tokenMerge";

// ============================================================
// Types for live API responses
// ============================================================

export interface LiveFeeOverview {
  totalFees24h: number;
  totalRevenue24h: number;
  change_1d: number;
  change_7d: number;
  change_1m: number;
  /** Daily aggregated fee totals: [unixTimestamp, value][] */
  totalDataChart: [number, number][];
  /** Per-protocol summaries */
  protocols: LiveProtocolFee[];
}

export interface LiveProtocolFee {
  name: string;
  displayName: string;
  slug: string;
  category: string;
  logo: string | null;
  defillamaId: string | null;
  parentProtocol: string | null;
  chains: string[];
  // Fees (what users pay)
  total24h: number;
  total7d: number;
  total30d: number;
  totalAllTime: number;
  total1y: number | null;
  average1y: number | null;
  // Revenue (what protocol keeps — from dedicated revenue API call)
  revenue24h: number | null;
  revenue7d: number | null;
  revenue30d: number | null;
  // Holders revenue (buybacks, burns, staking distributions)
  holdersRevenue24h: number | null;
  // Derived
  margin: number | null;
  // Change metrics
  change_1d: number | null;
  change_7d: number | null;
  change_1m: number | null;
  change_7dover7d: number | null;
  change_30dover30d: number | null;
  // Metadata
  doublecounted: boolean;
  methodology: Record<string, string> | null;
}

export interface LiveSentiment {
  fearGreed: {
    current: number;
    classification: string;
    history: { timestamp: string; value: number; classification: string }[];
    avg30d: number;
    avg90d: number;
  };
  marketCap: {
    total: number;
    btcDominance: number;
    ethDominance: number;
  };
}

export interface LiveTokenTerminalData {
  protocols: {
    project_id: string;
    metrics: {
      metric_id: string;
      date: string;
      value: number;
      chain_id?: string;
    }[];
  }[];
}

export interface LiveTVLData {
  totalDataChart: [number, number][];
  topProtocols: {
    name: string;
    tvl: number;
    category: string;
    chains: string[];
  }[];
  allProtocolsTVL: {
    name: string;
    slug: string;
    tvl: number;
    category: string;
    chains: string[];
    mcap: number | null;
    fdv: number | null;
  }[];
}

export interface LiveETFData {
  totalAum: number;
  btcEtfAum: number;
  ethEtfAum: number;
  netFlows: { date: string; btcFlows: number; ethFlows: number; totalFlows: number }[];
}

export interface LiveProtocolHistory {
  protocols: {
    name: string;
    history: { date: number; fees: number; revenue: number }[];
  }[];
}

export interface LiveActivityData {
  dailyActiveProtocols: number;
  dexVolume24h: number;
  dexVolume7d: number;
  totalDataChart: Array<{ date: number; dexVolume: number; feeVolume: number }>;
  topProtocolsByUsers: Array<{
    name: string;
    category: string;
    volume24h: number;
    change7d: number | null;
  }>;
  fetchedAt: string;
}

export interface LiveEarningsData {
  source: "api" | "static";
  protocols: Array<{
    id: string;
    name: string;
    aliases: string[];
    latestRevenue: number;
    latestEarnings: number;
    margin: number;
    revenueHistory: Array<{ date: string; revenue: number; earnings: number; margin: number }>;
  }>;
  fetchedAt: string;
}

export interface LiveCoinGlassData {
  openInterest: {
    btc: Array<{ date: number; open: number; high: number; low: number; close: number }>;
    eth: Array<{ date: number; open: number; high: number; low: number; close: number }>;
    btcCurrent: number;
    ethCurrent: number;
  };
  fundingRate: {
    btc: Array<{ date: number; rate: number }>;
    currentRate: number;
  };
  liquidations: {
    history: Array<{ date: number; longLiquidations: number; shortLiquidations: number; totalLiquidations: number }>;
    total24h: number;
  };
  longShortRatio: {
    history: Array<{ date: number; longRatio: number; shortRatio: number; longShortRatio: number }>;
    currentRatio: number;
  };
  fetchedAt: string;
}

export interface LiveCoinGeckoData {
  global: {
    totalMarketCap: number;
    totalVolume24h: number;
    btcDominance: number;
    ethDominance: number;
    marketCapChange24h: number;
  };
  tokens: Array<{
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
  }>;
  historicalMarketCap: Array<{ date: number; marketCap: number }>;
  fetchedAt: string;
}

export interface LiveSectorHistory {
  dates: number[];
  fees: Record<string, number[]>;
  revenue: Record<string, number[]> | null;
  revenueDates: number[] | null;
  protocolCount: number;
}

export interface DataDifferential {
  protocolId: string;
  protocolName: string;
  defillamaRevenue24h: number | null;
  defillamaRevenue30d: number | null;
  tokenTerminalRevenue: number | null;
  tokenTerminalFees: number | null;
  differentialPct: number | null; // percentage difference between sources
  source: "both" | "defillama_only" | "tokenterminal_only";
}

export interface LiveData {
  fees: LiveFeeOverview | null;
  sentiment: LiveSentiment | null;
  tokenTerminal: LiveTokenTerminalData | null;
  tvl: LiveTVLData | null;
  etf: LiveETFData | null;
  protocolHistory: LiveProtocolHistory | null;
  activity: LiveActivityData | null;
  earnings: LiveEarningsData | null;
  coinGlass: LiveCoinGlassData | null;
  coinGecko: LiveCoinGeckoData | null;
  sectorHistory: LiveSectorHistory | null;
  differentials: DataDifferential[];
  unifiedTokens: UnifiedToken[];
  isLoading: boolean;
  isLive: boolean;
  lastUpdated: Date | null;
  errors: string[];
  refetch: () => void;
}

const defaultLiveData: LiveData = {
  fees: null,
  sentiment: null,
  tokenTerminal: null,
  tvl: null,
  etf: null,
  protocolHistory: null,
  activity: null,
  earnings: null,
  coinGlass: null,
  coinGecko: null,
  sectorHistory: null,
  differentials: [],
  unifiedTokens: [],
  isLoading: true,
  isLive: false,
  lastUpdated: null,
  errors: [],
  refetch: () => {},
};

const DataContext = createContext<LiveData>(defaultLiveData);

export function useDataContext() {
  return useContext(DataContext);
}

// ============================================================
// Helper: aggregate daily [timestamp, value][] into quarterly buckets
// ============================================================
export function aggregateToQuarterly(
  dailyData: [number, number][]
): { period: string; value: number }[] {
  const buckets: Record<string, number> = {};

  for (const [ts, val] of dailyData) {
    const date = new Date(ts * 1000);
    const year = date.getUTCFullYear();
    const q = Math.ceil((date.getUTCMonth() + 1) / 3);
    const key = `Q${q} ${year}`;
    buckets[key] = (buckets[key] || 0) + val;
  }

  return Object.entries(buckets)
    .sort((a, b) => {
      const [qa, ya] = [parseInt(a[0][1]), parseInt(a[0].split(" ")[1])];
      const [qb, yb] = [parseInt(b[0][1]), parseInt(b[0].split(" ")[1])];
      return ya !== yb ? ya - yb : qa - qb;
    })
    .map(([period, value]) => ({ period, value }));
}

// ============================================================
// Helper: group protocols by category for sector breakdown
// ============================================================
export function groupByCategory(
  protocols: LiveProtocolFee[]
): Record<string, { total24h: number; total30d: number; count: number; protocols: string[] }> {
  const groups: Record<string, { total24h: number; total30d: number; count: number; protocols: string[] }> = {};

  for (const p of protocols) {
    const cat = p.category || "Other";
    if (!groups[cat]) {
      groups[cat] = { total24h: 0, total30d: 0, count: 0, protocols: [] };
    }
    groups[cat].total24h += p.total24h || 0;
    groups[cat].total30d += p.total30d || 0;
    groups[cat].count += 1;
    groups[cat].protocols.push(p.displayName || p.name);
  }

  return groups;
}

// ============================================================
// Provider — fetch + normalize helpers
// ============================================================

async function fetchJSON<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const json = await res.json();
    if (json.source === "static") return null;
    return json as T;
  } catch {
    return null;
  }
}

/**
 * Fetch the fees overview and normalise the response into the
 * LiveFeeOverview shape that the rest of the app expects.
 *
 * The API returns `totalDataChart` as `Array<{date,fees,revenue}>`
 * but the app expects `[timestamp, value][]` tuples.
 */
async function fetchFees(): Promise<LiveFeeOverview | null> {
  try {
    const res = await fetch("/api/defillama?type=overview");
    if (!res.ok) return null;
    const json = await res.json();
    if (json.source === "static") return null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw = json as Record<string, any>;

    // Normalize totalDataChart → [timestamp, feeValue][]
    const rawChart = Array.isArray(raw.totalDataChart) ? raw.totalDataChart : [];
    const totalDataChart: [number, number][] = rawChart.map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (entry: any): [number, number] => {
        if (Array.isArray(entry) && entry.length >= 2) {
          return [Number(entry[0]), Number(entry[1]) || 0];
        }
        if (entry && typeof entry === "object") {
          return [
            Number(entry.date ?? 0),
            Number(entry.fees ?? entry.Fees ?? entry.dailyFees ?? entry.value ?? 0),
          ];
        }
        return [0, 0];
      },
    );

    // Normalize protocols (now includes revenue, holders, margin, enriched fields)
    const rawProtos = Array.isArray(raw.protocols) ? raw.protocols : [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const protocols: LiveProtocolFee[] = rawProtos.map((p: any) => ({
      name: String(p.name ?? ""),
      displayName: String(p.displayName ?? p.name ?? ""),
      slug: String(p.slug ?? ""),
      category: String(p.category ?? "Other"),
      logo: p.logo ? String(p.logo) : null,
      defillamaId: p.defillamaId != null ? String(p.defillamaId) : null,
      parentProtocol: p.parentProtocol ? String(p.parentProtocol) : null,
      chains: Array.isArray(p.chains) ? p.chains.map(String) : [],
      total24h: Number(p.total24h ?? 0),
      total7d: Number(p.total7d ?? 0),
      total30d: Number(p.total30d ?? 0),
      totalAllTime: Number(p.totalAllTime ?? 0),
      total1y: p.total1y != null ? Number(p.total1y) : null,
      average1y: p.average1y != null ? Number(p.average1y) : null,
      revenue24h: p.revenue24h != null ? Number(p.revenue24h) : null,
      revenue7d: p.revenue7d != null ? Number(p.revenue7d) : null,
      revenue30d: p.revenue30d != null ? Number(p.revenue30d) : null,
      holdersRevenue24h: p.holdersRevenue24h != null ? Number(p.holdersRevenue24h) : null,
      margin: p.margin != null ? Number(p.margin) : null,
      change_1d: p.change1d ?? p.change_1d ?? null,
      change_7d: p.change7d ?? p.change_7d ?? null,
      change_1m: p.change1m ?? p.change_1m ?? null,
      change_7dover7d: p.change7dover7d ?? null,
      change_30dover30d: p.change30dover30d ?? null,
      doublecounted: p.doublecounted === true,
      methodology: p.methodology && typeof p.methodology === "object" ? p.methodology : null,
    }));

    return {
      totalFees24h: Number(raw.totalFees24h ?? 0),
      totalRevenue24h: Number(raw.totalRevenue24h ?? 0),
      change_1d: Number(raw.change_1d ?? 0),
      change_7d: Number(raw.change_7d ?? 0),
      change_1m: Number(raw.change_1m ?? 0),
      totalDataChart,
      protocols,
    };
  } catch {
    return null;
  }
}

/**
 * Fetch TVL and normalise into the LiveTVLData shape.
 *
 * The API returns quarterly buckets and per-protocol detail, but the
 * frontend expects flat `[timestamp, tvlValue][]` and a simplified
 * `topProtocols` list.
 */
async function fetchTVL(): Promise<LiveTVLData | null> {
  try {
    const res = await fetch("/api/defillama/tvl");
    if (!res.ok) return null;
    const json = await res.json();
    if (json.error) return null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw = json as Record<string, any>;

    // Convert quarterly TVL → [timestamp, value][] tuples
    const totalDataChart: [number, number][] = [];
    if (Array.isArray(raw.totalTVLQuarterly)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const q of raw.totalTVLQuarterly as any[]) {
        const ts = q.startDate
          ? Math.floor(new Date(q.startDate).getTime() / 1000)
          : 0;
        totalDataChart.push([ts, Number(q.endTotalTVL ?? q.avgTotalTVL ?? 0)]);
      }
    }

    // Normalise top protocols → { name, tvl, category, chains }
    const topProtocols = Array.isArray(raw.topProtocols)
      ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
        raw.topProtocols.map((p: any) => ({
          name: String(p.name ?? ""),
          tvl: Number(p.currentTVL ?? p.tvl ?? 0),
          category: String(p.category ?? ""),
          chains: Array.isArray(p.chains) ? p.chains.map(String) : [],
        }))
      : [];

    // All protocols with TVL > 0 (lightweight, no quarterly detail)
    const allProtocolsTVL = Array.isArray(raw.allProtocolsTVL)
      ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
        raw.allProtocolsTVL.map((p: any) => ({
          name: String(p.name ?? ""),
          slug: String(p.slug ?? ""),
          tvl: Number(p.currentTVL ?? p.tvl ?? 0),
          category: String(p.category ?? ""),
          chains: Array.isArray(p.chains) ? p.chains.map(String) : [],
          mcap: p.mcap != null ? Number(p.mcap) : null,
          fdv: p.fdv != null ? Number(p.fdv) : null,
        }))
      : [];

    return { totalDataChart, topProtocols, allProtocolsTVL };
  } catch {
    return null;
  }
}

/**
 * Fetch protocol-history and normalise into LiveProtocolHistory.
 */
async function fetchProtocolHistory(): Promise<LiveProtocolHistory | null> {
  try {
    const res = await fetch(
      "/api/defillama/protocol-history?protocols=aave,uniswap,hyperliquid,jupiter,raydium,lido,tether,circle",
    );
    if (!res.ok) return null;
    const json = await res.json();
    if (json.error) return null;

    const protocols = Array.isArray(json.protocols) ? json.protocols : [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return { protocols: protocols.map((p: any) => ({
      name: String(p.name ?? ""),
      history: Array.isArray(p.history) ? p.history : [],
    })) };
  } catch {
    return null;
  }
}

/**
 * Fetch and normalise the ETF API response.
 *
 * The /api/defillama/etf route returns either
 *   { source: "static", data: null }            (no API key)
 *   { source: "pro",    data: { ... } }          (Pro API)
 *
 * We unwrap the nested `.data` envelope and map the Pro API shape
 * into the flat LiveETFData interface the rest of the app expects.
 */
async function fetchETF(): Promise<LiveETFData | null> {
  try {
    const res = await fetch("/api/defillama/etf");
    if (!res.ok) return null;
    const json = await res.json();

    // Static fallback — no API key configured
    if (json.source === "static" || !json.data) return null;

    const d = json.data as Record<string, unknown>;

    // Extract per-category AUM
    let btcEtfAum = 0;
    let ethEtfAum = 0;
    if (Array.isArray(d.categories)) {
      for (const cat of d.categories as { category: string; totalAum: number }[]) {
        if (cat.category?.toLowerCase().includes("btc")) btcEtfAum = cat.totalAum ?? 0;
        if (cat.category?.toLowerCase().includes("eth")) ethEtfAum = cat.totalAum ?? 0;
      }
    }

    const totalAum = (d.totalAum as number) ?? btcEtfAum + ethEtfAum;

    // Map flowHistory -> netFlows
    const flowHistory = Array.isArray(d.flowHistory) ? d.flowHistory : [];
    const netFlows = flowHistory.map((entry: Record<string, unknown>) => ({
      date: String(entry.date ?? ""),
      btcFlows: Number(entry.btcFlows ?? 0),
      ethFlows: Number(entry.ethFlows ?? 0),
      totalFlows: Number(entry.totalFlows ?? 0),
    }));

    return { totalAum, btcEtfAum, ethEtfAum, netFlows };
  } catch {
    return null;
  }
}

/**
 * Fetch on-chain user activity data and normalise into LiveActivityData.
 *
 * The /api/defillama/activity route returns DEX volume, fee-generating
 * protocol counts, and merged daily chart data.
 */
async function fetchActivity(): Promise<LiveActivityData | null> {
  try {
    const res = await fetch("/api/defillama/activity");
    if (!res.ok) return null;
    const json = await res.json();
    if (json.error) return null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw = json as Record<string, any>;

    const totalDataChart = Array.isArray(raw.totalDataChart)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? raw.totalDataChart.map((entry: any) => ({
          date: Number(entry.date ?? 0),
          dexVolume: Number(entry.dexVolume ?? 0),
          feeVolume: Number(entry.feeVolume ?? 0),
        }))
      : [];

    const topProtocolsByUsers = Array.isArray(raw.topProtocolsByUsers)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? raw.topProtocolsByUsers.map((p: any) => ({
          name: String(p.name ?? ""),
          category: String(p.category ?? "Other"),
          volume24h: Number(p.volume24h ?? 0),
          change7d: p.change7d != null ? Number(p.change7d) : null,
        }))
      : [];

    return {
      dailyActiveProtocols: Number(raw.dailyActiveProtocols ?? 0),
      dexVolume24h: Number(raw.dexVolume24h ?? 0),
      dexVolume7d: Number(raw.dexVolume7d ?? 0),
      totalDataChart,
      topProtocolsByUsers,
      fetchedAt: String(raw.fetchedAt ?? new Date().toISOString()),
    };
  } catch {
    return null;
  }
}

/**
 * Fetch protocol earnings/margin data and normalise into LiveEarningsData.
 *
 * The /api/tokenterminal/earnings route returns margin data for key
 * protocols, or { source: "static", protocols: [] } when no API key
 * is configured.
 */
async function fetchEarnings(): Promise<LiveEarningsData | null> {
  try {
    const res = await fetch("/api/tokenterminal/earnings");
    if (!res.ok) return null;
    const json = await res.json();
    if (json.error) return null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw = json as Record<string, any>;

    const source = raw.source === "api" ? "api" as const : "static" as const;

    // If static with no protocols, return null so the context treats it
    // as unavailable (consistent with other fetchers)
    if (source === "static" && (!Array.isArray(raw.protocols) || raw.protocols.length === 0)) {
      return null;
    }

    const protocols = Array.isArray(raw.protocols)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? raw.protocols.map((p: any) => ({
          id: String(p.id ?? ""),
          name: String(p.name ?? ""),
          aliases: Array.isArray(p.aliases) ? p.aliases.map(String) : [],
          latestRevenue: Number(p.latestRevenue ?? 0),
          latestEarnings: Number(p.latestEarnings ?? 0),
          margin: Number(p.margin ?? 0),
          revenueHistory: Array.isArray(p.revenueHistory)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ? p.revenueHistory.map((h: any) => ({
                date: String(h.date ?? ""),
                revenue: Number(h.revenue ?? 0),
                earnings: Number(h.earnings ?? 0),
                margin: Number(h.margin ?? 0),
              }))
            : [],
        }))
      : [];

    return {
      source,
      protocols,
      fetchedAt: String(raw.fetchedAt ?? new Date().toISOString()),
    };
  } catch {
    return null;
  }
}

/**
 * Fetch CoinGlass derivatives data and normalise into LiveCoinGlassData.
 *
 * The /api/coinglass route returns either
 *   { source: "static", data: null }   (no API key)
 *   { source: "api",    data: { ... } } (live data)
 *
 * We unwrap the `.data` envelope and return it typed.
 */
async function fetchCoinGlass(): Promise<LiveCoinGlassData | null> {
  try {
    const res = await fetch("/api/coinglass");
    if (!res.ok) return null;
    const json = await res.json();

    // Static fallback — no API key configured
    if (json.source === "static" || !json.data) return null;

    const d = json.data as LiveCoinGlassData;
    return d;
  } catch {
    return null;
  }
}

/**
 * Fetch sector-level historical fee/revenue time series.
 * Uses the new /api/defillama/sector-history endpoint.
 */
async function fetchSectorHistory(): Promise<LiveSectorHistory | null> {
  try {
    const res = await fetch("/api/defillama/sector-history");
    if (!res.ok) return null;
    const json = await res.json();
    if (json.error) return null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw = json as Record<string, any>;

    return {
      dates: Array.isArray(raw.dates) ? raw.dates.map(Number) : [],
      fees: raw.fees && typeof raw.fees === "object" ? raw.fees : {},
      revenue: raw.revenue && typeof raw.revenue === "object" ? raw.revenue : null,
      revenueDates: Array.isArray(raw.revenueDates) ? raw.revenueDates.map(Number) : null,
      protocolCount: Number(raw.protocolCount ?? 0),
    };
  } catch {
    return null;
  }
}

/**
 * Fetch CoinGecko market data and normalise into LiveCoinGeckoData.
 */
async function fetchCoinGecko(): Promise<LiveCoinGeckoData | null> {
  try {
    const res = await fetch("/api/coingecko");
    if (!res.ok) return null;
    const json = await res.json();
    if (json.error) return null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw = json as Record<string, any>;

    const globalRaw = raw.global ?? {};
    const global = {
      totalMarketCap: Number(globalRaw.totalMarketCap ?? 0),
      totalVolume24h: Number(globalRaw.totalVolume24h ?? 0),
      btcDominance: Number(globalRaw.btcDominance ?? 0),
      ethDominance: Number(globalRaw.ethDominance ?? 0),
      marketCapChange24h: Number(globalRaw.marketCapChange24h ?? 0),
    };

    const tokens = Array.isArray(raw.tokens)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? raw.tokens.map((t: any) => ({
          id: String(t.id ?? ""),
          symbol: String(t.symbol ?? ""),
          name: String(t.name ?? ""),
          currentPrice: Number(t.currentPrice ?? 0),
          marketCap: Number(t.marketCap ?? 0),
          priceChange24h: Number(t.priceChange24h ?? 0),
          priceChange7d: Number(t.priceChange7d ?? 0),
          priceChange30d: Number(t.priceChange30d ?? 0),
          fullyDilutedValuation: t.fullyDilutedValuation != null ? Number(t.fullyDilutedValuation) : null,
          totalVolume24h: Number(t.totalVolume24h ?? 0),
          marketCapRank: t.marketCapRank != null ? Number(t.marketCapRank) : null,
          ath: t.ath != null ? Number(t.ath) : null,
          atl: t.atl != null ? Number(t.atl) : null,
          athChangePercentage: t.athChangePercentage != null ? Number(t.athChangePercentage) : null,
          circulatingSupply: t.circulatingSupply != null ? Number(t.circulatingSupply) : null,
        }))
      : [];

    const historicalMarketCap = Array.isArray(raw.historicalMarketCap)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? raw.historicalMarketCap.map((entry: any) => ({
          date: Number(entry.date ?? 0),
          marketCap: Number(entry.marketCap ?? 0),
        }))
      : [];

    return {
      global,
      tokens,
      historicalMarketCap,
      fetchedAt: String(raw.fetchedAt ?? new Date().toISOString()),
    };
  } catch {
    return null;
  }
}

// ============================================================
// Compute differentials between DefiLlama and TokenTerminal data
// ============================================================
function computeDifferentials(
  fees: LiveFeeOverview | null,
  tokenTerminal: LiveTokenTerminalData | null
): DataDifferential[] {
  const results: DataDifferential[] = [];

  // Build a map of TokenTerminal protocols by lowercase project_id
  const ttMap = new Map<string, { revenue: number | null; fees: number | null }>();
  if (tokenTerminal?.protocols) {
    for (const p of tokenTerminal.protocols) {
      const key = p.project_id.toLowerCase();
      let revenue: number | null = null;
      let ttFees: number | null = null;
      for (const m of p.metrics) {
        if (m.metric_id === "revenue") revenue = m.value;
        if (m.metric_id === "fees") ttFees = m.value;
      }
      ttMap.set(key, { revenue, fees: ttFees });
    }
  }

  const matchedTT = new Set<string>();

  // Walk DefiLlama protocols and try to match against TokenTerminal
  if (fees?.protocols) {
    for (const p of fees.protocols) {
      const key = p.name.toLowerCase();
      const ttEntry = ttMap.get(key);

      if (ttEntry) {
        matchedTT.add(key);
        const defillamaAnnualised = p.total24h * 365;
        const ttRevenue = ttEntry.revenue;
        let differentialPct: number | null = null;
        if (ttRevenue != null && ttRevenue !== 0) {
          differentialPct = ((defillamaAnnualised - ttRevenue) / ttRevenue) * 100;
        }
        results.push({
          protocolId: key,
          protocolName: p.displayName || p.name,
          defillamaRevenue24h: p.total24h,
          defillamaRevenue30d: p.total30d,
          tokenTerminalRevenue: ttEntry.revenue,
          tokenTerminalFees: ttEntry.fees,
          differentialPct,
          source: "both",
        });
      } else {
        results.push({
          protocolId: key,
          protocolName: p.displayName || p.name,
          defillamaRevenue24h: p.total24h,
          defillamaRevenue30d: p.total30d,
          tokenTerminalRevenue: null,
          tokenTerminalFees: null,
          differentialPct: null,
          source: "defillama_only",
        });
      }
    }
  }

  // Add TokenTerminal-only protocols (not matched above)
  if (tokenTerminal?.protocols) {
    for (const p of tokenTerminal.protocols) {
      const key = p.project_id.toLowerCase();
      if (!matchedTT.has(key)) {
        let revenue: number | null = null;
        let ttFees: number | null = null;
        for (const m of p.metrics) {
          if (m.metric_id === "revenue") revenue = m.value;
          if (m.metric_id === "fees") ttFees = m.value;
        }
        results.push({
          protocolId: key,
          protocolName: p.project_id,
          defillamaRevenue24h: null,
          defillamaRevenue30d: null,
          tokenTerminalRevenue: revenue,
          tokenTerminalFees: ttFees,
          differentialPct: null,
          source: "tokenterminal_only",
        });
      }
    }
  }

  return results;
}

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [fees, setFees] = useState<LiveFeeOverview | null>(null);
  const [sentiment, setSentiment] = useState<LiveSentiment | null>(null);
  const [tokenTerminal, setTokenTerminal] = useState<LiveTokenTerminalData | null>(null);
  const [tvl, setTvl] = useState<LiveTVLData | null>(null);
  const [etf, setEtf] = useState<LiveETFData | null>(null);
  const [protocolHistory, setProtocolHistory] = useState<LiveProtocolHistory | null>(null);
  const [activity, setActivity] = useState<LiveActivityData | null>(null);
  const [earnings, setEarnings] = useState<LiveEarningsData | null>(null);
  const [coinGlass, setCoinGlass] = useState<LiveCoinGlassData | null>(null);
  const [coinGecko, setCoinGecko] = useState<LiveCoinGeckoData | null>(null);
  const [sectorHistory, setSectorHistory] = useState<LiveSectorHistory | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    const errs: string[] = [];

    // Launch ALL fetches in parallel immediately
    const feesP = fetchFees();
    const sentimentP = fetchJSON<LiveSentiment>("/api/sentiment");
    const ttP = fetchJSON<LiveTokenTerminalData>("/api/tokenterminal");
    const tvlP = fetchTVL();
    const etfP = fetchETF();
    const protocolHistoryP = fetchProtocolHistory();
    const activityP = fetchActivity();
    const earningsP = fetchEarnings();
    const coinGlassP = fetchCoinGlass();
    const coinGeckoP = fetchCoinGecko();
    const sectorHistoryP = fetchSectorHistory();

    // Wave 1: Wait for critical data (fees, coinGecko, tvl, sentiment)
    // These power the main sections and scatter plots
    const [feesData, coinGeckoData, tvlData, sentimentData] = await Promise.allSettled([
      feesP, coinGeckoP, tvlP, sentimentP,
    ]);

    if (feesData.status === "fulfilled" && feesData.value) {
      setFees(feesData.value);
    } else {
      errs.push("DefiLlama fees fetch failed");
    }

    if (coinGeckoData.status === "fulfilled" && coinGeckoData.value) {
      setCoinGecko(coinGeckoData.value);
    } else {
      errs.push("CoinGecko market data fetch failed");
    }

    if (tvlData.status === "fulfilled" && tvlData.value) {
      setTvl(tvlData.value);
    } else {
      errs.push("TVL fetch failed");
    }

    if (sentimentData.status === "fulfilled" && sentimentData.value) {
      setSentiment(sentimentData.value);
    } else {
      errs.push("Sentiment fetch failed");
    }

    // Unblock the UI — sections can start rendering with critical data
    setIsLoading(false);
    setLastUpdated(new Date());

    // Wave 2: Process secondary data as it arrives (already in flight)
    const [ttData, etfData, protocolHistoryData, activityData, earningsData, coinGlassData, sectorHistoryData] = await Promise.allSettled([
      ttP, etfP, protocolHistoryP, activityP, earningsP, coinGlassP, sectorHistoryP,
    ]);

    if (ttData.status === "fulfilled" && ttData.value) {
      setTokenTerminal(ttData.value);
    } else {
      errs.push("TokenTerminal fetch failed (check API key)");
    }

    if (etfData.status === "fulfilled" && etfData.value) {
      setEtf(etfData.value);
    }
    // ETF data is optional (Pro-only) — don't report as error

    if (protocolHistoryData.status === "fulfilled" && protocolHistoryData.value) {
      setProtocolHistory(protocolHistoryData.value);
    } else {
      errs.push("Protocol history fetch failed");
    }

    if (activityData.status === "fulfilled" && activityData.value) {
      setActivity(activityData.value);
    } else {
      errs.push("On-chain activity fetch failed");
    }

    if (earningsData.status === "fulfilled" && earningsData.value) {
      setEarnings(earningsData.value);
    } else {
      errs.push("Protocol earnings fetch failed");
    }

    if (coinGlassData.status === "fulfilled" && coinGlassData.value) {
      setCoinGlass(coinGlassData.value);
    } else {
      errs.push("CoinGlass derivatives data fetch failed");
    }

    if (sectorHistoryData.status === "fulfilled" && sectorHistoryData.value) {
      setSectorHistory(sectorHistoryData.value);
    } else {
      errs.push("Sector history fetch failed");
    }

    setErrors(errs);
    setLastUpdated(new Date());
  }, []);

  useEffect(() => {
    fetchAll();
    // Refresh every 5 minutes for more real-time feel
    const interval = setInterval(fetchAll, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  const isLive = !!(fees || sentiment || tokenTerminal || tvl || etf || protocolHistory || activity || earnings || coinGlass || coinGecko || sectorHistory);

  const differentials = useMemo(
    () => computeDifferentials(fees, tokenTerminal),
    [fees, tokenTerminal]
  );

  const unifiedTokens = useMemo(
    () => buildUnifiedTokenList(fees, coinGecko, tvl, earnings),
    [fees, coinGecko, tvl, earnings]
  );

  return (
    <DataContext.Provider
      value={{ fees, sentiment, tokenTerminal, tvl, etf, protocolHistory, activity, earnings, coinGlass, coinGecko, sectorHistory, differentials, unifiedTokens, isLoading, isLive, lastUpdated, errors, refetch: fetchAll }}
    >
      {children}
    </DataContext.Provider>
  );
}

// ============================================================
// Protocol lookup hook — fast cross-source indexing
// ============================================================
export function useProtocolLookup() {
  const ctx = useDataContext();
  return useMemo(() => {
    const map = new Map<string, {
      defillama: LiveProtocolFee | null;
      coinGecko: LiveCoinGeckoData['tokens'][number] | null;
      tvl: LiveTVLData['topProtocols'][number] | null;
      earnings: LiveEarningsData['protocols'][number] | null;
      history: LiveProtocolHistory['protocols'][number] | null;
    }>();

    // Index DefiLlama protocols
    if (ctx.fees?.protocols) {
      for (const p of ctx.fees.protocols) {
        const key = p.name.toLowerCase();
        if (!map.has(key)) map.set(key, { defillama: null, coinGecko: null, tvl: null, earnings: null, history: null });
        map.get(key)!.defillama = p;
      }
    }

    // Build a reverse index: coinGeckoId -> protocol map key
    const cgIdToProtocolKey = new Map<string, string>();
    for (const [mapKey, mapping] of Object.entries(PROTOCOL_TOKEN_MAP)) {
      if (mapping.coinGeckoId) {
        cgIdToProtocolKey.set(mapping.coinGeckoId, mapKey);
      }
    }

    // Index CoinGecko tokens
    if (ctx.coinGecko?.tokens) {
      for (const t of ctx.coinGecko.tokens) {
        // Try mapping.coinGeckoId first for reliable matching
        const protocolKey = cgIdToProtocolKey.get(t.id);
        if (protocolKey && map.has(protocolKey)) {
          map.get(protocolKey)!.coinGecko = t;
          continue;
        }
        // Also try matching the defiLlamaName from the mapping
        const mapping = PROTOCOL_TOKEN_MAP[protocolKey ?? ""];
        if (mapping) {
          const dlKey = mapping.defiLlamaName.toLowerCase();
          if (map.has(dlKey)) {
            map.get(dlKey)!.coinGecko = t;
            continue;
          }
        }
        // Fallback: match by token name
        const key = t.name.toLowerCase();
        if (map.has(key)) {
          map.get(key)!.coinGecko = t;
        } else {
          // Try matching by id
          const byId = [...map.keys()].find(k => k === t.id.toLowerCase());
          if (byId) map.get(byId)!.coinGecko = t;
        }
      }
    }

    // Index TVL — prefer allProtocolsTVL for comprehensive coverage (~2000+)
    const tvlSource = ctx.tvl?.allProtocolsTVL ?? ctx.tvl?.topProtocols ?? [];
    for (const p of tvlSource) {
      const key = p.name.toLowerCase();
      if (map.has(key)) map.get(key)!.tvl = p;
    }

    // Index earnings — use aliases for robust cross-source matching
    if (ctx.earnings?.protocols) {
      for (const p of ctx.earnings.protocols) {
        const keys = [p.name.toLowerCase(), p.id.toLowerCase(), ...p.aliases.map(a => a.toLowerCase())];
        for (const key of keys) {
          if (map.has(key) && !map.get(key)!.earnings) { map.get(key)!.earnings = p; }
        }
      }
    }

    // Index history
    if (ctx.protocolHistory?.protocols) {
      for (const p of ctx.protocolHistory.protocols) {
        const key = p.name.toLowerCase();
        if (map.has(key)) map.get(key)!.history = p;
      }
    }

    return map;
  }, [ctx]);
}
