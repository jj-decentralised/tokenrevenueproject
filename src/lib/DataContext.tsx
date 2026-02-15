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

export interface LiveData {
  fees: LiveFeeOverview | null;
  sentiment: LiveSentiment | null;
  tokenTerminal: LiveTokenTerminalData | null;
  tvl: LiveTVLData | null;
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
// Provider
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

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [fees, setFees] = useState<LiveFeeOverview | null>(null);
  const [sentiment, setSentiment] = useState<LiveSentiment | null>(null);
  const [tokenTerminal, setTokenTerminal] = useState<LiveTokenTerminalData | null>(null);
  const [tvl, setTvl] = useState<LiveTVLData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    const errs: string[] = [];

    const [feesData, sentimentData, ttData, tvlData] = await Promise.allSettled([
      fetchJSON<LiveFeeOverview>("/api/defillama?type=overview"),
      fetchJSON<LiveSentiment>("/api/sentiment"),
      fetchJSON<LiveTokenTerminalData>("/api/tokenterminal"),
      fetchJSON<LiveTVLData>("/api/defillama/tvl"),
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

  const isLive = !!(fees || sentiment || tokenTerminal || tvl);

  return (
    <DataContext.Provider
      value={{ fees, sentiment, tokenTerminal, tvl, isLoading, isLive, lastUpdated, errors, refetch: fetchAll }}
    >
      {children}
    </DataContext.Provider>
  );
}
