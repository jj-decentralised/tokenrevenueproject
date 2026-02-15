"use client";

import React, { useMemo, useState, useCallback } from "react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
  Cell,
  Treemap,
  ReferenceLine,
} from "recharts";
import { useDataContext } from "@/lib/DataContext";
import {
  Card,
  SectionHeader,
  DataSource,
} from "@/components/ui/Card";
import { ChartExport } from "@/components/ui/ChartExport";
import {
  formatCompact,
  formatPct,
  formatRatio,
  logTickFormatter,
  tooltipStyle,
  getHeatmapColor,
  getHeatmapTextColor,
} from "@/lib/chartUtils";
import { getCategoryGroup, getCategoryColor, GROUP_COLORS, GROUP_ORDER } from "@/lib/categories";
import { findProtocolMapping } from "@/lib/protocolTokenMap";

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

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
// Statistics helpers
// ---------------------------------------------------------------------------

function pearsonR(data: { x: number; y: number }[]): number {
  const n = data.length;
  if (n < 3) return 0;
  const sumX = data.reduce((s, d) => s + d.x, 0);
  const sumY = data.reduce((s, d) => s + d.y, 0);
  const sumXY = data.reduce((s, d) => s + d.x * d.y, 0);
  const sumX2 = data.reduce((s, d) => s + d.x * d.x, 0);
  const sumY2 = data.reduce((s, d) => s + d.y * d.y, 0);
  const num = n * sumXY - sumX * sumY;
  const den = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
  return den === 0 ? 0 : num / den;
}

function regressionLine(data: { x: number; y: number }[]): { slope: number; intercept: number } | null {
  const n = data.length;
  if (n < 3) return null;
  const sumX = data.reduce((s, d) => s + d.x, 0);
  const sumY = data.reduce((s, d) => s + d.y, 0);
  const sumXY = data.reduce((s, d) => s + d.x * d.y, 0);
  const sumX2 = data.reduce((s, d) => s + d.x * d.x, 0);
  const denom = n * sumX2 - sumX * sumX;
  if (denom === 0) return null;
  return { slope: (n * sumXY - sumX * sumY) / denom, intercept: (sumY - ((n * sumXY - sumX * sumY) / denom) * sumX) / n };
}

// ---------------------------------------------------------------------------
// Category Filter Panel (shared across scatter charts)
// ---------------------------------------------------------------------------

function ScatterFilterPanel({
  subcatsByGroup,
  disabledGroups,
  disabledSubcats,
  onToggleGroup,
  onToggleSubcat,
  onSelectAll,
  onSelectNone,
  totalCount,
  visibleCount,
}: {
  subcatsByGroup: Map<string, Map<string, number>>;
  disabledGroups: Set<string>;
  disabledSubcats: Set<string>;
  onToggleGroup: (g: string) => void;
  onToggleSubcat: (s: string) => void;
  onSelectAll: () => void;
  onSelectNone: () => void;
  totalCount: number;
  visibleCount: number;
}) {
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  return (
    <div style={{ marginBottom: 20, padding: "12px 16px", border: "1px solid #e8e8e8", backgroundColor: "#fafafa" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <p style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#999999", margin: 0 }}>
          Filter Scatter Charts by Category
        </p>
        <span style={{ fontSize: "11px", color: "#666666" }}>
          {visibleCount} / {totalCount} protocols
        </span>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 8 }}>
        {GROUP_ORDER.map((group) => {
          const isActive = !disabledGroups.has(group);
          const subcats = subcatsByGroup.get(group);
          const count = subcats ? Array.from(subcats.values()).reduce((s, c) => s + c, 0) : 0;
          if (count === 0) return null;
          const isExpanded = expandedGroup === group;
          return (
            <button
              key={group}
              onClick={() => onToggleGroup(group)}
              onDoubleClick={() => setExpandedGroup(isExpanded ? null : group)}
              title="Click to toggle. Double-click to show subcategories."
              style={{
                fontSize: "11px", fontWeight: 600, letterSpacing: "0.04em",
                padding: "5px 12px", border: "1px solid",
                borderColor: isActive ? (GROUP_COLORS[group] || "#111") : "#d4d4d4",
                backgroundColor: isActive ? (GROUP_COLORS[group] || "#111") : "#fff",
                color: isActive ? "#fff" : "#666", borderRadius: 0, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 6, opacity: isActive ? 1 : 0.5,
              }}
            >
              {group} <span style={{ fontSize: "10px", opacity: 0.7 }}>({count})</span>
              <span style={{ fontSize: "9px", opacity: 0.5 }}>{isExpanded ? "\u25B2" : "\u25BC"}</span>
            </button>
          );
        })}
        <button onClick={onSelectAll} style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", padding: "5px 10px", border: "1px solid #d4d4d4", backgroundColor: "#fff", color: "#666", borderRadius: 0, cursor: "pointer" }}>All</button>
        <button onClick={onSelectNone} style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", padding: "5px 10px", border: "1px solid #d4d4d4", backgroundColor: "#fff", color: "#666", borderRadius: 0, cursor: "pointer" }}>None</button>
      </div>
      {expandedGroup && subcatsByGroup.get(expandedGroup) && (
        <div style={{ marginTop: 4, paddingTop: 8, borderTop: "1px solid #e2e8f0" }}>
          <p style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#999", marginBottom: 6 }}>
            {expandedGroup} Subcategories
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
            {Array.from(subcatsByGroup.get(expandedGroup)!.entries())
              .sort((a, b) => b[1] - a[1])
              .map(([subcat, count]) => {
                const isActive = !disabledSubcats.has(subcat);
                return (
                  <button key={subcat} onClick={() => onToggleSubcat(subcat)} style={{
                    fontSize: "10px", fontWeight: 500, padding: "3px 8px",
                    border: "1px solid", borderColor: isActive ? (GROUP_COLORS[expandedGroup] || "#999") : "#d4d4d4",
                    backgroundColor: isActive ? `${GROUP_COLORS[expandedGroup] || "#999"}20` : "#fff",
                    color: isActive ? "#333" : "#999", borderRadius: 0, cursor: "pointer", opacity: isActive ? 1 : 0.5,
                  }}>
                    {subcat} ({count})
                  </button>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Custom Tooltips
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ScatterTooltipFeesRevenue({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  return (
    <div style={tooltipStyle}>
      <p style={{ fontWeight: 700, color: "#111111", marginBottom: 4 }}>{d.name}</p>
      <p>Fees (24h): {formatCompact(d.fees24h)}</p>
      <p>Revenue (24h): {formatCompact(d.revenue24h)}</p>
      <p>Take Rate: {d.takeRate != null ? `${(d.takeRate * 100).toFixed(1)}%` : "\u2014"}</p>
      <p style={{ fontSize: "11px", color: "#999999", marginTop: 2 }}>{d.subcategory || d.category}</p>
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
      <p style={{ fontSize: "11px", color: "#999999", marginTop: 2 }}>{d.subcategory || d.category}</p>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ScatterTooltipTvlFees({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  return (
    <div style={tooltipStyle}>
      <p style={{ fontWeight: 700, color: "#111111", marginBottom: 4 }}>{d.name}</p>
      <p>TVL: {formatCompact(d.tvl)}</p>
      <p>Fees (24h): {formatCompact(d.fees24h)}</p>
      <p>Fees/TVL: {d.feesTvl != null ? `${(d.feesTvl * 100).toFixed(4)}%` : "\u2014"}</p>
      <p style={{ fontSize: "11px", color: "#999999", marginTop: 2 }}>{d.subcategory || d.category}</p>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ScatterTooltipRevFdv({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  return (
    <div style={tooltipStyle}>
      <p style={{ fontWeight: 700, color: "#111111", marginBottom: 4 }}>{d.name}</p>
      <p>Revenue (Ann.): {formatCompact(d.revenueAnn)}</p>
      <p>FDV: {formatCompact(d.fdv)}</p>
      <p>P/S (FDV): {formatRatio(d.psFdv)}</p>
      <p style={{ fontSize: "11px", color: "#999999", marginTop: 2 }}>{d.subcategory || d.category}</p>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ScatterTooltipCorrelation({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  return (
    <div style={tooltipStyle}>
      <p style={{ fontWeight: 700, color: "#111111", marginBottom: 4 }}>{d.name}</p>
      <p>Fee Change (7d): {d.feeChange7d >= 0 ? "+" : ""}{d.feeChange7d.toFixed(1)}%</p>
      <p>Price Change (7d): {d.priceChange7d >= 0 ? "+" : ""}{d.priceChange7d.toFixed(1)}%</p>
      <p>Revenue (Ann.): {formatCompact(d.revenueAnn)}</p>
      <p style={{ fontSize: "11px", color: "#999999", marginTop: 2 }}>{d.subcategory || d.category}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Custom treemap cell content
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function TreemapCell(props: any) {
  const { x, y, width, height, name, change7d } = props;
  if (width < 2 || height < 2) return null;

  const bgColor = getHeatmapColor(change7d);
  const textColor = getHeatmapTextColor(change7d);
  const showText = width > 40 && height > 28;
  const showChange = width > 50 && height > 40;

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={bgColor}
        stroke="rgba(255,255,255,0.3)"
        strokeWidth={1}
      />
      {showText && (
        <text
          x={x + width / 2}
          y={y + height / 2 - (showChange ? 6 : 0)}
          textAnchor="middle"
          dominantBaseline="central"
          fill={textColor}
          fontSize={Math.min(11, width / 6)}
          fontWeight={700}
        >
          {name && name.length > Math.floor(width / 7) ? name.slice(0, Math.floor(width / 7)) : name}
        </text>
      )}
      {showChange && change7d != null && (
        <text
          x={x + width / 2}
          y={y + height / 2 + 10}
          textAnchor="middle"
          dominantBaseline="central"
          fill={textColor}
          fontSize={Math.min(10, width / 7)}
          fontWeight={600}
        >
          {formatPct(change7d)}
        </text>
      )}
    </g>
  );
}

// ---------------------------------------------------------------------------
// Helper: group scatter data by category
// ---------------------------------------------------------------------------

function groupByCategory<T extends { category: string }>(data: T[]): Record<string, T[]> {
  const groups: Record<string, T[]> = {};
  for (const d of data) {
    if (!groups[d.category]) groups[d.category] = [];
    groups[d.category].push(d);
  }
  return groups;
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function Section7Analytics() {
  const { fees, tvl, unifiedTokens, coinGecko, isLoading } = useDataContext();

  // =======================================================================
  // Filter state for scatter charts (C, D, E, F, H)
  // =======================================================================
  const [disabledGroups, setDisabledGroups] = useState<Set<string>>(new Set());
  const [disabledSubcats, setDisabledSubcats] = useState<Set<string>>(new Set());

  const subcatsByGroup = useMemo(() => {
    const map = new Map<string, Map<string, number>>();
    if (!fees?.protocols) return map;
    for (const p of fees.protocols) {
      if (p.total24h <= 0) continue;
      const raw = p.category || "Other";
      const slug = p.slug || p.name.toLowerCase().replace(/\s+/g, "-");
      const group = getCategoryGroup(raw, slug);
      if (!map.has(group)) map.set(group, new Map());
      const sub = map.get(group)!;
      sub.set(raw, (sub.get(raw) ?? 0) + 1);
    }
    return map;
  }, [fees]);

  const isVisible = useCallback(
    (group: string, subcat: string) => !disabledGroups.has(group) && !disabledSubcats.has(subcat),
    [disabledGroups, disabledSubcats]
  );

  const toggleGroup = useCallback((group: string) => {
    setDisabledGroups((prev) => {
      const next = new Set(prev);
      if (next.has(group)) {
        next.delete(group);
        setDisabledSubcats((ps) => {
          const ns = new Set(ps);
          const subs = subcatsByGroup.get(group);
          if (subs) for (const sub of subs.keys()) ns.delete(sub);
          return ns;
        });
      } else {
        next.add(group);
      }
      return next;
    });
  }, [subcatsByGroup]);

  const toggleSubcat = useCallback((subcat: string) => {
    setDisabledSubcats((prev) => {
      const next = new Set(prev);
      if (next.has(subcat)) next.delete(subcat); else next.add(subcat);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => { setDisabledGroups(new Set()); setDisabledSubcats(new Set()); }, []);
  const selectNone = useCallback(() => { setDisabledGroups(new Set(GROUP_ORDER)); setDisabledSubcats(new Set()); }, []);

  // =======================================================================
  // A. Revenue Momentum Treemap — ALL protocols with 7d change data
  // =======================================================================
  const treemapData = useMemo(() => {
    if (!fees?.protocols) return [];

    const items = fees.protocols
      .filter((p) => p.total24h > 0 && p.change_7d != null)
      .map((p) => {
        const slug = p.slug || p.name.toLowerCase().replace(/\s+/g, "-");
        return {
          name: p.displayName || p.name,
          size: p.total24h,
          change7d: p.change_7d,
          category: getCategoryGroup(p.category || "Other", slug),
          color: getHeatmapColor(p.change_7d),
        };
      });

    return items;
  }, [fees]);

  // =======================================================================
  // B. Revenue by Category — bar chart
  // =======================================================================
  const categoryRevenue = useMemo(() => {
    if (!fees?.protocols) return [];

    const groups: Record<string, number> = {};
    for (const p of fees.protocols) {
      if (p.total24h <= 0) continue;
      const slug = p.slug || p.name.toLowerCase().replace(/\s+/g, "-");
      const g = getCategoryGroup(p.category || "Other", slug);
      groups[g] = (groups[g] || 0) + p.total24h;
    }

    return Object.entries(groups)
      .map(([name, revenue]) => ({
        name,
        revenue,
        color: GROUP_COLORS[name] || "#94a3b8",
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [fees]);

  // =======================================================================
  // C. Fees vs Revenue Scatter — ALL protocols (DefiLlama only)
  // =======================================================================
  const feeVsRevScatterAll = useMemo(() => {
    if (!fees?.protocols) return [];
    return fees.protocols
      .filter((p) => p.total24h > 0 && (p.revenue24h ?? 0) > 0)
      .map((p) => {
        const raw = p.category || "Other";
        const slug = p.slug || p.name.toLowerCase().replace(/\s+/g, "-");
        const group = getCategoryGroup(raw, slug);
        return {
          name: p.displayName || p.name, fees24h: p.total24h,
          revenue24h: p.revenue24h ?? 0, takeRate: (p.revenue24h ?? 0) / p.total24h,
          category: group, subcategory: raw,
          color: GROUP_COLORS[group] || "#94a3b8", z: 60,
        };
      });
  }, [fees]);

  const feeVsRevScatter = useMemo(
    () => feeVsRevScatterAll.filter((d) => isVisible(d.category, d.subcategory)),
    [feeVsRevScatterAll, isVisible]
  );
  const feeVsRevByCategory = useMemo(() => groupByCategory(feeVsRevScatter), [feeVsRevScatter]);

  // =======================================================================
  // D. Revenue vs TVL Scatter — expanded with allProtocolsTVL
  // =======================================================================
  const revVsTvlScatterAll = useMemo(() => {
    if (!fees?.protocols || !tvl?.allProtocolsTVL) return [];
    const tvlByName = new Map<string, number>();
    for (const p of tvl.allProtocolsTVL) {
      tvlByName.set(p.name.toLowerCase(), p.tvl);
      tvlByName.set(p.slug.toLowerCase(), p.tvl);
    }
    return fees.protocols
      .filter((p) => {
        const tvlVal = tvlByName.get(p.name.toLowerCase()) ?? tvlByName.get((p.slug || "").toLowerCase());
        return p.total24h > 0 && tvlVal != null && tvlVal > 0;
      })
      .map((p) => {
        const tvlVal = (tvlByName.get(p.name.toLowerCase()) ?? tvlByName.get((p.slug || "").toLowerCase()))!;
        const revenueAnn = p.total24h * 365;
        const raw = p.category || "Other";
        const slug = p.slug || p.name.toLowerCase().replace(/\s+/g, "-");
        const group = getCategoryGroup(raw, slug);
        return {
          name: p.displayName || p.name, tvl: tvlVal, revenueAnn,
          revenueTvl: revenueAnn / tvlVal,
          category: group, subcategory: raw,
          color: GROUP_COLORS[group] || "#94a3b8", z: 60,
        };
      });
  }, [fees, tvl]);

  const revVsTvlScatter = useMemo(
    () => revVsTvlScatterAll.filter((d) => isVisible(d.category, d.subcategory)),
    [revVsTvlScatterAll, isVisible]
  );
  const revVsTvlByCategory = useMemo(() => groupByCategory(revVsTvlScatter), [revVsTvlScatter]);

  const avgRevenueTvl = useMemo(() => {
    const valid = revVsTvlScatter.filter((p) => isFinite(p.revenueTvl));
    if (valid.length === 0) return 0.1;
    const sum = valid.reduce((s, p) => s + p.revenueTvl, 0);
    return sum / valid.length;
  }, [revVsTvlScatter]);

  // =======================================================================
  // E. TVL vs Fees Scatter
  // =======================================================================
  const tvlVsFeesScatterAll = useMemo(() => {
    if (!fees?.protocols || !tvl?.allProtocolsTVL) return [];
    const tvlByName = new Map<string, number>();
    for (const p of tvl.allProtocolsTVL) {
      tvlByName.set(p.name.toLowerCase(), p.tvl);
      tvlByName.set(p.slug.toLowerCase(), p.tvl);
    }
    return fees.protocols
      .filter((p) => {
        const tvlVal = tvlByName.get(p.name.toLowerCase()) ?? tvlByName.get((p.slug || "").toLowerCase());
        return p.total24h > 0 && tvlVal != null && tvlVal > 0;
      })
      .map((p) => {
        const tvlVal = (tvlByName.get(p.name.toLowerCase()) ?? tvlByName.get((p.slug || "").toLowerCase()))!;
        const raw = p.category || "Other";
        const slug = p.slug || p.name.toLowerCase().replace(/\s+/g, "-");
        const group = getCategoryGroup(raw, slug);
        return {
          name: p.displayName || p.name, tvl: tvlVal, fees24h: p.total24h,
          feesTvl: p.total24h / tvlVal,
          category: group, subcategory: raw,
          color: GROUP_COLORS[group] || "#94a3b8", z: 60,
        };
      });
  }, [fees, tvl]);

  const tvlVsFeesScatter = useMemo(
    () => tvlVsFeesScatterAll.filter((d) => isVisible(d.category, d.subcategory)),
    [tvlVsFeesScatterAll, isVisible]
  );
  const tvlVsFeesByCategory = useMemo(() => groupByCategory(tvlVsFeesScatter), [tvlVsFeesScatter]);

  // =======================================================================
  // F. Revenue vs FDV Scatter — uses CoinGecko-matched data
  // =======================================================================
  const revVsFdvScatterAll = useMemo(() => {
    return unifiedTokens
      .filter((p) => p.fdv != null && p.fdv > 0 && p.revenueAnn != null && p.revenueAnn > 0)
      .map((p) => ({
        name: p.name, revenueAnn: p.revenueAnn!, fdv: p.fdv!, psFdv: p.psFdv,
        category: p.categoryGroup, subcategory: p.subcategory || p.category,
        color: GROUP_COLORS[p.categoryGroup] || "#94a3b8", z: 60,
      }));
  }, [unifiedTokens]);

  const revVsFdvScatter = useMemo(
    () => revVsFdvScatterAll.filter((d) => isVisible(d.category, d.subcategory)),
    [revVsFdvScatterAll, isVisible]
  );
  const revVsFdvByCategory = useMemo(() => groupByCategory(revVsFdvScatter), [revVsFdvScatter]);

  // P/S = 20x reference line data
  const ps20xLineData = useMemo(() => {
    const points = [];
    for (let rev = 1e5; rev <= 1e11; rev *= 10) {
      points.push({ x: rev, y: rev * 20 });
    }
    return points;
  }, []);

  // =======================================================================
  // G. P/S Ratio Distribution (Histogram)
  // =======================================================================
  const psDistribution = useMemo(() => {
    const buckets = [
      { label: "0-5x", min: 0, max: 5, count: 0, color: "#166534" },
      { label: "5-10x", min: 5, max: 10, count: 0, color: "#22c55e" },
      { label: "10-20x", min: 10, max: 20, count: 0, color: "#4ade80" },
      { label: "20-50x", min: 20, max: 50, count: 0, color: "#f59e0b" },
      { label: "50-100x", min: 50, max: 100, count: 0, color: "#f87171" },
      { label: "100x+", min: 100, max: Infinity, count: 0, color: "#dc2626" },
    ];

    for (const p of unifiedTokens) {
      if (p.psRatio == null || p.psRatio <= 0 || !isFinite(p.psRatio)) continue;
      for (const b of buckets) {
        if (p.psRatio >= b.min && p.psRatio < b.max) {
          b.count++;
          break;
        }
      }
    }

    return buckets;
  }, [unifiedTokens]);

  const totalPsProtocols = psDistribution.reduce((s, b) => s + b.count, 0);

  // =======================================================================
  // H. Revenue-Price Correlation
  // =======================================================================
  const correlationDataAll = useMemo(() => {
    if (!fees?.protocols || !coinGecko?.tokens) return [];
    const tokenById = new Map<string, { priceChange7d: number }>();
    const tokenByName = new Map<string, { priceChange7d: number }>();
    for (const t of coinGecko.tokens) {
      tokenById.set(t.id.toLowerCase(), { priceChange7d: t.priceChange7d });
      tokenByName.set(t.name.toLowerCase(), { priceChange7d: t.priceChange7d });
    }
    const results: Array<{
      name: string; feeChange7d: number; priceChange7d: number; revenueAnn: number;
      category: string; subcategory: string; color: string; z: number;
    }> = [];
    for (const p of fees.protocols) {
      if (p.total24h <= 0 || p.change_7d == null) continue;
      const mapping = findProtocolMapping(p.name);
      const tm = mapping?.coinGeckoId
        ? tokenById.get(mapping.coinGeckoId.toLowerCase())
        : (tokenByName.get(p.name.toLowerCase()) ?? tokenById.get(p.name.toLowerCase()));
      if (!tm || tm.priceChange7d === 0) continue;
      const raw = p.category || "Other";
      const slug = p.slug || p.name.toLowerCase().replace(/\s+/g, "-");
      const group = getCategoryGroup(raw, slug);
      results.push({
        name: p.displayName || p.name, feeChange7d: p.change_7d,
        priceChange7d: tm.priceChange7d, revenueAnn: p.total24h * 365,
        category: group, subcategory: raw,
        color: GROUP_COLORS[group] || "#94a3b8",
        z: Math.max(30, Math.min(300, p.total24h / 100)),
      });
    }
    return results;
  }, [fees, coinGecko]);

  const filteredCorrelation = useMemo(() => {
    const filtered = correlationDataAll.filter((d) => isVisible(d.category, d.subcategory));
    const pairs = filtered.map((d) => ({ x: d.feeChange7d, y: d.priceChange7d }));
    const r = pearsonR(pairs);
    const reg = regressionLine(pairs);
    return { data: filtered, r, r2: r * r, regression: reg, byCategory: groupByCategory(filtered) };
  }, [correlationDataAll, isVisible]);

  const corrRegressionLine = useMemo(() => {
    if (!filteredCorrelation.regression || filteredCorrelation.data.length < 5) return [];
    const { slope, intercept } = filteredCorrelation.regression;
    const xs = filteredCorrelation.data.map((d) => d.feeChange7d);
    const minX = Math.min(...xs); const maxX = Math.max(...xs);
    return [
      { feeChange7d: minX, priceChange7d: slope * minX + intercept, z: 0, name: "Regression" },
      { feeChange7d: maxX, priceChange7d: slope * maxX + intercept, z: 0, name: "Regression" },
    ];
  }, [filteredCorrelation]);

  // =======================================================================
  // Render
  // =======================================================================

  return (
    <section className="space-y-12">
      <SectionHeader
        number="7"
        title="Protocol Analytics"
        subtitle="Cross-protocol analysis using the full dataset of fee-generating protocols. Scatter plots, treemaps, and distribution charts across multiple metrics."
      />

      {/* ================================================================ */}
      {/* A. Revenue Momentum Treemap                                      */}
      {/* ================================================================ */}
      <Card>
        <ChartExport
          data={treemapData.map((d) => ({
            protocol: d.name,
            revenue_24h: d.size,
            change_7d: d.change7d ?? "",
            category: d.category,
          }))}
          filename="revenue-momentum-treemap"
          title="Revenue Momentum Treemap"
        >
          <p style={{ fontSize: "14px", color: "#666666", lineHeight: "1.5", marginBottom: 8 }}>
            Every fee-generating protocol sized by daily revenue, colored by 7-day change.
            Green = growing revenue, Red = declining.
          </p>
          <p style={{ fontSize: "12px", color: "#999999", marginBottom: 16 }}>
            {treemapData.length} protocols shown
          </p>

          {isLoading ? (
            <ChartSkeleton height="h-[500px]" />
          ) : treemapData.length === 0 ? (
            <div className="h-[400px] flex items-center justify-center text-sm" style={{ color: "#999999" }}>
              Insufficient data to render treemap.
            </div>
          ) : (
            <div className="h-[500px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <Treemap
                  data={treemapData}
                  dataKey="size"
                  nameKey="name"
                  content={<TreemapCell />}
                  isAnimationActive={false}
                />
              </ResponsiveContainer>
            </div>
          )}

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
        </ChartExport>
        <DataSource sources={["DefiLlama (live)"]} />
      </Card>

      {/* ================================================================ */}
      {/* B. Revenue by Category                                           */}
      {/* ================================================================ */}
      <Card>
        <ChartExport
          data={categoryRevenue.map((d) => ({
            category: d.name,
            revenue_24h: d.revenue,
          }))}
          filename="revenue-by-category"
          title="Daily Revenue by Category"
        >
          <p style={{ fontSize: "14px", color: "#666666", lineHeight: "1.5", marginBottom: 16 }}>
            Total 24h fee revenue aggregated by category group across all protocols.
          </p>

          {isLoading ? (
            <ChartSkeleton height="h-[350px]" />
          ) : categoryRevenue.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center text-sm" style={{ color: "#999999" }}>
              Insufficient data to render chart.
            </div>
          ) : (
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={categoryRevenue}
                  layout="vertical"
                  margin={{ top: 10, right: 30, left: 100, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8e8e8" horizontal={false} />
                  <XAxis
                    type="number"
                    tickFormatter={logTickFormatter}
                    tick={{ fontSize: 11, fill: "#999999" }}
                    tickLine={false}
                    axisLine={{ stroke: "#d4d4d4" }}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 12, fill: "#333333", fontWeight: 600 }}
                    tickLine={false}
                    axisLine={false}
                    width={90}
                  />
                  <Tooltip
                    formatter={(value: number) => [formatCompact(value), "Revenue (24h)"]}
                    contentStyle={tooltipStyle}
                  />
                  <Bar dataKey="revenue" name="Revenue (24h)">
                    {categoryRevenue.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartExport>
        <DataSource sources={["DefiLlama (live)"]} />
      </Card>

      {/* ================================================================ */}
      {/* Scatter Filter Panel (shared across C, D, E, F, H)              */}
      {/* ================================================================ */}
      <ScatterFilterPanel
        subcatsByGroup={subcatsByGroup}
        disabledGroups={disabledGroups}
        disabledSubcats={disabledSubcats}
        onToggleGroup={toggleGroup}
        onToggleSubcat={toggleSubcat}
        onSelectAll={selectAll}
        onSelectNone={selectNone}
        totalCount={feeVsRevScatterAll.length}
        visibleCount={feeVsRevScatter.length}
      />

      {/* ================================================================ */}
      {/* C. Fees vs Revenue Scatter (Take Rate)                           */}
      {/* ================================================================ */}
      <Card>
        <ChartExport
          data={feeVsRevScatter.map((d) => ({
            protocol: d.name,
            fees_24h: d.fees24h,
            revenue_24h: d.revenue24h,
            take_rate: d.takeRate,
            category: d.category,
          }))}
          filename="fees-vs-revenue-scatter"
          title="Fees vs Revenue (Protocol Take Rate)"
        >
          <p style={{ fontSize: "14px", color: "#666666", lineHeight: "1.5", marginBottom: 8 }}>
            Each dot is a protocol. X = total fees collected (24h), Y = protocol revenue (24h).
            The diagonal line marks 100% take rate. Points below it keep less than total fees as revenue.
          </p>
          <p style={{ fontSize: "12px", color: "#999999", marginBottom: 16 }}>
            {feeVsRevScatter.length} of {feeVsRevScatterAll.length} protocols shown
          </p>

          {isLoading ? (
            <ChartSkeleton />
          ) : feeVsRevScatter.length === 0 ? (
            <div className="h-[400px] flex items-center justify-center text-sm" style={{ color: "#999999" }}>
              Insufficient data to render chart.
            </div>
          ) : (
            <div className="h-[480px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8e8e8" />
                  <XAxis
                    type="number"
                    dataKey="fees24h"
                    name="Fees (24h)"
                    scale="log"
                    domain={["auto", "auto"]}
                    tickFormatter={logTickFormatter}
                    tick={{ fontSize: 11, fill: "#999999" }}
                    tickLine={false}
                    axisLine={{ stroke: "#d4d4d4" }}
                    label={{
                      value: "Fees (24h)",
                      position: "insideBottom",
                      offset: -10,
                      style: { fontSize: 11, fill: "#999999", textAnchor: "middle" },
                    }}
                  />
                  <YAxis
                    type="number"
                    dataKey="revenue24h"
                    name="Revenue (24h)"
                    scale="log"
                    domain={["auto", "auto"]}
                    tickFormatter={logTickFormatter}
                    tick={{ fontSize: 11, fill: "#999999" }}
                    tickLine={false}
                    axisLine={false}
                    width={70}
                    label={{
                      value: "Revenue (24h)",
                      angle: -90,
                      position: "insideLeft",
                      offset: -5,
                      style: { fontSize: 11, fill: "#999999", textAnchor: "middle" },
                    }}
                  />
                  <ZAxis type="number" dataKey="z" range={[30, 80]} />
                  <Tooltip
                    content={<ScatterTooltipFeesRevenue />}
                    cursor={{ strokeDasharray: "3 3", stroke: "#d4d4d4" }}
                  />
                  {/* 100% take rate line */}
                  <Scatter
                    name="100% Take Rate"
                    data={[1e2, 1e3, 1e4, 1e5, 1e6, 1e7, 1e8].map((v) => ({
                      fees24h: v,
                      revenue24h: v,
                      z: 0,
                      name: "100%",
                    }))}
                    fill="none"
                    line={{ stroke: "#999999", strokeDasharray: "6 4", strokeWidth: 1 }}
                    shape={() => <></>}
                    legendType="line"
                  />
                  {Object.entries(feeVsRevByCategory).map(([cat, data]) => (
                    <Scatter
                      key={cat}
                      name={cat}
                      data={data}
                      fill={GROUP_COLORS[cat] || "#94a3b8"}
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
        <DataSource sources={["DefiLlama (live)"]} />
      </Card>

      {/* ================================================================ */}
      {/* D. Revenue vs TVL Scatter (Capital Efficiency)                    */}
      {/* ================================================================ */}
      <Card>
        <ChartExport
          data={revVsTvlScatter.map((d) => ({
            protocol: d.name,
            tvl: d.tvl,
            revenue_ann: d.revenueAnn,
            revenue_tvl: d.revenueTvl,
            category: d.category,
          }))}
          filename="revenue-vs-tvl-scatter"
          title="Revenue vs TVL (Capital Efficiency)"
        >
          <p style={{ fontSize: "14px", color: "#666666", lineHeight: "1.5", marginBottom: 8 }}>
            Capital efficiency: protocols above the reference line generate more revenue per dollar
            of TVL than the industry average ({(avgRevenueTvl * 100).toFixed(1)}%).
          </p>
          <p style={{ fontSize: "12px", color: "#999999", marginBottom: 16 }}>
            {revVsTvlScatter.length} of {revVsTvlScatterAll.length} protocols shown
          </p>

          {isLoading ? (
            <ChartSkeleton />
          ) : revVsTvlScatter.length === 0 ? (
            <div className="h-[400px] flex items-center justify-center text-sm" style={{ color: "#999999" }}>
              Insufficient data to render chart.
            </div>
          ) : (
            <div className="h-[480px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8e8e8" />
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
                  <ZAxis type="number" dataKey="z" range={[30, 80]} />
                  <Tooltip
                    content={<ScatterTooltipRevTvl />}
                    cursor={{ strokeDasharray: "3 3", stroke: "#d4d4d4" }}
                  />
                  {avgRevenueTvl > 0 && (
                    <Scatter
                      name={`Avg Rev/TVL (${(avgRevenueTvl * 100).toFixed(1)}%)`}
                      data={[1e4, 1e5, 1e6, 1e7, 1e8, 1e9, 1e10, 1e11].map((tvlVal) => ({
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
                  {Object.entries(revVsTvlByCategory).map(([cat, data]) => (
                    <Scatter
                      key={cat}
                      name={cat}
                      data={data}
                      fill={GROUP_COLORS[cat] || "#94a3b8"}
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
        <DataSource sources={["DefiLlama (live fees + TVL)"]} />
      </Card>

      {/* ================================================================ */}
      {/* E. TVL vs Fees Scatter                                           */}
      {/* ================================================================ */}
      <Card>
        <ChartExport
          data={tvlVsFeesScatter.map((d) => ({
            protocol: d.name,
            tvl: d.tvl,
            fees_24h: d.fees24h,
            fees_tvl: d.feesTvl,
            category: d.category,
          }))}
          filename="tvl-vs-fees-scatter"
          title="TVL vs Fees (Fee Generation Efficiency)"
        >
          <p style={{ fontSize: "14px", color: "#666666", lineHeight: "1.5", marginBottom: 8 }}>
            How efficiently protocols generate fees from locked capital. X = TVL, Y = daily fees (both log scale).
          </p>
          <p style={{ fontSize: "12px", color: "#999999", marginBottom: 16 }}>
            {tvlVsFeesScatter.length} of {tvlVsFeesScatterAll.length} protocols shown
          </p>

          {isLoading ? (
            <ChartSkeleton />
          ) : tvlVsFeesScatter.length === 0 ? (
            <div className="h-[400px] flex items-center justify-center text-sm" style={{ color: "#999999" }}>
              Insufficient data to render chart.
            </div>
          ) : (
            <div className="h-[480px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8e8e8" />
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
                    dataKey="fees24h"
                    name="Fees (24h)"
                    scale="log"
                    domain={["auto", "auto"]}
                    tickFormatter={logTickFormatter}
                    tick={{ fontSize: 11, fill: "#999999" }}
                    tickLine={false}
                    axisLine={false}
                    width={70}
                    label={{
                      value: "Fees (24h)",
                      angle: -90,
                      position: "insideLeft",
                      offset: -5,
                      style: { fontSize: 11, fill: "#999999", textAnchor: "middle" },
                    }}
                  />
                  <ZAxis type="number" dataKey="z" range={[30, 80]} />
                  <Tooltip
                    content={<ScatterTooltipTvlFees />}
                    cursor={{ strokeDasharray: "3 3", stroke: "#d4d4d4" }}
                  />
                  {Object.entries(tvlVsFeesByCategory).map(([cat, data]) => (
                    <Scatter
                      key={cat}
                      name={cat}
                      data={data}
                      fill={GROUP_COLORS[cat] || "#94a3b8"}
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
        <DataSource sources={["DefiLlama (live fees + TVL)"]} />
      </Card>

      {/* ================================================================ */}
      {/* F. Revenue vs FDV Scatter                                        */}
      {/* ================================================================ */}
      <Card>
        <ChartExport
          data={revVsFdvScatter.map((d) => ({
            protocol: d.name,
            revenue_ann: d.revenueAnn,
            fdv: d.fdv,
            ps_fdv: d.psFdv ?? "",
            category: d.category,
          }))}
          filename="revenue-vs-fdv-scatter"
          title="Revenue vs FDV (Fully Diluted Valuation)"
        >
          <p style={{ fontSize: "14px", color: "#666666", lineHeight: "1.5", marginBottom: 8 }}>
            Annualized revenue vs fully diluted valuation. The diagonal line marks P/S = 20x.
            Dots below the line trade at &lt;20x revenue on FDV basis.
          </p>
          <p style={{ fontSize: "12px", color: "#999999", marginBottom: 16 }}>
            {revVsFdvScatter.length} of {revVsFdvScatterAll.length} protocols shown
          </p>

          {isLoading ? (
            <ChartSkeleton />
          ) : revVsFdvScatter.length === 0 ? (
            <div className="h-[400px] flex items-center justify-center text-sm" style={{ color: "#999999" }}>
              Insufficient data to render chart.
            </div>
          ) : (
            <div className="h-[480px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8e8e8" />
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
                    dataKey="fdv"
                    name="FDV"
                    scale="log"
                    domain={["auto", "auto"]}
                    tickFormatter={logTickFormatter}
                    tick={{ fontSize: 11, fill: "#999999" }}
                    tickLine={false}
                    axisLine={false}
                    width={70}
                    label={{
                      value: "Fully Diluted Valuation",
                      angle: -90,
                      position: "insideLeft",
                      offset: -5,
                      style: { fontSize: 11, fill: "#999999", textAnchor: "middle" },
                    }}
                  />
                  <ZAxis type="number" dataKey="z" range={[30, 80]} />
                  <Tooltip
                    content={<ScatterTooltipRevFdv />}
                    cursor={{ strokeDasharray: "3 3", stroke: "#d4d4d4" }}
                  />
                  {/* P/S = 20x reference line */}
                  <Scatter
                    name="P/S = 20x"
                    data={ps20xLineData.map((pt) => ({
                      revenueAnn: pt.x,
                      fdv: pt.y,
                      z: 0,
                      name: "P/S = 20x",
                    }))}
                    fill="none"
                    line={{ stroke: "#999999", strokeDasharray: "6 4", strokeWidth: 1 }}
                    shape={() => <></>}
                    legendType="line"
                  />
                  {Object.entries(revVsFdvByCategory).map(([cat, data]) => (
                    <Scatter
                      key={cat}
                      name={cat}
                      data={data}
                      fill={GROUP_COLORS[cat] || "#94a3b8"}
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
        <DataSource sources={["DefiLlama (live)", "CoinGecko (live)"]} />
      </Card>

      {/* ================================================================ */}
      {/* G. P/S Ratio Distribution (Histogram)                            */}
      {/* ================================================================ */}
      <Card>
        <ChartExport
          data={psDistribution.map((b) => ({
            bucket: b.label,
            count: b.count,
          }))}
          filename="ps-ratio-distribution"
          title="P/S Ratio Distribution"
        >
          <p style={{ fontSize: "14px", color: "#666666", lineHeight: "1.5", marginBottom: 8 }}>
            How many protocols fall into each P/S ratio bucket. Lower P/S = cheaper relative to revenue.
          </p>
          <p style={{ fontSize: "12px", color: "#999999", marginBottom: 16 }}>
            {totalPsProtocols} protocols with P/S data
          </p>

          {isLoading ? (
            <ChartSkeleton height="h-[300px]" />
          ) : totalPsProtocols === 0 ? (
            <div className="h-[300px] flex items-center justify-center text-sm" style={{ color: "#999999" }}>
              Insufficient data to render histogram.
            </div>
          ) : (
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={psDistribution}
                  margin={{ top: 10, right: 30, left: 20, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8e8e8" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 12, fill: "#333333", fontWeight: 600 }}
                    tickLine={false}
                    axisLine={{ stroke: "#d4d4d4" }}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#999999" }}
                    tickLine={false}
                    axisLine={false}
                    label={{
                      value: "# Protocols",
                      angle: -90,
                      position: "insideLeft",
                      offset: -5,
                      style: { fontSize: 11, fill: "#999999", textAnchor: "middle" },
                    }}
                  />
                  <Tooltip
                    formatter={(value: number) => [`${value} protocols`, "Count"]}
                    contentStyle={tooltipStyle}
                  />
                  <Bar dataKey="count" name="Protocols">
                    {psDistribution.map((entry) => (
                      <Cell key={entry.label} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartExport>
        <DataSource sources={["DefiLlama (live)", "CoinGecko (live)"]} />
      </Card>

      {/* ================================================================ */}
      {/* H. Revenue-Price Correlation                                      */}
      {/* ================================================================ */}
      <Card>
        <ChartExport
          data={filteredCorrelation.data.map((d) => ({
            protocol: d.name, fee_change_7d: d.feeChange7d,
            price_change_7d: d.priceChange7d, revenue_ann: d.revenueAnn, category: d.category,
          }))}
          filename="revenue-price-correlation"
          title="Revenue Growth vs Price Movement (7-Day)"
        >
          <p style={{ fontSize: "14px", color: "#666666", lineHeight: "1.5", marginBottom: 8 }}>
            Does rising revenue translate to price appreciation? Each dot plots a protocol&apos;s 7-day fee
            change (X) vs 7-day price change (Y). The regression line shows the aggregate trend.
          </p>

          <div style={{ display: "flex", gap: 24, marginBottom: 16, padding: "12px 16px", border: "1px solid #e8e8e8", backgroundColor: "#fafafa", flexWrap: "wrap" }}>
            <div>
              <p style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#999", marginBottom: 2 }}>Protocols Matched</p>
              <p style={{ fontSize: "20px", fontWeight: 700, color: "#111", fontVariantNumeric: "tabular-nums" }}>{filteredCorrelation.data.length}</p>
            </div>
            <div>
              <p style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#999", marginBottom: 2 }}>Pearson R</p>
              <p style={{ fontSize: "20px", fontWeight: 700, color: "#111", fontVariantNumeric: "tabular-nums" }}>{filteredCorrelation.r.toFixed(3)}</p>
            </div>
            <div>
              <p style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#999", marginBottom: 2 }}>R-squared</p>
              <p style={{ fontSize: "20px", fontWeight: 700, color: "#111", fontVariantNumeric: "tabular-nums" }}>{filteredCorrelation.r2.toFixed(3)}</p>
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <p style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#999", marginBottom: 2 }}>Interpretation</p>
              <p style={{ fontSize: "13px", color: "#333", lineHeight: 1.4 }}>
                {filteredCorrelation.r2 < 0.05
                  ? "Very weak correlation \u2014 revenue changes explain less than 5% of price movement."
                  : filteredCorrelation.r2 < 0.15
                    ? `Weak ${filteredCorrelation.r > 0 ? "positive" : "negative"} correlation \u2014 some signal, but noisy.`
                    : filteredCorrelation.r2 < 0.3
                      ? `Moderate ${filteredCorrelation.r > 0 ? "positive" : "negative"} correlation \u2014 revenue growth matters.`
                      : `Strong ${filteredCorrelation.r > 0 ? "positive" : "negative"} correlation \u2014 revenue is a key price driver.`}
              </p>
            </div>
          </div>

          {isLoading ? (
            <ChartSkeleton />
          ) : filteredCorrelation.data.length < 5 ? (
            <div className="h-[400px] flex items-center justify-center text-sm" style={{ color: "#999" }}>
              Insufficient matched protocols. Try selecting more categories.
            </div>
          ) : (
            <div className="h-[480px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8e8e8" />
                  <XAxis
                    type="number" dataKey="feeChange7d" name="Fee Change 7d (%)"
                    domain={["auto", "auto"]}
                    tickFormatter={(v: number) => `${v > 0 ? "+" : ""}${v.toFixed(0)}%`}
                    tick={{ fontSize: 11, fill: "#999" }} tickLine={false}
                    axisLine={{ stroke: "#d4d4d4" }}
                    label={{ value: "Fee Change (7d %)", position: "insideBottom", offset: -10, style: { fontSize: 11, fill: "#999", textAnchor: "middle" } }}
                  />
                  <YAxis
                    type="number" dataKey="priceChange7d" name="Price Change 7d (%)"
                    domain={["auto", "auto"]}
                    tickFormatter={(v: number) => `${v > 0 ? "+" : ""}${v.toFixed(0)}%`}
                    tick={{ fontSize: 11, fill: "#999" }} tickLine={false} axisLine={false} width={70}
                    label={{ value: "Price Change (7d %)", angle: -90, position: "insideLeft", offset: -5, style: { fontSize: 11, fill: "#999", textAnchor: "middle" } }}
                  />
                  <ZAxis type="number" dataKey="z" range={[30, 200]} />
                  <Tooltip content={<ScatterTooltipCorrelation />} cursor={{ strokeDasharray: "3 3", stroke: "#d4d4d4" }} />
                  <ReferenceLine x={0} stroke="#d4d4d4" strokeDasharray="3 3" />
                  <ReferenceLine y={0} stroke="#d4d4d4" strokeDasharray="3 3" />
                  {corrRegressionLine.length > 0 && (
                    <Scatter
                      name={`Regression (R\u00B2=${filteredCorrelation.r2.toFixed(2)})`}
                      data={corrRegressionLine} fill="none"
                      line={{ stroke: "#ef4444", strokeWidth: 2, strokeDasharray: "8 4" }}
                      shape={() => <></>} legendType="line"
                    />
                  )}
                  {Object.entries(filteredCorrelation.byCategory).map(([cat, data]) => (
                    <Scatter key={cat} name={cat} data={data} fill={GROUP_COLORS[cat] || "#94a3b8"} fillOpacity={0.7} />
                  ))}
                  <Legend verticalAlign="top" height={36} iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartExport>
        <DataSource sources={["DefiLlama (live)", "CoinGecko (live)"]} />
      </Card>
    </section>
  );
}
