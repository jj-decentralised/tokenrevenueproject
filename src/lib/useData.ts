"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import * as staticData from "./data";

// ============================================================
// Types
// ============================================================

/** The full shape of the static data module (all named exports). */
type StaticData = typeof staticData;

/** What each API endpoint may return on success. */
interface TokenTerminalResponse {
  source?: "static" | "live";
  annualRevenueData?: StaticData["annualRevenueData"];
  quarterlyRevenueData?: StaticData["quarterlyRevenueData"];
  peComparisonData?: StaticData["peComparisonData"];
  earlyTechPSComparison?: StaticData["earlyTechPSComparison"];
  moatAnalysis?: StaticData["moatAnalysis"];
}

interface DefiLlamaResponse {
  source?: "static" | "live";
  sectorBreakdownTimeSeries?: StaticData["sectorBreakdownTimeSeries"];
  h1_2025_sectorBreakdown?: StaticData["h1_2025_sectorBreakdown"];
  exchangeRevenueHistory?: StaticData["exchangeRevenueHistory"];
  stablecoinRevenueBreakdown?: StaticData["stablecoinRevenueBreakdown"];
  consumerCryptoApps?: StaticData["consumerCryptoApps"];
  consumerCryptoInsights?: StaticData["consumerCryptoInsights"];
}

interface SentimentResponse {
  source?: "static" | "live";
  sentimentVsRevenueData?: StaticData["sentimentVsRevenueData"];
  sentimentKeyMetrics?: StaticData["sentimentKeyMetrics"];
  ethFlowsData?: StaticData["ethFlowsData"];
  tradFiParallels?: StaticData["tradFiParallels"];
}

export interface RevenueDataResult {
  data: StaticData;
  isLive: boolean;
  isLoading: boolean;
  lastUpdated: Date | null;
  errors: string[];
}

// ============================================================
// Constants
// ============================================================

const REFRESH_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes

const API_ENDPOINTS = {
  tokenterminal: "/api/tokenterminal",
  defillama: "/api/defillama",
  sentiment: "/api/sentiment",
} as const;

// ============================================================
// Helpers
// ============================================================

/**
 * Fetch JSON from a URL with a timeout. Returns `null` and an error
 * message string if anything goes wrong.
 */
async function safeFetch<T>(
  url: string,
  timeoutMs = 10_000,
): Promise<{ data: T | null; error: string | null }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);

    if (!res.ok) {
      return {
        data: null,
        error: `${url} responded with ${res.status} ${res.statusText}`,
      };
    }

    const json = (await res.json()) as T;
    return { data: json, error: null };
  } catch (err) {
    clearTimeout(timer);

    if (err instanceof DOMException && err.name === "AbortError") {
      return { data: null, error: `${url} request timed out after ${timeoutMs}ms` };
    }

    return {
      data: null,
      error: `${url} fetch failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

/**
 * Returns true if the API response is usable live data (not a static
 * fallback returned by the server).
 */
function isLiveResponse<T extends { source?: string }>(
  response: T | null,
): response is T {
  return response !== null && response.source !== "static";
}

/**
 * Deep-merge live data into a copy of static data. For every key that
 * exists in the live payload (and is not undefined), the live value wins.
 * Everything else keeps its static value.
 */
function mergeData(
  base: StaticData,
  tokenTerminal: TokenTerminalResponse | null,
  defillama: DefiLlamaResponse | null,
  sentiment: SentimentResponse | null,
): StaticData {
  // Start with a shallow copy of all static exports
  const merged: Record<string, unknown> = {};
  for (const key of Object.keys(base)) {
    merged[key] = (base as Record<string, unknown>)[key];
  }

  // Overlay live data where available
  const liveOverlays: Array<Record<string, unknown>> = [
    tokenTerminal ? { ...tokenTerminal } : {},
    defillama ? { ...defillama } : {},
    sentiment ? { ...sentiment } : {},
  ];

  for (const overlay of liveOverlays) {
    for (const [key, value] of Object.entries(overlay)) {
      // Skip meta keys that are not part of the data shape
      if (key === "source") continue;
      if (value !== undefined && value !== null) {
        merged[key] = value;
      }
    }
  }

  return merged as unknown as StaticData;
}

// ============================================================
// Hook
// ============================================================

export function useRevenueData(): RevenueDataResult {
  const [data, setData] = useState<StaticData>(staticData);
  const [isLive, setIsLive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  // Track whether the component is still mounted to avoid state updates
  // after unmount.
  const mountedRef = useRef(true);

  // Interval ref so we can clear it on unmount
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async () => {
    if (!mountedRef.current) return;

    setIsLoading(true);
    const newErrors: string[] = [];

    // Fire all three requests in parallel
    const [ttResult, dlResult, sentResult] = await Promise.all([
      safeFetch<TokenTerminalResponse>(API_ENDPOINTS.tokenterminal),
      safeFetch<DefiLlamaResponse>(API_ENDPOINTS.defillama),
      safeFetch<SentimentResponse>(API_ENDPOINTS.sentiment),
    ]);

    if (!mountedRef.current) return;

    // Collect errors
    if (ttResult.error) newErrors.push(ttResult.error);
    if (dlResult.error) newErrors.push(dlResult.error);
    if (sentResult.error) newErrors.push(sentResult.error);

    // Determine which responses are usable live data
    const ttLive = isLiveResponse(ttResult.data) ? ttResult.data : null;
    const dlLive = isLiveResponse(dlResult.data) ? dlResult.data : null;
    const sentLive = isLiveResponse(sentResult.data) ? sentResult.data : null;

    const anyLive = ttLive !== null || dlLive !== null || sentLive !== null;

    // Merge: live data takes priority, static fills gaps
    const merged = mergeData(staticData, ttLive, dlLive, sentLive);

    setData(merged);
    setIsLive(anyLive);
    setErrors(newErrors);
    if (anyLive) {
      setLastUpdated(new Date());
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    // Initial fetch on mount
    fetchData();

    // Refresh every 30 minutes (SWR-like pattern)
    intervalRef.current = setInterval(fetchData, REFRESH_INTERVAL_MS);

    return () => {
      mountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [fetchData]);

  return { data, isLive, isLoading, lastUpdated, errors };
}
