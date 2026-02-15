"use client";

import React, { useMemo } from "react";
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
  categoryColorMap,
  getHeatmapColor,
  getHeatmapTextColor,
} from "@/lib/chartUtils";
import { getCategoryGroup, getCategoryColor, GROUP_COLORS } from "@/lib/categories";

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
// Category Legend
// ---------------------------------------------------------------------------

function CategoryLegend() {
  const items = Object.entries(categoryColorMap);
  return (
    <div className="flex flex-wrap gap-4 mt-3 text-xs" style={{ color: "#666666" }}>
      {items.map(([label, color]) => (
        <span key={label} className="flex items-center gap-1.5">
          <span
            className="w-2.5 h-2.5"
            style={{ backgroundColor: color, borderRadius: 0 }}
          />
          {label}
        </span>
      ))}
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
      <p style={{ fontSize: "11px", color: "#999999", marginTop: 2 }}>{d.category}</p>
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
      <p style={{ fontSize: "11px", color: "#999999", marginTop: 2 }}>{d.category}</p>
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
      <p style={{ fontSize: "11px", color: "#999999", marginTop: 2 }}>{d.category}</p>
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
      <p style={{ fontSize: "11px", color: "#999999", marginTop: 2 }}>{d.category}</p>
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
  const { fees, tvl, unifiedTokens, isLoading } = useDataContext();

  // =======================================================================
  // A. Revenue Momentum Treemap — ALL protocols with 7d change data
  // =======================================================================
  const treemapData = useMemo(() => {
    if (!fees?.protocols) return [];

    const items = fees.protocols
      .filter((p) => p.total24h > 0 && p.change_7d != null)
      .map((p) => ({
        name: p.displayName || p.name,
        size: p.total24h,
        change7d: p.change_7d,
        category: getCategoryGroup(p.category || "Other"),
        color: getHeatmapColor(p.change_7d),
      }));

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
      const g = getCategoryGroup(p.category || "Other");
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
  const feeVsRevScatter = useMemo(() => {
    if (!fees?.protocols) return [];

    return fees.protocols
      .filter((p) => p.total24h > 0 && (p.revenue24h ?? 0) > 0)
      .map((p) => ({
        name: p.displayName || p.name,
        fees24h: p.total24h,
        revenue24h: p.revenue24h ?? 0,
        takeRate: (p.revenue24h ?? 0) / p.total24h,
        category: getCategoryGroup(p.category || "Other"),
        color: getCategoryColor(p.category || "Other"),
        z: 60,
      }));
  }, [fees]);

  const feeVsRevByCategory = useMemo(() => groupByCategory(feeVsRevScatter), [feeVsRevScatter]);

  // =======================================================================
  // D. Revenue vs TVL Scatter — expanded with allProtocolsTVL
  // =======================================================================
  const revVsTvlScatter = useMemo(() => {
    if (!fees?.protocols || !tvl?.allProtocolsTVL) return [];

    const tvlByName = new Map<string, number>();
    for (const p of tvl.allProtocolsTVL) {
      tvlByName.set(p.name.toLowerCase(), p.tvl);
    }

    return fees.protocols
      .filter((p) => {
        const tvlVal = tvlByName.get(p.name.toLowerCase());
        return p.total24h > 0 && tvlVal != null && tvlVal > 0;
      })
      .map((p) => {
        const tvlVal = tvlByName.get(p.name.toLowerCase())!;
        const revenueAnn = p.total24h * 365;
        return {
          name: p.displayName || p.name,
          tvl: tvlVal,
          revenueAnn,
          revenueTvl: revenueAnn / tvlVal,
          category: getCategoryGroup(p.category || "Other"),
          color: getCategoryColor(p.category || "Other"),
          z: 60,
        };
      });
  }, [fees, tvl]);

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
  const tvlVsFeesScatter = useMemo(() => {
    if (!fees?.protocols || !tvl?.allProtocolsTVL) return [];

    const tvlByName = new Map<string, number>();
    for (const p of tvl.allProtocolsTVL) {
      tvlByName.set(p.name.toLowerCase(), p.tvl);
    }

    return fees.protocols
      .filter((p) => {
        const tvlVal = tvlByName.get(p.name.toLowerCase());
        return p.total24h > 0 && tvlVal != null && tvlVal > 0;
      })
      .map((p) => {
        const tvlVal = tvlByName.get(p.name.toLowerCase())!;
        return {
          name: p.displayName || p.name,
          tvl: tvlVal,
          fees24h: p.total24h,
          feesTvl: p.total24h / tvlVal,
          category: getCategoryGroup(p.category || "Other"),
          color: getCategoryColor(p.category || "Other"),
          z: 60,
        };
      });
  }, [fees, tvl]);

  const tvlVsFeesByCategory = useMemo(() => groupByCategory(tvlVsFeesScatter), [tvlVsFeesScatter]);

  // =======================================================================
  // F. Revenue vs FDV Scatter — uses CoinGecko-matched data
  // =======================================================================
  const revVsFdvScatter = useMemo(() => {
    return unifiedTokens
      .filter((p) => p.fdv != null && p.fdv > 0 && p.revenueAnn != null && p.revenueAnn > 0)
      .map((p) => ({
        name: p.name,
        revenueAnn: p.revenueAnn!,
        fdv: p.fdv!,
        psFdv: p.psFdv,
        category: p.categoryGroup,
        color: getCategoryColor(p.category),
        z: 60,
      }));
  }, [unifiedTokens]);

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
            {feeVsRevScatter.length} protocols shown
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
            {revVsTvlScatter.length} protocols shown
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
            {tvlVsFeesScatter.length} protocols shown
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
            {revVsFdvScatter.length} protocols shown (requires CoinGecko token match)
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
    </section>
  );
}
