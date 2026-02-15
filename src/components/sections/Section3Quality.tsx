"use client";

import React, { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
  ComposedChart,
  Line,
  TooltipProps,
} from "recharts";
import {
  sectorBreakdownTimeSeries,
  h1_2025_sectorBreakdown,
  exchangeRevenueHistory,
  stablecoinRevenueBreakdown,
  consumerCryptoApps,
  consumerCryptoInsights,
  SECTOR_COLORS,
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

const SECTOR_LABELS: Record<string, string> = {
  defi: "DeFi",
  exchanges: "Exchanges",
  stablecoins: "Stablecoins",
  blockchains: "Blockchains",
  consumer: "Consumer",
  wallets: "Wallets",
  depin: "DePIN",
  other: "Other",
};

const SECTOR_KEYS = Object.keys(SECTOR_LABELS);

function formatBillions(v: number) {
  return `$${v.toFixed(1)}B`;
}

function formatMillions(v: number) {
  if (v >= 1000) return `$${(v / 1000).toFixed(1)}B`;
  return `$${v.toFixed(0)}M`;
}

function pctChange(peak: number, current: number) {
  if (peak === 0) return 0;
  return Math.round(((current - peak) / peak) * 100);
}

// ---------------------------------------------------------------------------
// Custom Tooltips
// ---------------------------------------------------------------------------

function SectorAreaTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload || payload.length === 0) return null;
  const total = payload.reduce((s, p) => s + (Number(p.value) || 0), 0);
  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-100 p-4 text-sm min-w-[180px]">
      <p className="font-bold text-slate-900 mb-2">{label}</p>
      {payload
        .slice()
        .reverse()
        .map((entry) => (
          <div key={entry.dataKey} className="flex justify-between gap-4 py-0.5">
            <span className="flex items-center gap-1.5">
              <span
                className="inline-block w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              {SECTOR_LABELS[entry.dataKey as string] ?? entry.dataKey}
            </span>
            <span className="font-medium text-slate-700">
              {formatBillions(Number(entry.value))}
            </span>
          </div>
        ))}
      <div className="border-t border-slate-100 mt-1.5 pt-1.5 flex justify-between font-semibold text-slate-900">
        <span>Total</span>
        <span>{formatBillions(total)}</span>
      </div>
    </div>
  );
}

function ExchangeTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload || payload.length === 0) return null;
  const dataPoint = payload[0]?.payload;
  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-100 p-4 text-sm min-w-[170px]">
      <p className="font-bold text-slate-900 mb-2">{label}</p>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="flex justify-between gap-4 py-0.5">
          <span className="flex items-center gap-1.5">
            <span
              className="inline-block w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            {entry.dataKey === "cex" ? "CEX" : "DEX"}
          </span>
          <span className="font-medium text-slate-700">
            {formatBillions(Number(entry.value))}
          </span>
        </div>
      ))}
      {dataPoint?.cexDominance != null && (
        <p className="text-xs text-slate-400 mt-1.5 pt-1.5 border-t border-slate-100">
          CEX dominance: {dataPoint.cexDominance}%
        </p>
      )}
    </div>
  );
}

function StablecoinTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-100 p-4 text-sm min-w-[200px]">
      <p className="font-bold text-slate-900 mb-2">{label}</p>
      {payload.map((entry) => {
        const nameMap: Record<string, string> = {
          interestIncome: "Interest Income",
          transactionFees: "Transaction Fees",
          other: "Other Revenue",
          fedRate: "Fed Funds Rate",
        };
        const isFed = entry.dataKey === "fedRate";
        return (
          <div key={entry.dataKey} className="flex justify-between gap-4 py-0.5">
            <span className="flex items-center gap-1.5">
              <span
                className="inline-block w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              {nameMap[entry.dataKey as string] ?? entry.dataKey}
            </span>
            <span className="font-medium text-slate-700">
              {isFed ? `${Number(entry.value).toFixed(2)}%` : formatBillions(Number(entry.value))}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// Custom label for the pie chart
function PieLabel({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
  sector,
}: {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  percent: number;
  sector: string;
}) {
  const RADIAN = Math.PI / 180;
  const radius = outerRadius + 28;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  if (percent < 0.03) return null;
  return (
    <text
      x={x}
      y={y}
      fill="#334155"
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
      className="text-xs font-medium"
    >
      {sector} {(percent * 100).toFixed(0)}%
    </text>
  );
}

// ---------------------------------------------------------------------------
// Status badge for consumer apps
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Dead: "bg-red-100 text-red-700",
    Declining: "bg-amber-100 text-amber-700",
    Struggling: "bg-orange-100 text-orange-700",
    Niche: "bg-blue-100 text-blue-700",
    Early: "bg-slate-100 text-slate-600",
  };
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
        styles[status] ?? "bg-slate-100 text-slate-600"
      }`}
    >
      {status}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function Section3Quality() {
  // Prepare area chart data with string year label
  const areaData = useMemo(
    () =>
      sectorBreakdownTimeSeries.map((d) => ({
        ...d,
        name: d.year.toString(),
      })),
    []
  );

  // Pie chart data
  const pieData = useMemo(
    () =>
      h1_2025_sectorBreakdown.map((d) => ({
        ...d,
        name: d.sector,
      })),
    []
  );

  // Exchange chart data
  const exchangeData = useMemo(
    () =>
      exchangeRevenueHistory.map((d) => ({
        ...d,
        name: d.year.toString(),
      })),
    []
  );

  // Stablecoin + rate data
  const stablecoinData = useMemo(
    () =>
      stablecoinRevenueBreakdown.map((d) => ({
        ...d,
        name: d.year.toString(),
      })),
    []
  );

  // Interest income dependency percentage
  const latestStablecoin = stablecoinRevenueBreakdown[stablecoinRevenueBreakdown.length - 1];
  const interestPct = Math.round(
    (latestStablecoin.interestIncome / latestStablecoin.total) * 100
  );

  return (
    <section className="py-16 px-4">
      <div className="max-w-6xl mx-auto">
        {/* ---------------------------------------------------------------- */}
        {/* Header                                                           */}
        {/* ---------------------------------------------------------------- */}
        <SectionHeader
          number="3"
          title="Revenue Quality"
          subtitle="Not all crypto revenue is created equal. Sector composition has shifted dramatically since 2020 — exchanges gave way to stablecoins, DeFi matured, and consumer crypto remains the laggard."
        />

        {/* ---------------------------------------------------------------- */}
        {/* Key Metrics Row                                                  */}
        {/* ---------------------------------------------------------------- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          <StatCard
            label="Stablecoin Share"
            value="40%"
            subvalue="of total crypto revenue"
            change="Up from 6% in 2020"
            changeType="positive"
          />
          <StatCard
            label="Interest Dependency"
            value={`${interestPct}%`}
            subvalue="of stablecoin rev from T-bills"
            change="Risk: rate cuts erode revenue"
            changeType="negative"
          />
          <StatCard
            label="DEX vs CEX"
            value="55% DEX"
            subvalue="DEX share of exchange rev"
            change="DEXs overtook CEXs in 2025"
            changeType="positive"
          />
          <StatCard
            label="Consumer Share"
            value="6%"
            subvalue="of onchain revenue (H1 2025)"
            change="-20% YoY growth"
            changeType="negative"
          />
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* 1. Stacked Area — Sector Revenue Over Time                       */}
        {/* ---------------------------------------------------------------- */}
        <Card className="mb-10">
          <h3 className="text-lg font-bold text-slate-900 mb-1">
            Sector Revenue Composition (2020 - 2025)
          </h3>
          <p className="text-sm text-slate-500 mb-6">
            Exchanges dominated in 2020-21. Stablecoins took over in the bear market. DeFi surged again in 2024-25.
          </p>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={areaData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12, fill: "#64748b" }}
                  axisLine={{ stroke: "#e2e8f0" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "#64748b" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => `$${v}B`}
                />
                <Tooltip content={<SectorAreaTooltip />} />
                {SECTOR_KEYS.map((key) => (
                  <Area
                    key={key}
                    type="monotone"
                    dataKey={key}
                    stackId="1"
                    stroke={SECTOR_COLORS[key]}
                    fill={SECTOR_COLORS[key]}
                    fillOpacity={0.75}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 mt-4 justify-center">
            {SECTOR_KEYS.map((key) => (
              <div key={key} className="flex items-center gap-1.5 text-xs text-slate-600">
                <span
                  className="inline-block w-3 h-3 rounded-sm"
                  style={{ backgroundColor: SECTOR_COLORS[key] }}
                />
                {SECTOR_LABELS[key]}
              </div>
            ))}
          </div>

          <DataSource sources={["1kx 2025 Onchain Revenue Report", "DefiLlama", "TokenTerminal"]} />
        </Card>

        {/* ---------------------------------------------------------------- */}
        {/* 2. Pie / Donut — H1 2025 Sector Breakdown                       */}
        {/* ---------------------------------------------------------------- */}
        <Card className="mb-10">
          <h3 className="text-lg font-bold text-slate-900 mb-1">
            H1 2025 Onchain Revenue Breakdown
          </h3>
          <p className="text-sm text-slate-500 mb-6">
            $9.7B in onchain fees. DeFi/Finance dominates at 63%, while Consumer
            contributes just 6%.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Donut chart */}
            <div className="h-[340px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={120}
                    paddingAngle={2}
                    dataKey="value"
                    label={({
                      cx,
                      cy,
                      midAngle,
                      innerRadius,
                      outerRadius,
                      percent,
                      index,
                    }) => (
                      <PieLabel
                        cx={cx}
                        cy={cy}
                        midAngle={midAngle}
                        innerRadius={innerRadius}
                        outerRadius={outerRadius}
                        percent={percent}
                        sector={pieData[index].sector}
                      />
                    )}
                  >
                    {pieData.map((entry, idx) => (
                      <Cell
                        key={`cell-${idx}`}
                        fill={entry.color}
                        stroke="white"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      `$${value.toFixed(2)}B`,
                      name,
                    ]}
                    contentStyle={{
                      borderRadius: "12px",
                      border: "1px solid #f1f5f9",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Sector detail cards */}
            <div className="space-y-3">
              {h1_2025_sectorBreakdown.map((s) => (
                <div
                  key={s.sector}
                  className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: s.color }}
                    />
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        {s.sector}
                      </p>
                      <p className="text-xs text-slate-400">
                        ${s.value.toFixed(2)}B &middot; {s.share}% share
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-sm font-bold ${
                      s.yoyGrowth >= 0 ? "text-emerald-600" : "text-red-500"
                    }`}
                  >
                    {s.yoyGrowth >= 0 ? "+" : ""}
                    {s.yoyGrowth}% YoY
                  </span>
                </div>
              ))}
            </div>
          </div>

          <DataSource sources={["1kx 2025 Onchain Revenue Report (H1 2025)"]} />
        </Card>

        {/* ---------------------------------------------------------------- */}
        {/* 3. Exchange Deep-Dive — CEX vs DEX                               */}
        {/* ---------------------------------------------------------------- */}
        <Card className="mb-10">
          <h3 className="text-lg font-bold text-slate-900 mb-1">
            Exchange Revenue: The DEX Flip
          </h3>
          <p className="text-sm text-slate-500 mb-6">
            CEXs commanded 86% of exchange revenue in 2020. By 2025, DEXs have
            overtaken them for the first time, capturing 55% of the total.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Bar chart */}
            <div className="lg:col-span-2 h-[360px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={exchangeData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12, fill: "#64748b" }}
                    axisLine={{ stroke: "#e2e8f0" }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: "#64748b" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v: number) => `$${v}B`}
                  />
                  <Tooltip content={<ExchangeTooltip />} />
                  <Legend
                    formatter={(value: string) =>
                      value === "cex" ? "CEX Revenue" : "DEX Revenue"
                    }
                    iconType="square"
                    wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                  />
                  <Bar
                    dataKey="cex"
                    fill="#8b5cf6"
                    radius={[4, 4, 0, 0]}
                    name="cex"
                  />
                  <Bar
                    dataKey="dex"
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                    name="dex"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* CEX dominance trend */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
                CEX Dominance Trend
              </h4>
              {exchangeRevenueHistory.map((d) => (
                <div key={d.year} className="flex items-center gap-3">
                  <span className="text-xs text-slate-500 w-10">{d.year}</span>
                  <div className="flex-1 bg-slate-100 rounded-full h-4 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${d.cexDominance}%`,
                        backgroundColor:
                          d.cexDominance > 50 ? "#8b5cf6" : "#3b82f6",
                      }}
                    />
                  </div>
                  <span
                    className={`text-xs font-bold w-10 text-right ${
                      d.cexDominance > 50 ? "text-purple-600" : "text-blue-600"
                    }`}
                  >
                    {d.cexDominance}%
                  </span>
                </div>
              ))}
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Declining CEX share reflects the maturation of on-chain
                infrastructure. Hyperliquid, Jupiter, and Raydium now offer
                comparable UX with self-custody benefits.
              </p>
            </div>
          </div>

          <DataSource
            sources={[
              "DefiLlama",
              "TokenTerminal",
              "Exchange financial disclosures",
            ]}
          />
        </Card>

        {/* ---------------------------------------------------------------- */}
        {/* 4. Consumer Crypto Failure Analysis                              */}
        {/* ---------------------------------------------------------------- */}
        <Card className="mb-10">
          <h3 className="text-lg font-bold text-slate-900 mb-1">
            Consumer Crypto: The Graveyard
          </h3>
          <p className="text-sm text-slate-500 mb-6">
            Consumer crypto apps contributed just 6% of H1 2025 onchain fees.
            Most launched with hype, peaked fast, then collapsed. Here is the
            damage report.
          </p>

          {/* App failure cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {consumerCryptoApps.map((app) => {
              const decline = pctChange(
                app.peakQuarterlyRev,
                app.currentQuarterlyRev
              );
              return (
                <div
                  key={app.name}
                  className="rounded-xl border border-slate-100 p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-bold text-slate-900 text-sm">
                      {app.name}
                    </h4>
                    <StatusBadge status={app.status} />
                  </div>
                  <p className="text-xs text-slate-400 mb-3">{app.category}</p>

                  {/* Revenue bar comparison */}
                  <div className="space-y-2 mb-3">
                    <div>
                      <div className="flex justify-between text-xs mb-0.5">
                        <span className="text-slate-500">Peak</span>
                        <span className="font-semibold text-slate-700">
                          {formatMillions(app.peakQuarterlyRev)}/q
                        </span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-slate-400"
                          style={{ width: "100%" }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-0.5">
                        <span className="text-slate-500">Current</span>
                        <span className="font-semibold text-red-600">
                          {formatMillions(app.currentQuarterlyRev)}/q
                        </span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-red-400"
                          style={{
                            width: `${Math.max(
                              (app.currentQuarterlyRev /
                                app.peakQuarterlyRev) *
                                100,
                              1
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <p className="text-xs font-bold text-red-600 mb-2">
                    {decline}% from peak
                  </p>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {app.note}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Consumer insights */}
          <div className="bg-slate-50 rounded-xl p-5">
            <h4 className="text-sm font-bold text-slate-800 mb-3 uppercase tracking-wider">
              Why Consumer Crypto Keeps Failing
            </h4>
            <ul className="space-y-2">
              {consumerCryptoInsights.map((insight, i) => (
                <li key={i} className="flex gap-2 text-sm text-slate-600">
                  <span className="text-slate-300 flex-shrink-0 mt-0.5">
                    &bull;
                  </span>
                  <span>{insight}</span>
                </li>
              ))}
            </ul>
          </div>

          <DataSource
            sources={["DefiLlama", "TokenTerminal", "Individual protocol data"]}
          />
        </Card>

        {/* ---------------------------------------------------------------- */}
        {/* 5. Stablecoin Interest Rate Dependency                           */}
        {/* ---------------------------------------------------------------- */}
        <Card className="mb-10">
          <h3 className="text-lg font-bold text-slate-900 mb-1">
            Stablecoins and the Rate Trap
          </h3>
          <p className="text-sm text-slate-500 mb-6">
            Stablecoin issuers (Tether, Circle) earn the majority of their
            revenue from T-bill interest. As the Fed cuts rates, this revenue
            stream shrinks — unless they diversify into transaction fees.
          </p>

          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={stablecoinData}
                margin={{ top: 10, right: 50, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12, fill: "#64748b" }}
                  axisLine={{ stroke: "#e2e8f0" }}
                  tickLine={false}
                />
                <YAxis
                  yAxisId="left"
                  tick={{ fontSize: 12, fill: "#64748b" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => `$${v}B`}
                  label={{
                    value: "Revenue ($B)",
                    angle: -90,
                    position: "insideLeft",
                    style: { fontSize: 11, fill: "#94a3b8" },
                  }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 12, fill: "#64748b" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => `${v}%`}
                  domain={[0, 7]}
                  label={{
                    value: "Fed Rate (%)",
                    angle: 90,
                    position: "insideRight",
                    style: { fontSize: 11, fill: "#94a3b8" },
                  }}
                />
                <Tooltip content={<StablecoinTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                  iconType="square"
                />
                <Bar
                  yAxisId="left"
                  dataKey="interestIncome"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                  name="Interest Income"
                  stackId="rev"
                />
                <Bar
                  yAxisId="left"
                  dataKey="transactionFees"
                  fill="#3b82f6"
                  radius={[0, 0, 0, 0]}
                  name="Transaction Fees"
                  stackId="rev"
                />
                <Bar
                  yAxisId="left"
                  dataKey="other"
                  fill="#94a3b8"
                  radius={[0, 0, 0, 0]}
                  name="Other Revenue"
                  stackId="rev"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="fedRate"
                  stroke="#ef4444"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "#ef4444", strokeWidth: 0 }}
                  name="Fed Funds Rate"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Rate dependency breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
            <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-4 text-center">
              <p className="text-2xl font-bold text-emerald-700">
                ${latestStablecoin.interestIncome}B
              </p>
              <p className="text-xs text-emerald-600 mt-1">
                Interest income (2025)
              </p>
              <p className="text-xs text-emerald-500 mt-0.5">
                {interestPct}% of total
              </p>
            </div>
            <div className="rounded-xl bg-blue-50 border border-blue-100 p-4 text-center">
              <p className="text-2xl font-bold text-blue-700">
                ${latestStablecoin.transactionFees}B
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Transaction fees (2025)
              </p>
              <p className="text-xs text-blue-500 mt-0.5">
                {Math.round(
                  (latestStablecoin.transactionFees / latestStablecoin.total) *
                    100
                )}
                % of total
              </p>
            </div>
            <div className="rounded-xl bg-red-50 border border-red-100 p-4 text-center">
              <p className="text-2xl font-bold text-red-700">
                {latestStablecoin.fedRate}%
              </p>
              <p className="text-xs text-red-600 mt-1">
                Current Fed Rate
              </p>
              <p className="text-xs text-red-500 mt-0.5">
                Down from 5.5% peak
              </p>
            </div>
          </div>

          <DataSource
            sources={[
              "Tether quarterly reports",
              "Circle S-1 filing",
              "Federal Reserve",
            ]}
          />
        </Card>

        {/* ---------------------------------------------------------------- */}
        {/* Insight Boxes                                                    */}
        {/* ---------------------------------------------------------------- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
          <InsightBox title="Stablecoin Revenue Paradox" type="warning">
            <p>
              Stablecoins now generate ~40% of all crypto revenue, but{" "}
              <strong>65% of that comes from T-bill interest</strong> — not
              transaction fees. Every 100bps Fed rate cut erodes ~$1.5B in
              annualized stablecoin revenue. Tether and Circle are racing to
              diversify into payments, but the clock is ticking.
            </p>
          </InsightBox>

          <InsightBox title="The DEX Flip" type="highlight">
            <p>
              <strong>DEXs overtook CEXs in 2025 for the first time.</strong>{" "}
              CEX dominance fell from 86% (2020) to 45% (2025). Hyperliquid
              alone now generates more revenue than most CEXs outside of
              Binance. This is a structural shift — self-custody + on-chain
              execution is winning.
            </p>
          </InsightBox>

          <InsightBox title="Consumer Crypto Is the Weak Link" type="insight">
            <p>
              Only 6% of onchain fees come from consumer apps, and over 80% of
              that came from a single memecoin launchpad (Pump.fun). Social
              tokens, GameFi, and NFT marketplaces have all failed to sustain
              revenue. Crypto&apos;s killer consumer app hasn&apos;t been built
              yet.
            </p>
          </InsightBox>

          <InsightBox title="DeFi Quality Premium" type="highlight">
            <p>
              DeFi generates 63% of onchain fees and grew 113% YoY — the
              highest-quality revenue in crypto. Unlike consumer apps, DeFi
              protocols serve genuine financial utility (trading, lending,
              staking) with sustainable fee models. This is the revenue that
              matters.
            </p>
          </InsightBox>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Bottom Source                                                     */}
        {/* ---------------------------------------------------------------- */}
        <DataSource
          sources={[
            "1kx 2025 Onchain Revenue Report",
            "DefiLlama",
            "TokenTerminal",
            "Tether & Circle financial reports",
            "Federal Reserve FRED data",
          ]}
        />
      </div>
    </section>
  );
}
