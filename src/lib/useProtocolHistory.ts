"use client";

import { useState, useEffect, useRef } from "react";
import { useDataContext } from "@/lib/DataContext";

// ============================================================
// Lazy protocol history hook with caching
// ============================================================

export interface ProtocolHistoryEntry {
  date: number;
  fees: number;
  revenue: number;
}

export interface ChainBreakdownEntry {
  date: number;
  chains: Record<string, number>;
}

interface UseProtocolHistoryResult {
  data: ProtocolHistoryEntry[] | null;
  breakdown: ChainBreakdownEntry[] | null;
  isLoading: boolean;
  error: string | null;
}

interface CacheEntry {
  data: ProtocolHistoryEntry[];
  breakdown: ChainBreakdownEntry[] | null;
}

// Module-level cache to persist across component re-renders
const historyCache = new Map<string, CacheEntry>();
const inflightRequests = new Map<string, Promise<CacheEntry | null>>();

async function fetchHistory(
  slug: string,
  withBreakdown: boolean,
): Promise<CacheEntry | null> {
  const cacheKey = `${slug}:${withBreakdown}`;

  // Check cache first
  if (historyCache.has(cacheKey)) {
    return historyCache.get(cacheKey)!;
  }

  // Deduplicate inflight requests
  if (inflightRequests.has(cacheKey)) {
    return inflightRequests.get(cacheKey)!;
  }

  const url = withBreakdown
    ? `/api/defillama/protocol-history?protocols=${encodeURIComponent(slug)}&breakdown=true`
    : `/api/defillama/protocol-history?protocols=${encodeURIComponent(slug)}`;

  const promise = fetch(url)
    .then(async (res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const protocol = json.protocols?.[0];
      if (!protocol) return null;

      const entry: CacheEntry = {
        data: protocol.history || [],
        breakdown: protocol.breakdown || null,
      };
      historyCache.set(cacheKey, entry);
      return entry;
    })
    .catch((err) => {
      console.warn(`[useProtocolHistory] Failed to fetch ${slug}:`, err);
      return null;
    })
    .finally(() => {
      inflightRequests.delete(cacheKey);
    });

  inflightRequests.set(cacheKey, promise);
  return promise;
}

export function useProtocolHistory(
  slug: string | null,
  options?: { breakdown?: boolean },
): UseProtocolHistoryResult {
  const { protocolHistory } = useDataContext();
  const withBreakdown = options?.breakdown ?? false;
  const [data, setData] = useState<ProtocolHistoryEntry[] | null>(null);
  const [breakdown, setBreakdown] = useState<ChainBreakdownEntry[] | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchedSlug = useRef<string | null>(null);

  useEffect(() => {
    if (!slug) {
      setData(null);
      setBreakdown(null);
      return;
    }

    // Check if already in pre-fetched DataContext
    const preloaded = protocolHistory?.protocols?.find(
      (p) => p.name.toLowerCase() === slug.toLowerCase(),
    );
    if (preloaded && !withBreakdown) {
      setData(preloaded.history);
      setBreakdown(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    // Avoid re-fetching the same slug
    const cacheKey = `${slug}:${withBreakdown}`;
    if (fetchedSlug.current === cacheKey && data) return;

    setIsLoading(true);
    setError(null);
    fetchedSlug.current = cacheKey;

    fetchHistory(slug, withBreakdown).then((result) => {
      if (fetchedSlug.current !== cacheKey) return; // stale
      if (result) {
        setData(result.data);
        setBreakdown(result.breakdown);
      } else {
        setError("No data available");
      }
      setIsLoading(false);
    });
  }, [slug, withBreakdown, protocolHistory, data]);

  return { data, breakdown, isLoading, error };
}
