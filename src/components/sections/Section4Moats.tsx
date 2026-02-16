"use client";

import React, { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Legend,
} from "recharts";
import { moatAnalysis, CHART_COLORS } from "@/lib/data";
import { useDataContext } from "@/lib/DataContext";
import { ChartExport } from "@/components/ui/ChartExport";
import {
  Card,
  StatCard,
  SectionHeader,
  DataSource,
  InsightBox,
} from "@/components/ui/Card";

// ---------------------------------------------------------------------------
// Helpers & derived data
// ---------------------------------------------------------------------------

const moatStrengthColor = (strength: string) => {
  switch (strength) {
    case "strong":
      return { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500" };
    case "moderate":
      return { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", dot: "bg-amber-500" };
    case "weak":
      return { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", dot: "bg-red-500" };
    default:
      return { bg: "bg-slate-50", text: "text-slate-700", border: "border-slate-200", dot: "bg-slate-500" };
  }
};

const barFillColor = (strength: string) => {
  switch (strength) {
    case "strong":
      return "#10b981";
    case "moderate":
      return "#f59e0b";
    case "weak":
      return "#ef4444";
    default:
      return CHART_COLORS.muted;
  }
};

// Map from moatAnalysis protocol names to DefiLlama protocol slug names
const PROTOCOL_SLUG_MAP: Record<string, string[]> = {
  "Tether": ["tether"],
  "Circle": ["circle"],
  "Aave": ["aave"],
  "Uniswap": ["uniswap"],
  "Hyperliquid": ["hyperliquid"],
  "Jupiter": ["jupiter"],
};

// Map from moatAnalysis protocol names to CoinGecko token identifiers
// Uses symbol (lowercase) for matching against CoinGecko tokens array
const COINGECKO_TOKEN_MAP: Record<string, string[]> = {
  "Tether": ["usdt", "tether"],
  "Circle": ["usdc", "usd-coin"],
  "Aave": ["aave"],
  "Uniswap": ["uni", "uniswap"],
  "Hyperliquid": ["hype", "hyperliquid"],
  "Jupiter": ["jup", "jupiter"],
};

// Radar chart dimensions — each protocol scored 1-10 across moat axes
const radarDimensions = [
  { dimension: "Network Effects", Tether: 10, Circle: 6, Aave: 7, Uniswap: 5, Hyperliquid: 6, Jupiter: 5 },
  { dimension: "Switching Costs", Tether: 9, Circle: 5, Aave: 7, Uniswap: 3, Hyperliquid: 6, Jupiter: 4 },
  { dimension: "Brand / Trust", Tether: 7, Circle: 8, Aave: 9, Uniswap: 8, Hyperliquid: 7, Jupiter: 6 },
  { dimension: "Product Quality", Tether: 6, Circle: 7, Aave: 8, Uniswap: 7, Hyperliquid: 10, Jupiter: 8 },
  { dimension: "Vertical Integ.", Tether: 4, Circle: 5, Aave: 6, Uniswap: 5, Hyperliquid: 10, Jupiter: 7 },
  { dimension: "Distribution", Tether: 10, Circle: 7, Aave: 8, Uniswap: 6, Hyperliquid: 5, Jupiter: 8 },
  { dimension: "Composability", Tether: 8, Circle: 7, Aave: 10, Uniswap: 8, Hyperliquid: 4, Jupiter: 9 },
  { dimension: "Regulatory", Tether: 4, Circle: 9, Aave: 6, Uniswap: 5, Hyperliquid: 3, Jupiter: 5 },
];

const radarColors: Record<string, string> = {
  Tether: CHART_COLORS.primary,
  Circle: CHART_COLORS.tertiary,
  Aave: CHART_COLORS.secondary,
  Uniswap: CHART_COLORS.pink,
  Hyperliquid: CHART_COLORS.quaternary,
  Jupiter: CHART_COLORS.accent,
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function DurabilityBar({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-0.5">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className={`w-2.5 h-5 rounded-sm ${
              i < score
                ? score >= 8
                  ? "bg-emerald-500"
                  : score >= 6
                  ? "bg-amber-400"
                  : "bg-red-400"
                : "bg-slate-100"
            }`}
          />
        ))}
      </div>
      <span className="text-sm font-semibold text-slate-700">{score}/10</span>
    </div>
  );
}

function MoatBadge({ type, strength }: { type: string; strength: string }) {
  const colors = moatStrengthColor(strength);
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${colors.bg} ${colors.text} ${colors.border} border`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
      {type}
    </span>
  );
}

function ProtocolMoatCard({
  protocol,
  isHighlighted = false,
}: {
  protocol: (typeof moatAnalysis)[number] & { revenue: number; tokenPrice: number | null; tokenMarketCap: number | null; tokenFDV: number | null; tokenPriceChange24h: number | null; tokenSymbol: string | null };
  isHighlighted?: boolean;
}) {
  const colors = moatStrengthColor(protocol.moatStrength);
  const shortName = protocol.protocol.split(" (")[0];

  // Compute implied P/S ratio: FDV / annualized revenue
  const impliedPS = protocol.tokenFDV && protocol.revenue > 0
    ? protocol.tokenFDV / (protocol.revenue * 1e6)
    : null;

  return (
    <Card
      className={`relative ${
        isHighlighted
          ? "ring-2 ring-emerald-400 shadow-lg shadow-emerald-50"
          : ""
      }`}
      hover
    >
      {/* Highlighted badge */}
      {isHighlighted && (
        <div className="absolute -top-3 left-4">
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-600 text-white text-xs font-semibold shadow-sm">
            Featured
          </span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h4 className="text-lg font-bold text-slate-900">{shortName}</h4>
          <p className="text-xs text-slate-400 mt-0.5">
            {protocol.protocol.includes("(")
              ? protocol.protocol.split("(")[1]?.replace(")", "")
              : ""}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold text-slate-900">
            ${(protocol.revenue / 1000).toFixed(1)}B
          </p>
          <p className="text-xs text-slate-500">annualized revenue</p>
        </div>
      </div>

      {/* Live token price + market data (CoinGecko) */}
      {protocol.tokenPrice != null && (
        <div className="bg-slate-50 rounded-lg border border-slate-100 p-3 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              {protocol.tokenSymbol && (
                <span className="bg-slate-200 text-slate-600 rounded px-1.5 py-0.5 text-[10px] font-bold">
                  {protocol.tokenSymbol}
                </span>
              )}
              Token Data
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </span>
            {protocol.tokenPriceChange24h != null && (
              <span className={`text-xs font-semibold ${protocol.tokenPriceChange24h >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                {protocol.tokenPriceChange24h >= 0 ? "+" : ""}{protocol.tokenPriceChange24h.toFixed(1)}% 24h
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-slate-400">Price:</span>{" "}
              <span className="font-semibold text-slate-800">
                ${protocol.tokenPrice >= 1
                  ? protocol.tokenPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                  : protocol.tokenPrice.toFixed(4)}
              </span>
            </div>
            {protocol.tokenMarketCap != null && protocol.tokenMarketCap > 0 && (
              <div>
                <span className="text-slate-400">MCap:</span>{" "}
                <span className="font-semibold text-slate-800">
                  ${protocol.tokenMarketCap >= 1e9
                    ? `${(protocol.tokenMarketCap / 1e9).toFixed(1)}B`
                    : `${(protocol.tokenMarketCap / 1e6).toFixed(0)}M`}
                </span>
              </div>
            )}
            {protocol.tokenFDV != null && protocol.tokenFDV > 0 && (
              <div>
                <span className="text-slate-400">FDV:</span>{" "}
                <span className="font-semibold text-slate-800">
                  ${protocol.tokenFDV >= 1e9
                    ? `${(protocol.tokenFDV / 1e9).toFixed(1)}B`
                    : `${(protocol.tokenFDV / 1e6).toFixed(0)}M`}
                </span>
              </div>
            )}
            {impliedPS != null && (
              <div>
                <span className="text-slate-400">P/S:</span>{" "}
                <span className={`font-semibold ${impliedPS > 100 ? "text-red-600" : impliedPS > 30 ? "text-amber-600" : "text-emerald-700"}`}>
                  {impliedPS >= 1000 ? `${(impliedPS / 1000).toFixed(1)}K` : impliedPS.toFixed(1)}x
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Moat badge + market share */}
      <div className="flex items-center justify-between mb-4">
        <MoatBadge type={protocol.moatType.split(" + ")[0]} strength={protocol.moatStrength} />
        <span className="text-sm font-medium text-slate-500">
          {protocol.marketShare}% market share
        </span>
      </div>

      {/* Description */}
      <p className="text-sm text-slate-600 leading-relaxed mb-4">
        {protocol.description}
      </p>

      {/* Moat strength visual */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Moat Strength
          </span>
          <span
            className={`text-xs font-semibold capitalize ${colors.text}`}
          >
            {protocol.moatStrength}
          </span>
        </div>
        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${
              protocol.moatStrength === "strong"
                ? "bg-emerald-500 w-full"
                : protocol.moatStrength === "moderate"
                ? "bg-amber-400 w-2/3"
                : "bg-red-400 w-1/3"
            }`}
          />
        </div>
      </div>

      {/* Durability */}
      <div className="mb-4">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">
          Durability Score
        </p>
        <DurabilityBar score={protocol.durability} />
      </div>

      {/* Risk */}
      <div className="rounded-lg bg-red-50 border border-red-100 p-3">
        <p className="text-xs font-semibold text-red-700 uppercase tracking-wider mb-0.5">
          Key Risk
        </p>
        <p className="text-xs text-red-600 leading-relaxed">{protocol.risk}</p>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Custom tooltip for revenue bar chart
// ---------------------------------------------------------------------------

function RevenueBarTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: { name: string; revenue: number; moatStrength: string; durability: number } }> }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-lg text-sm">
      <p className="font-bold text-slate-900 mb-1">{d.name}</p>
      <p className="text-slate-600">
        Revenue: <span className="font-semibold">${(d.revenue / 1000).toFixed(1)}B</span>
      </p>
      <p className="text-slate-600">
        Moat:{" "}
        <span className={`font-semibold capitalize ${
          d.moatStrength === "strong" ? "text-emerald-600" : d.moatStrength === "moderate" ? "text-amber-600" : "text-red-500"
        }`}>
          {d.moatStrength}
        </span>
      </p>
      <p className="text-slate-600">
        Durability: <span className="font-semibold">{d.durability}/10</span>
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function Section4Moats() {
  const ctx = useDataContext();

  // -----------------------------------------------------------------------
  // Merge live revenue data + CoinGecko token data into moatAnalysis
  // -----------------------------------------------------------------------
  const enrichedMoatAnalysis = useMemo(() => {
    return moatAnalysis.map((p) => {
      const shortName = p.protocol.split(" (")[0];
      let enriched = { ...p, tokenPrice: null as number | null, tokenMarketCap: null as number | null, tokenFDV: null as number | null, tokenPriceChange24h: null as number | null, tokenSymbol: null as string | null };

      // Merge live DefiLlama revenue
      const slugs = PROTOCOL_SLUG_MAP[shortName];
      if (slugs && ctx.fees?.protocols) {
        const liveProto = ctx.fees.protocols.find((lp) =>
          slugs.some(
            (slug) =>
              lp.name.toLowerCase() === slug.toLowerCase() ||
              lp.displayName.toLowerCase() === slug.toLowerCase()
          )
        );

        if (liveProto && liveProto.total24h > 0) {
          // Convert to millions to match static moatAnalysis revenue unit ($M)
          const annualizedM = Math.round((liveProto.total24h * 365) / 1e6);
          enriched = { ...enriched, revenue: annualizedM > 0 ? annualizedM : p.revenue };
        }
      }

      // Merge CoinGecko token data
      const geckoIds = COINGECKO_TOKEN_MAP[shortName];
      if (geckoIds && ctx.coinGecko?.tokens) {
        const token = ctx.coinGecko.tokens.find((t) =>
          geckoIds.some(
            (gid) =>
              t.symbol.toLowerCase() === gid.toLowerCase() ||
              t.id.toLowerCase() === gid.toLowerCase()
          )
        );

        if (token) {
          enriched = {
            ...enriched,
            tokenPrice: token.currentPrice,
            tokenMarketCap: token.marketCap,
            tokenFDV: token.fullyDilutedValuation,
            tokenPriceChange24h: token.priceChange24h,
            tokenSymbol: token.symbol.toUpperCase(),
          };
        }
      }

      return enriched;
    });
  }, [ctx.fees, ctx.coinGecko]);

  // Whether CoinGecko token data is available for enrichment
  const hasCoinGeckoTokens = enrichedMoatAnalysis.some((p) => p.tokenPrice != null);

  // Build bar chart data from enriched analysis
  const barChartData = useMemo(
    () =>
      enrichedMoatAnalysis
        .map((p) => ({
          name: p.protocol.split(" (")[0],
          revenue: p.revenue,
          moatStrength: p.moatStrength,
          durability: p.durability,
        }))
        .sort((a, b) => b.revenue - a.revenue),
    [enrichedMoatAnalysis]
  );

  // Compute combined revenue from enriched data
  const combinedRevenue = useMemo(
    () => enrichedMoatAnalysis.reduce((sum, p) => sum + p.revenue, 0),
    [enrichedMoatAnalysis]
  );

  return (
    <section className="space-y-10">
      {/* Section Header */}
      <SectionHeader
        number="4"
        title="Revenue Moats"
        subtitle="Are today's leaders durable? Analyzing network effects, switching costs, and competitive advantages across the top revenue-generating protocols."
      />

      {/* ---- Top-level stat cards ---- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Protocols Analyzed"
          value="6"
          subvalue="Top revenue generators"
        />
        <StatCard
          label="Strong Moats"
          value="3"
          subvalue="Tether, Aave, Hyperliquid"
          change="Durable multi-year advantages"
          changeType="positive"
        />
        <StatCard
          label="Moderate Moats"
          value="3"
          subvalue="Circle, Uniswap, Jupiter"
          change="Defensible but vulnerable"
          changeType="neutral"
        />
        <StatCard
          label="Combined Revenue"
          value={`$${(combinedRevenue / 1000).toFixed(1)}B`}
          subvalue={`Annualized across 6 protocols${ctx.isLive ? " (live)" : ""}`}
        />
      </div>

      {/* ---- Horizontal Bar Chart: Revenue by Protocol with Moat Strength ---- */}
      <Card>
        <div className="mb-6">
          <h3 className="text-lg font-bold text-slate-900">
            Revenue by Protocol
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            Annualized revenue ($M) color-coded by moat strength -- green = strong, amber = moderate, red = weak
            {ctx.isLive && (
              <span className="ml-2 inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live data
              </span>
            )}
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-6 mb-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-emerald-500" />
            <span className="text-xs text-slate-600">Strong moat</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-amber-400" />
            <span className="text-xs text-slate-600">Moderate moat</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-red-400" />
            <span className="text-xs text-slate-600">Weak moat</span>
          </div>
        </div>

        <ChartExport
          data={barChartData}
          filename="section4-revenue-by-protocol"
        >
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={barChartData}
                layout="vertical"
                margin={{ top: 0, right: 40, bottom: 0, left: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 12, fill: "#94a3b8" }}
                  tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}B`}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={100}
                  tick={{ fontSize: 13, fill: "#334155", fontWeight: 500 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<RevenueBarTooltip />} cursor={{ fill: "#f8fafc" }} />
                <Bar dataKey="revenue" radius={[0, 6, 6, 0]} barSize={28}>
                  {barChartData.map((entry, index) => (
                    <Cell key={index} fill={barFillColor(entry.moatStrength)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartExport>

        <DataSource sources={["TokenTerminal (live)", "DefiLlama (live)"]} />
      </Card>

      {/* ---- Insight: What makes a durable crypto moat ---- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InsightBox title="The moat question is existential" type="insight">
          <p>
            Crypto protocols face a fundamental challenge: code is open-source, forks are free, and users
            have zero switching costs. The protocols that sustain revenue are those that build moats beyond
            code -- network effects (Tether), composability depth (Aave), or vertical integration (Hyperliquid).
          </p>
        </InsightBox>
        <InsightBox title="Strong moats correlate with revenue durability" type="highlight">
          <p>
            The three protocols rated &ldquo;strong&rdquo; -- Tether, Aave, and Hyperliquid -- have average durability
            scores of 8.3/10 and collectively generate $13.4B in annualized revenue. Moderate-moat protocols
            average 6.7/10 and show more competitive pressure.
          </p>
        </InsightBox>
      </div>

      {/* ---- Protocol Moat Cards ---- */}
      <div>
        <h3 className="text-lg font-bold text-slate-900 mb-1">
          Individual Protocol Assessments
        </h3>
        <p className="text-sm text-slate-500 mb-6">
          Deep-dive analysis for each top revenue protocol -- moat type, strength, durability, and key risks.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {enrichedMoatAnalysis.map((protocol) => (
            <ProtocolMoatCard
              key={protocol.protocol}
              protocol={protocol}
              isHighlighted={protocol.protocol.includes("Hyperliquid")}
            />
          ))}
        </div>
      </div>

      {/* ---- Hyperliquid deep-dive callout ---- */}
      <Card className="bg-emerald-50 border-emerald-200">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center">
            <span className="text-white text-lg font-bold">H</span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-emerald-900 mb-2">
              Hyperliquid: The fastest moat build in crypto history
            </h3>
            <div className="space-y-2 text-sm text-emerald-800 leading-relaxed">
              <p>
                Hyperliquid went from zero to 35% of onchain perps market share in under a year -- without
                token incentives driving volume. This is nearly unprecedented in DeFi. The key is vertical
                integration: by building its own L1 (HyperEVM), order book, and exchange as a unified stack,
                it delivers latency and UX that modular competitors cannot match.
              </p>
              <p>
                The community airdrop (one of the largest and most successful in crypto) created organic
                distribution without mercenary capital. Users trade on Hyperliquid because the product is
                genuinely better, not because they are farming tokens.
              </p>
              <p className="font-semibold">
                Key question: Can a small validator set and single-chain architecture scale without
                sacrificing the decentralization that gives crypto its regulatory moat?
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* ---- Radar Chart: Moat Dimensions ---- */}
      <Card>
        <div className="mb-6">
          <h3 className="text-lg font-bold text-slate-900">
            Moat Dimensions Comparison
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            Each protocol scored 1-10 across eight moat dimensions. Larger area indicates broader competitive
            advantages.
          </p>
        </div>

        <ChartExport
          data={radarDimensions}
          filename="section4-moat-dimensions-radar"
        >
          <div className="h-[500px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarDimensions}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis
                  dataKey="dimension"
                  tick={{ fontSize: 11, fill: "#64748b" }}
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 10]}
                  tick={{ fontSize: 10, fill: "#94a3b8" }}
                  tickCount={6}
                />
                {Object.entries(radarColors).map(([protocol, color]) => (
                  <Radar
                    key={protocol}
                    name={protocol}
                    dataKey={protocol}
                    stroke={color}
                    fill={color}
                    fillOpacity={0.08}
                    strokeWidth={2}
                  />
                ))}
                <Legend
                  wrapperStyle={{ fontSize: 12, paddingTop: 16 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e2e8f0",
                    borderRadius: "12px",
                    fontSize: "13px",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)",
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </ChartExport>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="text-xs text-slate-500 bg-slate-50 rounded-lg p-3">
            <span className="font-semibold text-slate-700">Network Effects:</span>{" "}
            How much the product improves as more users adopt it.
          </div>
          <div className="text-xs text-slate-500 bg-slate-50 rounded-lg p-3">
            <span className="font-semibold text-slate-700">Switching Costs:</span>{" "}
            How painful it is for users to leave for a competitor.
          </div>
          <div className="text-xs text-slate-500 bg-slate-50 rounded-lg p-3">
            <span className="font-semibold text-slate-700">Vertical Integ.:</span>{" "}
            Degree of control over the full stack (chain, protocol, frontend).
          </div>
          <div className="text-xs text-slate-500 bg-slate-50 rounded-lg p-3">
            <span className="font-semibold text-slate-700">Composability:</span>{" "}
            How deeply integrated the protocol is into the broader DeFi stack.
          </div>
          <div className="text-xs text-slate-500 bg-slate-50 rounded-lg p-3">
            <span className="font-semibold text-slate-700">Distribution:</span>{" "}
            Reach across exchanges, chains, and user bases.
          </div>
          <div className="text-xs text-slate-500 bg-slate-50 rounded-lg p-3">
            <span className="font-semibold text-slate-700">Regulatory:</span>{" "}
            Preparedness for and resilience against regulatory action.
          </div>
        </div>

        <DataSource sources={["DefiLlama (live)", "TokenTerminal (live)"]} />
      </Card>

      {/* ---- Insight boxes: durability conclusions ---- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <InsightBox title="Stablecoins: Most durable" type="highlight">
          <p>
            Tether&apos;s moat is the strongest in crypto. USDT is integrated into 200+ exchanges and every major
            chain. Even a superior competitor cannot overcome the switching costs embedded in trading pairs,
            smart contracts, and OTC desks globally.
          </p>
        </InsightBox>
        <InsightBox title="Lending: Deep but challenged" type="insight">
          <p>
            Aave&apos;s $30B+ TVL and multi-chain composability create a wide moat. However, Morpho&apos;s unbundled
            lending model (0 to 10% share) shows that modular challengers can chip away at monolithic protocols.
            Aave&apos;s governance and security track record remain key differentiators.
          </p>
        </InsightBox>
        <InsightBox title="DEXs: Liquidity is mercenary" type="warning">
          <p>
            Uniswap&apos;s share decline (44% to 16%) is a cautionary tale. Liquidity follows incentives, not loyalty.
            The DEX moat is the weakest category -- aggregators commoditize execution, and new chains spawn
            new incumbent DEXs. Only product innovation (Uni v4, Hyperliquid) can rebuild defensibility.
          </p>
        </InsightBox>
      </div>

      {/* ---- Summary table ---- */}
      <Card>
        <h3 className="text-lg font-bold text-slate-900 mb-1">
          Moat Summary Matrix
        </h3>
        {hasCoinGeckoTokens && (
          <p className="text-sm text-slate-500 mb-4">
            Enriched with live token market cap, FDV, and implied P/S ratios from CoinGecko.
          </p>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Protocol
                </th>
                <th className="text-left py-3 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Revenue
                </th>
                {hasCoinGeckoTokens && (
                  <>
                    <th className="text-left py-3 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Token Price
                    </th>
                    <th className="text-left py-3 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      FDV
                    </th>
                    <th className="text-left py-3 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      P/S
                    </th>
                  </>
                )}
                <th className="text-left py-3 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Share
                </th>
                <th className="text-left py-3 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Moat Type
                </th>
                <th className="text-left py-3 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Strength
                </th>
                <th className="text-left py-3 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Durability
                </th>
              </tr>
            </thead>
            <tbody>
              {enrichedMoatAnalysis.map((p, idx) => {
                const colors = moatStrengthColor(p.moatStrength);
                const isHL = p.protocol.includes("Hyperliquid");
                const impliedPS = p.tokenFDV && p.revenue > 0
                  ? p.tokenFDV / (p.revenue * 1e6)
                  : null;
                return (
                  <tr
                    key={p.protocol}
                    className={`border-b border-slate-50 ${
                      isHL ? "bg-emerald-50/50" : idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"
                    }`}
                  >
                    <td className={`py-3 px-3 font-medium ${isHL ? "text-emerald-900 font-bold" : "text-slate-900"}`}>
                      <div className="flex items-center gap-1.5">
                        {p.protocol.split(" (")[0]}
                        {p.tokenSymbol && (
                          <span className="text-[10px] font-bold text-slate-400 bg-slate-100 rounded px-1 py-0.5">
                            {p.tokenSymbol}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-700 font-medium">
                      ${(p.revenue / 1000).toFixed(1)}B
                    </td>
                    {hasCoinGeckoTokens && (
                      <>
                        <td className="py-3 px-3 text-slate-700">
                          {p.tokenPrice != null ? (
                            <div className="flex items-center gap-1.5">
                              <span className="font-medium">
                                ${p.tokenPrice >= 1
                                  ? p.tokenPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                                  : p.tokenPrice.toFixed(4)}
                              </span>
                              {p.tokenPriceChange24h != null && (
                                <span className={`text-[10px] font-semibold ${p.tokenPriceChange24h >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                                  {p.tokenPriceChange24h >= 0 ? "+" : ""}{p.tokenPriceChange24h.toFixed(1)}%
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-300">--</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-slate-700 font-medium">
                          {p.tokenFDV != null && p.tokenFDV > 0 ? (
                            `$${p.tokenFDV >= 1e9
                              ? `${(p.tokenFDV / 1e9).toFixed(1)}B`
                              : `${(p.tokenFDV / 1e6).toFixed(0)}M`}`
                          ) : (
                            <span className="text-slate-300">--</span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          {impliedPS != null ? (
                            <span className={`font-semibold ${impliedPS > 100 ? "text-red-600" : impliedPS > 30 ? "text-amber-600" : "text-emerald-700"}`}>
                              {impliedPS >= 1000 ? `${(impliedPS / 1000).toFixed(1)}Kx` : `${impliedPS.toFixed(1)}x`}
                            </span>
                          ) : (
                            <span className="text-slate-300">--</span>
                          )}
                        </td>
                      </>
                    )}
                    <td className="py-3 px-3 text-slate-600">{p.marketShare}%</td>
                    <td className="py-3 px-3">
                      <MoatBadge type={p.moatType.split("+")[0].trim()} strength={p.moatStrength} />
                    </td>
                    <td className="py-3 px-3">
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold capitalize ${colors.text}`}>
                        <span className={`w-2 h-2 rounded-full ${colors.dot}`} />
                        {p.moatStrength}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <DurabilityBar score={p.durability} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <DataSource sources={["TokenTerminal (live)", "DefiLlama (live)", "CoinGecko (live)"]} />
      </Card>
    </section>
  );
}
