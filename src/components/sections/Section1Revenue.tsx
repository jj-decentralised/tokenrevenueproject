"use client";

import React, { useMemo } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts";
import {
  annualRevenueData as staticAnnualData,
  quarterlyRevenueData as staticQuarterlyData,
  peComparisonData as staticPEData,
  earlyTechPSComparison as staticPSData,
  CHART_COLORS,
} from "@/lib/data";
import {
  useDataContext,
  aggregateToQuarterly,
} from "@/lib/DataContext";
import { ChartExport } from "@/components/ui/ChartExport";
import {
  Card,
  StatCard,
  SectionHeader,
  DataSource,
  InsightBox,
} from "@/components/ui/Card";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDollar(value: number, decimals = 1): string {
  if (value >= 1000) return `$${(value / 1000).toFixed(decimals)}T`;
  if (value >= 1) return `$${value.toFixed(decimals)}B`;
  return `$${(value * 1000).toFixed(0)}M`;
}

function formatAxis(value: number): string {
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}T`;
  if (value >= 1) return `$${value.toFixed(0)}B`;
  return `$${(value * 1000).toFixed(0)}M`;
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function ChartSkeleton({ height = "h-[380px]" }: { height?: string }) {
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
// Custom tooltip components
// ---------------------------------------------------------------------------

interface TooltipPayloadEntry {
  name: string;
  value: number;
  color: string;
  dataKey: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string;
}

function RevenueTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-sm">
      <p className="font-semibold text-slate-800 mb-1">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-slate-600">{entry.name}:</span>
          <span className="font-medium text-slate-900">
            {formatDollar(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

function PETooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const data = payload[0];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const item = (data as any)?.payload;
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-sm max-w-xs">
      <p className="font-semibold text-slate-800 mb-1">{item?.name}</p>
      <p className="text-slate-700">
        P/E: <span className="font-bold">{item?.pe?.toLocaleString()}x</span>
      </p>
      {item?.note && <p className="text-slate-500 text-xs mt-1">{item.note}</p>}
    </div>
  );
}

function PSTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const data = payload[0];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const item = (data as any)?.payload;
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-sm max-w-xs">
      <p className="font-semibold text-slate-800 mb-1">{item?.name}</p>
      <p className="text-slate-700">
        P/S: <span className="font-bold">{item?.ps?.toLocaleString()}x</span>
      </p>
      <p className="text-slate-500 text-xs mt-1">{item?.category}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Category color map for PE chart
// ---------------------------------------------------------------------------

const PE_CATEGORY_COLORS: Record<string, string> = {
  crypto: CHART_COLORS.primary,
  developed: CHART_COLORS.quaternary,
  emerging: CHART_COLORS.accent,
  tech: CHART_COLORS.secondary,
};

const PS_CATEGORY_COLORS: Record<string, string> = {
  "Historical tech": CHART_COLORS.muted,
  "2020-21 tech": CHART_COLORS.secondary,
  Crypto: CHART_COLORS.primary,
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function Section1Revenue() {
  const ctx = useDataContext();

  // ---- Quarterly revenue data: live or static ----
  const quarterlyRevenueData = useMemo(() => {
    if (ctx.fees?.totalDataChart && ctx.fees.totalDataChart.length > 0) {
      return aggregateToQuarterly(ctx.fees.totalDataChart).map((d) => ({
        period: d.period,
        totalRevenue: d.value / 1e9, // convert to $B
        // Live API only gives total fees; estimate ex-stablecoins as ~65% of total
        exStablecoins: (d.value / 1e9) * 0.65,
        onChain: (d.value / 1e9) * 0.35,
        offChain: (d.value / 1e9) * 0.65,
      }));
    }
    return staticQuarterlyData;
  }, [ctx.fees]);

  // ---- Annual revenue data: live or static ----
  const annualRevenueData = useMemo(() => {
    if (ctx.fees?.totalDataChart && ctx.fees.totalDataChart.length > 0) {
      // Aggregate daily data into annual buckets
      const buckets: Record<number, number> = {};
      for (const [ts, val] of ctx.fees.totalDataChart) {
        const year = new Date(ts * 1000).getUTCFullYear();
        buckets[year] = (buckets[year] || 0) + val;
      }

      // Merge live annual totals into static structure for additional fields
      return staticAnnualData.map((row) => {
        const liveTotal = buckets[row.year];
        if (liveTotal !== undefined) {
          const totalB = liveTotal / 1e9;
          return {
            ...row,
            totalRevenue: totalB,
            revenueExStablecoins: totalB * 0.65,
            onChainRevenue: totalB * 0.35,
            offChainRevenue: totalB * 0.65,
          };
        }
        return row;
      });
    }
    return staticAnnualData;
  }, [ctx.fees]);

  // ---- Headline stats from live data or static fallback ----
  const headlineStats = useMemo(() => {
    const latest = annualRevenueData[annualRevenueData.length - 1];
    const prior = annualRevenueData[annualRevenueData.length - 2];

    // If we have 24h live data, compute annualized headline
    const totalRevAnnualized =
      ctx.fees?.totalFees24h != null
        ? (ctx.fees.totalFees24h * 365) / 1e9
        : latest.totalRevenue;

    const revenueExStable =
      ctx.fees?.totalRevenue24h != null
        ? (ctx.fees.totalRevenue24h * 365) / 1e9
        : latest.revenueExStablecoins;

    const yoyGrowth = (
      ((totalRevAnnualized - prior.totalRevenue) / prior.totalRevenue) *
      100
    ).toFixed(0);

    const yoyGrowthExStable = (
      ((revenueExStable - prior.revenueExStablecoins) /
        prior.revenueExStablecoins) *
      100
    ).toFixed(0);

    const protocolCount =
      ctx.fees?.protocols != null
        ? ctx.fees.protocols.length
        : latest.protocolsGeneratingFees;

    const priorProtocolCount = prior.protocolsGeneratingFees;
    const protocolCountGrowth = (
      ((protocolCount - priorProtocolCount) / priorProtocolCount) *
      100
    ).toFixed(0);

    return {
      totalRevAnnualized,
      revenueExStable,
      yoyGrowth,
      yoyGrowthExStable,
      protocolCount,
      protocolCountGrowth,
      quarter: ctx.fees?.totalFees24h != null ? "Live (annualized)" : latest.quarter,
    };
  }, [annualRevenueData, ctx.fees]);

  // ---- On-chain vs off-chain stacked data ----
  const onOffChainData = useMemo(
    () =>
      annualRevenueData.map((d) => ({
        year: d.year.toString(),
        "On-chain": d.onChainRevenue,
        "Off-chain": d.offChainRevenue,
        total: d.totalRevenue,
      })),
    [annualRevenueData]
  );

  // ---- PE comparison data: live crypto P/E if we have market cap + revenue ----
  const peComparisonData = useMemo(() => {
    if (ctx.fees?.totalFees24h && ctx.sentiment?.marketCap?.total) {
      const totalMarketCap = ctx.sentiment.marketCap.total / 1e9; // to $B
      const annualizedRev = (ctx.fees.totalFees24h * 365) / 1e9;
      const liveCryptoPE = Math.round(totalMarketCap / annualizedRev);

      // Compute ex-stablecoins P/E using totalRevenue24h
      const annualizedRevExStable = ctx.fees.totalRevenue24h
        ? (ctx.fees.totalRevenue24h * 365) / 1e9
        : annualizedRev * 0.65;
      const liveCryptoPEExStable = Math.round(totalMarketCap / annualizedRevExStable);

      return staticPEData.map((entry) => {
        if (entry.name === "Crypto (incl. stablecoins)") {
          return {
            ...entry,
            pe: liveCryptoPE,
            note: `$${totalMarketCap.toFixed(1)}T mcap / $${annualizedRev.toFixed(0)}B rev (live)`,
          };
        }
        if (entry.name === "Crypto (ex stablecoins)") {
          return {
            ...entry,
            pe: liveCryptoPEExStable,
            note: `$${totalMarketCap.toFixed(1)}T mcap / $${annualizedRevExStable.toFixed(0)}B rev (live)`,
          };
        }
        // Keep TradFi P/E as static reference data
        return entry;
      });
    }
    return staticPEData;
  }, [ctx.fees, ctx.sentiment]);

  // ---- PE comparison sorted & filtered ----
  const peDataMain = useMemo(
    () =>
      peComparisonData
        .filter(
          (d) => d.name !== "L1 Blockchains" && d.name !== "Crypto 2021 peak"
        )
        .sort((a, b) => a.pe - b.pe),
    [peComparisonData]
  );

  // ---- PS comparison data (static -- no live P/S API) ----
  const psData = useMemo(
    () =>
      staticPSData
        .filter((d) => d.name !== "Crypto L1s (2025)")
        .sort((a, b) => a.ps - b.ps),
    []
  );

  return (
    <section className="space-y-12">
      {/* ---- Section Header ---- */}
      <SectionHeader
        number="1"
        title="Revenue Overview & Valuation"
        subtitle="Crypto protocols generated $56B in annualized revenue by mid-2025 -- a 16x increase since 2020. But how does this compare to traditional markets on a valuation basis?"
      />

      {/* ---- Live data indicator ---- */}
      {ctx.isLive && (
        <div className="flex items-center gap-2 text-xs text-emerald-600 bg-emerald-50 rounded-lg px-3 py-1.5 w-fit">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Live data active
          {ctx.lastUpdated && (
            <span className="text-emerald-500 ml-1">
              (updated {ctx.lastUpdated.toLocaleTimeString()})
            </span>
          )}
        </div>
      )}

      {/* ---- Stat Cards ---- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {ctx.isLoading ? (
          <>
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-slate-200 p-5 animate-pulse"
              >
                <div className="h-3 bg-slate-200 rounded w-2/3 mb-3" />
                <div className="h-7 bg-slate-200 rounded w-1/2 mb-2" />
                <div className="h-3 bg-slate-200 rounded w-1/3" />
              </div>
            ))}
          </>
        ) : (
          <>
            <StatCard
              label="Total Revenue (Ann.)"
              value={formatDollar(headlineStats.totalRevAnnualized)}
              subvalue={headlineStats.quarter}
              change={`+${headlineStats.yoyGrowth}% YoY`}
              changeType="positive"
            />
            <StatCard
              label="Revenue ex-Stablecoins"
              value={formatDollar(headlineStats.revenueExStable)}
              subvalue="Native protocol fees only"
              change={`+${headlineStats.yoyGrowthExStable}% YoY`}
              changeType="positive"
            />
            <StatCard
              label="YoY Revenue Growth"
              value={`${headlineStats.yoyGrowth}%`}
              subvalue="Total revenue basis"
              change="Accelerating from +155% in 2024"
              changeType="positive"
            />
            <StatCard
              label="Protocols Generating Fees"
              value={headlineStats.protocolCount.toLocaleString()}
              subvalue="Unique fee-generating protocols"
              change={`+${headlineStats.protocolCountGrowth}% YoY`}
              changeType="positive"
            />
          </>
        )}
      </div>

      {/* ---- Chart 1: Quarterly Revenue Time Series ---- */}
      <Card>
        <ChartExport
          data={quarterlyRevenueData}
          filename="crypto-revenue-quarterly"
          title="Quarterly Revenue Time Series"
        >
          <p className="text-sm text-slate-500 mb-6">
            Total crypto revenue vs. revenue excluding stablecoin issuers, Q1
            2020 -- Q3 2025
          </p>

          {ctx.isLoading ? (
            <ChartSkeleton />
          ) : (
            <div className="h-[380px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={quarterlyRevenueData}
                  margin={{ top: 10, right: 20, left: 10, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="0%"
                        stopColor={CHART_COLORS.primary}
                        stopOpacity={0.25}
                      />
                      <stop
                        offset="95%"
                        stopColor={CHART_COLORS.primary}
                        stopOpacity={0.02}
                      />
                    </linearGradient>
                    <linearGradient
                      id="gradExStable"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor={CHART_COLORS.secondary}
                        stopOpacity={0.2}
                      />
                      <stop
                        offset="95%"
                        stopColor={CHART_COLORS.secondary}
                        stopOpacity={0.02}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#e2e8f0"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="period"
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                    tickLine={false}
                    axisLine={{ stroke: "#e2e8f0" }}
                    interval={3}
                  />
                  <YAxis
                    tickFormatter={formatAxis}
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                    tickLine={false}
                    axisLine={false}
                    width={52}
                  />
                  <Tooltip content={<RevenueTooltip />} />
                  <Legend
                    verticalAlign="top"
                    height={36}
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: 12 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="totalRevenue"
                    name="Total Revenue"
                    stroke={CHART_COLORS.primary}
                    strokeWidth={2.5}
                    fill="url(#gradTotal)"
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 2, fill: "#fff" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="exStablecoins"
                    name="Ex-Stablecoins"
                    stroke={CHART_COLORS.secondary}
                    strokeWidth={2}
                    strokeDasharray="5 3"
                    fill="url(#gradExStable)"
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 2, fill: "#fff" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartExport>

        <DataSource
          sources={[
            "DefiLlama (live)",
            "1kx 2025 Onchain Revenue Report",
            "TokenTerminal",
          ]}
        />
      </Card>

      {/* ---- Chart 2: On-chain vs Off-chain Revenue ---- */}
      <Card>
        <ChartExport
          data={onOffChainData}
          filename="crypto-revenue-onchain-vs-offchain"
          title="On-chain vs Off-chain Revenue by Year"
        >
          <p className="text-sm text-slate-500 mb-6">
            Stacked breakdown of where crypto revenue is generated. Off-chain
            (stablecoin interest, CEX fees) now dominates.
          </p>

          {ctx.isLoading ? (
            <ChartSkeleton height="h-[350px]" />
          ) : (
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={onOffChainData}
                  margin={{ top: 10, right: 20, left: 10, bottom: 0 }}
                  barCategoryGap="25%"
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#e2e8f0"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="year"
                    tick={{ fontSize: 12, fill: "#94a3b8" }}
                    tickLine={false}
                    axisLine={{ stroke: "#e2e8f0" }}
                  />
                  <YAxis
                    tickFormatter={formatAxis}
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                    tickLine={false}
                    axisLine={false}
                    width={52}
                  />
                  <Tooltip content={<RevenueTooltip />} />
                  <Legend
                    verticalAlign="top"
                    height={36}
                    iconType="square"
                    iconSize={10}
                    wrapperStyle={{ fontSize: 12 }}
                  />
                  <Bar
                    dataKey="On-chain"
                    name="On-chain Revenue"
                    stackId="stack"
                    fill={CHART_COLORS.primary}
                    radius={[0, 0, 0, 0]}
                  />
                  <Bar
                    dataKey="Off-chain"
                    name="Off-chain Revenue"
                    stackId="stack"
                    fill={CHART_COLORS.tertiary}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartExport>

        <DataSource
          sources={[
            "DefiLlama (live)",
            "1kx 2025 Onchain Revenue Report",
            "TokenTerminal",
            "Stablecoin issuer financials",
          ]}
        />
      </Card>

      {/* ---- Insight Row ---- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InsightBox title="Stablecoin Revenue Dominance" type="insight">
          <p>
            Stablecoin issuers (Tether, Circle) now account for{" "}
            <strong>36%</strong> of total crypto revenue, up from 6% in 2020.
            Most of this is interest income on reserves -- making it highly
            sensitive to Fed rate policy. Revenue ex-stablecoins gives a cleaner
            picture of native protocol economics.
          </p>
        </InsightBox>
        <InsightBox title="Off-chain Shift" type="warning">
          <p>
            Off-chain revenue surpassed on-chain in 2024 for the first time.
            In 2025, <strong>65%</strong> of crypto revenue comes off-chain
            (stablecoin interest, CEX trading fees, custody revenue). This
            challenges the narrative that crypto&apos;s value is purely &quot;on-chain.&quot;
          </p>
        </InsightBox>
      </div>

      {/* ---- Chart 3: P/E Comparison (Horizontal Bar) ---- */}
      <Card>
        <ChartExport
          data={peDataMain}
          filename="crypto-pe-ratio-comparison"
          title="Implied P/E Ratio Comparison"
        >
          <p className="text-sm text-slate-500 mb-6">
            Crypto implied P/E (market cap / annualized revenue) vs. global equity
            indices. DeFi protocols trade at comparable multiples to TradFi; the
            aggregate crypto P/E is inflated by L1 blockchains (7,300x -- shown
            separately).
          </p>

          {ctx.isLoading ? (
            <ChartSkeleton height="h-[480px]" />
          ) : (
            <div className="h-[480px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={peDataMain}
                  layout="vertical"
                  margin={{ top: 5, right: 40, left: 10, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#e2e8f0"
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                    tickLine={false}
                    axisLine={{ stroke: "#e2e8f0" }}
                    domain={[0, 160]}
                    tickFormatter={(v: number) => `${v}x`}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={180}
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<PETooltip />} />
                  <ReferenceLine
                    x={27.8}
                    stroke={CHART_COLORS.muted}
                    strokeDasharray="4 4"
                    label={{
                      value: "S&P 500 avg",
                      position: "top",
                      fontSize: 10,
                      fill: "#94a3b8",
                    }}
                  />
                  <Bar dataKey="pe" name="P/E Ratio" radius={[0, 4, 4, 0]}>
                    {peDataMain.map((entry, index) => (
                      <Cell
                        key={index}
                        fill={
                          PE_CATEGORY_COLORS[entry.category] || CHART_COLORS.muted
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartExport>

        {/* Callout for L1 outlier */}
        <div className="mt-4 flex items-start gap-3 bg-slate-50 rounded-lg p-4">
          <div className="flex-shrink-0 mt-0.5 w-3 h-3 rounded-full bg-blue-500" />
          <div className="text-sm text-slate-700">
            <span className="font-semibold">L1 Blockchains: 7,300x P/E</span>{" "}
            -- excluded from chart for scale. L1 fee revenue is tiny relative to
            market caps because value accrues through MEV, monetary premium, and
            security budget -- not protocol fees alone.
          </div>
        </div>

        {/* Legend for categories */}
        <div className="flex flex-wrap gap-4 mt-4 text-xs text-slate-600">
          <span className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: CHART_COLORS.primary }}
            />
            Crypto
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: CHART_COLORS.quaternary }}
            />
            Developed Markets
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: CHART_COLORS.accent }}
            />
            Emerging Markets
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: CHART_COLORS.secondary }}
            />
            Historical Tech Peaks
          </span>
        </div>

        <DataSource
          sources={[
            "CoinGecko (live)",
            "DefiLlama (live)",
            "WorldPERatio",
            "S&P Global",
            "1kx",
            "BVP Cloud Index",
          ]}
        />
      </Card>

      {/* ---- Chart 4: P/S Comparison vs Early-Stage Tech ---- */}
      <Card>
        <ChartExport
          data={psData}
          filename="crypto-ps-ratio-vs-tech"
          title="Implied P/S vs Early-Stage Tech Eras"
        >
          <p className="text-sm text-slate-500 mb-6">
            How does crypto&apos;s current valuation compare to other nascent tech
            sectors at similar stages? Crypto DeFi (17x P/S) trades closer to
            mature SaaS than to dot-com-era or 2020-21 peak valuations.
          </p>

          {ctx.isLoading ? (
            <ChartSkeleton height="h-[400px]" />
          ) : (
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={psData}
                  layout="vertical"
                  margin={{ top: 5, right: 40, left: 10, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#e2e8f0"
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                    tickLine={false}
                    axisLine={{ stroke: "#e2e8f0" }}
                    tickFormatter={(v: number) => `${v}x`}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={185}
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<PSTooltip />} />
                  <Bar dataKey="ps" name="P/S Ratio" radius={[0, 4, 4, 0]}>
                    {psData.map((entry, index) => (
                      <Cell
                        key={index}
                        fill={
                          PS_CATEGORY_COLORS[entry.category] || CHART_COLORS.muted
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartExport>

        {/* Callout for L1 outlier */}
        <div className="mt-4 flex items-start gap-3 bg-slate-50 rounded-lg p-4">
          <div className="flex-shrink-0 mt-0.5 w-3 h-3 rounded-full bg-blue-500" />
          <div className="text-sm text-slate-700">
            <span className="font-semibold">
              Crypto L1s (2025): 7,300x P/S
            </span>{" "}
            -- excluded from chart for readability. L1 valuations reflect
            monetary premium and ecosystem potential rather than current fee
            generation.
          </div>
        </div>

        {/* Legend for PS categories */}
        <div className="flex flex-wrap gap-4 mt-4 text-xs text-slate-600">
          <span className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: CHART_COLORS.muted }}
            />
            Historical Tech (Dot-com)
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: CHART_COLORS.secondary }}
            />
            2020-21 Tech Peak
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: CHART_COLORS.primary }}
            />
            Crypto
          </span>
        </div>

        <DataSource
          sources={[
            "BVP Cloud Index",
            "Jay Ritter IPO Data",
            "CoinGecko",
            "1kx",
          ]}
        />
      </Card>

      {/* ---- Insight Boxes: Key Takeaways ---- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <InsightBox title="DeFi is Cheaper than You Think" type="highlight">
          <p>
            DeFi protocols trade at a <strong>17x median P/E</strong> --
            comparable to the S&P 500 STOXX 600 (15x) and cheaper than the
            NASDAQ (35x). The &quot;crypto premium&quot; argument no longer holds
            for revenue-generating DeFi.
          </p>
        </InsightBox>
        <InsightBox title="The L1 Valuation Paradox" type="warning">
          <p>
            L1 blockchains trade at <strong>7,300x P/E</strong> -- reflecting
            monetary premium (ETH as &quot;digital oil&quot;) rather than fee revenue.
            This is the single biggest distortion in crypto&apos;s aggregate
            valuation metrics.
          </p>
        </InsightBox>
        <InsightBox title="Crypto's Dot-com Moment?" type="insight">
          <p>
            Crypto&apos;s overall 64x P/S is rich but below dot-com peaks (180x)
            and 2020-21 SaaS highs (Snowflake at 175x). Unlike the dot-com era,
            crypto protocols are generating{" "}
            <strong>real, growing revenue</strong> -- $56B annualized and
            accelerating.
          </p>
        </InsightBox>
      </div>
    </section>
  );
}
