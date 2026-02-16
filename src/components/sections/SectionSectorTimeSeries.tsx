"use client";

import React, { useMemo, useState, useCallback } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useDataContext } from "@/lib/DataContext";
import { Card, SectionHeader, DataSource } from "@/components/ui/Card";
import { ChartExport } from "@/components/ui/ChartExport";
import { formatCompact, tooltipStyle } from "@/lib/chartUtils";
import { GROUP_ORDER, GROUP_COLORS, getCategoryGroup, categorizeToken } from "@/lib/categories";

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function ChartSkeleton({ height = "h-[420px]" }: { height?: string }) {
  return (
    <div className={`${height} w-full flex items-center justify-center`}>
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-slate-400">Loading sector data...</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Time range options (extended — now includes 2Y and All)
// ---------------------------------------------------------------------------

type TimeRange = "30d" | "90d" | "180d" | "1y" | "2y" | "all";
const TIME_RANGES: { key: TimeRange; label: string; days: number }[] = [
  { key: "30d", label: "30D", days: 30 },
  { key: "90d", label: "90D", days: 90 },
  { key: "180d", label: "6M", days: 180 },
  { key: "1y", label: "1Y", days: 365 },
  { key: "2y", label: "2Y", days: 730 },
  { key: "all", label: "All", days: Infinity },
];

// ---------------------------------------------------------------------------
// View level for drill-down
// ---------------------------------------------------------------------------

type ViewLevel = "sectors" | "subcategories";

// ---------------------------------------------------------------------------
// Subcategory color generation (derives from parent sector color)
// ---------------------------------------------------------------------------

function generateSubcategoryColors(
  subcategories: Record<string, string[]>,
): Record<string, string> {
  const colors: Record<string, string> = {};

  for (const [sector, subs] of Object.entries(subcategories)) {
    const baseColor = GROUP_COLORS[sector] || "#94a3b8";
    // Parse hex color and generate variations
    const r = parseInt(baseColor.slice(1, 3), 16);
    const g = parseInt(baseColor.slice(3, 5), 16);
    const b = parseInt(baseColor.slice(5, 7), 16);

    for (let i = 0; i < subs.length; i++) {
      // Vary lightness: spread from 70% to 130% of base color
      const factor = 0.7 + (i / Math.max(subs.length - 1, 1)) * 0.6;
      const nr = Math.min(255, Math.round(r * factor));
      const ng = Math.min(255, Math.round(g * factor));
      const nb = Math.min(255, Math.round(b * factor));
      colors[subs[i]] = `rgb(${nr},${ng},${nb})`;
    }
  }

  return colors;
}

// ---------------------------------------------------------------------------
// Shared tooltip
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function SectorTooltip({ active, payload, label, shareMode }: any) {
  if (!active || !payload?.length) return null;

  const sorted = [...payload]
    .filter((p: { value: number }) => p.value > 0)
    .sort((a: { value: number }, b: { value: number }) => b.value - a.value);
  const total = sorted.reduce((s: number, p: { value: number }) => s + p.value, 0);

  const dateStr = label
    ? new Date(Number(label) * 1000).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "";

  return (
    <div style={{ ...tooltipStyle, minWidth: 220, maxHeight: 400, overflowY: "auto" }}>
      <p style={{ fontWeight: 700, color: "#111", marginBottom: 6, fontSize: 12 }}>{dateStr}</p>
      {!shareMode && (
        <p style={{ fontSize: 11, color: "#666", marginBottom: 6 }}>
          Total: <strong style={{ color: "#111" }}>{formatCompact(total)}</strong>
        </p>
      )}
      {sorted.slice(0, 20).map((entry: { name: string; value: number; color: string }) => (
        <div
          key={entry.name}
          style={{ display: "flex", justifyContent: "space-between", gap: 16, fontSize: 11, marginBottom: 2 }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 8, height: 8, backgroundColor: entry.color, display: "inline-block", flexShrink: 0 }} />
            <span style={{ maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{entry.name}</span>
          </span>
          <span style={{ fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>
            {shareMode ? `${entry.value.toFixed(1)}%` : formatCompact(entry.value)}
          </span>
        </div>
      ))}
      {sorted.length > 20 && (
        <p style={{ fontSize: 10, color: "#999", marginTop: 4 }}>+{sorted.length - 20} more</p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Toggle panels
// ---------------------------------------------------------------------------

function SectorToggle({
  sectors,
  colors,
  disabled,
  onToggle,
  onAll,
  onNone,
}: {
  sectors: string[];
  colors: Record<string, string>;
  disabled: Set<string>;
  onToggle: (s: string) => void;
  onAll: () => void;
  onNone: () => void;
}) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 16 }}>
      {sectors.map((sector) => {
        const isActive = !disabled.has(sector);
        return (
          <button
            key={sector}
            onClick={() => onToggle(sector)}
            style={{
              fontSize: "11px",
              fontWeight: 600,
              letterSpacing: "0.04em",
              padding: "4px 10px",
              border: "1px solid",
              borderColor: isActive ? colors[sector] || "#111" : "#d4d4d4",
              backgroundColor: isActive ? colors[sector] || "#111" : "#fff",
              color: isActive ? "#fff" : "#999",
              borderRadius: 0,
              cursor: "pointer",
              opacity: isActive ? 1 : 0.4,
              maxWidth: 180,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {sector}
          </button>
        );
      })}
      <button
        onClick={onAll}
        style={{
          fontSize: "10px",
          fontWeight: 600,
          textTransform: "uppercase",
          padding: "4px 8px",
          border: "1px solid #d4d4d4",
          backgroundColor: "#fff",
          color: "#666",
          borderRadius: 0,
          cursor: "pointer",
        }}
      >
        All
      </button>
      <button
        onClick={onNone}
        style={{
          fontSize: "10px",
          fontWeight: 600,
          textTransform: "uppercase",
          padding: "4px 8px",
          border: "1px solid #d4d4d4",
          backgroundColor: "#fff",
          color: "#666",
          borderRadius: 0,
          cursor: "pointer",
        }}
      >
        None
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helper: convert absolute values to % share (100% stacked)
// ---------------------------------------------------------------------------

function toShareData(
  data: Record<string, number>[],
  keys: string[],
): Record<string, number>[] {
  return data.map((row) => {
    const total = keys.reduce((s, k) => s + (row[k] || 0), 0);
    if (total <= 0) return row;
    const result: Record<string, number> = { date: row.date };
    for (const k of keys) {
      result[k] = ((row[k] || 0) / total) * 100;
    }
    return result;
  });
}

// ---------------------------------------------------------------------------
// Helper: compute rolling average
// ---------------------------------------------------------------------------

function rollingAvg(
  vals: number[],
  idx: number,
  windowSize: number,
): number {
  if (windowSize <= 1) return vals[idx] || 0;
  let sum = 0;
  let count = 0;
  for (let j = Math.max(0, idx - windowSize + 1); j <= idx; j++) {
    sum += vals[j] || 0;
    count++;
  }
  return count > 0 ? sum / count : 0;
}

// ---------------------------------------------------------------------------
// Stacked area chart component (reusable for fees, revenue, market cap)
// ---------------------------------------------------------------------------

function StackedAreaSection({
  title,
  description,
  data,
  keys,
  colors,
  disabled,
  shareMode,
  filename,
  source,
  isLoading,
  isEmpty,
  summaryLabel,
  summaryValue,
}: {
  title: string;
  description: string;
  data: Record<string, number>[];
  keys: string[];
  colors: Record<string, string>;
  disabled: Set<string>;
  shareMode: boolean;
  filename: string;
  source: string;
  isLoading: boolean;
  isEmpty: boolean;
  summaryLabel?: string;
  summaryValue?: number;
}) {
  const activeKeys = keys.filter((k) => !disabled.has(k));
  const chartData = shareMode ? toShareData(data, activeKeys) : data;

  return (
    <Card>
      <ChartExport
        data={chartData.map((row) => {
          const obj: Record<string, unknown> = {
            date: new Date(Number(row.date) * 1000).toISOString().slice(0, 10),
          };
          for (const k of keys) obj[k] = row[k] || 0;
          return obj;
        })}
        filename={filename}
        title={title}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
          <p style={{ fontSize: "14px", color: "#666", lineHeight: "1.5", maxWidth: "70%", margin: 0 }}>
            {description}
          </p>
          {summaryLabel && summaryValue != null && (
            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#999", marginBottom: 2 }}>
                {summaryLabel}
              </p>
              <p style={{ fontSize: "18px", fontWeight: 700, color: "#111", fontVariantNumeric: "tabular-nums" }}>
                {formatCompact(summaryValue)}
              </p>
            </div>
          )}
        </div>

        {isLoading ? (
          <ChartSkeleton />
        ) : isEmpty ? (
          <div className="h-[420px] flex items-center justify-center text-sm" style={{ color: "#999" }}>
            No data available.
          </div>
        ) : (
          <div className="h-[420px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8e8e8" />
                <XAxis
                  dataKey="date"
                  type="number"
                  domain={["dataMin", "dataMax"]}
                  tickFormatter={(v: number) => {
                    const d = new Date(v * 1000);
                    const now = Date.now();
                    const diffDays = (now - v * 1000) / 86400000;
                    if (diffDays > 365) {
                      return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
                    }
                    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                  }}
                  tick={{ fontSize: 10, fill: "#999" }}
                  tickLine={false}
                  axisLine={{ stroke: "#d4d4d4" }}
                  minTickGap={40}
                />
                <YAxis
                  tickFormatter={(v: number) => shareMode ? `${v.toFixed(0)}%` : formatCompact(v)}
                  tick={{ fontSize: 10, fill: "#999" }}
                  tickLine={false}
                  axisLine={false}
                  width={60}
                  domain={shareMode ? [0, 100] : undefined}
                />
                <Tooltip content={<SectorTooltip shareMode={shareMode} />} />
                {activeKeys.map((key) => (
                  <Area
                    key={key}
                    type="monotone"
                    dataKey={key}
                    stackId="1"
                    fill={colors[key] || "#94a3b8"}
                    stroke={colors[key] || "#94a3b8"}
                    fillOpacity={0.7}
                    strokeWidth={0.5}
                  />
                ))}
                <Legend
                  verticalAlign="top"
                  height={activeKeys.length > 12 ? 56 : 36}
                  iconSize={10}
                  wrapperStyle={{ fontSize: 11 }}
                  payload={activeKeys.map((k) => ({
                    value: k,
                    type: "square" as const,
                    color: colors[k] || "#94a3b8",
                  }))}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </ChartExport>
      <DataSource sources={[source]} />
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Main Section Component
// ---------------------------------------------------------------------------

export default function SectionSectorTimeSeries() {
  const { sectorHistory, coinGecko, unifiedTokens, isLoading } = useDataContext();

  const [timeRange, setTimeRange] = useState<TimeRange>("1y");
  const [disabledSectors, setDisabledSectors] = useState<Set<string>>(new Set());
  const [shareMode, setShareMode] = useState(false);
  const [viewLevel, setViewLevel] = useState<ViewLevel>("sectors");

  const toggleSector = useCallback((s: string) => {
    setDisabledSectors((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });
  }, []);
  const selectAll = useCallback(() => setDisabledSectors(new Set()), []);
  const selectNone = useCallback(() => {
    const allKeys = viewLevel === "sectors"
      ? GROUP_ORDER as unknown as string[]
      : Object.keys(sectorHistory?.feesSub ?? {});
    setDisabledSectors(new Set(allKeys));
  }, [viewLevel, sectorHistory]);

  // Subcategory colors
  const subcategoryColors = useMemo(() => {
    if (!sectorHistory?.subcategories) return {};
    return generateSubcategoryColors(sectorHistory.subcategories);
  }, [sectorHistory]);

  // Current view's keys and colors
  const currentKeys = useMemo(() => {
    if (viewLevel === "sectors") return [...GROUP_ORDER];
    // Subcategories: sorted by total value (largest first)
    if (!sectorHistory?.feesSub) return [];
    return Object.entries(sectorHistory.feesSub)
      .map(([name, vals]) => ({ name, total: vals.reduce((s, v) => s + v, 0) }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 30) // Top 30 subcategories to keep chart readable
      .map((e) => e.name);
  }, [viewLevel, sectorHistory]);

  const currentColors = useMemo(() => {
    if (viewLevel === "sectors") return GROUP_COLORS;
    return subcategoryColors;
  }, [viewLevel, subcategoryColors]);

  // Reset disabled when switching view level
  const switchViewLevel = useCallback((level: ViewLevel) => {
    setViewLevel(level);
    setDisabledSectors(new Set());
  }, []);

  // Time cutoff computation
  const rangeDays = useMemo(() => {
    return TIME_RANGES.find((tr) => tr.key === timeRange)?.days ?? 365;
  }, [timeRange]);

  const cutoffTs = useMemo(() => {
    if (rangeDays === Infinity) return 0;
    return Math.floor(Date.now() / 1000) - rangeDays * 86400;
  }, [rangeDays]);

  // ===================================================================
  // A. Fee time series by sector or subcategory
  // ===================================================================
  const feeChartData = useMemo(() => {
    if (!sectorHistory?.dates?.length) return [];
    const { dates } = sectorHistory;
    const dataSource = viewLevel === "sectors" ? sectorHistory.fees : (sectorHistory.feesSub ?? {});

    const windowSize = rangeDays <= 30 ? 1 : rangeDays <= 90 ? 3 : 7;
    const raw: Record<string, number>[] = [];

    for (let i = 0; i < dates.length; i++) {
      if (dates[i] < cutoffTs) continue;
      const row: Record<string, number> = { date: dates[i] };
      for (const key of currentKeys) {
        const vals = dataSource[key];
        if (!vals) { row[key] = 0; continue; }
        row[key] = rollingAvg(vals, i, windowSize);
      }
      raw.push(row);
    }

    return raw;
  }, [sectorHistory, timeRange, viewLevel, currentKeys, cutoffTs, rangeDays]);

  // ===================================================================
  // B. Revenue time series by sector or subcategory
  // ===================================================================
  const revenueChartData = useMemo(() => {
    if (!sectorHistory?.revenueDates?.length || !sectorHistory.revenue) return [];
    const { revenueDates } = sectorHistory;
    const dataSource = viewLevel === "sectors"
      ? sectorHistory.revenue
      : (sectorHistory.revenueSub ?? {});

    const windowSize = rangeDays <= 30 ? 1 : rangeDays <= 90 ? 3 : 7;
    const raw: Record<string, number>[] = [];

    for (let i = 0; i < revenueDates.length; i++) {
      if (revenueDates[i] < cutoffTs) continue;
      const row: Record<string, number> = { date: revenueDates[i] };
      for (const key of currentKeys) {
        const vals = dataSource[key];
        if (!vals) { row[key] = 0; continue; }
        row[key] = rollingAvg(vals, i, windowSize);
      }
      raw.push(row);
    }

    return raw;
  }, [sectorHistory, timeRange, viewLevel, currentKeys, cutoffTs, rangeDays]);

  // ===================================================================
  // C. Market cap by sector (from per-token CoinGecko data)
  //    Classifies ALL 1000 tokens individually — no more category proxy.
  // ===================================================================

  const currentSectorMcap = useMemo(() => {
    const sectorMcap: Record<string, number> = {};
    for (const s of GROUP_ORDER) sectorMcap[s] = 0;

    // Use unifiedTokens (has best categorization from all sources) when available
    if (unifiedTokens?.length) {
      const seen = new Set<string>();
      for (const t of unifiedTokens) {
        if (!t.marketCap || t.marketCap <= 0) continue;
        // Avoid double-counting: use CoinGecko ID or slug as dedup key
        const dedup = t.id.toLowerCase();
        if (seen.has(dedup)) continue;
        seen.add(dedup);

        const sector = t.categoryGroup;
        if (sectorMcap[sector] !== undefined) {
          sectorMcap[sector] += t.marketCap;
        } else {
          sectorMcap["Other"] = (sectorMcap["Other"] || 0) + t.marketCap;
        }
      }
    } else if (coinGecko?.tokens?.length) {
      // Fallback: classify CoinGecko tokens directly
      for (const t of coinGecko.tokens) {
        if (!t.marketCap || t.marketCap <= 0) continue;
        const { categoryGroup } = categorizeToken(null, null, t.name, t.id);
        if (sectorMcap[categoryGroup] !== undefined) {
          sectorMcap[categoryGroup] += t.marketCap;
        } else {
          sectorMcap["Other"] = (sectorMcap["Other"] || 0) + t.marketCap;
        }
      }
    }

    return sectorMcap;
  }, [unifiedTokens, coinGecko]);

  // Subcategory-level market cap (for subcategory view)
  const currentSubMcap = useMemo(() => {
    if (viewLevel !== "subcategories" || !unifiedTokens?.length) return {};
    const subMcap: Record<string, number> = {};
    const seen = new Set<string>();

    for (const t of unifiedTokens) {
      if (!t.marketCap || t.marketCap <= 0) continue;
      const dedup = t.id.toLowerCase();
      if (seen.has(dedup)) continue;
      seen.add(dedup);

      const sub = t.subcategory || t.categoryGroup;
      subMcap[sub] = (subMcap[sub] || 0) + t.marketCap;
    }

    return subMcap;
  }, [unifiedTokens, viewLevel]);

  const mcapChartData = useMemo(() => {
    if (!coinGecko?.historicalMarketCap?.length) return [];

    const mcapSource = viewLevel === "sectors" ? currentSectorMcap : currentSubMcap;
    const totalSectorMcap = Object.values(mcapSource).reduce((s, v) => s + v, 0);
    if (totalSectorMcap <= 0) return [];

    // Compute fractional weights
    const weights: Record<string, number> = {};
    for (const key of currentKeys) {
      weights[key] = (mcapSource[key] || 0) / totalSectorMcap;
    }

    const cutoffMs = cutoffTs * 1000;

    // Scale historical data to total market cap if needed
    const lastHistMcap = coinGecko.historicalMarketCap[coinGecko.historicalMarketCap.length - 1]?.marketCap || 0;
    const globalMcap = coinGecko.global?.totalMarketCap || 0;
    const isAlreadyGlobal = globalMcap > 0 && Math.abs(lastHistMcap - globalMcap) / globalMcap < 0.2;
    const hasBtcDominance = coinGecko.global?.btcDominance > 0;
    const scale = isAlreadyGlobal ? 1 : (hasBtcDominance ? 100 / coinGecko.global.btcDominance : 1);

    return coinGecko.historicalMarketCap
      .filter((d) => cutoffTs === 0 || d.date >= cutoffMs)
      .map((d) => {
        const totalMcap = d.marketCap * scale;
        const row: Record<string, number> = { date: Math.floor(d.date / 1000) };
        for (const key of currentKeys) {
          row[key] = totalMcap * (weights[key] || 0);
        }
        return row;
      });
  }, [coinGecko, currentSectorMcap, currentSubMcap, currentKeys, viewLevel, cutoffTs]);

  // ===================================================================
  // Summary stats
  // ===================================================================
  const feeStats = useMemo(() => {
    if (!feeChartData.length) return null;
    const latest = feeChartData[feeChartData.length - 1];
    const totalLatest = currentKeys.reduce((s, key) => s + ((latest[key] as number) || 0), 0);
    return { totalDaily: totalLatest, dataPoints: feeChartData.length };
  }, [feeChartData, currentKeys]);

  // ===================================================================
  // Render
  // ===================================================================
  return (
    <section className="mb-16">
      <SectionHeader
        number="8"
        title="Sector Trends Over Time"
        subtitle="Daily fees, revenue, and market capitalisation broken down by sector. Toggle categories, adjust time window, and switch to % share view to explore trends."
      />

      {/* Controls */}
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 12 }}>
          {/* Left: Time Range */}
          <div>
            <p style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#999", marginBottom: 6 }}>
              Time Range
            </p>
            <div style={{ display: "flex", gap: 2 }}>
              {TIME_RANGES.map((tr) => (
                <button
                  key={tr.key}
                  onClick={() => setTimeRange(tr.key)}
                  style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    padding: "4px 12px",
                    border: "1px solid",
                    borderColor: timeRange === tr.key ? "#111" : "#d4d4d4",
                    backgroundColor: timeRange === tr.key ? "#111" : "#fff",
                    color: timeRange === tr.key ? "#fff" : "#666",
                    borderRadius: 0,
                    cursor: "pointer",
                  }}
                >
                  {tr.label}
                </button>
              ))}
            </div>
          </div>

          {/* Center: View Level + Share Mode */}
          <div>
            <p style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#999", marginBottom: 6 }}>
              View
            </p>
            <div style={{ display: "flex", gap: 2 }}>
              <button
                onClick={() => switchViewLevel("sectors")}
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  padding: "4px 12px",
                  border: "1px solid",
                  borderColor: viewLevel === "sectors" ? "#111" : "#d4d4d4",
                  backgroundColor: viewLevel === "sectors" ? "#111" : "#fff",
                  color: viewLevel === "sectors" ? "#fff" : "#666",
                  borderRadius: 0,
                  cursor: "pointer",
                }}
              >
                Sectors
              </button>
              <button
                onClick={() => switchViewLevel("subcategories")}
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  padding: "4px 12px",
                  border: "1px solid",
                  borderColor: viewLevel === "subcategories" ? "#111" : "#d4d4d4",
                  backgroundColor: viewLevel === "subcategories" ? "#111" : "#fff",
                  color: viewLevel === "subcategories" ? "#fff" : "#666",
                  borderRadius: 0,
                  cursor: "pointer",
                }}
              >
                Subcategories
              </button>
              <button
                onClick={() => setShareMode((prev) => !prev)}
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  padding: "4px 12px",
                  border: "1px solid",
                  borderColor: shareMode ? "#111" : "#d4d4d4",
                  backgroundColor: shareMode ? "#111" : "#fff",
                  color: shareMode ? "#fff" : "#666",
                  borderRadius: 0,
                  cursor: "pointer",
                  marginLeft: 8,
                }}
              >
                % Share
              </button>
            </div>
          </div>

          {/* Right: Stats */}
          {feeStats && !shareMode && (
            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#999", marginBottom: 2 }}>
                Latest Daily Fees
              </p>
              <p style={{ fontSize: "20px", fontWeight: 700, color: "#111", fontVariantNumeric: "tabular-nums" }}>
                {formatCompact(feeStats.totalDaily)}
              </p>
            </div>
          )}
        </div>

        <SectorToggle
          sectors={currentKeys}
          colors={currentColors}
          disabled={disabledSectors}
          onToggle={toggleSector}
          onAll={selectAll}
          onNone={selectNone}
        />
      </Card>

      {/* ================================================================ */}
      {/* A. Daily Fees                                                     */}
      {/* ================================================================ */}
      <StackedAreaSection
        title="Daily Fees by Sector"
        description={`Total protocol fees generated per day, stacked by ${viewLevel === "sectors" ? "sector" : "subcategory"}. ${rangeDays > 30 ? "Rolling average applied to smooth daily volatility." : ""}`}
        data={feeChartData}
        keys={currentKeys}
        colors={currentColors}
        disabled={disabledSectors}
        shareMode={shareMode}
        filename={`sector-fees-${viewLevel}`}
        source="DefiLlama (live)"
        isLoading={isLoading || !sectorHistory}
        isEmpty={feeChartData.length === 0}
        summaryLabel={!shareMode ? "Latest Daily Fees" : undefined}
        summaryValue={!shareMode ? feeStats?.totalDaily : undefined}
      />

      {/* ================================================================ */}
      {/* B. Daily Revenue                                                  */}
      {/* ================================================================ */}
      <StackedAreaSection
        title="Daily Revenue by Sector"
        description={`Protocol revenue (what the protocol keeps) per day, stacked by ${viewLevel === "sectors" ? "sector" : "subcategory"}. Revenue is a subset of total fees — the take rate varies by protocol type.`}
        data={revenueChartData}
        keys={currentKeys}
        colors={currentColors}
        disabled={disabledSectors}
        shareMode={shareMode}
        filename={`sector-revenue-${viewLevel}`}
        source="DefiLlama (live)"
        isLoading={isLoading || !sectorHistory}
        isEmpty={revenueChartData.length === 0}
      />

      {/* ================================================================ */}
      {/* C. Market Capitalisation                                          */}
      {/* ================================================================ */}
      <Card>
        <ChartExport
          data={mcapChartData.map((row) => {
            const obj: Record<string, unknown> = {
              date: new Date(Number(row.date) * 1000).toISOString().slice(0, 10),
            };
            for (const k of currentKeys) obj[k] = row[k] || 0;
            return obj;
          })}
          filename={`sector-marketcap-${viewLevel}`}
          title="Market Capitalisation by Sector"
        >
          <p style={{ fontSize: "14px", color: "#666", lineHeight: "1.5", marginBottom: 12 }}>
            Total market capitalisation by {viewLevel === "sectors" ? "sector" : "subcategory"} over time.
            Current {viewLevel === "sectors" ? "sector" : "subcategory"} weights derived from per-token classification
            of the top 1,000 tokens by market cap.
          </p>

          {/* Current snapshot breakdown */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 16, padding: "10px 14px", border: "1px solid #e8e8e8", backgroundColor: "#fafafa" }}>
            {(viewLevel === "sectors" ? GROUP_ORDER as unknown as string[] : currentKeys)
              .filter((s) => {
                const mcap = viewLevel === "sectors" ? currentSectorMcap[s] : (currentSubMcap[s] || 0);
                return mcap > 0 && !disabledSectors.has(s);
              })
              .sort((a, b) => {
                const aMcap = viewLevel === "sectors" ? currentSectorMcap[a] : (currentSubMcap[a] || 0);
                const bMcap = viewLevel === "sectors" ? currentSectorMcap[b] : (currentSubMcap[b] || 0);
                return bMcap - aMcap;
              })
              .slice(0, 12)
              .map((key) => {
                const mcap = viewLevel === "sectors" ? currentSectorMcap[key] : (currentSubMcap[key] || 0);
                return (
                  <div key={key} style={{ minWidth: 80 }}>
                    <p style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: currentColors[key] || "#666", marginBottom: 1, maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {key}
                    </p>
                    <p style={{ fontSize: "14px", fontWeight: 700, color: "#111", fontVariantNumeric: "tabular-nums" }}>
                      {formatCompact(mcap)}
                    </p>
                  </div>
                );
              })}
          </div>

          {isLoading || !coinGecko ? (
            <ChartSkeleton />
          ) : mcapChartData.length === 0 ? (
            <div className="h-[420px] flex items-center justify-center text-sm" style={{ color: "#999" }}>
              No historical market cap data available.
            </div>
          ) : (
            <div className="h-[420px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={shareMode ? toShareData(mcapChartData, currentKeys.filter((k) => !disabledSectors.has(k))) : mcapChartData}
                  margin={{ top: 10, right: 30, left: 20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8e8e8" />
                  <XAxis
                    dataKey="date"
                    type="number"
                    domain={["dataMin", "dataMax"]}
                    tickFormatter={(v: number) => {
                      const d = new Date(v * 1000);
                      const diffDays = (Date.now() - v * 1000) / 86400000;
                      if (diffDays > 365) {
                        return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
                      }
                      return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                    }}
                    tick={{ fontSize: 10, fill: "#999" }}
                    tickLine={false}
                    axisLine={{ stroke: "#d4d4d4" }}
                    minTickGap={40}
                  />
                  <YAxis
                    tickFormatter={(v: number) => shareMode ? `${v.toFixed(0)}%` : formatCompact(v)}
                    tick={{ fontSize: 10, fill: "#999" }}
                    tickLine={false}
                    axisLine={false}
                    width={65}
                    domain={shareMode ? [0, 100] : undefined}
                  />
                  <Tooltip content={<SectorTooltip shareMode={shareMode} />} />
                  {currentKeys.filter((k) => !disabledSectors.has(k)).map((key) => (
                    <Area
                      key={key}
                      type="monotone"
                      dataKey={key}
                      stackId="1"
                      fill={currentColors[key] || "#94a3b8"}
                      stroke={currentColors[key] || "#94a3b8"}
                      fillOpacity={0.7}
                      strokeWidth={0.5}
                    />
                  ))}
                  <Legend
                    verticalAlign="top"
                    height={currentKeys.filter((k) => !disabledSectors.has(k)).length > 12 ? 56 : 36}
                    iconSize={10}
                    wrapperStyle={{ fontSize: 11 }}
                    payload={currentKeys.filter((k) => !disabledSectors.has(k)).map((k) => ({
                      value: k,
                      type: "square" as const,
                      color: currentColors[k] || "#94a3b8",
                    }))}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartExport>
        <DataSource sources={["CoinGecko (live)"]} />
      </Card>
    </section>
  );
}
