"use client";

import React, { useMemo } from "react";
import {
  ComposedChart,
  AreaChart,
  BarChart,
  Area,
  Bar,
  Line,
  LineChart,
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
import { useDataContext, aggregateToQuarterly } from "@/lib/DataContext";
import { ChartExport } from "@/components/ui/ChartExport";

// ---------------------------------------------------------------------------
// Helper: merge live Fear & Greed history with live quarterly revenue into the
// same shape as the static `sentimentVsRevenueData` array so the chart works
// unchanged.
//
// We bucket F&G history into monthly averages, then align with quarterly
// revenue data. Each point gets { date, fearGreed, revenue, label }.
// ---------------------------------------------------------------------------
function buildLiveSentimentVsRevenue(
  fgHistory: { timestamp: string; value: number; classification: string }[],
  quarterlyRevenue: { period: string; value: number }[]
): { date: string; fearGreed: number; revenue: number; label: string }[] {
  // Build a map of quarterly revenue keyed like "Q1 2024"
  const revMap = new Map<string, number>();
  for (const q of quarterlyRevenue) {
    // value is raw daily sums in USD — convert to $B (daily fees summed over ~90 days)
    revMap.set(q.period, +(q.value / 1e9).toFixed(1));
  }

  // Bucket F&G values by quarter
  const fgByQuarter = new Map<string, number[]>();
  for (const entry of fgHistory) {
    const d = new Date(entry.timestamp);
    const year = d.getUTCFullYear();
    const q = Math.ceil((d.getUTCMonth() + 1) / 3);
    const key = `Q${q} ${year}`;
    if (!fgByQuarter.has(key)) fgByQuarter.set(key, []);
    fgByQuarter.get(key)!.push(entry.value);
  }

  // Create a sorted union of all quarter keys
  const allQuarters = new Set<string>([
    ...revMap.keys(),
    ...fgByQuarter.keys(),
  ]);

  const sorted = [...allQuarters].sort((a, b) => {
    const [qa, ya] = [parseInt(a[1]), parseInt(a.split(" ")[1])];
    const [qb, yb] = [parseInt(b[1]), parseInt(b.split(" ")[1])];
    return ya !== yb ? ya - yb : qa - qb;
  });

  // Only include quarters where we have BOTH data points
  return sorted
    .filter((key) => fgByQuarter.has(key) && revMap.has(key))
    .map((key) => {
      const fgVals = fgByQuarter.get(key)!;
      const avgFg = Math.round(
        fgVals.reduce((s, v) => s + v, 0) / fgVals.length
      );
      return {
        date: key,
        fearGreed: avgFg,
        revenue: revMap.get(key)!,
        label: "",
      };
    });
}

// ---------------------------------------------------------------------------
// Helper: build live ETH ETF flows chart data from ctx.etf.netFlows
// Aggregates daily flows into monthly buckets for the bar chart.
// ---------------------------------------------------------------------------
function buildLiveEthFlowsData(
  netFlows: { date: string; btcFlows: number; ethFlows: number; totalFlows: number }[]
): { period: string; netFlows: number; price: number; note: string }[] {
  // Group by month
  const monthBuckets = new Map<string, { totalEthFlows: number; count: number }>();

  for (const entry of netFlows) {
    const d = new Date(entry.date);
    const year = d.getUTCFullYear();
    const month = d.getUTCMonth();
    // Create a monthly key
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const key = `${monthNames[month]} ${year}`;

    if (!monthBuckets.has(key)) {
      monthBuckets.set(key, { totalEthFlows: 0, count: 0 });
    }
    const bucket = monthBuckets.get(key)!;
    bucket.totalEthFlows += entry.ethFlows;
    bucket.count += 1;
  }

  // Sort chronologically and convert to $B
  const sortedKeys = [...monthBuckets.keys()].sort((a, b) => {
    const dateA = new Date(a);
    const dateB = new Date(b);
    return dateA.getTime() - dateB.getTime();
  });

  // Take the last 12 months for a clean view
  const recentKeys = sortedKeys.slice(-12);

  return recentKeys.map((key) => {
    const bucket = monthBuckets.get(key)!;
    const flowsInBillions = +(bucket.totalEthFlows / 1e9).toFixed(2);
    return {
      period: key,
      netFlows: flowsInBillions,
      price: 0, // price not available from ETF flow data
      note: flowsInBillions >= 0 ? "Net inflows" : "Net outflows",
    };
  });
}

// ---------------------------------------------------------------------------
// Helper: build protocol revenue comparison chart data from protocolHistory
// Aggregates daily revenue into weekly buckets for smoother lines.
// ---------------------------------------------------------------------------
function buildProtocolRevenueComparison(
  protocols: { name: string; history: { date: number; fees: number; revenue: number }[] }[]
): { chartData: Record<string, unknown>[]; protocolNames: string[] } {
  // Focus on the top 4 protocols by total revenue
  const protocolsWithTotal = protocols
    .map((p) => ({
      ...p,
      totalRevenue: p.history.reduce((sum, h) => sum + (h.revenue || h.fees || 0), 0),
    }))
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, 4);

  const protocolNames = protocolsWithTotal.map((p) => p.name);

  // Collect all dates across all protocols and bucket by week
  const weekBuckets = new Map<string, Record<string, number[]>>();

  for (const protocol of protocolsWithTotal) {
    for (const entry of protocol.history) {
      const d = new Date(entry.date * 1000);
      // Get the Monday of this week
      const day = d.getUTCDay();
      const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(d);
      monday.setUTCDate(diff);
      const weekKey = monday.toISOString().slice(0, 10);

      if (!weekBuckets.has(weekKey)) {
        weekBuckets.set(weekKey, {});
      }
      const bucket = weekBuckets.get(weekKey)!;
      if (!bucket[protocol.name]) {
        bucket[protocol.name] = [];
      }
      bucket[protocol.name].push(entry.revenue || entry.fees || 0);
    }
  }

  // Sort by date, take last 26 weeks (6 months)
  const sortedWeeks = [...weekBuckets.keys()].sort();
  const recentWeeks = sortedWeeks.slice(-26);

  const chartData: Record<string, unknown>[] = recentWeeks.map((weekKey) => {
    const bucket = weekBuckets.get(weekKey)!;
    const d = new Date(weekKey);
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const label = `${monthNames[d.getUTCMonth()]} ${d.getUTCDate()}`;

    const point: Record<string, unknown> = { date: label };

    for (const name of protocolNames) {
      const values = bucket[name] || [];
      // Average daily revenue for the week, in thousands
      const avg = values.length > 0
        ? values.reduce((s, v) => s + v, 0) / values.length
        : 0;
      point[name] = Math.round(avg);
    }

    return point;
  });

  return { chartData, protocolNames };
}

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
  if (!data) return null;
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-lg px-4 py-3 text-sm">
      <p className="font-semibold text-slate-900 mb-1.5">{label}</p>
      <p className="text-slate-600">
        Net Flows:{" "}
        <span
          className={`font-semibold ${
            (data.netFlows ?? 0) >= 0 ? "text-emerald-600" : "text-red-500"
          }`}
        >
          {(data.netFlows ?? 0) >= 0 ? "+" : ""}
          ${data.netFlows ?? 0}B
        </span>
      </p>
      {data.price > 0 && (
        <p className="text-slate-600">
          ETH Price: <span className="font-semibold">${data.price?.toLocaleString()}</span>
        </p>
      )}
      {data.note && (
        <p className="mt-1.5 text-xs text-slate-400 border-t border-slate-100 pt-1.5">
          {data.note}
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Custom tooltip for the protocol revenue comparison chart
// ---------------------------------------------------------------------------
function ProtocolRevenueTooltip({ active, payload, label }: any) {
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
            ${Number(entry.value).toLocaleString()}
          </span>
        </p>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sentiment percentile vs revenue percentile visual
// ---------------------------------------------------------------------------
function PercentileDivergenceVisual({
  sentimentPctFromATH,
  revenuePct,
}: {
  sentimentPctFromATH: number;
  revenuePct: number;
}) {
  const sentimentPct = Math.abs(sentimentPctFromATH);

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

// Protocol revenue comparison line colors
const PROTOCOL_COLORS = [
  CHART_COLORS.primary,    // Blue - Aave
  CHART_COLORS.secondary,  // Purple - Uniswap
  CHART_COLORS.tertiary,   // Cyan - Hyperliquid
  CHART_COLORS.accent,     // Amber - Jupiter
];

// ===========================================================================
// MAIN COMPONENT
// ===========================================================================
export default function Section2Sentiment() {
  const ctx = useDataContext();

  // -----------------------------------------------------------------------
  // Derive live values when available, fall back to static
  // -----------------------------------------------------------------------

  const hasLiveSentiment = !!ctx.sentiment;
  const hasLiveFees = !!ctx.fees;
  const hasLiveEtf = !!ctx.etf;
  const hasLiveProtocolHistory = !!ctx.protocolHistory;

  // Current Fear & Greed value
  const fgValue = hasLiveSentiment
    ? ctx.sentiment!.fearGreed.current
    : sentimentKeyMetrics.currentFearGreed;

  // ATH for F&G — we keep the static constant since the API doesn't expose an ATH
  const athFG = sentimentKeyMetrics.athFearGreed;

  // Percentile from ATH: how far current is below the ATH (as a negative %)
  const sentimentPctFromATH = hasLiveSentiment
    ? -Math.round(((athFG - fgValue) / athFG) * 100)
    : sentimentKeyMetrics.sentimentPercentileFromATH;

  // Quarterly revenue from live fees (aggregated)
  const liveQuarterlyRevenue = useMemo(() => {
    if (!hasLiveFees) return null;
    return aggregateToQuarterly(ctx.fees!.totalDataChart);
  }, [hasLiveFees, ctx.fees]);

  // Latest quarterly revenue in $B
  const currentQuarterlyRevenue = useMemo(() => {
    if (liveQuarterlyRevenue && liveQuarterlyRevenue.length > 0) {
      const last = liveQuarterlyRevenue[liveQuarterlyRevenue.length - 1];
      return +(last.value / 1e9).toFixed(1);
    }
    return sentimentKeyMetrics.currentQuarterlyRevenue;
  }, [liveQuarterlyRevenue]);

  // Revenue percentile — compute from the live quarterly data if available
  const revenuePercentile = useMemo(() => {
    if (liveQuarterlyRevenue && liveQuarterlyRevenue.length > 1) {
      const values = liveQuarterlyRevenue.map((q) => q.value);
      const current = values[values.length - 1];
      const countBelow = values.filter((v) => v < current).length;
      return Math.round((countBelow / values.length) * 100);
    }
    return sentimentKeyMetrics.revenuePercentile;
  }, [liveQuarterlyRevenue]);

  // Divergence score — composite of sentiment gap and revenue percentile
  const divergenceScore = useMemo(() => {
    if (hasLiveSentiment || hasLiveFees) {
      // Simple composite: revenuePercentile + abs(sentimentPctFromATH)
      return revenuePercentile + Math.abs(sentimentPctFromATH);
    }
    return sentimentKeyMetrics.divergenceScore;
  }, [hasLiveSentiment, hasLiveFees, revenuePercentile, sentimentPctFromATH]);

  // -----------------------------------------------------------------------
  // Build the "money chart" data — live or static
  // -----------------------------------------------------------------------
  const moneyChartData = useMemo(() => {
    if (
      hasLiveSentiment &&
      hasLiveFees &&
      ctx.sentiment!.fearGreed.history.length > 0 &&
      liveQuarterlyRevenue &&
      liveQuarterlyRevenue.length > 0
    ) {
      const built = buildLiveSentimentVsRevenue(
        ctx.sentiment!.fearGreed.history,
        liveQuarterlyRevenue
      );
      // Only use live data if we got a reasonable number of points
      if (built.length >= 4) return built;
    }
    return sentimentVsRevenueData;
  }, [hasLiveSentiment, hasLiveFees, ctx.sentiment, liveQuarterlyRevenue]);

  // Compute max revenue for Y-axis domain
  const maxRevenue = useMemo(() => {
    const maxVal = Math.max(...moneyChartData.map((d) => d.revenue));
    return Math.ceil(maxVal / 2) * 2 + 2; // round up to nearest even + buffer
  }, [moneyChartData]);

  // -----------------------------------------------------------------------
  // Build live ETH ETF flows chart data when available
  // -----------------------------------------------------------------------
  const ethFlowsChartData = useMemo(() => {
    if (hasLiveEtf && ctx.etf!.netFlows.length > 0) {
      const liveData = buildLiveEthFlowsData(ctx.etf!.netFlows);
      // Only use live data if we got enough data points
      if (liveData.length >= 3) return liveData;
    }
    return ethFlowsData;
  }, [hasLiveEtf, ctx.etf]);

  // -----------------------------------------------------------------------
  // Build protocol revenue comparison data when available
  // -----------------------------------------------------------------------
  const protocolRevenueData = useMemo(() => {
    if (hasLiveProtocolHistory && ctx.protocolHistory!.protocols.length > 0) {
      return buildProtocolRevenueComparison(ctx.protocolHistory!.protocols);
    }
    return null;
  }, [hasLiveProtocolHistory, ctx.protocolHistory]);

  // -----------------------------------------------------------------------
  // Color-code the Fear & Greed value
  // -----------------------------------------------------------------------
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
          change={`${sentimentPctFromATH}% from ATH of ${athFG}`}
          changeType="negative"
          className={`border-l-4 border-l-red-500`}
        />
        <StatCard
          label="Quarterly Revenue"
          value={`$${currentQuarterlyRevenue}B`}
          subvalue={`${revenuePercentile}th percentile historically`}
          change="All-time high range"
          changeType="positive"
          className="border-l-4 border-l-emerald-500"
        />
        <StatCard
          label="Divergence Score"
          value={String(divergenceScore)}
          subvalue="Composite sentiment-revenue gap"
          change="Highest on record"
          changeType="negative"
          className="border-l-4 border-l-amber-500"
        />
      </div>

      {/* ---- CoinGecko Market Dominance Context ---- */}
      {ctx.coinGecko?.global && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <StatCard
            label="BTC Dominance"
            value={`${ctx.coinGecko.global.btcDominance.toFixed(1)}%`}
            subvalue="Share of total crypto market cap"
            change={ctx.coinGecko.global.btcDominance >= 55 ? "Elevated -- risk-off signal" : "Normal range"}
            changeType={ctx.coinGecko.global.btcDominance >= 55 ? "negative" : "neutral"}
          />
          <StatCard
            label="ETH Dominance"
            value={`${ctx.coinGecko.global.ethDominance.toFixed(1)}%`}
            subvalue="Share of total crypto market cap"
            change={ctx.coinGecko.global.ethDominance < 15 ? "Below historic avg" : "Normal range"}
            changeType={ctx.coinGecko.global.ethDominance < 15 ? "negative" : "neutral"}
          />
          <StatCard
            label="Total Market Cap"
            value={`$${(ctx.coinGecko.global.totalMarketCap / 1e12).toFixed(2)}T`}
            subvalue="All cryptocurrencies"
            change={`${ctx.coinGecko.global.marketCapChange24h >= 0 ? "+" : ""}${ctx.coinGecko.global.marketCapChange24h.toFixed(1)}% 24h`}
            changeType={ctx.coinGecko.global.marketCapChange24h >= 0 ? "positive" : "negative"}
          />
          <StatCard
            label="24h Spot Volume"
            value={`$${(ctx.coinGecko.global.totalVolume24h / 1e9).toFixed(1)}B`}
            subvalue="Global spot trading"
          />
        </div>
      )}

      {/* ---- CoinGlass Derivatives Market ---- */}
      {ctx.coinGlass && (
        <Card className="mb-10">
          <div className="mb-6">
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-bold text-slate-900">
                Derivatives Market Snapshot
              </h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-emerald-700 bg-emerald-50 rounded-full border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live CoinGlass
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-1 max-w-2xl">
              Derivatives data adds depth to sentiment analysis -- open interest, funding rates, and liquidations reveal
              how leveraged and positioned the market is beyond spot price action.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
              label="BTC Open Interest"
              value={`$${(ctx.coinGlass.openInterest.btcCurrent / 1e9).toFixed(1)}B`}
              subvalue="Total BTC futures OI"
              change={ctx.coinGlass.openInterest.btcCurrent > 30e9 ? "Elevated leverage" : "Normal range"}
              changeType={ctx.coinGlass.openInterest.btcCurrent > 30e9 ? "negative" : "neutral"}
            />
            <StatCard
              label="Funding Rate (BTC)"
              value={`${(ctx.coinGlass.fundingRate.currentRate * 100).toFixed(4)}%`}
              subvalue="Current 8h funding"
              change={
                ctx.coinGlass.fundingRate.currentRate > 0.01
                  ? "Longs paying -- bullish bias"
                  : ctx.coinGlass.fundingRate.currentRate < -0.01
                  ? "Shorts paying -- bearish bias"
                  : "Near neutral"
              }
              changeType={
                ctx.coinGlass.fundingRate.currentRate > 0.01
                  ? "positive"
                  : ctx.coinGlass.fundingRate.currentRate < -0.01
                  ? "negative"
                  : "neutral"
              }
            />
            <StatCard
              label="Long/Short Ratio"
              value={ctx.coinGlass.longShortRatio.currentRatio.toFixed(2)}
              subvalue="Global L/S accounts ratio"
              change={
                ctx.coinGlass.longShortRatio.currentRatio > 1.5
                  ? "Crowded long"
                  : ctx.coinGlass.longShortRatio.currentRatio < 0.8
                  ? "Crowded short"
                  : "Balanced positioning"
              }
              changeType={
                ctx.coinGlass.longShortRatio.currentRatio > 1.5 || ctx.coinGlass.longShortRatio.currentRatio < 0.8
                  ? "negative"
                  : "neutral"
              }
            />
            <StatCard
              label="24h Liquidations"
              value={`$${(ctx.coinGlass.liquidations.total24h / 1e6).toFixed(0)}M`}
              subvalue="Total liquidated positions"
              change={ctx.coinGlass.liquidations.total24h > 500e6 ? "High volatility event" : "Normal range"}
              changeType={ctx.coinGlass.liquidations.total24h > 500e6 ? "negative" : "neutral"}
            />
          </div>

          {/* Derivatives context insight */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5 w-3 h-3 rounded-full bg-blue-500" />
              <div className="text-sm text-slate-700">
                <span className="font-semibold">Why derivatives matter for sentiment:</span>{" "}
                Open interest and funding rates reveal market positioning that spot prices alone cannot show.
                High OI with negative funding suggests shorts are dominant -- a contrarian bullish signal
                when combined with strong revenue fundamentals. Liquidation spikes often mark local extremes
                in sentiment.
              </div>
            </div>
          </div>

          <DataSource sources={["CoinGlass (live)"]} />
        </Card>
      )}

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

        <ChartExport
          data={moneyChartData}
          filename="fear-greed-vs-quarterly-revenue"
        >
          <ResponsiveContainer width="100%" height={420}>
            <ComposedChart
              data={moneyChartData}
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
                domain={[0, maxRevenue]}
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
        </ChartExport>

        <DataSource
          sources={[
            "Alternative.me Fear & Greed Index",
            "TokenTerminal (live)",
            "DefiLlama (live)",
          ]}
        />
      </Card>

      {/* ---- Percentile Divergence + Insight ---- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
        <PercentileDivergenceVisual
          sentimentPctFromATH={sentimentPctFromATH}
          revenuePct={revenuePercentile}
        />

        <div className="flex flex-col gap-5">
          <InsightBox title="The Key Thesis" type="highlight">
            <p>
              Sentiment is{" "}
              <strong>
                {Math.abs(sentimentPctFromATH)}% below
                its all-time high
              </strong>{" "}
              while revenue sits in the{" "}
              <strong>
                {revenuePercentile}th percentile
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

      {/* ---- ETH Flows Chart (live ETF data when available, static fallback) ---- */}
      <Card className="mb-10">
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-bold text-slate-900">
              ETH Net Flows: The Sentiment Barometer
            </h3>
            {hasLiveEtf && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-emerald-700 bg-emerald-50 rounded-full border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live ETF Data
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl">
            {hasLiveEtf
              ? "Live ETH ETF flow data showing monthly net inflows and outflows. Persistent outflows signal capital leaving the ecosystem even as protocol revenues hit records."
              : "ETH has shifted from net inflows to persistent net outflows since Q4 2024 — a clear signal that capital is leaving the ecosystem even as protocol revenues hit records."}
          </p>
        </div>

        <ChartExport
          data={ethFlowsChartData}
          filename="eth-net-flows-sentiment-barometer"
        >
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart
              data={ethFlowsChartData}
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

              {/* Only show price axis when price data exists (static fallback) */}
              {!hasLiveEtf && (
                <YAxis
                  yAxisId="price"
                  orientation="right"
                  tick={{ fontSize: 11, fill: "#8b5cf6" }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v: number) => `$${(v / 1000).toFixed(1)}k`}
                />
              )}

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
                {ethFlowsChartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.netFlows >= 0 ? "#10b981" : "#ef4444"}
                    fillOpacity={0.85}
                  />
                ))}
              </Bar>

              {/* Only show price line when price data exists (static fallback) */}
              {!hasLiveEtf && (
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
              )}

              <Legend
                verticalAlign="top"
                height={36}
                iconType="circle"
                wrapperStyle={{ fontSize: 13 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartExport>

        <DataSource
          sources={
            hasLiveEtf
              ? ["DefiLlama Pro ETF API", "ETF Flow Data"]
              : ["CoinGecko", "Glassnode", "ETF Flow Data", "DefiLlama"]
          }
        />
      </Card>

      {/* ---- Protocol Revenue Comparison (live data only) ---- */}
      {protocolRevenueData && protocolRevenueData.chartData.length > 0 && (
        <Card className="mb-10">
          <div className="mb-6">
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-bold text-slate-900">
                Protocol Revenue Comparison
              </h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-emerald-700 bg-emerald-50 rounded-full border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-1 max-w-2xl">
              Average daily revenue (USD) for top protocols over the past 6
              months. Revenue trends show which protocols are building
              sustainable fee-generating businesses regardless of market
              sentiment.
            </p>
          </div>

          <ChartExport
            data={protocolRevenueData.chartData as Record<string, unknown>[]}
            filename="protocol-revenue-comparison"
          >
            <ResponsiveContainer width="100%" height={380}>
              <LineChart
                data={protocolRevenueData.chartData}
                margin={{ top: 10, right: 20, left: 10, bottom: 20 }}
              >
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

                <YAxis
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v: number) =>
                    v >= 1_000_000
                      ? `$${(v / 1_000_000).toFixed(1)}M`
                      : v >= 1_000
                      ? `$${(v / 1_000).toFixed(0)}K`
                      : `$${v}`
                  }
                />

                <Tooltip content={<ProtocolRevenueTooltip />} />

                <Legend
                  verticalAlign="top"
                  height={36}
                  iconType="circle"
                  wrapperStyle={{ fontSize: 13 }}
                />

                {protocolRevenueData.protocolNames.map((name, i) => (
                  <Line
                    key={name}
                    type="monotone"
                    dataKey={name}
                    name={name}
                    stroke={PROTOCOL_COLORS[i % PROTOCOL_COLORS.length]}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 5, stroke: "#fff", strokeWidth: 2 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </ChartExport>

          <DataSource sources={["DefiLlama Protocol Fees API"]} />
        </Card>
      )}

      {/* ---- TradFi Parallels (static — editorial) ---- */}
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
          "Alternative.me (live)",
          "TokenTerminal (live)",
          "DefiLlama (live)",
          "S&P Global",
          "WorldPERatio.com",
        ]}
      />
    </section>
  );
}
