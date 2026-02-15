"use client";

import React from "react";
import {
  ComposedChart,
  AreaChart,
  BarChart,
  Area,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from "recharts";
import {
  Card,
  StatCard,
  SectionHeader,
  DataSource,
  InsightBox,
} from "@/components/ui/Card";
import {
  sentimentVsRevenueData,
  sentimentKeyMetrics,
  ethFlowsData,
  tradFiParallels,
  CHART_COLORS,
} from "@/lib/data";

// ---------------------------------------------------------------------------
// Custom tooltip for the dual-axis divergence chart
// ---------------------------------------------------------------------------
function DivergenceTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-lg px-4 py-3 text-sm">
      <p className="font-semibold text-slate-900 mb-1.5">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="flex items-center gap-2" style={{ color: entry.color }}>
          <span
            className="inline-block w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          {entry.name}:{" "}
          <span className="font-semibold">
            {entry.name === "Quarterly Revenue ($B)"
              ? `$${entry.value}B`
              : entry.value}
          </span>
        </p>
      ))}
      {payload[0]?.payload?.label && (
        <p className="mt-1.5 text-xs font-medium text-slate-500 border-t border-slate-100 pt-1.5">
          {payload[0].payload.label}
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Custom tooltip for the ETH flows chart
// ---------------------------------------------------------------------------
function EthFlowsTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const data = payload[0]?.payload;
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-lg px-4 py-3 text-sm">
      <p className="font-semibold text-slate-900 mb-1.5">{label}</p>
      <p className="text-slate-600">
        Net Flows:{" "}
        <span
          className={`font-semibold ${
            data.netFlows >= 0 ? "text-emerald-600" : "text-red-500"
          }`}
        >
          {data.netFlows >= 0 ? "+" : ""}
          ${data.netFlows}B
        </span>
      </p>
      <p className="text-slate-600">
        ETH Price: <span className="font-semibold">${data.price?.toLocaleString()}</span>
      </p>
      {data.note && (
        <p className="mt-1.5 text-xs text-slate-400 border-t border-slate-100 pt-1.5">
          {data.note}
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sentiment percentile vs revenue percentile visual
// ---------------------------------------------------------------------------
function PercentileDivergenceVisual() {
  const sentimentPct = Math.abs(sentimentKeyMetrics.sentimentPercentileFromATH);
  const revenuePct = sentimentKeyMetrics.revenuePercentile;

  return (
    <Card className="relative overflow-hidden">
      <h3 className="text-lg font-bold text-slate-900 mb-1">
        Sentiment vs Revenue Percentile
      </h3>
      <p className="text-sm text-slate-500 mb-6">
        Where each metric sits relative to its historical range
      </p>

      {/* Sentiment bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-700">
            Fear &amp; Greed Index
          </span>
          <span className="text-sm font-bold text-red-500">
            {100 - sentimentPct}th percentile
          </span>
        </div>
        <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{
              width: `${100 - sentimentPct}%`,
              background: "linear-gradient(90deg, #dc2626, #ef4444)",
            }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-xs text-slate-400">Extreme Fear</span>
          <span className="text-xs text-slate-400">Extreme Greed</span>
        </div>
      </div>

      {/* Revenue bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-700">
            Quarterly Revenue
          </span>
          <span className="text-sm font-bold text-emerald-600">
            {revenuePct}th percentile
          </span>
        </div>
        <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{
              width: `${revenuePct}%`,
              background: "linear-gradient(90deg, #059669, #10b981)",
            }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-xs text-slate-400">Historic Low</span>
          <span className="text-xs text-slate-400">Historic High</span>
        </div>
      </div>

      {/* Gap indicator */}
      <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-600">
              Percentile Gap
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              Revenue percentile minus sentiment percentile
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-black text-slate-900">
              {revenuePct - (100 - sentimentPct)}
            </p>
            <p className="text-xs font-medium text-amber-600">points</p>
          </div>
        </div>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// TradFi Parallel Card
// ---------------------------------------------------------------------------
function TradFiCard({
  parallel,
}: {
  parallel: (typeof tradFiParallels)[number];
}) {
  return (
    <Card hover className="flex flex-col h-full">
      <div className="flex items-start justify-between mb-3">
        <h4 className="text-base font-bold text-slate-900">
          {parallel.sector}
        </h4>
        <span className="text-xs font-medium text-slate-400 bg-slate-50 px-2 py-1 rounded-full whitespace-nowrap">
          {parallel.period}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-emerald-50 rounded-lg px-3 py-2">
          <p className="text-xs text-emerald-600 font-medium">Revenue Growth</p>
          <p className="text-lg font-bold text-emerald-700">
            {parallel.revenueGrowth}
          </p>
        </div>
        <div className="bg-red-50 rounded-lg px-3 py-2">
          <p className="text-xs text-red-500 font-medium">Multiple</p>
          <p className="text-xs font-semibold text-red-600 leading-snug mt-0.5">
            {parallel.multipleCompression}
          </p>
        </div>
      </div>

      <p className="text-sm text-slate-600 leading-relaxed flex-1">
        {parallel.description}
      </p>

      <div className="mt-4 pt-3 border-t border-slate-100">
        <p className="text-xs font-semibold text-blue-600">
          Outcome
        </p>
        <p className="text-sm text-slate-700 mt-0.5">{parallel.outcome}</p>
      </div>
    </Card>
  );
}

// ===========================================================================
// MAIN COMPONENT
// ===========================================================================
export default function Section2Sentiment() {
  // Color-code the Fear & Greed value
  const fgValue = sentimentKeyMetrics.currentFearGreed;
  const fgColor =
    fgValue <= 25
      ? "text-red-600"
      : fgValue <= 45
      ? "text-orange-500"
      : fgValue <= 55
      ? "text-yellow-500"
      : fgValue <= 75
      ? "text-lime-500"
      : "text-emerald-600";

  const fgLabel =
    fgValue <= 25
      ? "Extreme Fear"
      : fgValue <= 45
      ? "Fear"
      : fgValue <= 55
      ? "Neutral"
      : fgValue <= 75
      ? "Greed"
      : "Extreme Greed";

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* ---- Section Header ---- */}
      <SectionHeader
        number="2"
        title="The Great Divergence"
        subtitle="Sentiment is at historic lows while revenue is at historic highs. This is the single most important chart in crypto right now."
      />

      {/* ---- Headline Stat Cards ---- */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-12">
        <StatCard
          label="Fear & Greed Index"
          value={String(fgValue)}
          subvalue={fgLabel}
          change={`${sentimentKeyMetrics.sentimentPercentileFromATH}% from ATH of ${sentimentKeyMetrics.athFearGreed}`}
          changeType="negative"
          className={`border-l-4 border-l-red-500`}
        />
        <StatCard
          label="Quarterly Revenue"
          value={`$${sentimentKeyMetrics.currentQuarterlyRevenue}B`}
          subvalue={`${sentimentKeyMetrics.revenuePercentile}th percentile historically`}
          change="All-time high range"
          changeType="positive"
          className="border-l-4 border-l-emerald-500"
        />
        <StatCard
          label="Divergence Score"
          value={String(sentimentKeyMetrics.divergenceScore)}
          subvalue="Composite sentiment-revenue gap"
          change="Highest on record"
          changeType="negative"
          className="border-l-4 border-l-amber-500"
        />
      </div>

      {/* ---- THE MONEY CHART: Dual-Axis Divergence ---- */}
      <Card className="mb-10">
        <div className="mb-6">
          <h3 className="text-xl font-bold text-slate-900">
            Fear &amp; Greed vs Quarterly Revenue
          </h3>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl">
            These two lines used to move together. Since mid-2024, they have
            completely decoupled — revenue keeps climbing while sentiment keeps
            falling. This is the historic divergence.
          </p>
        </div>

        <ResponsiveContainer width="100%" height={420}>
          <ComposedChart
            data={sentimentVsRevenueData}
            margin={{ top: 10, right: 20, left: 0, bottom: 20 }}
          >
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="fearGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#ef4444" stopOpacity={0.02} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />

            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              tickLine={false}
              axisLine={{ stroke: "#e2e8f0" }}
              angle={-30}
              textAnchor="end"
              height={50}
            />

            {/* Left axis: Fear & Greed (0-100) */}
            <YAxis
              yAxisId="sentiment"
              orientation="left"
              domain={[0, 100]}
              tick={{ fontSize: 11, fill: "#ef4444" }}
              tickLine={false}
              axisLine={{ stroke: "#fecaca" }}
              label={{
                value: "Fear & Greed",
                angle: -90,
                position: "insideLeft",
                offset: 10,
                style: { fill: "#ef4444", fontSize: 12, fontWeight: 600 },
              }}
            />

            {/* Right axis: Revenue ($B) */}
            <YAxis
              yAxisId="revenue"
              orientation="right"
              domain={[0, 18]}
              tick={{ fontSize: 11, fill: "#059669" }}
              tickLine={false}
              axisLine={{ stroke: "#a7f3d0" }}
              tickFormatter={(v: number) => `$${v}B`}
              label={{
                value: "Revenue",
                angle: 90,
                position: "insideRight",
                offset: 10,
                style: { fill: "#059669", fontSize: 12, fontWeight: 600 },
              }}
            />

            <Tooltip content={<DivergenceTooltip />} />

            <Legend
              verticalAlign="top"
              height={36}
              iconType="circle"
              wrapperStyle={{ fontSize: 13 }}
            />

            {/* Fear & Greed — red area */}
            <Area
              yAxisId="sentiment"
              type="monotone"
              dataKey="fearGreed"
              name="Fear & Greed Index"
              stroke="#ef4444"
              strokeWidth={2.5}
              fill="url(#fearGradient)"
              dot={{ r: 3, fill: "#ef4444", strokeWidth: 0 }}
              activeDot={{ r: 5, stroke: "#fff", strokeWidth: 2 }}
            />

            {/* Revenue — green area */}
            <Area
              yAxisId="revenue"
              type="monotone"
              dataKey="revenue"
              name="Quarterly Revenue ($B)"
              stroke="#10b981"
              strokeWidth={2.5}
              fill="url(#revenueGradient)"
              dot={{ r: 3, fill: "#10b981", strokeWidth: 0 }}
              activeDot={{ r: 5, stroke: "#fff", strokeWidth: 2 }}
            />

            {/* Neutral line at 50 for Fear & Greed */}
            <ReferenceLine
              yAxisId="sentiment"
              y={50}
              stroke="#fca5a5"
              strokeDasharray="6 4"
              strokeWidth={1}
              label={{
                value: "Neutral (50)",
                position: "left",
                style: { fontSize: 10, fill: "#f87171" },
              }}
            />
          </ComposedChart>
        </ResponsiveContainer>

        <DataSource
          sources={[
            "Alternative.me Fear & Greed Index",
            "TokenTerminal",
            "DefiLlama",
            "1kx Research",
          ]}
        />
      </Card>

      {/* ---- Percentile Divergence + Insight ---- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
        <PercentileDivergenceVisual />

        <div className="flex flex-col gap-5">
          <InsightBox title="The Key Thesis" type="highlight">
            <p>
              Sentiment is{" "}
              <strong>
                {Math.abs(sentimentKeyMetrics.sentimentPercentileFromATH)}% below
                its all-time high
              </strong>{" "}
              while revenue sits in the{" "}
              <strong>
                {sentimentKeyMetrics.revenuePercentile}th percentile
              </strong>{" "}
              of its entire history. This level of divergence has never occurred
              before in crypto. The market is pricing in fear while the
              fundamentals have never been stronger.
            </p>
          </InsightBox>

          <InsightBox title="Why is sentiment so low?" type="warning">
            <ul className="list-disc list-inside space-y-1">
              <li>Post-memecoin fatigue and scam exhaustion</li>
              <li>ETH underperformance and L2 fragmentation narrative</li>
              <li>Regulatory uncertainty persisting despite legislative progress</li>
              <li>Macro fears: rate cuts slower than expected</li>
              <li>Retail burned by AI agent and memecoin cycles</li>
            </ul>
          </InsightBox>
        </div>
      </div>

      {/* ---- ETH Flows Chart ---- */}
      <Card className="mb-10">
        <div className="mb-6">
          <h3 className="text-xl font-bold text-slate-900">
            ETH Net Flows: The Sentiment Barometer
          </h3>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl">
            ETH has shifted from net inflows to persistent net outflows since Q4
            2024 — a clear signal that capital is leaving the ecosystem even as
            protocol revenues hit records.
          </p>
        </div>

        <ResponsiveContainer width="100%" height={320}>
          <ComposedChart
            data={ethFlowsData}
            margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />

            <XAxis
              dataKey="period"
              tick={{ fontSize: 12, fill: "#94a3b8" }}
              tickLine={false}
              axisLine={{ stroke: "#e2e8f0" }}
            />

            <YAxis
              yAxisId="flows"
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => `${v >= 0 ? "+" : ""}$${v}B`}
            />

            <YAxis
              yAxisId="price"
              orientation="right"
              tick={{ fontSize: 11, fill: "#8b5cf6" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => `$${(v / 1000).toFixed(1)}k`}
            />

            <Tooltip content={<EthFlowsTooltip />} />

            <ReferenceLine
              yAxisId="flows"
              y={0}
              stroke="#94a3b8"
              strokeWidth={1.5}
              strokeDasharray="4 3"
            />

            <Bar
              yAxisId="flows"
              dataKey="netFlows"
              name="Net Flows ($B)"
              radius={[6, 6, 0, 0]}
              maxBarSize={48}
            >
              {ethFlowsData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.netFlows >= 0 ? "#10b981" : "#ef4444"}
                  fillOpacity={0.85}
                />
              ))}
            </Bar>

            <Line
              yAxisId="price"
              type="monotone"
              dataKey="price"
              name="ETH Price"
              stroke="#8b5cf6"
              strokeWidth={2.5}
              dot={{ r: 4, fill: "#8b5cf6", strokeWidth: 0 }}
              activeDot={{ r: 6, stroke: "#fff", strokeWidth: 2 }}
            />

            <Legend
              verticalAlign="top"
              height={36}
              iconType="circle"
              wrapperStyle={{ fontSize: 13 }}
            />
          </ComposedChart>
        </ResponsiveContainer>

        <DataSource
          sources={[
            "CoinGecko",
            "Glassnode",
            "ETF Flow Data",
            "DefiLlama",
          ]}
        />
      </Card>

      {/* ---- TradFi Parallels ---- */}
      <div className="mb-10">
        <div className="mb-6">
          <h3 className="text-xl font-bold text-slate-900">
            Has This Happened Before?
          </h3>
          <p className="text-sm text-slate-500 mt-1 max-w-3xl">
            Revenue growing while sentiment and multiples compress is not unique
            to crypto. Here are four TradFi precedents where the same dynamic
            played out — and how it resolved.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {tradFiParallels.map((parallel) => (
            <TradFiCard key={parallel.sector} parallel={parallel} />
          ))}
        </div>
      </div>

      {/* ---- Closing Insight ---- */}
      <InsightBox title="The Pattern is Clear" type="highlight">
        <p className="text-base leading-relaxed">
          <strong>
            Has this happened before? Yes — and every time, the re-rating
            eventually came.
          </strong>{" "}
          Energy stocks surged after years of ESG-driven multiple compression.
          Bank stocks tripled once regulation fears subsided. Chinese tech is
          still re-rating today. In every case, revenue growth was the leading
          indicator and sentiment was the lagging one. Crypto&apos;s fundamentals are
          screaming — the market just isn&apos;t listening yet.
        </p>
      </InsightBox>

      <DataSource
        sources={[
          "Alternative.me",
          "TokenTerminal",
          "DefiLlama",
          "1kx 2025 Report",
          "S&P Global",
          "WorldPERatio.com",
        ]}
      />
    </section>
  );
}
