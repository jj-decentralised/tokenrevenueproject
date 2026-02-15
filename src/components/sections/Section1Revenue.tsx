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
  annualRevenueData,
  quarterlyRevenueData,
  peComparisonData,
  earlyTechPSComparison,
  CHART_COLORS,
} from "@/lib/data";
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
  // ---- Derived metrics ----
  const latest = annualRevenueData[annualRevenueData.length - 1]; // 2025
  const prior = annualRevenueData[annualRevenueData.length - 2]; // 2024

  const yoyGrowth = (
    ((latest.totalRevenue - prior.totalRevenue) / prior.totalRevenue) *
    100
  ).toFixed(0);

  // ---- On-chain vs off-chain stacked data ----
  const onOffChainData = annualRevenueData.map((d) => ({
    year: d.year.toString(),
    "On-chain": d.onChainRevenue,
    "Off-chain": d.offChainRevenue,
    total: d.totalRevenue,
  }));

  // ---- PE comparison data sorted & split ----
  // Exclude the extreme L1 outlier for the main chart; show it separately
  const peDataMain = useMemo(
    () =>
      peComparisonData
        .filter(
          (d) => d.name !== "L1 Blockchains" && d.name !== "Crypto 2021 peak"
        )
        .sort((a, b) => a.pe - b.pe),
    []
  );

  // ---- PS comparison data ----
  // Exclude the extreme L1 outlier for readability
  const psData = useMemo(
    () =>
      earlyTechPSComparison
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

      {/* ---- Stat Cards ---- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Revenue (2025 Ann.)"
          value={formatDollar(latest.totalRevenue)}
          subvalue={latest.quarter}
          change={`+${yoyGrowth}% YoY`}
          changeType="positive"
        />
        <StatCard
          label="Revenue ex-Stablecoins"
          value={formatDollar(latest.revenueExStablecoins)}
          subvalue="Native protocol fees only"
          change={`+${(
            ((latest.revenueExStablecoins - prior.revenueExStablecoins) /
              prior.revenueExStablecoins) *
            100
          ).toFixed(0)}% YoY`}
          changeType="positive"
        />
        <StatCard
          label="YoY Revenue Growth"
          value={`${yoyGrowth}%`}
          subvalue="Total revenue basis"
          change="Accelerating from +155% in 2024"
          changeType="positive"
        />
        <StatCard
          label="Protocols Generating Fees"
          value={latest.protocolsGeneratingFees.toLocaleString()}
          subvalue="Unique fee-generating protocols"
          change={`+${(
            ((latest.protocolsGeneratingFees -
              prior.protocolsGeneratingFees) /
              prior.protocolsGeneratingFees) *
            100
          ).toFixed(0)}% YoY`}
          changeType="positive"
        />
      </div>

      {/* ---- Chart 1: Quarterly Revenue Time Series ---- */}
      <Card>
        <h3 className="text-lg font-semibold text-slate-800 mb-1">
          Quarterly Revenue Time Series
        </h3>
        <p className="text-sm text-slate-500 mb-6">
          Total crypto revenue vs. revenue excluding stablecoin issuers, Q1
          2020 -- Q3 2025
        </p>

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
                <linearGradient id="gradExStable" x1="0" y1="0" x2="0" y2="1">
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

        <DataSource
          sources={[
            "1kx 2025 Onchain Revenue Report",
            "DefiLlama",
            "TokenTerminal",
          ]}
        />
      </Card>

      {/* ---- Chart 2: On-chain vs Off-chain Revenue ---- */}
      <Card>
        <h3 className="text-lg font-semibold text-slate-800 mb-1">
          On-chain vs Off-chain Revenue by Year
        </h3>
        <p className="text-sm text-slate-500 mb-6">
          Stacked breakdown of where crypto revenue is generated. Off-chain
          (stablecoin interest, CEX fees) now dominates.
        </p>

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

        <DataSource
          sources={[
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
        <h3 className="text-lg font-semibold text-slate-800 mb-1">
          Implied P/E Ratio Comparison
        </h3>
        <p className="text-sm text-slate-500 mb-6">
          Crypto implied P/E (market cap / annualized revenue) vs. global equity
          indices. DeFi protocols trade at comparable multiples to TradFi; the
          aggregate crypto P/E is inflated by L1 blockchains (7,300x -- shown
          separately).
        </p>

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
                    fill={PE_CATEGORY_COLORS[entry.category] || CHART_COLORS.muted}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

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
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS.primary }} />
            Crypto
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS.quaternary }} />
            Developed Markets
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS.accent }} />
            Emerging Markets
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS.secondary }} />
            Historical Tech Peaks
          </span>
        </div>

        <DataSource
          sources={[
            "CoinGecko",
            "WorldPERatio",
            "S&P Global",
            "1kx",
            "BVP Cloud Index",
          ]}
        />
      </Card>

      {/* ---- Chart 4: P/S Comparison vs Early-Stage Tech ---- */}
      <Card>
        <h3 className="text-lg font-semibold text-slate-800 mb-1">
          Implied P/S vs Early-Stage Tech Eras
        </h3>
        <p className="text-sm text-slate-500 mb-6">
          How does crypto&apos;s current valuation compare to other nascent tech
          sectors at similar stages? Crypto DeFi (17x P/S) trades closer to
          mature SaaS than to dot-com-era or 2020-21 peak valuations.
        </p>

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

        {/* Callout for L1 outlier */}
        <div className="mt-4 flex items-start gap-3 bg-slate-50 rounded-lg p-4">
          <div className="flex-shrink-0 mt-0.5 w-3 h-3 rounded-full bg-blue-500" />
          <div className="text-sm text-slate-700">
            <span className="font-semibold">Crypto L1s (2025): 7,300x P/S</span>{" "}
            -- excluded from chart for readability. L1 valuations reflect
            monetary premium and ecosystem potential rather than current fee
            generation.
          </div>
        </div>

        {/* Legend for PS categories */}
        <div className="flex flex-wrap gap-4 mt-4 text-xs text-slate-600">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS.muted }} />
            Historical Tech (Dot-com)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS.secondary }} />
            2020-21 Tech Peak
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS.primary }} />
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
