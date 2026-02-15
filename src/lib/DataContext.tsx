"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

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
  category: string;
  chains: string[];
  total24h: number;
  total7d: number;
  total30d: number;
  totalAllTime: number;
  change_1d: number | null;
  change_7d: number | null;
  change_1m: number | null;
  revenue24h?: number;
  revenue7d?: number;
  revenue30d?: number;
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

export interface LiveData {
  fees: LiveFeeOverview | null;
  sentiment: LiveSentiment | null;
  tokenTerminal: LiveTokenTerminalData | null;
  tvl: LiveTVLData | null;
  etf: LiveETFData | null;
  protocolHistory: LiveProtocolHistory | null;
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

    // Normalize protocols
    const rawProtos = Array.isArray(raw.protocols) ? raw.protocols : [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const protocols: LiveProtocolFee[] = rawProtos.map((p: any) => ({
      name: String(p.name ?? ""),
      displayName: String(p.name ?? p.displayName ?? ""),
      category: String(p.category ?? "Other"),
      chains: Array.isArray(p.chains) ? p.chains.map(String) : [],
      total24h: Number(p.total24h ?? 0),
      total7d: Number(p.total7d ?? 0),
      total30d: Number(p.total30d ?? 0),
      totalAllTime: Number(p.totalAllTime ?? 0),
      change_1d: p.change1d ?? p.change_1d ?? null,
      change_7d: p.change7d ?? p.change_7d ?? null,
      change_1m: p.change1m ?? p.change_1m ?? null,
      revenue24h: Number(p.revenue24h ?? 0),
      revenue7d: Number(p.revenue7d ?? 0),
      revenue30d: Number(p.revenue30d ?? 0),
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

    return { totalDataChart, topProtocols };
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

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [fees, setFees] = useState<LiveFeeOverview | null>(null);
  const [sentiment, setSentiment] = useState<LiveSentiment | null>(null);
  const [tokenTerminal, setTokenTerminal] = useState<LiveTokenTerminalData | null>(null);
  const [tvl, setTvl] = useState<LiveTVLData | null>(null);
  const [etf, setEtf] = useState<LiveETFData | null>(null);
  const [protocolHistory, setProtocolHistory] = useState<LiveProtocolHistory | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    const errs: string[] = [];

    const [feesData, sentimentData, ttData, tvlData, etfData, protocolHistoryData] = await Promise.allSettled([
      fetchFees(),
      fetchJSON<LiveSentiment>("/api/sentiment"),
      fetchJSON<LiveTokenTerminalData>("/api/tokenterminal"),
      fetchTVL(),
      fetchETF(),
      fetchProtocolHistory(),
    ]);

    if (feesData.status === "fulfilled" && feesData.value) {
      setFees(feesData.value);
    } else {
      errs.push("DefiLlama fees fetch failed");
    }

    if (sentimentData.status === "fulfilled" && sentimentData.value) {
      setSentiment(sentimentData.value);
    } else {
      errs.push("Sentiment fetch failed");
    }

    if (ttData.status === "fulfilled" && ttData.value) {
      setTokenTerminal(ttData.value);
    } else {
      errs.push("TokenTerminal fetch failed (check API key)");
    }

    if (tvlData.status === "fulfilled" && tvlData.value) {
      setTvl(tvlData.value);
    } else {
      errs.push("TVL fetch failed");
    }

    if (etfData.status === "fulfilled" && etfData.value) {
      setEtf(etfData.value);
    } else {
      errs.push("ETF flow data fetch failed");
    }

    if (protocolHistoryData.status === "fulfilled" && protocolHistoryData.value) {
      setProtocolHistory(protocolHistoryData.value);
    } else {
      errs.push("Protocol history fetch failed");
    }

    setErrors(errs);
    setIsLoading(false);
    setLastUpdated(new Date());
  }, []);

  useEffect(() => {
    fetchAll();
    // Refresh every 30 minutes
    const interval = setInterval(fetchAll, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  const isLive = !!(fees || sentiment || tokenTerminal || tvl || etf || protocolHistory);

  return (
    <DataContext.Provider
      value={{ fees, sentiment, tokenTerminal, tvl, etf, protocolHistory, isLoading, isLive, lastUpdated, errors, refetch: fetchAll }}
    >
      {children}
    </DataContext.Provider>
  );
}
