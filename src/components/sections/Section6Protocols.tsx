"use client";

import React, { useMemo, useState } from "react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from "recharts";
import { useDataContext, LiveProtocolFee } from "@/lib/DataContext";
import { findProtocolMapping, PROTOCOL_TOKEN_MAP } from "@/lib/protocolTokenMap";
import { CategoryTreeTable } from "@/components/ui/CategoryTreeTable";
import { ChartExport } from "@/components/ui/ChartExport";
import {
  Card,
  SectionHeader,
  DataSource,
} from "@/components/ui/Card";
import {
  CATEGORY_GROUP as SHARED_CATEGORY_GROUP,
  CATEGORY_COLORS as SHARED_CATEGORY_COLORS,
  GROUP_COLORS,
} from "@/lib/categories";

// ---------------------------------------------------------------------------
// Category color map (WSJ-style)
// ---------------------------------------------------------------------------

const CATEGORY_COLORS = SHARED_CATEGORY_COLORS;
const CATEGORY_GROUP = SHARED_CATEGORY_GROUP;

function getCategoryGroup(category: string): string {
  return CATEGORY_GROUP[category] || "Other";
}

function getCategoryColor(category: string): string {
  const group = getCategoryGroup(category);
  return CATEGORY_COLORS[category] || GROUP_COLORS[group] || "#94a3b8";
}

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

function formatCompact(value: number | null | undefined): string {
  if (value == null || !isFinite(value)) return "\u2014";
  const abs = Math.abs(value);
  if (abs >= 1e12) return `$${(value / 1e12).toFixed(1)}T`;
  if (abs >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `$${(value / 1e3).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
}

function formatRatio(value: number | null | undefined): string {
  if (value == null || !isFinite(value)) return "\u2014";
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return `${value.toFixed(1)}x`;
}

function formatPct(value: number | null | undefined): string {
  if (value == null || !isFinite(value)) return "\u2014";
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

function formatMargin(value: number | null | undefined): string {
  if (value == null || !isFinite(value)) return "\u2014";
  return `${(value * 100).toFixed(0)}%`;
}

function toSlug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

// ---------------------------------------------------------------------------
// Types for merged protocol data
// ---------------------------------------------------------------------------

interface MergedProtocol {
  rank: number;
  name: string;
  displayName: string;
  category: string;
  categoryGroup: string;
  slug: string;
  logo: string | null;
  fees24h: number;
  fees30d: number | null;
  feesAnn: number;
  protocolRevenue24h: number | null;
  protocolRevenue30d: number | null;
  holdersRevenue24h: number | null;
  margin: number | null;
  revenueAnn: number;
  marketCap: number | null;
  psRatio: number | null;
  tvl: number | null;
  revenueTvl: number | null;
  change1d: number | null;
  change7d: number | null;
  hasToken: boolean;
  fdv: number | null;
  psFdv: number | null;
  revenueFdv: number | null;
  mcapFdvRatio: number | null;
  change1m: number | null;
  // Backward compat aliases used in table display
  revenue24h: number;
  revenue30d: number | null;
}

// ---------------------------------------------------------------------------
// Filter categories
// ---------------------------------------------------------------------------

const FILTER_CATEGORIES = ["All", "DeFi", "Exchanges", "Stablecoins", "Blockchains", "Consumer", "Infrastructure", "DePIN"] as const;
type FilterCategory = (typeof FILTER_CATEGORIES)[number];

// ---------------------------------------------------------------------------
// Custom Tooltip Styles (WSJ -- no border-radius)
// ---------------------------------------------------------------------------

const tooltipStyle: React.CSSProperties = {
  backgroundColor: "#ffffff",
  border: "1px solid #d4d4d4",
  borderRadius: 0,
  padding: "10px 14px",
  fontSize: "13px",
  color: "#333333",
  boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
};

// ---------------------------------------------------------------------------
// Custom Tooltips
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ScatterTooltipRevMcap({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  return (
    <div style={tooltipStyle}>
      <p style={{ fontWeight: 700, color: "#111111", marginBottom: 4 }}>{d.name}</p>
      <p>Revenue (Ann.): {formatCompact(d.revenueAnn)}</p>
      <p>Market Cap: {formatCompact(d.marketCap)}</p>
      <p>P/S Ratio: {formatRatio(d.psRatio)}</p>
      {d.tvl != null && <p>TVL: {formatCompact(d.tvl)}</p>}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ScatterTooltipRevTvl({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  return (
    <div style={tooltipStyle}>
      <p style={{ fontWeight: 700, color: "#111111", marginBottom: 4 }}>{d.name}</p>
      <p>TVL: {formatCompact(d.tvl)}</p>
      <p>Revenue (Ann.): {formatCompact(d.revenueAnn)}</p>
      <p>Revenue/TVL: {d.revenueTvl != null ? `${(d.revenueTvl * 100).toFixed(2)}%` : "\u2014"}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Log scale tick formatter
// ---------------------------------------------------------------------------

function logTickFormatter(value: number): string {
  if (value >= 1e12) return `$${(value / 1e12).toFixed(0)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(0)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(0)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

// ---------------------------------------------------------------------------
// Heatmap cell color
// ---------------------------------------------------------------------------

function getHeatmapColor(change: number | null): string {
  if (change == null) return "#e8e8e8";
  if (change >= 50) return "#166534";
  if (change >= 20) return "#15803d";
  if (change >= 10) return "#22c55e";
  if (change >= 5) return "#4ade80";
  if (change >= 0) return "#bbf7d0";
  if (change >= -5) return "#fecaca";
  if (change >= -10) return "#f87171";
  if (change >= -20) return "#dc2626";
  return "#991b1b";
}

function getHeatmapTextColor(change: number | null): string {
  if (change == null) return "#999999";
  if (change >= 20 || change <= -20) return "#ffffff";
  return "#111111";
}

function abbreviate(name: string, maxLen: number = 6): string {
  if (name.length <= maxLen) return name;
  // Try taking first letters of words
  const words = name.split(/[\s-]+/);
  if (words.length > 1) {
    return words.map((w) => w[0]).join("").toUpperCase().slice(0, maxLen);
  }
  return name.slice(0, maxLen);
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function TableSkeleton() {
  return (
    <div className="w-full space-y-2 py-8">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex gap-4 animate-pulse">
          <div className="h-4 bg-slate-200 w-8" />
          <div className="h-4 bg-slate-200 flex-1" />
          <div className="h-4 bg-slate-200 w-20" />
          <div className="h-4 bg-slate-200 w-20" />
          <div className="h-4 bg-slate-200 w-20" />
        </div>
      ))}
    </div>
  );
}

function ChartSkeleton({ height = "h-[400px]" }: { height?: string }) {
  return (
    <div className={`${height} w-full flex items-center justify-center`}>
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-slate-400">Loading live data...</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Scatter legend component
// ---------------------------------------------------------------------------

function CategoryLegend() {
  const items = [
    { label: "DeFi", color: "#3b82f6" },
    { label: "Stablecoins", color: "#10b981" },
    { label: "Exchanges", color: "#8b5cf6" },
    { label: "Blockchains", color: "#f59e0b" },
    { label: "Consumer", color: "#ef4444" },
    { label: "DePIN", color: "#ec4899" },
    { label: "Infrastructure", color: "#6366f1" },
    { label: "Other", color: "#94a3b8" },
  ];
  return (
    <div className="flex flex-wrap gap-4 mt-3 text-xs" style={{ color: "#666666" }}>
      {items.map((item) => (
        <span key={item.label} className="flex items-center gap-1.5">
          <span
            className="w-2.5 h-2.5"
            style={{ backgroundColor: item.color, borderRadius: 0 }}
          />
          {item.label}
        </span>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Token vs Non-Token Summary Card
// ---------------------------------------------------------------------------

function TokenVsNonTokenSummary({ protocols }: { protocols: MergedProtocol[] }) {
  const stats = useMemo(() => {
    const tokenProjects = protocols.filter(p => p.hasToken);
    const nonTokenProjects = protocols.filter(p => !p.hasToken);

    const tokenRev = tokenProjects.reduce((s, p) => s + p.fees24h, 0);
    const nonTokenRev = nonTokenProjects.reduce((s, p) => s + p.fees24h, 0);
    const total = tokenRev + nonTokenRev;

    const median = (arr: number[]) => {
      if (arr.length === 0) return null;
      const sorted = [...arr].sort((a, b) => a - b);
      return sorted[Math.floor(sorted.length / 2)];
    };

    const tokenGrowth = median(tokenProjects.map(p => p.change7d).filter((v): v is number => v != null));
    const nonTokenGrowth = median(nonTokenProjects.map(p => p.change7d).filter((v): v is number => v != null));

    const psValues = tokenProjects.map(p => p.psRatio).filter((v): v is number => v != null && v < 1000);
    const avgPS = psValues.length > 0 ? psValues.reduce((s, v) => s + v, 0) / psValues.length : null;

    return {
      tokenCount: tokenProjects.length,
      nonTokenCount: nonTokenProjects.length,
      tokenRev, nonTokenRev, total,
      tokenPct: total > 0 ? (tokenRev / total) * 100 : 0,
      nonTokenPct: total > 0 ? (nonTokenRev / total) * 100 : 0,
      tokenGrowth, nonTokenGrowth, avgPS,
    };
  }, [protocols]);

  return (
    <Card>
      <div style={{ display: "flex", gap: 0, borderBottom: "1px solid #e8e8e8", marginBottom: 16 }}>
        <div style={{ flex: 1, padding: "16px 20px", borderRight: "1px solid #e8e8e8" }}>
          <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#999999", marginBottom: 8 }}>
            Token Projects
          </p>
          <p style={{ fontSize: "28px", fontWeight: 700, fontFamily: "Georgia, serif", color: "#111111" }}>
            {stats.tokenCount}
          </p>
          <p style={{ fontSize: "13px", color: "#666666", marginTop: 4 }}>
            {formatCompact(stats.tokenRev * 365)} annualized ({stats.tokenPct.toFixed(0)}% of total)
          </p>
          <p style={{ fontSize: "12px", color: stats.tokenGrowth != null && stats.tokenGrowth >= 0 ? "#2e7d32" : "#9e2b25", marginTop: 4 }}>
            Median 7d: {stats.tokenGrowth != null ? formatPct(stats.tokenGrowth) : "\u2014"}
          </p>
          {stats.avgPS != null && (
            <p style={{ fontSize: "12px", color: "#666666", marginTop: 2 }}>
              Avg P/S: {stats.avgPS.toFixed(1)}x
            </p>
          )}
        </div>
        <div style={{ flex: 1, padding: "16px 20px" }}>
          <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#999999", marginBottom: 8 }}>
            Non-Token Projects
          </p>
          <p style={{ fontSize: "28px", fontWeight: 700, fontFamily: "Georgia, serif", color: "#111111" }}>
            {stats.nonTokenCount}
          </p>
          <p style={{ fontSize: "13px", color: "#666666", marginTop: 4 }}>
            {formatCompact(stats.nonTokenRev * 365)} annualized ({stats.nonTokenPct.toFixed(0)}% of total)
          </p>
          <p style={{ fontSize: "12px", color: stats.nonTokenGrowth != null && stats.nonTokenGrowth >= 0 ? "#2e7d32" : "#9e2b25", marginTop: 4 }}>
            Median 7d: {stats.nonTokenGrowth != null ? formatPct(stats.nonTokenGrowth) : "\u2014"}
          </p>
        </div>
      </div>
      <DataSource sources={["DefiLlama (live)", "CoinGecko (live)"]} />
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function Section6Protocols() {
  const { fees, coinGecko, tvl, earnings, isLoading } = useDataContext();
  const [activeFilter, setActiveFilter] = useState<FilterCategory>("All");
  const [tokenFilter, setTokenFilter] = useState<"all" | "token" | "no-token">("all");
  const [viewMode, setViewMode] = useState<"flat" | "tree">("flat");
  const [topN, setTopN] = useState<number>(0); // 0 = show all
  const [currentPage, setCurrentPage] = useState(1);
  const ROWS_PER_PAGE = 100;

  // -----------------------------------------------------------------------
  // Merge data from all sources
  // -----------------------------------------------------------------------
  const mergedProtocols: MergedProtocol[] = useMemo(() => {
    if (!fees?.protocols) return [];

    const protocols = fees.protocols;
    const tokens = coinGecko?.tokens ?? [];
    const tvlProtocols = tvl?.allProtocolsTVL ?? [];
    const earningsProtocols = earnings?.protocols ?? [];

    // Sort by total24h descending - show ALL protocols with revenue
    const sorted = [...protocols]
      .filter((p) => p.total24h > 0)
      .sort((a, b) => b.total24h - a.total24h);

    // Build lookup indexes for O(1) matching
    const tokenById = new Map<string, typeof tokens[0]>();
    const tokenByNameLower = new Map<string, typeof tokens[0]>();
    const tokenBySymbolLower = new Map<string, typeof tokens[0]>();
    const tokenByFirstWord = new Map<string, typeof tokens[0]>();
    for (const t of tokens) {
      tokenById.set(t.id.toLowerCase(), t);
      tokenByNameLower.set(t.name.toLowerCase(), t);
      if (t.symbol) tokenBySymbolLower.set(t.symbol.toLowerCase(), t);
      // Build first-word index (e.g., "curve" from "Curve DAO Token")
      const firstWord = t.name.split(/\s+/)[0]?.toLowerCase();
      if (firstWord && firstWord.length > 2 && !tokenByFirstWord.has(firstWord)) {
        tokenByFirstWord.set(firstWord, t);
      }
    }

    // Build reverse map from PROTOCOL_TOKEN_MAP: coinGeckoId -> token entry
    // This pre-fills matches for protocols whose coinGeckoId is known
    const tokenByCoinGeckoMapping = new Map<string, typeof tokens[0]>();
    for (const entry of Object.values(PROTOCOL_TOKEN_MAP)) {
      if (entry.coinGeckoId) {
        const t = tokenById.get(entry.coinGeckoId.toLowerCase());
        if (t) {
          tokenByCoinGeckoMapping.set(entry.defiLlamaName.toLowerCase(), t);
          // Also index by the map key slug
          const slug = entry.defiLlamaName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
          tokenByCoinGeckoMapping.set(slug, t);
        }
      }
    }

    // Common suffixes to strip for fuzzy matching
    const STRIP_SUFFIXES = ["-finance", "-protocol", "-network", "-exchange", "-swap", "-dao", "-fi", ".fun", ".tech"];

    function stripSuffix(name: string): string {
      let stripped = name;
      for (const suffix of STRIP_SUFFIXES) {
        if (stripped.endsWith(suffix)) {
          stripped = stripped.slice(0, -suffix.length);
          break; // Only strip one suffix
        }
      }
      return stripped;
    }

    const tvlByName = new Map<string, typeof tvlProtocols[0]>();
    for (const t of tvlProtocols) {
      tvlByName.set(t.name.toLowerCase(), t);
    }

    const earningsByName = new Map<string, typeof earningsProtocols[0]>();
    const earningsById = new Map<string, typeof earningsProtocols[0]>();
    for (const e of earningsProtocols) {
      earningsByName.set(e.name.toLowerCase(), e);
      earningsById.set(e.id.toLowerCase(), e);
    }

    return sorted.map((p: LiveProtocolFee, idx: number) => {
      const nameLower = p.name.toLowerCase();
      const displayLower = p.displayName.toLowerCase();

      // Use central mapping for deterministic token matching
      const mapping = findProtocolMapping(p.name);

      // Match CoinGecko token - prefer mapping, then multi-strategy heuristic fallback
      let tokenMatch: typeof tokens[0] | undefined;
      if (mapping?.coinGeckoId) {
        tokenMatch = tokenById.get(mapping.coinGeckoId.toLowerCase());
      }
      if (!tokenMatch) {
        tokenMatch = tokenByCoinGeckoMapping.get(nameLower) || tokenByCoinGeckoMapping.get(displayLower);
      }
      if (!tokenMatch) {
        tokenMatch = tokenByNameLower.get(nameLower)
          || tokenById.get(nameLower)
          || tokenByNameLower.get(displayLower)
          || tokenById.get(displayLower)
          || tokenBySymbolLower.get(nameLower);
      }
      if (!tokenMatch) {
        const strippedName = stripSuffix(nameLower);
        const strippedDisplay = stripSuffix(displayLower);
        if (strippedName !== nameLower) {
          tokenMatch = tokenByNameLower.get(strippedName)
            || tokenById.get(strippedName)
            || tokenBySymbolLower.get(strippedName);
        }
        if (!tokenMatch && strippedDisplay !== displayLower) {
          tokenMatch = tokenByNameLower.get(strippedDisplay)
            || tokenById.get(strippedDisplay)
            || tokenBySymbolLower.get(strippedDisplay);
        }
      }
      if (!tokenMatch) {
        tokenMatch = tokenBySymbolLower.get(displayLower);
      }
      if (!tokenMatch) {
        const firstWordName = nameLower.split(/[\s-]+/)[0];
        const firstWordDisplay = displayLower.split(/[\s-]+/)[0];
        if (firstWordName && firstWordName.length > 2) {
          tokenMatch = tokenByFirstWord.get(firstWordName);
        }
        if (!tokenMatch && firstWordDisplay && firstWordDisplay.length > 2 && firstWordDisplay !== firstWordName) {
          tokenMatch = tokenByFirstWord.get(firstWordDisplay);
        }
      }

      const hasToken = mapping ? mapping.hasToken : (tokenMatch != null);

      // Match TVL (O(1) lookup) — allProtocolsTVL includes mcap field
      const tvlMatch = tvlByName.get(nameLower) || tvlByName.get(displayLower);

      // Match earnings (O(1) lookup)
      const earningsMatch = earningsByName.get(nameLower) || earningsById.get(nameLower) || earningsByName.get(displayLower);

      // Fees = total24h (what users pay), Protocol Revenue = revenue24h (what protocol keeps)
      const fees24h = p.total24h;
      const fees30d = p.total30d || null;
      const feesAnn = fees24h * 365;

      // Real protocol revenue from enriched API
      const protocolRevenue24h = p.revenue24h ?? null;
      const protocolRevenue30d = p.revenue30d ?? null;
      const holdersRevenue24h = p.holdersRevenue24h ?? null;

      // Use protocol revenue for P/S when available, fall back to total fees
      const psBase = protocolRevenue24h != null ? protocolRevenue24h * 365 : feesAnn;
      const revenueAnn = psBase; // best available annualized revenue

      // Margin: enriched DL margin → TT earnings margin
      const margin = p.margin ?? earningsMatch?.margin ?? null;

      // Market cap & FDV: CoinGecko → DefiLlama TVL endpoint fallback
      const marketCap = tokenMatch?.marketCap ?? tvlMatch?.mcap ?? null;
      const tvlVal = tvlMatch?.tvl ?? null;
      const fdv = tokenMatch?.fullyDilutedValuation ?? tvlMatch?.fdv ?? null;
      // P/S: prefer FDV → Market Cap fallback for broader coverage
      const psNumerator = fdv ?? marketCap;
      const psRatio =
        psNumerator != null && revenueAnn > 0 ? psNumerator / revenueAnn : null;
      const revenueTvl =
        tvlVal != null && tvlVal > 0 ? feesAnn / tvlVal : null;
      const psFdv = fdv != null && revenueAnn > 0 ? fdv / revenueAnn : null;
      const revenueFdv = fdv != null && fdv > 0 ? revenueAnn / fdv : null;
      const mcapFdvRatio = (marketCap != null && fdv != null && fdv > 0) ? marketCap / fdv : null;

      return {
        rank: idx + 1,
        name: p.name,
        displayName: p.displayName || p.name,
        category: p.category || "Other",
        categoryGroup: getCategoryGroup(p.category || "Other"),
        slug: toSlug(p.name),
        logo: p.logo ?? null,
        fees24h,
        fees30d,
        feesAnn,
        protocolRevenue24h,
        protocolRevenue30d,
        holdersRevenue24h,
        margin,
        revenueAnn,
        marketCap,
        psRatio,
        tvl: tvlVal,
        revenueTvl,
        change1d: p.change_1d,
        change7d: p.change_7d,
        hasToken,
        fdv,
        psFdv,
        revenueFdv,
        mcapFdvRatio,
        change1m: p.total30d && p.total24h ? ((p.total24h * 30 / p.total30d) - 1) * 100 : null,
        // Backward compat aliases for table display
        revenue24h: fees24h,
        revenue30d: fees30d,
      };
    });
  }, [fees, coinGecko, tvl, earnings]);

  // -----------------------------------------------------------------------
  // Filtered protocols
  // -----------------------------------------------------------------------
  const filteredProtocols = useMemo(() => {
    let result = mergedProtocols;
    if (activeFilter !== "All") {
      result = result.filter(p => p.categoryGroup === activeFilter);
    }
    if (tokenFilter === "token") {
      result = result.filter(p => p.hasToken);
    } else if (tokenFilter === "no-token") {
      result = result.filter(p => !p.hasToken);
    }
    // Apply top-N filter (already sorted by revenue desc)
    if (topN > 0) {
      result = result.slice(0, topN);
    }
    return result;
  }, [mergedProtocols, activeFilter, tokenFilter, topN]);

  // -----------------------------------------------------------------------
  // Pagination for flat table
  // -----------------------------------------------------------------------
  const totalPages = Math.ceil(filteredProtocols.length / ROWS_PER_PAGE);
  const paginatedProtocols = useMemo(() => {
    const start = (currentPage - 1) * ROWS_PER_PAGE;
    return filteredProtocols.slice(start, start + ROWS_PER_PAGE);
  }, [filteredProtocols, currentPage, ROWS_PER_PAGE]);

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter, tokenFilter, topN]);

  // -----------------------------------------------------------------------
  // Scatter data: Revenue vs Market Cap
  // -----------------------------------------------------------------------
  const scatterRevMcap = useMemo(() => {
    return mergedProtocols
      .filter((p) => p.marketCap != null && p.marketCap > 0 && p.revenueAnn > 0)
      .map((p) => ({
        name: p.displayName,
        revenueAnn: p.revenueAnn,
        marketCap: p.marketCap!,
        psRatio: p.psRatio,
        tvl: p.tvl,
        category: p.categoryGroup,
        color: getCategoryColor(p.category),
        z: p.tvl != null ? Math.max(p.tvl / 1e8, 40) : 40,
      }));
  }, [mergedProtocols]);

  // Group scatter data by category for colored Scatter elements
  const scatterRevMcapByCategory = useMemo(() => {
    const groups: Record<string, typeof scatterRevMcap> = {};
    for (const d of scatterRevMcap) {
      const cat = d.category;
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(d);
    }
    return groups;
  }, [scatterRevMcap]);

  // -----------------------------------------------------------------------
  // Scatter data: Revenue vs TVL
  // -----------------------------------------------------------------------
  const scatterRevTvl = useMemo(() => {
    return mergedProtocols
      .filter((p) => p.tvl != null && p.tvl > 0 && p.revenueAnn > 0)
      .map((p) => ({
        name: p.displayName,
        tvl: p.tvl!,
        revenueAnn: p.revenueAnn,
        revenueTvl: p.revenueTvl,
        category: p.categoryGroup,
        color: getCategoryColor(p.category),
        z: 60,
      }));
  }, [mergedProtocols]);

  const scatterRevTvlByCategory = useMemo(() => {
    const groups: Record<string, typeof scatterRevTvl> = {};
    for (const d of scatterRevTvl) {
      const cat = d.category;
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(d);
    }
    return groups;
  }, [scatterRevTvl]);

  // Average revenue/TVL ratio for reference line
  const avgRevenueTvl = useMemo(() => {
    const valid = mergedProtocols.filter(
      (p) => p.revenueTvl != null && isFinite(p.revenueTvl!)
    );
    if (valid.length === 0) return 0.1;
    const sum = valid.reduce((s, p) => s + p.revenueTvl!, 0);
    return sum / valid.length;
  }, [mergedProtocols]);

  // -----------------------------------------------------------------------
  // Heatmap data: 30d change
  // -----------------------------------------------------------------------
  const heatmapData = useMemo(() => {
    return mergedProtocols
      .filter((p) => p.change7d != null)
      .sort((a, b) => Math.abs(b.change7d ?? 0) - Math.abs(a.change7d ?? 0))
      .slice(0, 120);
  }, [mergedProtocols]);

  // CSV export data for table
  const tableExportData = useMemo(() => {
    return filteredProtocols.map((p) => ({
      rank: p.rank,
      protocol: p.displayName,
      has_token: p.hasToken,
      category: p.categoryGroup,
      "fees_24h": p.fees24h,
      "fees_30d": p.fees30d ?? "",
      "fees_ann": p.feesAnn,
      "protocol_revenue_24h": p.protocolRevenue24h ?? "",
      "protocol_revenue_30d": p.protocolRevenue30d ?? "",
      "holders_revenue_24h": p.holdersRevenue24h ?? "",
      margin: p.margin ?? "",
      "market_cap": p.marketCap ?? "",
      "ps_ratio": p.psRatio ?? "",
      fdv: p.fdv ?? "",
      "ps_fdv": p.psFdv ?? "",
      tvl: p.tvl ?? "",
      "revenue_tvl": p.revenueTvl ?? "",
      "change_1d": p.change1d ?? "",
      "change_7d": p.change7d ?? "",
      "change_30d": p.change1m ?? "",
    }));
  }, [filteredProtocols]);

  // P/S = 20x reference line data
  const ps20xLineData = useMemo(() => {
    // Generate points from 1M to 10B revenue
    const points = [];
    for (let rev = 1e6; rev <= 1e10; rev *= 10) {
      points.push({ x: rev, y: rev * 20 });
    }
    return points;
  }, []);

  // -----------------------------------------------------------------------
  // Scatter chart color map
  // -----------------------------------------------------------------------
  const categoryColorMap: Record<string, string> = {
    DeFi: "#3b82f6",
    Stablecoins: "#10b981",
    Exchanges: "#8b5cf6",
    Blockchains: "#f59e0b",
    Consumer: "#ef4444",
    DePIN: "#ec4899",
    Infrastructure: "#6366f1",
    Other: "#94a3b8",
  };

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  return (
    <section className="space-y-12">
      <SectionHeader
        number="6"
        title="Protocol Explorer"
        subtitle="A comprehensive view of protocol-level economics. Compare revenue, valuations, capital efficiency, and momentum across all fee-generating protocols."
      />

      {/* ================================================================ */}
      {/* Token vs Non-Token Summary                                       */}
      {/* ================================================================ */}
      <TokenVsNonTokenSummary protocols={mergedProtocols} />

      {/* ================================================================ */}
      {/* A. Protocol Comparison Table                                     */}
      {/* ================================================================ */}
      <Card>
        <ChartExport
          data={tableExportData}
          filename="protocol-comparison-table"
          title="Protocol Comparison Table"
        >
          <p
            className="mb-4"
            style={{ fontSize: "14px", color: "#666666", lineHeight: "1.5" }}
          >
            All protocols ranked by 24h revenue, merged with market cap, TVL, and earnings data.
          </p>

          {/* Category filter row */}
          <div className="flex flex-wrap gap-2 mb-4">
            {FILTER_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveFilter(cat)}
                className="px-3 py-1.5 transition-colors duration-150"
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase" as const,
                  border: "1px solid",
                  borderColor: activeFilter === cat ? "#111111" : "#d4d4d4",
                  backgroundColor: activeFilter === cat ? "#111111" : "#ffffff",
                  color: activeFilter === cat ? "#ffffff" : "#666666",
                  borderRadius: 0,
                  cursor: "pointer",
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Token filter + Top-N row */}
          <div className="flex flex-wrap gap-2 mb-4 items-center">
            {(["all", "token", "no-token"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setTokenFilter(f)}
                className="px-3 py-1.5 transition-colors duration-150"
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase" as const,
                  border: "1px solid",
                  borderColor: tokenFilter === f ? "#111111" : "#d4d4d4",
                  backgroundColor: tokenFilter === f ? "#111111" : "#ffffff",
                  color: tokenFilter === f ? "#ffffff" : "#666666",
                  borderRadius: 0,
                  cursor: "pointer",
                }}
              >
                {f === "all" ? "All Projects" : f === "token" ? "Token" : "No Token"}
              </button>
            ))}

            <span style={{ width: 1, height: 20, backgroundColor: "#d4d4d4", margin: "0 4px" }} />

            {([0, 10, 25, 50, 100, 250] as const).map((n) => (
              <button
                key={n}
                onClick={() => setTopN(n)}
                className="px-3 py-1.5 transition-colors duration-150"
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase" as const,
                  border: "1px solid",
                  borderColor: topN === n ? "#111111" : "#d4d4d4",
                  backgroundColor: topN === n ? "#111111" : "#ffffff",
                  color: topN === n ? "#ffffff" : "#666666",
                  borderRadius: 0,
                  cursor: "pointer",
                }}
              >
                {n === 0 ? "All" : `Top ${n}`}
              </button>
            ))}
          </div>

          {/* View mode toggle */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setViewMode("flat")}
              className="px-3 py-1.5 transition-colors duration-150"
              style={{
                fontSize: "11px",
                fontWeight: 600,
                letterSpacing: "0.06em",
                textTransform: "uppercase" as const,
                border: "1px solid",
                borderColor: viewMode === "flat" ? "#111111" : "#d4d4d4",
                backgroundColor: viewMode === "flat" ? "#111111" : "#ffffff",
                color: viewMode === "flat" ? "#ffffff" : "#666666",
                borderRadius: 0,
                cursor: "pointer",
              }}
            >
              Table View
            </button>
            <button
              onClick={() => setViewMode("tree")}
              className="px-3 py-1.5 transition-colors duration-150"
              style={{
                fontSize: "11px",
                fontWeight: 600,
                letterSpacing: "0.06em",
                textTransform: "uppercase" as const,
                border: "1px solid",
                borderColor: viewMode === "tree" ? "#111111" : "#d4d4d4",
                backgroundColor: viewMode === "tree" ? "#111111" : "#ffffff",
                color: viewMode === "tree" ? "#ffffff" : "#666666",
                borderRadius: 0,
                cursor: "pointer",
              }}
            >
              Category Tree
            </button>
          </div>

          {isLoading ? (
            <TableSkeleton />
          ) : viewMode === "tree" ? (
            <CategoryTreeTable protocols={filteredProtocols} />
          ) : (
            <div className="overflow-x-auto">
              <table className="financial-table w-full" style={{ borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: "left", width: 36 }}>#</th>
                    <th style={{ textAlign: "left", minWidth: 140 }}>Protocol</th>
                    <th style={{ textAlign: "left", minWidth: 90 }}>Category</th>
                    <th style={{ textAlign: "right", minWidth: 90 }}>Fees (24h)</th>
                    <th style={{ textAlign: "right", minWidth: 90 }}>Revenue (24h)</th>
                    <th style={{ textAlign: "right", minWidth: 60 }}>Margin</th>
                    <th style={{ textAlign: "right", minWidth: 100 }}>Revenue (Ann.)</th>
                    <th style={{ textAlign: "right", minWidth: 100 }}>Market Cap</th>
                    <th style={{ textAlign: "right", minWidth: 70 }}>P/S</th>
                    <th style={{ textAlign: "right", minWidth: 90 }}>FDV</th>
                    <th style={{ textAlign: "right", minWidth: 90 }}>TVL</th>
                    <th style={{ textAlign: "right", minWidth: 90 }}>Fees/TVL</th>
                    <th style={{ textAlign: "right", minWidth: 70 }}>24h</th>
                    <th style={{ textAlign: "right", minWidth: 70 }}>7d</th>
                    <th style={{ textAlign: "right", minWidth: 70 }}>30d</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedProtocols.map((p) => (
                    <tr key={p.name}>
                      <td style={{ textAlign: "left", color: "#999999" }}>{p.rank}</td>
                      <td style={{ textAlign: "left" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          {p.logo && (
                            <img
                              src={p.logo}
                              alt=""
                              width={16}
                              height={16}
                              style={{ flexShrink: 0 }}
                              loading="lazy"
                            />
                          )}
                          <div>
                            <a
                              href={`/protocol/${p.slug}`}
                              style={{
                                color: "#111111",
                                fontWeight: 600,
                                textDecoration: "none",
                              }}
                              onMouseOver={(e) =>
                                (e.currentTarget.style.color = "#0274B6")
                              }
                              onMouseOut={(e) =>
                                (e.currentTarget.style.color = "#111111")
                              }
                            >
                              {p.displayName}
                            </a>
                            {p.hasToken && (
                              <span style={{ fontSize: "9px", color: "#3b82f6", marginLeft: 4, verticalAlign: "super" }}>●</span>
                            )}
                          </div>
                        </div>
                        <div
                          style={{
                            fontSize: "10px",
                            color: "#999999",
                            marginTop: 1,
                          }}
                        >
                          <span
                            style={{
                              display: "inline-block",
                              padding: "1px 5px",
                              border: "1px solid #e8e8e8",
                              fontSize: "9px",
                              letterSpacing: "0.04em",
                              textTransform: "uppercase",
                              color: getCategoryColor(p.category),
                              borderRadius: 0,
                            }}
                          >
                            {p.category}
                          </span>
                        </div>
                      </td>
                      <td style={{ textAlign: "left", color: "#666666" }}>
                        {p.categoryGroup}
                      </td>
                      <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                        {formatCompact(p.fees24h)}
                      </td>
                      <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                        {p.protocolRevenue24h != null ? formatCompact(p.protocolRevenue24h) : "\u2014"}
                      </td>
                      <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                        {formatMargin(p.margin)}
                      </td>
                      <td
                        style={{
                          textAlign: "right",
                          fontWeight: 600,
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {formatCompact(p.revenueAnn)}
                      </td>
                      <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                        {formatCompact(p.marketCap)}
                      </td>
                      <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                        {formatRatio(p.psRatio)}
                      </td>
                      <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                        {formatCompact(p.fdv)}
                      </td>
                      <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                        {formatCompact(p.tvl)}
                      </td>
                      <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                        {p.revenueTvl != null
                          ? `${(p.revenueTvl * 100).toFixed(1)}%`
                          : "\u2014"}
                      </td>
                      <td
                        style={{
                          textAlign: "right",
                          fontVariantNumeric: "tabular-nums",
                          color:
                            p.change1d == null
                              ? "#999999"
                              : p.change1d >= 0
                              ? "#2e7d32"
                              : "#9e2b25",
                          fontWeight: 500,
                        }}
                      >
                        {formatPct(p.change1d)}
                      </td>
                      <td
                        style={{
                          textAlign: "right",
                          fontVariantNumeric: "tabular-nums",
                          color:
                            p.change7d == null
                              ? "#999999"
                              : p.change7d >= 0
                              ? "#2e7d32"
                              : "#9e2b25",
                          fontWeight: 500,
                        }}
                      >
                        {formatPct(p.change7d)}
                      </td>
                      <td
                        style={{
                          textAlign: "right",
                          fontVariantNumeric: "tabular-nums",
                          color:
                            p.change1m == null
                              ? "#999999"
                              : p.change1m >= 0
                              ? "#2e7d32"
                              : "#9e2b25",
                          fontWeight: 500,
                        }}
                      >
                        {formatPct(p.change1m)}
                      </td>
                    </tr>
                  ))}
                  {filteredProtocols.length === 0 && (
                    <tr>
                      <td
                        colSpan={15}
                        style={{
                          textAlign: "center",
                          padding: "24px 0",
                          color: "#999999",
                        }}
                      >
                        No protocols found in this category.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {viewMode === "flat" && totalPages > 1 && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 16, padding: "8px 0", borderTop: "1px solid #e8e8e8" }}>
              <span style={{ fontSize: "12px", color: "#666666" }}>
                Showing {((currentPage - 1) * ROWS_PER_PAGE) + 1}&ndash;{Math.min(currentPage * ROWS_PER_PAGE, filteredProtocols.length)} of {filteredProtocols.length} protocols
              </span>
              <div style={{ display: "flex", gap: 4 }}>
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  style={{
                    padding: "4px 12px",
                    fontSize: "11px",
                    fontWeight: 600,
                    border: "1px solid #d4d4d4",
                    backgroundColor: currentPage === 1 ? "#f5f5f5" : "#ffffff",
                    color: currentPage === 1 ? "#999999" : "#333333",
                    cursor: currentPage === 1 ? "default" : "pointer",
                    borderRadius: 0,
                  }}
                >
                  Previous
                </button>
                <span style={{ padding: "4px 8px", fontSize: "12px", color: "#666666", alignSelf: "center" }}>
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  style={{
                    padding: "4px 12px",
                    fontSize: "11px",
                    fontWeight: 600,
                    border: "1px solid #d4d4d4",
                    backgroundColor: currentPage === totalPages ? "#f5f5f5" : "#ffffff",
                    color: currentPage === totalPages ? "#999999" : "#333333",
                    cursor: currentPage === totalPages ? "default" : "pointer",
                    borderRadius: 0,
                  }}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </ChartExport>

        <DataSource
          sources={["DefiLlama (live)", "CoinGecko (live)", "TokenTerminal (live)"]}
        />
      </Card>

      {/* ================================================================ */}
      {/* B. Revenue vs Market Cap Scatter Plot                            */}
      {/* ================================================================ */}
      <Card>
        <ChartExport
          data={scatterRevMcap.map((d) => ({
            protocol: d.name,
            revenueAnn: d.revenueAnn,
            marketCap: d.marketCap,
            psRatio: d.psRatio ?? "",
            tvl: d.tvl ?? "",
            category: d.category,
          }))}
          filename="revenue-vs-marketcap-scatter"
          title="Revenue vs Market Cap"
        >
          <p
            style={{ fontSize: "14px", color: "#666666", lineHeight: "1.5", marginBottom: 16 }}
          >
            Each dot is a protocol. X-axis shows annualized revenue; Y-axis shows market cap (both log scale).
            The diagonal line marks P/S = 20x. Dots below the line trade at &lt;20x revenue.
          </p>

          {isLoading ? (
            <ChartSkeleton />
          ) : scatterRevMcap.length === 0 ? (
            <div className="h-[400px] flex items-center justify-center text-sm" style={{ color: "#999999" }}>
              Insufficient data to render chart.
            </div>
          ) : (
            <div className="h-[480px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#e8e8e8"
                    vertical={true}
                  />
                  <XAxis
                    type="number"
                    dataKey="revenueAnn"
                    name="Annualized Revenue"
                    scale="log"
                    domain={["auto", "auto"]}
                    tickFormatter={logTickFormatter}
                    tick={{ fontSize: 11, fill: "#999999" }}
                    tickLine={false}
                    axisLine={{ stroke: "#d4d4d4" }}
                    label={{
                      value: "Annualized Revenue",
                      position: "insideBottom",
                      offset: -10,
                      style: { fontSize: 11, fill: "#999999", textAnchor: "middle" },
                    }}
                  />
                  <YAxis
                    type="number"
                    dataKey="marketCap"
                    name="Market Cap"
                    scale="log"
                    domain={["auto", "auto"]}
                    tickFormatter={logTickFormatter}
                    tick={{ fontSize: 11, fill: "#999999" }}
                    tickLine={false}
                    axisLine={false}
                    width={70}
                    label={{
                      value: "Market Cap",
                      angle: -90,
                      position: "insideLeft",
                      offset: -5,
                      style: { fontSize: 11, fill: "#999999", textAnchor: "middle" },
                    }}
                  />
                  <ZAxis type="number" dataKey="z" range={[30, 300]} />
                  <Tooltip
                    content={<ScatterTooltipRevMcap />}
                    cursor={{ strokeDasharray: "3 3", stroke: "#d4d4d4" }}
                  />
                  {/* P/S = 20x reference line: plotted as a Scatter with line shape */}
                  <Scatter
                    name="P/S = 20x"
                    data={ps20xLineData.map((pt) => ({
                      revenueAnn: pt.x,
                      marketCap: pt.y,
                      z: 0,
                      name: "P/S = 20x",
                    }))}
                    fill="none"
                    line={{ stroke: "#999999", strokeDasharray: "6 4", strokeWidth: 1 }}
                    shape={() => <></>}
                    legendType="line"
                  />
                  {/* Per-category scatter groups */}
                  {Object.entries(scatterRevMcapByCategory).map(([cat, data]) => (
                    <Scatter
                      key={cat}
                      name={cat}
                      data={data}
                      fill={categoryColorMap[cat] || "#94a3b8"}
                      fillOpacity={0.8}
                    />
                  ))}
                  <Legend
                    verticalAlign="top"
                    height={36}
                    iconSize={10}
                    wrapperStyle={{ fontSize: 11 }}
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartExport>

        <DataSource
          sources={["DefiLlama (live)", "CoinGecko (live)"]}
        />
      </Card>

      {/* ================================================================ */}
      {/* C. Revenue vs TVL Scatter Plot                                   */}
      {/* ================================================================ */}
      <Card>
        <ChartExport
          data={scatterRevTvl.map((d) => ({
            protocol: d.name,
            tvl: d.tvl,
            revenueAnn: d.revenueAnn,
            revenueTvl: d.revenueTvl ?? "",
            category: d.category,
          }))}
          filename="revenue-vs-tvl-scatter"
          title="Revenue vs TVL (Capital Efficiency)"
        >
          <p
            style={{ fontSize: "14px", color: "#666666", lineHeight: "1.5", marginBottom: 16 }}
          >
            Capital efficiency: protocols above the reference line generate more revenue per dollar
            of TVL than the industry average ({(avgRevenueTvl * 100).toFixed(1)}%).
          </p>

          {isLoading ? (
            <ChartSkeleton />
          ) : scatterRevTvl.length === 0 ? (
            <div className="h-[400px] flex items-center justify-center text-sm" style={{ color: "#999999" }}>
              Insufficient data to render chart.
            </div>
          ) : (
            <div className="h-[480px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#e8e8e8"
                    vertical={true}
                  />
                  <XAxis
                    type="number"
                    dataKey="tvl"
                    name="TVL"
                    scale="log"
                    domain={["auto", "auto"]}
                    tickFormatter={logTickFormatter}
                    tick={{ fontSize: 11, fill: "#999999" }}
                    tickLine={false}
                    axisLine={{ stroke: "#d4d4d4" }}
                    label={{
                      value: "Total Value Locked",
                      position: "insideBottom",
                      offset: -10,
                      style: { fontSize: 11, fill: "#999999", textAnchor: "middle" },
                    }}
                  />
                  <YAxis
                    type="number"
                    dataKey="revenueAnn"
                    name="Annualized Revenue"
                    scale="log"
                    domain={["auto", "auto"]}
                    tickFormatter={logTickFormatter}
                    tick={{ fontSize: 11, fill: "#999999" }}
                    tickLine={false}
                    axisLine={false}
                    width={70}
                    label={{
                      value: "Annualized Revenue",
                      angle: -90,
                      position: "insideLeft",
                      offset: -5,
                      style: { fontSize: 11, fill: "#999999", textAnchor: "middle" },
                    }}
                  />
                  <ZAxis type="number" dataKey="z" range={[40, 100]} />
                  <Tooltip
                    content={<ScatterTooltipRevTvl />}
                    cursor={{ strokeDasharray: "3 3", stroke: "#d4d4d4" }}
                  />
                  {/* Reference line for avg Revenue/TVL ratio */}
                  {avgRevenueTvl > 0 && (
                    <Scatter
                      name={`Avg Rev/TVL (${(avgRevenueTvl * 100).toFixed(1)}%)`}
                      data={[1e5, 1e6, 1e7, 1e8, 1e9, 1e10, 1e11].map((tvlVal) => ({
                        tvl: tvlVal,
                        revenueAnn: tvlVal * avgRevenueTvl,
                        z: 0,
                        name: "Average",
                      }))}
                      fill="none"
                      line={{ stroke: "#999999", strokeDasharray: "6 4", strokeWidth: 1 }}
                      shape={() => <></>}
                      legendType="line"
                    />
                  )}
                  {/* Per-category scatter groups */}
                  {Object.entries(scatterRevTvlByCategory).map(([cat, data]) => (
                    <Scatter
                      key={cat}
                      name={cat}
                      data={data}
                      fill={categoryColorMap[cat] || "#94a3b8"}
                      fillOpacity={0.8}
                    />
                  ))}
                  <Legend
                    verticalAlign="top"
                    height={36}
                    iconSize={10}
                    wrapperStyle={{ fontSize: 11 }}
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartExport>

        <DataSource
          sources={["DefiLlama (live fees + TVL)"]}
        />
      </Card>

      {/* ================================================================ */}
      {/* D. Revenue Growth Heatmap                                        */}
      {/* ================================================================ */}
      <Card>
        <ChartExport
          data={heatmapData.map((d) => ({
            protocol: d.displayName,
            change_7d: d.change7d ?? "",
            revenue_24h: d.revenue24h,
            category: d.categoryGroup,
          }))}
          filename="revenue-growth-heatmap"
          title="Revenue Momentum Heatmap (7d Change)"
        >
          <p
            style={{ fontSize: "14px", color: "#666666", lineHeight: "1.5", marginBottom: 16 }}
          >
            Each cell shows a protocol&apos;s 7-day revenue change. Green = growing, red = declining.
            Sorted by absolute magnitude of change.
          </p>

          {isLoading ? (
            <ChartSkeleton height="h-[260px]" />
          ) : heatmapData.length === 0 ? (
            <div className="h-[200px] flex items-center justify-center text-sm" style={{ color: "#999999" }}>
              Insufficient data to render heatmap.
            </div>
          ) : (
            <div
              className="grid gap-1"
              style={{
                gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))",
              }}
            >
              {heatmapData.map((p) => (
                <div
                  key={p.name}
                  style={{
                    backgroundColor: getHeatmapColor(p.change7d),
                    color: getHeatmapTextColor(p.change7d),
                    padding: "8px 6px",
                    borderRadius: 0,
                    textAlign: "center",
                    cursor: "default",
                    border: "1px solid rgba(255,255,255,0.2)",
                  }}
                  title={`${p.displayName}: ${formatPct(p.change7d)} 7d change`}
                >
                  <div
                    style={{
                      fontSize: "10px",
                      fontWeight: 700,
                      letterSpacing: "0.03em",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {abbreviate(p.displayName)}
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      marginTop: 2,
                    }}
                  >
                    {formatPct(p.change7d)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ChartExport>

        {/* Heatmap legend */}
        <div className="flex items-center gap-2 mt-4" style={{ fontSize: "11px", color: "#999999" }}>
          <span>Strong decline</span>
          <div className="flex gap-0">
            {["#991b1b", "#dc2626", "#f87171", "#fecaca", "#bbf7d0", "#4ade80", "#22c55e", "#15803d", "#166534"].map(
              (c) => (
                <div
                  key={c}
                  style={{
                    width: 20,
                    height: 10,
                    backgroundColor: c,
                    borderRadius: 0,
                  }}
                />
              )
            )}
          </div>
          <span>Strong growth</span>
        </div>

        <DataSource sources={["DefiLlama (live)"]} />
      </Card>

      {/* CTA to full analytics */}
      <div style={{ textAlign: "center", padding: "8px 0" }}>
        <a
          href="#analytics"
          style={{
            fontSize: "13px",
            fontWeight: 600,
            color: "#0274B6",
            textDecoration: "none",
            letterSpacing: "0.02em",
          }}
        >
          See full analytics with all {mergedProtocols.length}+ protocols &rarr;
        </a>
      </div>
    </section>
  );
}
