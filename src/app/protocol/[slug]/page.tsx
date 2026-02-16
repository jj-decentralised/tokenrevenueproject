"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
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
} from "recharts";
import { ArrowLeft } from "lucide-react";
import { useDataContext } from "@/lib/DataContext";
import type {
  LiveProtocolFee,
  LiveCoinGeckoData,
  LiveTokenTerminalData,
  LiveEarningsData,
  LiveProtocolHistory,
  LiveTVLData,
  LiveActivityData,
} from "@/lib/DataContext";
import { moatAnalysis, CHART_COLORS } from "@/lib/data";
import { ChartExport } from "@/components/ui/ChartExport";
import { GlobalNav } from "@/components/ui/GlobalNav";
import {
  Card,
  StatCard,
  SectionHeader,
  DataSource,
  InsightBox,
} from "@/components/ui/Card";

// ============================================================
// Protocol slug mapping
// ============================================================

interface ProtocolMapping {
  defiLlama: string;
  coinGecko: string | null;
  tokenTerminal: string;
  displayName: string;
}

const PROTOCOL_MAP: Record<string, ProtocolMapping> = {
  aave: {
    defiLlama: "aave",
    coinGecko: "aave",
    tokenTerminal: "aave",
    displayName: "Aave",
  },
  uniswap: {
    defiLlama: "uniswap",
    coinGecko: "uniswap",
    tokenTerminal: "uniswap",
    displayName: "Uniswap",
  },
  hyperliquid: {
    defiLlama: "hyperliquid",
    coinGecko: "hyperliquid",
    tokenTerminal: "hyperliquid",
    displayName: "Hyperliquid",
  },
  jupiter: {
    defiLlama: "jupiter",
    coinGecko: "jupiter-exchange-solana",
    tokenTerminal: "jupiter",
    displayName: "Jupiter",
  },
  lido: {
    defiLlama: "lido",
    coinGecko: "lido-dao",
    tokenTerminal: "lido",
    displayName: "Lido",
  },
  raydium: {
    defiLlama: "raydium",
    coinGecko: "raydium",
    tokenTerminal: "raydium",
    displayName: "Raydium",
  },
  tether: {
    defiLlama: "tether",
    coinGecko: "tether",
    tokenTerminal: "tether",
    displayName: "Tether",
  },
  circle: {
    defiLlama: "circle",
    coinGecko: "usd-coin",
    tokenTerminal: "circle",
    displayName: "Circle",
  },
  maker: {
    defiLlama: "maker",
    coinGecko: "maker",
    tokenTerminal: "maker",
    displayName: "MakerDAO",
  },
  ethereum: {
    defiLlama: "ethereum",
    coinGecko: "ethereum",
    tokenTerminal: "ethereum",
    displayName: "Ethereum",
  },
  solana: {
    defiLlama: "solana",
    coinGecko: "solana",
    tokenTerminal: "solana",
    displayName: "Solana",
  },
  base: {
    defiLlama: "base",
    coinGecko: null,
    tokenTerminal: "base",
    displayName: "Base",
  },
  pancakeswap: {
    defiLlama: "pancakeswap",
    coinGecko: "pancakeswap-token",
    tokenTerminal: "pancakeswap",
    displayName: "PancakeSwap",
  },
  "curve-finance": {
    defiLlama: "curve-finance",
    coinGecko: "curve-dao-token",
    tokenTerminal: "curve",
    displayName: "Curve Finance",
  },
  aerodrome: {
    defiLlama: "aerodrome",
    coinGecko: "aerodrome-finance",
    tokenTerminal: "aerodrome",
    displayName: "Aerodrome",
  },
  compound: {
    defiLlama: "compound",
    coinGecko: "compound-governance-token",
    tokenTerminal: "compound",
    displayName: "Compound",
  },
  morpho: {
    defiLlama: "morpho",
    coinGecko: "morpho",
    tokenTerminal: "morpho",
    displayName: "Morpho",
  },
  gmx: {
    defiLlama: "gmx",
    coinGecko: "gmx",
    tokenTerminal: "gmx",
    displayName: "GMX",
  },
  dydx: {
    defiLlama: "dydx",
    coinGecko: "dydx-chain",
    tokenTerminal: "dydx",
    displayName: "dYdX",
  },
  jito: {
    defiLlama: "jito",
    coinGecko: "jito-governance-token",
    tokenTerminal: "jito",
    displayName: "Jito",
  },
  ethena: {
    defiLlama: "ethena",
    coinGecko: "ethena",
    tokenTerminal: "ethena",
    displayName: "Ethena",
  },
  tron: {
    defiLlama: "tron",
    coinGecko: "tron",
    tokenTerminal: "tron",
    displayName: "Tron",
  },
  avalanche: {
    defiLlama: "avalanche",
    coinGecko: "avalanche-2",
    tokenTerminal: "avalanche",
    displayName: "Avalanche",
  },
  arbitrum: {
    defiLlama: "arbitrum",
    coinGecko: "arbitrum",
    tokenTerminal: "arbitrum",
    displayName: "Arbitrum",
  },
  optimism: {
    defiLlama: "optimism",
    coinGecko: "optimism",
    tokenTerminal: "optimism",
    displayName: "Optimism",
  },
  polygon: {
    defiLlama: "polygon",
    coinGecko: "matic-network",
    tokenTerminal: "polygon",
    displayName: "Polygon",
  },
  synthetix: {
    defiLlama: "synthetix",
    coinGecko: "havven",
    tokenTerminal: "synthetix",
    displayName: "Synthetix",
  },
  sushiswap: {
    defiLlama: "sushiswap",
    coinGecko: "sushi",
    tokenTerminal: "sushiswap",
    displayName: "SushiSwap",
  },
  "rocket-pool": {
    defiLlama: "rocket-pool",
    coinGecko: "rocket-pool",
    tokenTerminal: "rocket-pool",
    displayName: "Rocket Pool",
  },
};

// ============================================================
// Number formatting helpers
// ============================================================

function formatUSD(value: number): string {
  if (value === 0) return "$0";
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs >= 1e9) return `${sign}$${(abs / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${sign}$${(abs / 1e3).toFixed(2)}K`;
  return `${sign}$${abs.toFixed(2)}`;
}

function formatUSDCompact(value: number): string {
  if (value === 0) return "$0";
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs >= 1e9) return `${sign}$${(abs / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `${sign}$${(abs / 1e3).toFixed(1)}K`;
  return `${sign}$${abs.toFixed(0)}`;
}

function formatPercent(value: number | null | undefined): string {
  if (value == null) return "N/A";
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

function formatChartDate(timestamp: number): string {
  const d = new Date(timestamp * 1000);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatChartDateShort(timestamp: number): string {
  const d = new Date(timestamp * 1000);
  return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}

// ============================================================
// Custom tooltip for charts
// ============================================================

interface ChartTooltipPayloadItem {
  name: string;
  value: number;
  color: string;
  dataKey: string;
}

function WSJTooltip({
  active,
  payload,
  label,
  valueFormatter,
}: {
  active?: boolean;
  payload?: ChartTooltipPayloadItem[];
  label?: string;
  valueFormatter?: (v: number) => string;
}) {
  if (!active || !payload?.length) return null;
  const fmt = valueFormatter || formatUSDCompact;
  return (
    <div
      className="bg-white border border-[#d4d4d4] p-3"
      style={{ borderRadius: 0, boxShadow: "none", fontSize: "12px" }}
    >
      <p
        className="font-serif font-bold text-[#111111] mb-1"
        style={{ fontSize: "13px" }}
      >
        {label}
      </p>
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color }} className="text-[12px]">
          {entry.name}: <span className="font-semibold">{fmt(entry.value)}</span>
        </p>
      ))}
    </div>
  );
}

// ============================================================
// Slug helper
// ============================================================

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

// ============================================================
// Dynamic protocol mapping builder
// ============================================================

function buildDynamicMapping(
  slug: string,
  ctx: {
    fees?: { protocols: LiveProtocolFee[] } | null;
    coinGecko?: LiveCoinGeckoData | null;
  }
): ProtocolMapping | null {
  if (!ctx.fees?.protocols) return null;

  // Search DefiLlama protocols for one whose slugified name matches the slug
  const matched = ctx.fees.protocols.find((p) => {
    return (
      slugify(p.name) === slug ||
      slugify(p.displayName) === slug ||
      p.name.toLowerCase() === slug ||
      p.displayName.toLowerCase() === slug
    );
  });

  if (!matched) return null;

  // Try to find a CoinGecko token by matching the protocol name
  let coinGeckoId: string | null = null;
  if (ctx.coinGecko?.tokens) {
    const cgMatch = ctx.coinGecko.tokens.find(
      (t) =>
        t.name.toLowerCase() === matched.name.toLowerCase() ||
        t.name.toLowerCase() === matched.displayName.toLowerCase() ||
        t.id.toLowerCase() === slug ||
        t.symbol.toLowerCase() === slug
    );
    if (cgMatch) {
      coinGeckoId = cgMatch.id;
    }
  }

  return {
    defiLlama: matched.name,
    coinGecko: coinGeckoId,
    tokenTerminal: slugify(matched.name),
    displayName: matched.displayName || matched.name,
  };
}

// ============================================================
// Data lookup helpers
// ============================================================

function findDefiLlamaProtocol(
  protocols: LiveProtocolFee[] | undefined,
  defiLlamaName: string
): LiveProtocolFee | null {
  if (!protocols) return null;
  const target = defiLlamaName.toLowerCase();
  const targetSlug = slugify(defiLlamaName);
  return (
    protocols.find(
      (p) =>
        p.name.toLowerCase() === target ||
        p.displayName.toLowerCase() === target ||
        slugify(p.name) === targetSlug ||
        slugify(p.displayName) === targetSlug
    ) ?? null
  );
}

function findCoinGeckoToken(
  data: LiveCoinGeckoData | null,
  coinGeckoId: string | null,
  fallbackName?: string
) {
  if (!data?.tokens) return null;
  if (coinGeckoId) {
    const byId = data.tokens.find(
      (t) => t.id.toLowerCase() === coinGeckoId.toLowerCase()
    );
    if (byId) return byId;
  }
  // Fallback: try matching by token name (case-insensitive)
  if (fallbackName) {
    const target = fallbackName.toLowerCase();
    return (
      data.tokens.find(
        (t) =>
          t.name.toLowerCase() === target ||
          t.symbol.toLowerCase() === target
      ) ?? null
    );
  }
  return null;
}

function findTokenTerminalProtocol(
  data: LiveTokenTerminalData | null,
  projectId: string
) {
  if (!data?.protocols) return null;
  return (
    data.protocols.find(
      (p) => p.project_id.toLowerCase() === projectId.toLowerCase()
    ) ?? null
  );
}

function findEarningsProtocol(
  data: LiveEarningsData | null,
  projectId: string
) {
  if (!data?.protocols) return null;
  return (
    data.protocols.find(
      (p) =>
        p.id.toLowerCase() === projectId.toLowerCase() ||
        p.name.toLowerCase() === projectId.toLowerCase()
    ) ?? null
  );
}

function findProtocolHistory(
  data: LiveProtocolHistory | null,
  name: string
) {
  if (!data?.protocols) return null;
  return (
    data.protocols.find(
      (p) => p.name.toLowerCase() === name.toLowerCase()
    ) ?? null
  );
}

function findTVLProtocol(data: LiveTVLData | null, name: string) {
  // Prefer allProtocolsTVL which includes mcap field
  const source = data?.allProtocolsTVL ?? data?.topProtocols ?? [];
  if (source.length === 0) return null;
  return (
    source.find(
      (p) => p.name.toLowerCase() === name.toLowerCase()
    ) ?? null
  );
}

function findActivityProtocol(data: LiveActivityData | null, name: string) {
  if (!data?.topProtocolsByUsers) return null;
  return (
    data.topProtocolsByUsers.find(
      (p) => p.name.toLowerCase() === name.toLowerCase()
    ) ?? null
  );
}

function findMoatAnalysis(displayName: string) {
  return (
    moatAnalysis.find((m) => {
      const short = m.protocol.split(" (")[0];
      return short.toLowerCase() === displayName.toLowerCase();
    }) ?? null
  );
}

// ============================================================
// Sub-components
// ============================================================

function CategoryBadge({ category }: { category: string }) {
  return (
    <span
      className="badge-blue"
      style={{ fontSize: "11px", letterSpacing: "0.06em" }}
    >
      {category}
    </span>
  );
}

function ChangeIndicator({
  value,
  label,
}: {
  value: number | null | undefined;
  label?: string;
}) {
  if (value == null) return null;
  const isPositive = value >= 0;
  return (
    <span
      className={`text-[13px] font-medium ${
        isPositive ? "text-[#2e7d32]" : "text-[#9e2b25]"
      }`}
    >
      {formatPercent(value)}
      {label && <span className="text-[#999999] ml-1">{label}</span>}
    </span>
  );
}

function MoatStrengthBar({ strength }: { strength: string }) {
  const width =
    strength === "strong" ? "100%" : strength === "moderate" ? "66%" : "33%";
  const color =
    strength === "strong"
      ? "#2e7d32"
      : strength === "moderate"
      ? "#c67100"
      : "#9e2b25";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-[#e8e8e8]">
        <div className="h-full" style={{ width, backgroundColor: color }} />
      </div>
      <span
        className="text-[11px] font-semibold uppercase"
        style={{ color, letterSpacing: "0.06em" }}
      >
        {strength}
      </span>
    </div>
  );
}

// ============================================================
// Main Protocol Profile Page
// ============================================================

export default function ProtocolProfilePage() {
  const params = useParams();
  const slug = typeof params.slug === "string" ? params.slug : "";
  const ctx = useDataContext();

  const mapping = useMemo(
    () => PROTOCOL_MAP[slug] ?? buildDynamicMapping(slug, ctx),
    [slug, ctx]
  );

  // ---- Gather all data sources for this protocol ----

  const defiLlamaData = useMemo(
    () =>
      mapping
        ? findDefiLlamaProtocol(ctx.fees?.protocols, mapping.defiLlama)
        : null,
    [ctx.fees, mapping]
  );

  const coinGeckoToken = useMemo(
    () =>
      mapping
        ? findCoinGeckoToken(ctx.coinGecko, mapping.coinGecko, mapping.displayName)
        : null,
    [ctx.coinGecko, mapping]
  );

  const tokenTerminalData = useMemo(
    () =>
      mapping
        ? findTokenTerminalProtocol(ctx.tokenTerminal, mapping.tokenTerminal)
        : null,
    [ctx.tokenTerminal, mapping]
  );

  const earningsData = useMemo(
    () =>
      mapping
        ? findEarningsProtocol(ctx.earnings, mapping.tokenTerminal)
        : null,
    [ctx.earnings, mapping]
  );

  const historyData = useMemo(
    () =>
      mapping
        ? findProtocolHistory(ctx.protocolHistory, mapping.defiLlama)
        : null,
    [ctx.protocolHistory, mapping]
  );

  const tvlData = useMemo(
    () => (mapping ? findTVLProtocol(ctx.tvl, mapping.defiLlama) : null),
    [ctx.tvl, mapping]
  );

  const activityData = useMemo(
    () =>
      mapping ? findActivityProtocol(ctx.activity, mapping.defiLlama) : null,
    [ctx.activity, mapping]
  );

  const moatData = useMemo(
    () => (mapping ? findMoatAnalysis(mapping.displayName) : null),
    [mapping]
  );

  // ---- Derived values ----

  const annualizedRevenue = useMemo(() => {
    if (defiLlamaData?.revenue24h && defiLlamaData.revenue24h > 0) {
      return defiLlamaData.revenue24h * 365;
    }
    if (defiLlamaData?.total24h && defiLlamaData.total24h > 0) {
      return defiLlamaData.total24h * 365;
    }
    return null;
  }, [defiLlamaData]);

  // Market cap & FDV: CoinGecko → DefiLlama TVL endpoint fallback
  const marketCap = coinGeckoToken?.marketCap ?? (tvlData as any)?.mcap ?? null;
  const fdv = coinGeckoToken?.fullyDilutedValuation ?? (tvlData as any)?.fdv ?? null;

  const psRatio = useMemo(() => {
    if (fdv && annualizedRevenue && annualizedRevenue > 0) {
      return fdv / annualizedRevenue;
    }
    if (marketCap && annualizedRevenue && annualizedRevenue > 0) {
      return marketCap / annualizedRevenue;
    }
    return null;
  }, [fdv, marketCap, annualizedRevenue]);

  // ---- Revenue chart data from protocol history ----

  const revenueChartData = useMemo(() => {
    if (!historyData?.history || historyData.history.length === 0) return [];
    return historyData.history
      .filter((h) => h.date && (h.fees > 0 || h.revenue > 0))
      .sort((a, b) => a.date - b.date)
      .map((h) => ({
        date: h.date,
        dateLabel: formatChartDate(h.date),
        fees: h.fees,
        revenue: h.revenue,
      }));
  }, [historyData]);

  // ---- Earnings chart data ----

  const earningsChartData = useMemo(() => {
    if (!earningsData?.revenueHistory || earningsData.revenueHistory.length === 0)
      return [];
    return earningsData.revenueHistory.map((h) => ({
      date: h.date,
      revenue: h.revenue,
      earnings: h.earnings,
      margin: h.margin,
    }));
  }, [earningsData]);

  // ---- TokenTerminal latest fees for differential ----

  const ttLatestFees = useMemo(() => {
    if (!tokenTerminalData?.metrics) return null;
    const feeMetrics = tokenTerminalData.metrics
      .filter((m) => m.metric_id === "fees" || m.metric_id === "revenue")
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    if (feeMetrics.length === 0) return null;
    return feeMetrics[0].value;
  }, [tokenTerminalData]);

  // ============================================================
  // All available protocols from live data (for not-found page)
  // ============================================================

  const allLiveProtocols = useMemo(() => {
    if (!ctx.fees?.protocols) return [];
    return [...ctx.fees.protocols]
      .filter((p) => (p.revenue24h ?? p.total24h ?? 0) > 0)
      .sort(
        (a, b) =>
          (b.revenue24h ?? b.total24h ?? 0) - (a.revenue24h ?? a.total24h ?? 0)
      );
  }, [ctx.fees]);

  // ============================================================
  // Loading state
  // ============================================================

  if (ctx.isLoading) {
    return (
      <div className="min-h-screen">
        <GlobalNav />
        <div className="flex items-center justify-center pt-24">
          <div className="text-center">
            <p
              className="font-serif font-bold text-[#111111] mb-2"
              style={{ fontSize: "24px" }}
            >
              Loading protocol data...
            </p>
            <p className="text-[13px] text-[#999999]">
              Fetching from DefiLlama, CoinGecko, and TokenTerminal
            </p>
            <div className="mt-6 flex justify-center">
              <div
                className="w-8 h-0.5 bg-[#0274B6] animate-pulse"
                style={{ animationDuration: "1.5s" }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // Protocol not found
  // ============================================================

  if (!mapping) {
    const topProtocols = allLiveProtocols.slice(0, 50);
    const totalCount = allLiveProtocols.length;

    return (
      <div className="min-h-screen">
        <GlobalNav />
        <div className="max-w-3xl pt-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-[13px] text-[#0274B6] hover:text-[#014d7a] font-medium transition-colors mb-8"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Overview
          </Link>
          <h1
            className="font-serif font-bold text-[#111111] mt-6"
            style={{ fontSize: "32px", lineHeight: "1.15" }}
          >
            Protocol not found
          </h1>
          <p className="text-[14px] text-[#666666] mt-3" style={{ lineHeight: "1.5" }}>
            No protocol matches the slug &ldquo;{slug}&rdquo;.
          </p>

          {/* Curated protocols */}
          <h2
            className="font-serif font-bold text-[#111111] mt-8 mb-3"
            style={{ fontSize: "20px" }}
          >
            Featured Protocols
          </h2>
          <div className="flex flex-wrap gap-2">
            {Object.entries(PROTOCOL_MAP).map(([key, val]) => (
              <Link
                key={key}
                href={`/protocol/${key}`}
                className="badge-blue hover:opacity-80 transition-opacity"
                style={{ fontSize: "12px" }}
              >
                {val.displayName}
              </Link>
            ))}
          </div>

          {/* All live protocols from DefiLlama */}
          <h2
            className="font-serif font-bold text-[#111111] mt-10 mb-1"
            style={{ fontSize: "20px" }}
          >
            All Protocols by Revenue
          </h2>
          <p className="text-[13px] text-[#999999] mb-4">
            Showing top 50 of {totalCount.toLocaleString()} protocols from
            DefiLlama (sorted by daily revenue).
          </p>
          <hr className="wsj-rule mb-4" />

          {topProtocols.length === 0 ? (
            <p className="text-[13px] text-[#999999]">
              No live protocol data available yet. Please wait for data to load.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {topProtocols.map((p, i) => {
                const pSlug = slugify(p.name);
                const dailyRev = p.revenue24h ?? p.total24h ?? 0;
                return (
                  <Link
                    key={pSlug + i}
                    href={`/protocol/${pSlug}`}
                    className="flex items-center justify-between px-3 py-2 border border-[#e8e8e8] hover:border-[#999999] transition-colors group"
                    style={{ borderRadius: 0 }}
                  >
                    <span className="text-[13px] text-[#111111] group-hover:text-[#0274B6] transition-colors font-medium">
                      <span className="text-[11px] text-[#999999] mr-2 font-normal">
                        {i + 1}.
                      </span>
                      {p.displayName || p.name}
                    </span>
                    <span className="text-[12px] text-[#666666] font-mono">
                      {formatUSDCompact(dailyRev)}/d
                    </span>
                  </Link>
                );
              })}
            </div>
          )}

          {totalCount > 50 && (
            <p className="text-[12px] text-[#999999] mt-4">
              ...and {(totalCount - 50).toLocaleString()} more protocols
              available. Navigate to any protocol by visiting{" "}
              <code className="text-[#0274B6]">/protocol/protocol-name</code>.
            </p>
          )}
        </div>
      </div>
    );
  }

  // ============================================================
  // Render full protocol profile
  // ============================================================

  const displayName = mapping.displayName;
  const category = defiLlamaData?.category ?? "Protocol";

  // ---- Peer protocols in same category ----
  const peerProtocols = useMemo(() => {
    if (!defiLlamaData?.category || !ctx.fees?.protocols) return [];
    return ctx.fees.protocols
      .filter(
        (p) =>
          p.category === defiLlamaData.category &&
          p.name.toLowerCase() !== defiLlamaData.name.toLowerCase() &&
          p.total24h > 0,
      )
      .sort((a, b) => b.total24h - a.total24h)
      .slice(0, 10);
  }, [ctx.fees, defiLlamaData]);

  return (
    <div className="min-h-screen pb-24">
      <GlobalNav />

      {/* ============================================ */}
      {/* 1. HEADER                                    */}
      {/* ============================================ */}
      <header className="pt-6 pb-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-[13px] text-[#0274B6] hover:text-[#014d7a] font-medium transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Overview
        </Link>

        <div className="mt-6 flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1
                className="font-serif font-bold text-[#111111]"
                style={{ fontSize: "36px", lineHeight: "1.1" }}
              >
                {displayName}
              </h1>
              <CategoryBadge category={category} />
            </div>
            {coinGeckoToken && (
              <p className="text-[13px] text-[#999999]">
                {coinGeckoToken.symbol.toUpperCase()} &middot; ${" "}
                {coinGeckoToken.currentPrice >= 1
                  ? coinGeckoToken.currentPrice.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })
                  : coinGeckoToken.currentPrice.toFixed(4)}{" "}
                <ChangeIndicator value={coinGeckoToken.priceChange24h} label="24h" />
              </p>
            )}
            {defiLlamaData?.chains && defiLlamaData.chains.length > 0 && (
              <p className="text-[12px] text-[#999999] mt-1">
                Chains: {defiLlamaData.chains.slice(0, 6).join(", ")}
                {defiLlamaData.chains.length > 6 &&
                  ` +${defiLlamaData.chains.length - 6} more`}
              </p>
            )}
          </div>

          {/* Right side: live indicator */}
          {ctx.isLive && (
            <div className="flex items-center gap-1.5 text-[11px] text-[#2e7d32] font-medium">
              <span className="w-1.5 h-1.5 bg-[#2e7d32] animate-pulse" />
              Live data
            </div>
          )}
        </div>

        <hr className="wsj-rule-heavy mt-6" />
      </header>

      {/* ============================================ */}
      {/* 2. KEY STATS ROW                             */}
      {/* ============================================ */}
      <section className="mb-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Annualized Revenue"
            value={annualizedRevenue ? formatUSDCompact(annualizedRevenue) : "N/A"}
            subvalue={
              defiLlamaData?.revenue24h
                ? `${formatUSDCompact(defiLlamaData.revenue24h)} daily revenue`
                : defiLlamaData?.total24h
                ? `${formatUSDCompact(defiLlamaData.total24h)} daily fees`
                : undefined
            }
          />
          <StatCard
            label="Market Cap"
            value={marketCap ? formatUSDCompact(marketCap) : "N/A"}
            subvalue={fdv ? `FDV: ${formatUSDCompact(fdv)}` : undefined}
          />
          <StatCard
            label="Price-to-Sales"
            value={psRatio ? `${psRatio.toFixed(1)}x` : "N/A"}
            subvalue={
              psRatio
                ? psRatio > 100
                  ? "High valuation"
                  : psRatio > 30
                  ? "Moderate valuation"
                  : "Reasonable valuation"
                : undefined
            }
            changeType={
              psRatio
                ? psRatio > 100
                  ? "negative"
                  : psRatio > 30
                  ? "neutral"
                  : "positive"
                : "neutral"
            }
          />
          <StatCard
            label="24h Change"
            value={formatPercent(defiLlamaData?.change_1d)}
            subvalue={
              defiLlamaData?.change_7d != null
                ? `7d: ${formatPercent(defiLlamaData.change_7d)}`
                : undefined
            }
            changeType={
              defiLlamaData?.change_1d != null
                ? defiLlamaData.change_1d >= 0
                  ? "positive"
                  : "negative"
                : "neutral"
            }
          />
        </div>

        {/* FDV-based metrics row (only for protocols with tokens) */}
        {mapping.coinGecko && coinGeckoToken && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
            <StatCard
              label="Fully Diluted Valuation"
              value={fdv ? formatUSDCompact(fdv) : "N/A"}
              subvalue={marketCap ? `MCap: ${formatUSDCompact(marketCap)}` : undefined}
            />
            <StatCard
              label="MCap / FDV"
              value={
                marketCap && fdv && fdv > 0
                  ? `${((marketCap / fdv) * 100).toFixed(0)}%`
                  : "N/A"
              }
              subvalue={
                marketCap && fdv && fdv > 0
                  ? `${((marketCap / fdv) * 100).toFixed(0)}% of tokens circulating`
                  : undefined
              }
              changeType={
                marketCap && fdv && fdv > 0
                  ? (marketCap / fdv) >= 0.5
                    ? "positive"
                    : "neutral"
                  : "neutral"
              }
            />
            <StatCard
              label="Rev / FDV"
              value={
                annualizedRevenue && fdv && fdv > 0
                  ? `${((annualizedRevenue / fdv) * 100).toFixed(2)}%`
                  : "N/A"
              }
              subvalue={
                annualizedRevenue && fdv && fdv > 0
                  ? "Revenue yield on fully diluted basis"
                  : undefined
              }
              changeType={
                annualizedRevenue && fdv && fdv > 0
                  ? (annualizedRevenue / fdv) >= 0.05
                    ? "positive"
                    : (annualizedRevenue / fdv) >= 0.01
                    ? "neutral"
                    : "negative"
                  : "neutral"
              }
            />
          </div>
        )}

        {/* Extra stats row: TVL and activity if available */}
        {(tvlData || activityData) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
            {tvlData && (
              <StatCard
                label="Total Value Locked"
                value={formatUSDCompact(tvlData.tvl)}
                subvalue={tvlData.category || undefined}
              />
            )}
            {activityData && (
              <StatCard
                label="24h Volume"
                value={formatUSDCompact(activityData.volume24h)}
                change={
                  activityData.change7d != null
                    ? `${formatPercent(activityData.change7d)} 7d`
                    : undefined
                }
                changeType={
                  activityData.change7d != null
                    ? activityData.change7d >= 0
                      ? "positive"
                      : "negative"
                    : "neutral"
                }
              />
            )}
            {defiLlamaData?.total7d != null && defiLlamaData.total7d > 0 && (
              <StatCard
                label="7d Fees"
                value={formatUSDCompact(defiLlamaData.total7d)}
                subvalue={
                  defiLlamaData.total30d
                    ? `30d: ${formatUSDCompact(defiLlamaData.total30d)}`
                    : undefined
                }
              />
            )}
            {defiLlamaData?.totalAllTime != null &&
              defiLlamaData.totalAllTime > 0 && (
                <StatCard
                  label="All-Time Fees"
                  value={formatUSDCompact(defiLlamaData.totalAllTime)}
                />
              )}
          </div>
        )}
      </section>

      {/* ============================================ */}
      {/* 2b. INCOME STATEMENT (enriched DefiLlama)    */}
      {/* ============================================ */}
      {defiLlamaData && defiLlamaData.total24h > 0 && (
        <section className="mb-12">
          <h2
            className="font-serif font-bold text-[#111111] mb-1"
            style={{ fontSize: "22px", lineHeight: "1.2" }}
          >
            Income Statement
          </h2>
          <p className="text-[13px] text-[#666666] mb-4" style={{ lineHeight: "1.5" }}>
            Fee breakdown: what users pay vs. what the protocol keeps vs. what goes to token holders.
          </p>
          <hr className="wsj-rule mb-6" />

          <Card>
            <div className="overflow-x-auto">
              <table className="financial-table w-full text-left">
                <thead>
                  <tr>
                    <th>Metric</th>
                    <th style={{ textAlign: "right" }}>24h</th>
                    <th style={{ textAlign: "right" }}>7d</th>
                    <th style={{ textAlign: "right" }}>30d</th>
                    <th style={{ textAlign: "right" }}>Annualized</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="font-medium text-[#111111]">Total Fees</td>
                    <td style={{ textAlign: "right" }}>{formatUSD(defiLlamaData.total24h)}</td>
                    <td style={{ textAlign: "right" }}>{defiLlamaData.total7d > 0 ? formatUSD(defiLlamaData.total7d) : "\u2014"}</td>
                    <td style={{ textAlign: "right" }}>{defiLlamaData.total30d > 0 ? formatUSD(defiLlamaData.total30d) : "\u2014"}</td>
                    <td style={{ textAlign: "right", fontWeight: 600 }}>{formatUSD(defiLlamaData.total24h * 365)}</td>
                  </tr>
                  {defiLlamaData.revenue24h != null && (
                    <tr>
                      <td className="font-medium text-[#111111]">Protocol Revenue</td>
                      <td style={{ textAlign: "right" }}>{formatUSD(defiLlamaData.revenue24h)}</td>
                      <td style={{ textAlign: "right" }}>{defiLlamaData.revenue7d != null ? formatUSD(defiLlamaData.revenue7d) : "\u2014"}</td>
                      <td style={{ textAlign: "right" }}>{defiLlamaData.revenue30d != null ? formatUSD(defiLlamaData.revenue30d) : "\u2014"}</td>
                      <td style={{ textAlign: "right", fontWeight: 600 }}>{formatUSD(defiLlamaData.revenue24h * 365)}</td>
                    </tr>
                  )}
                  {defiLlamaData.revenue24h != null && (
                    <tr>
                      <td className="font-medium text-[#999999]">Supply-Side Fees</td>
                      <td style={{ textAlign: "right", color: "#999999" }}>
                        {formatUSD(defiLlamaData.total24h - defiLlamaData.revenue24h)}
                      </td>
                      <td style={{ textAlign: "right", color: "#999999" }}>{"\u2014"}</td>
                      <td style={{ textAlign: "right", color: "#999999" }}>{"\u2014"}</td>
                      <td style={{ textAlign: "right", color: "#999999" }}>
                        {formatUSD((defiLlamaData.total24h - defiLlamaData.revenue24h) * 365)}
                      </td>
                    </tr>
                  )}
                  {defiLlamaData.holdersRevenue24h != null && defiLlamaData.holdersRevenue24h > 0 && (
                    <tr>
                      <td className="font-medium text-[#111111]">Holders Revenue</td>
                      <td style={{ textAlign: "right" }}>{formatUSD(defiLlamaData.holdersRevenue24h)}</td>
                      <td style={{ textAlign: "right" }}>{"\u2014"}</td>
                      <td style={{ textAlign: "right" }}>{"\u2014"}</td>
                      <td style={{ textAlign: "right", fontWeight: 600 }}>{formatUSD(defiLlamaData.holdersRevenue24h * 365)}</td>
                    </tr>
                  )}
                  {defiLlamaData.margin != null && (
                    <tr>
                      <td className="font-medium text-[#111111]">Margin (Revenue / Fees)</td>
                      <td
                        colSpan={4}
                        style={{
                          textAlign: "right",
                          fontWeight: 700,
                          color: Math.min(defiLlamaData.margin, 1) >= 0.5 ? "#2e7d32" : Math.min(defiLlamaData.margin, 1) >= 0.2 ? "#c67100" : "#9e2b25",
                        }}
                      >
                        {(Math.min(Math.max(defiLlamaData.margin, -1), 1) * 100).toFixed(1)}%
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {defiLlamaData.totalAllTime != null && defiLlamaData.totalAllTime > 0 && (
              <p className="text-[12px] text-[#999999] mt-3">
                Cumulative all-time fees: {formatUSDCompact(defiLlamaData.totalAllTime)}
                {defiLlamaData.total1y != null && defiLlamaData.total1y > 0 &&
                  ` | Trailing 1Y fees: ${formatUSDCompact(defiLlamaData.total1y)}`}
              </p>
            )}

            <DataSource sources={["DefiLlama (live fees + revenue + holders)"]} />
          </Card>
        </section>
      )}

      {/* ============================================ */}
      {/* 2c. METHODOLOGY                              */}
      {/* ============================================ */}
      {defiLlamaData?.methodology && Object.keys(defiLlamaData.methodology).length > 0 && (
        <section className="mb-12">
          <h2
            className="font-serif font-bold text-[#111111] mb-1"
            style={{ fontSize: "22px", lineHeight: "1.2" }}
          >
            Fee Methodology
          </h2>
          <p className="text-[13px] text-[#666666] mb-4" style={{ lineHeight: "1.5" }}>
            How DefiLlama calculates fees and revenue for {displayName}.
          </p>
          <hr className="wsj-rule mb-6" />

          <Card>
            <div className="space-y-3">
              {Object.entries(defiLlamaData.methodology).map(([key, value]) => (
                <div key={key}>
                  <p
                    style={{
                      fontSize: "11px",
                      fontWeight: 600,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: "#999999",
                      marginBottom: 2,
                    }}
                  >
                    {key}
                  </p>
                  <p style={{ fontSize: "13px", color: "#333333", lineHeight: "1.5" }}>
                    {value}
                  </p>
                </div>
              ))}
            </div>
            <DataSource sources={["DefiLlama"]} />
          </Card>
        </section>
      )}

      {/* ============================================ */}
      {/* 3. REVENUE CHART                             */}
      {/* ============================================ */}
      {revenueChartData.length > 0 && (
        <section className="mb-12">
          <h2
            className="font-serif font-bold text-[#111111] mb-1"
            style={{ fontSize: "22px", lineHeight: "1.2" }}
          >
            Fee &amp; Revenue History
          </h2>
          <p className="text-[13px] text-[#666666] mb-4" style={{ lineHeight: "1.5" }}>
            Daily fees and protocol revenue from DefiLlama historical data.
          </p>
          <hr className="wsj-rule mb-6" />

          <Card>
            <ChartExport
              data={revenueChartData.map((d) => ({
                date: new Date(d.date * 1000).toISOString().split("T")[0],
                fees: d.fees,
                revenue: d.revenue,
              }))}
              filename={`${slug}-revenue-history`}
            >
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={revenueChartData}
                    margin={{ top: 10, right: 10, bottom: 0, left: 10 }}
                  >
                    <CartesianGrid
                      strokeDasharray="none"
                      stroke="#e8e8e8"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="date"
                      tickFormatter={formatChartDateShort}
                      tick={{ fontSize: 11, fill: "#999999" }}
                      axisLine={{ stroke: "#d4d4d4" }}
                      tickLine={false}
                      minTickGap={40}
                    />
                    <YAxis
                      tickFormatter={(v: number) => formatUSDCompact(v)}
                      tick={{ fontSize: 11, fill: "#999999" }}
                      axisLine={false}
                      tickLine={false}
                      width={60}
                    />
                    <Tooltip
                      content={
                        <WSJTooltip
                          valueFormatter={formatUSD}
                        />
                      }
                      labelFormatter={(label: number) =>
                        new Date(label * 1000).toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })
                      }
                    />
                    <Legend
                      wrapperStyle={{
                        fontSize: "11px",
                        fontFamily: "Inter, system-ui, sans-serif",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="fees"
                      name="Fees"
                      stroke={CHART_COLORS.primary}
                      fill={CHART_COLORS.primary}
                      fillOpacity={0.08}
                      strokeWidth={1.5}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      name="Revenue"
                      stroke={CHART_COLORS.quaternary}
                      fill={CHART_COLORS.quaternary}
                      fillOpacity={0.08}
                      strokeWidth={1.5}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </ChartExport>
            <DataSource sources={["DefiLlama Protocol History"]} />
          </Card>
        </section>
      )}

      {/* ============================================ */}
      {/* 4. PRICE / TOKEN INFO (CoinGecko)            */}
      {/* ============================================ */}
      {coinGeckoToken && (
        <section className="mb-12">
          <h2
            className="font-serif font-bold text-[#111111] mb-1"
            style={{ fontSize: "22px", lineHeight: "1.2" }}
          >
            Token Market Data
          </h2>
          <p className="text-[13px] text-[#666666] mb-4" style={{ lineHeight: "1.5" }}>
            Live token data from CoinGecko.
          </p>
          <hr className="wsj-rule mb-6" />

          <Card>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="stat-label">Current Price</p>
                <p className="stat-value mt-1">
                  $
                  {coinGeckoToken.currentPrice >= 1
                    ? coinGeckoToken.currentPrice.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })
                    : coinGeckoToken.currentPrice.toFixed(4)}
                </p>
              </div>
              <div>
                <p className="stat-label">24h Volume</p>
                <p className="stat-value mt-1">
                  {formatUSDCompact(coinGeckoToken.totalVolume24h)}
                </p>
              </div>
              <div>
                <p className="stat-label">Market Cap</p>
                <p className="stat-value mt-1">
                  {formatUSDCompact(coinGeckoToken.marketCap)}
                </p>
              </div>
              <div>
                <p className="stat-label">Fully Diluted Val.</p>
                <p className="stat-value mt-1">
                  {coinGeckoToken.fullyDilutedValuation
                    ? formatUSDCompact(coinGeckoToken.fullyDilutedValuation)
                    : "N/A"}
                </p>
              </div>
            </div>

            {/* Price change row */}
            <hr className="wsj-rule my-4" />
            <div className="grid grid-cols-3 gap-6">
              <div>
                <p className="stat-label">24h Change</p>
                <p
                  className={`text-[18px] font-bold font-serif mt-1 ${
                    coinGeckoToken.priceChange24h >= 0
                      ? "text-[#2e7d32]"
                      : "text-[#9e2b25]"
                  }`}
                >
                  {formatPercent(coinGeckoToken.priceChange24h)}
                </p>
              </div>
              <div>
                <p className="stat-label">7d Change</p>
                <p
                  className={`text-[18px] font-bold font-serif mt-1 ${
                    coinGeckoToken.priceChange7d >= 0
                      ? "text-[#2e7d32]"
                      : "text-[#9e2b25]"
                  }`}
                >
                  {formatPercent(coinGeckoToken.priceChange7d)}
                </p>
              </div>
              <div>
                <p className="stat-label">30d Change</p>
                <p
                  className={`text-[18px] font-bold font-serif mt-1 ${
                    coinGeckoToken.priceChange30d >= 0
                      ? "text-[#2e7d32]"
                      : "text-[#9e2b25]"
                  }`}
                >
                  {formatPercent(coinGeckoToken.priceChange30d)}
                </p>
              </div>
            </div>

            <DataSource sources={["CoinGecko"]} />
          </Card>
        </section>
      )}

      {/* ============================================ */}
      {/* 4b. TOKEN ECONOMICS INSIGHT                  */}
      {/* ============================================ */}
      {coinGeckoToken && coinGeckoToken.fullyDilutedValuation && (
        <section className="mb-12">
          <InsightBox title="Token Economics" type="insight">
            <p>
              {mapping.displayName} has a market cap of {formatUSDCompact(coinGeckoToken.marketCap)}{" "}
              against a fully diluted valuation of {formatUSDCompact(coinGeckoToken.fullyDilutedValuation)},{" "}
              suggesting {((coinGeckoToken.marketCap / coinGeckoToken.fullyDilutedValuation) * 100).toFixed(0)}%{" "}
              of tokens are in circulation. At current annualized revenue of {formatUSDCompact(annualizedRevenue ?? 0)},{" "}
              the protocol trades at{" "}
              {annualizedRevenue && annualizedRevenue > 0
                ? `${(coinGeckoToken.fullyDilutedValuation / annualizedRevenue).toFixed(1)}x`
                : "N/A"}{" "}
              on a fully diluted P/S basis.
            </p>
          </InsightBox>
        </section>
      )}

      {/* ============================================ */}
      {/* 5. EARNINGS & MARGIN                         */}
      {/* ============================================ */}
      {earningsData && (
        <section className="mb-12">
          <h2
            className="font-serif font-bold text-[#111111] mb-1"
            style={{ fontSize: "22px", lineHeight: "1.2" }}
          >
            Earnings &amp; Margin
          </h2>
          <p className="text-[13px] text-[#666666] mb-4" style={{ lineHeight: "1.5" }}>
            Protocol revenue vs. earnings and operating margin from TokenTerminal.
          </p>
          <hr className="wsj-rule mb-6" />

          {/* Summary stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <StatCard
              label="Latest Revenue"
              value={formatUSDCompact(earningsData.latestRevenue)}
            />
            <StatCard
              label="Latest Earnings"
              value={formatUSDCompact(earningsData.latestEarnings)}
              changeType={earningsData.latestEarnings >= 0 ? "positive" : "negative"}
            />
            <StatCard
              label="Margin"
              value={`${(earningsData.margin * 100).toFixed(1)}%`}
              changeType={
                earningsData.margin >= 0.5
                  ? "positive"
                  : earningsData.margin >= 0
                  ? "neutral"
                  : "negative"
              }
            />
          </div>

          {/* Earnings chart */}
          {earningsChartData.length > 0 && (
            <Card>
              <ChartExport
                data={earningsChartData}
                filename={`${slug}-earnings`}
              >
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={earningsChartData}
                      margin={{ top: 10, right: 10, bottom: 0, left: 10 }}
                    >
                      <CartesianGrid
                        strokeDasharray="none"
                        stroke="#e8e8e8"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 11, fill: "#999999" }}
                        axisLine={{ stroke: "#d4d4d4" }}
                        tickLine={false}
                      />
                      <YAxis
                        tickFormatter={(v: number) => formatUSDCompact(v)}
                        tick={{ fontSize: 11, fill: "#999999" }}
                        axisLine={false}
                        tickLine={false}
                        width={60}
                      />
                      <Tooltip
                        content={<WSJTooltip valueFormatter={formatUSD} />}
                      />
                      <Legend
                        wrapperStyle={{
                          fontSize: "11px",
                          fontFamily: "Inter, system-ui, sans-serif",
                        }}
                      />
                      <Bar
                        dataKey="revenue"
                        name="Revenue"
                        fill={CHART_COLORS.primary}
                        radius={[0, 0, 0, 0]}
                        barSize={20}
                      />
                      <Bar
                        dataKey="earnings"
                        name="Earnings"
                        fill={CHART_COLORS.quaternary}
                        radius={[0, 0, 0, 0]}
                        barSize={20}
                      >
                        {earningsChartData.map((entry, index) => (
                          <Cell
                            key={index}
                            fill={
                              entry.earnings >= 0
                                ? CHART_COLORS.quaternary
                                : CHART_COLORS.danger
                            }
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </ChartExport>
              <DataSource sources={["TokenTerminal Earnings"]} />
            </Card>
          )}
        </section>
      )}

      {/* ============================================ */}
      {/* 6. DATA SOURCE DIFFERENTIAL                  */}
      {/* ============================================ */}
      {defiLlamaData && ttLatestFees != null && (
        <section className="mb-12">
          <h2
            className="font-serif font-bold text-[#111111] mb-1"
            style={{ fontSize: "22px", lineHeight: "1.2" }}
          >
            Data Source Comparison
          </h2>
          <p className="text-[13px] text-[#666666] mb-4" style={{ lineHeight: "1.5" }}>
            Comparing fee/revenue figures across data providers. Discrepancies arise from
            different methodologies (e.g., supply-side vs. protocol revenue, fee
            inclusion/exclusion).
          </p>
          <hr className="wsj-rule mb-6" />

          <Card>
            <div className="overflow-x-auto">
              <table className="financial-table w-full text-left">
                <thead>
                  <tr>
                    <th>Metric</th>
                    <th>DefiLlama</th>
                    <th>TokenTerminal</th>
                    <th>Differential</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="font-medium text-[#111111]">Daily Fees</td>
                    <td>{formatUSD(defiLlamaData.total24h)}</td>
                    <td>{formatUSD(ttLatestFees)}</td>
                    <td>
                      <DifferentialCell
                        a={defiLlamaData.total24h}
                        b={ttLatestFees}
                      />
                    </td>
                  </tr>
                  {defiLlamaData.total7d > 0 && (
                    <tr>
                      <td className="font-medium text-[#111111]">7d Fees</td>
                      <td>{formatUSD(defiLlamaData.total7d)}</td>
                      <td>
                        {formatUSD(ttLatestFees * 7)}
                        <span className="text-[#999999] text-[11px] ml-1">
                          (est.)
                        </span>
                      </td>
                      <td>
                        <DifferentialCell
                          a={defiLlamaData.total7d}
                          b={ttLatestFees * 7}
                        />
                      </td>
                    </tr>
                  )}
                  {defiLlamaData.total30d > 0 && (
                    <tr>
                      <td className="font-medium text-[#111111]">30d Fees</td>
                      <td>{formatUSD(defiLlamaData.total30d)}</td>
                      <td>
                        {formatUSD(ttLatestFees * 30)}
                        <span className="text-[#999999] text-[11px] ml-1">
                          (est.)
                        </span>
                      </td>
                      <td>
                        <DifferentialCell
                          a={defiLlamaData.total30d}
                          b={ttLatestFees * 30}
                        />
                      </td>
                    </tr>
                  )}
                  <tr>
                    <td className="font-medium text-[#111111]">
                      Annualized Revenue
                    </td>
                    <td>
                      {annualizedRevenue
                        ? formatUSD(annualizedRevenue)
                        : "N/A"}
                    </td>
                    <td>{formatUSD(ttLatestFees * 365)}</td>
                    <td>
                      {annualizedRevenue ? (
                        <DifferentialCell
                          a={annualizedRevenue}
                          b={ttLatestFees * 365}
                        />
                      ) : (
                        "N/A"
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <InsightBox title="Why data sources differ" type="insight">
              <p>
                DefiLlama and TokenTerminal use different methodologies.
                DefiLlama tracks total fees paid by users, while TokenTerminal
                may focus on protocol-level revenue (fees accruing to the
                protocol/token holders). This differential highlights the
                importance of defining &ldquo;revenue&rdquo; consistently when
                valuing protocols.
              </p>
            </InsightBox>

            <DataSource sources={["DefiLlama", "TokenTerminal"]} />
          </Card>
        </section>
      )}

      {/* ============================================ */}
      {/* 7. MOAT ANALYSIS                             */}
      {/* ============================================ */}
      {moatData && (
        <section className="mb-12">
          <h2
            className="font-serif font-bold text-[#111111] mb-1"
            style={{ fontSize: "22px", lineHeight: "1.2" }}
          >
            Competitive Moat Assessment
          </h2>
          <p className="text-[13px] text-[#666666] mb-4" style={{ lineHeight: "1.5" }}>
            Analysis of {displayName}&apos;s competitive advantages, durability, and
            key risks.
          </p>
          <hr className="wsj-rule mb-6" />

          <Card>
            {/* Moat header */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="stat-label mb-1">Moat Type</p>
                <p
                  className="font-serif font-bold text-[#111111]"
                  style={{ fontSize: "18px" }}
                >
                  {moatData.moatType}
                </p>
              </div>
              <div className="text-right">
                <p className="stat-label mb-1">Market Share</p>
                <p
                  className="font-serif font-bold text-[#111111]"
                  style={{ fontSize: "18px" }}
                >
                  {moatData.marketShare}%
                </p>
              </div>
            </div>

            {/* Moat strength bar */}
            <div className="mb-6">
              <p className="stat-label mb-2">Moat Strength</p>
              <MoatStrengthBar strength={moatData.moatStrength} />
            </div>

            {/* Durability score */}
            <div className="mb-6">
              <p className="stat-label mb-2">Durability Score</p>
              <div className="flex items-center gap-2">
                <div className="flex gap-0.5">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div
                      key={i}
                      className="w-3 h-5"
                      style={{
                        backgroundColor:
                          i < moatData.durability
                            ? moatData.durability >= 8
                              ? "#2e7d32"
                              : moatData.durability >= 6
                              ? "#c67100"
                              : "#9e2b25"
                            : "#e8e8e8",
                      }}
                    />
                  ))}
                </div>
                <span className="text-[14px] font-bold text-[#111111]">
                  {moatData.durability}/10
                </span>
              </div>
            </div>

            <hr className="wsj-rule my-4" />

            {/* Description */}
            <p
              className="text-[13px] text-[#333333] mb-6"
              style={{ lineHeight: "1.6" }}
            >
              {moatData.description}
            </p>

            {/* Risk callout */}
            <InsightBox title="Key Risk" type="warning">
              <p>{moatData.risk}</p>
            </InsightBox>

            <DataSource
              sources={[
                "DefiLlama (live)",
                "TokenTerminal (live)",
              ]}
            />
          </Card>
        </section>
      )}

      {/* ============================================ */}
      {/* 8. PEER COMPARISON                            */}
      {/* ============================================ */}
      {peerProtocols.length > 0 && (
        <section className="mb-12">
          <h2
            className="font-serif font-bold text-[#111111] mb-1"
            style={{ fontSize: "22px", lineHeight: "1.2" }}
          >
            Peer Comparison
          </h2>
          <p className="text-[13px] text-[#666666] mb-4" style={{ lineHeight: "1.5" }}>
            Top {peerProtocols.length} protocols in the same category ({defiLlamaData?.category}) by daily fees.
          </p>
          <hr className="wsj-rule mb-6" />

          <Card>
            <div className="overflow-x-auto">
              <table className="financial-table w-full text-left">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Protocol</th>
                    <th style={{ textAlign: "right" }}>Fees (24h)</th>
                    <th style={{ textAlign: "right" }}>Revenue (24h)</th>
                    <th style={{ textAlign: "right" }}>Margin</th>
                    <th style={{ textAlign: "right" }}>7d Change</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Current protocol highlighted */}
                  {defiLlamaData && (
                    <tr style={{ backgroundColor: "#f8f8f0" }}>
                      <td style={{ color: "#999999" }}>&rarr;</td>
                      <td>
                        <span style={{ fontWeight: 700, color: "#111111" }}>
                          {displayName}
                        </span>
                      </td>
                      <td style={{ textAlign: "right", fontWeight: 600 }}>
                        {formatUSDCompact(defiLlamaData.total24h)}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        {defiLlamaData.revenue24h != null
                          ? formatUSDCompact(defiLlamaData.revenue24h)
                          : "\u2014"}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        {defiLlamaData.margin != null
                          ? `${(defiLlamaData.margin * 100).toFixed(0)}%`
                          : "\u2014"}
                      </td>
                      <td
                        style={{
                          textAlign: "right",
                          color:
                            defiLlamaData.change_7d == null
                              ? "#999999"
                              : defiLlamaData.change_7d >= 0
                                ? "#2e7d32"
                                : "#9e2b25",
                          fontWeight: 500,
                        }}
                      >
                        {formatPercent(defiLlamaData.change_7d)}
                      </td>
                    </tr>
                  )}
                  {peerProtocols.map((p, i) => (
                    <tr key={p.name}>
                      <td style={{ color: "#999999" }}>{i + 1}</td>
                      <td>
                        <Link
                          href={`/protocol/${slugify(p.name)}`}
                          style={{
                            color: "#111111",
                            fontWeight: 600,
                            textDecoration: "none",
                          }}
                        >
                          {p.displayName || p.name}
                        </Link>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        {formatUSDCompact(p.total24h)}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        {p.revenue24h != null
                          ? formatUSDCompact(p.revenue24h)
                          : "\u2014"}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        {p.margin != null
                          ? `${(p.margin * 100).toFixed(0)}%`
                          : "\u2014"}
                      </td>
                      <td
                        style={{
                          textAlign: "right",
                          color:
                            p.change_7d == null
                              ? "#999999"
                              : p.change_7d >= 0
                                ? "#2e7d32"
                                : "#9e2b25",
                          fontWeight: 500,
                        }}
                      >
                        {formatPercent(p.change_7d)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <DataSource sources={["DefiLlama (live)"]} />
          </Card>
        </section>
      )}

      {/* ============================================ */}
      {/* FOOTER                                        */}
      {/* ============================================ */}
      <footer className="mt-16">
        <hr className="wsj-rule-heavy mb-6" />
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
          <div className="flex-1 min-w-0">
            <p className="stat-label mb-2">Featured Protocols</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {Object.entries(PROTOCOL_MAP)
                .filter(([key]) => key !== slug)
                .map(([key, val]) => (
                  <Link
                    key={key}
                    href={`/protocol/${key}`}
                    className="inline-flex items-center px-2 py-0.5 text-[12px] font-medium text-[#0274B6] hover:text-[#014d7a] transition-colors border border-[#d4d4d4] hover:border-[#999999]"
                    style={{ borderRadius: 0 }}
                  >
                    {val.displayName}
                  </Link>
                ))}
            </div>
            {allLiveProtocols.length > 0 && (
              <>
                <p className="stat-label mb-2">
                  Top Protocols by Revenue ({allLiveProtocols.length.toLocaleString()} total)
                </p>
                <div className="flex flex-wrap gap-2">
                  {allLiveProtocols
                    .slice(0, 20)
                    .filter((p) => {
                      const pSlug = slugify(p.name);
                      return pSlug !== slug && !PROTOCOL_MAP[pSlug];
                    })
                    .slice(0, 12)
                    .map((p) => {
                      const pSlug = slugify(p.name);
                      return (
                        <Link
                          key={pSlug}
                          href={`/protocol/${pSlug}`}
                          className="inline-flex items-center px-2 py-0.5 text-[12px] font-medium text-[#0274B6] hover:text-[#014d7a] transition-colors border border-[#e8e8e8] hover:border-[#999999]"
                          style={{ borderRadius: 0 }}
                        >
                          {p.displayName || p.name}
                        </Link>
                      );
                    })}
                </div>
              </>
            )}
          </div>
          <div className="text-right shrink-0">
            <p className="text-[11px] text-[#999999]" style={{ lineHeight: "1.6" }}>
              Data sources: DefiLlama, CoinGecko, TokenTerminal
              <br />
              Revenue figures are annualized estimates.
              <br />
              {allLiveProtocols.length > 0 && (
                <span>
                  {allLiveProtocols.length.toLocaleString()} protocols available
                </span>
              )}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ============================================================
// Differential display helper
// ============================================================

function DifferentialCell({ a, b }: { a: number; b: number }) {
  if (a === 0 && b === 0) {
    return <span className="text-[#999999]">--</span>;
  }
  const diff = a - b;
  const pctDiff = b !== 0 ? ((a - b) / b) * 100 : 0;
  const isPositive = diff >= 0;

  return (
    <span
      className={`font-medium ${
        Math.abs(pctDiff) < 5
          ? "text-[#666666]"
          : isPositive
          ? "text-[#2e7d32]"
          : "text-[#9e2b25]"
      }`}
    >
      {isPositive ? "+" : ""}
      {formatUSDCompact(diff)}{" "}
      <span className="text-[11px]">({formatPercent(pctDiff)})</span>
    </span>
  );
}
