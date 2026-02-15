"use client";

import React, { useMemo, useState } from "react";
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
import { useDataContext, groupByCategory, LiveProtocolFee } from "@/lib/DataContext";
import { findProtocolMapping } from "@/lib/protocolTokenMap";
import { ChartExport } from "@/components/ui/ChartExport";
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
  infrastructure: "Infrastructure",
  payments: "Payments",
  other: "Other",
};

const SECTOR_KEYS = Object.keys(SECTOR_LABELS);

/**
 * Map DefiLlama protocol categories to our internal sector keys.
 * DefiLlama uses categories like "Dexes", "Lending", "Derivatives", etc.
 */
const CATEGORY_TO_SECTOR: Record<string, string> = {
  // DeFi
  Dexes: "defi",
  DEX: "defi",
  Lending: "defi",
  Derivatives: "defi",
  Perpetuals: "defi",
  "Liquid Staking": "defi",
  Yield: "defi",
  Bridge: "defi",
  CDP: "defi",
  "Yield Aggregator": "defi",
  Liquidations: "defi",
  "Leveraged Farming": "defi",
  Options: "defi",
  Insurance: "defi",
  "DEX Aggregator": "defi",
  Synthetics: "defi",
  Indexes: "defi",
  "Reserve Currency": "defi",
  "Algo-Stables": "defi",
  "NFT Fi": "defi",
  "Liquid Restaking": "defi",
  Restaking: "defi",
  RWA: "defi",
  MEV: "defi",
  "Liquidity Manager": "defi",
  Farm: "defi",
  "Leveraged Yield": "defi",
  "Uncollateralized Lending": "defi",
  "Flash Loans": "defi",
  AMM: "defi",
  "Margin Trading": "defi",
  "Borrowing Lending": "defi",
  SoFi: "defi",
  "Structured Products": "defi",
  "Staking Pool": "defi",
  "Cross Chain": "defi",
  "Decentralized Stablecoin": "defi",

  // Exchanges
  CEX: "exchanges",

  // Blockchains
  Chain: "blockchains",
  EVM: "blockchains",
  Rollup: "blockchains",
  Parachain: "blockchains",
  Cosmos: "blockchains",
  Sidechain: "blockchains",
  Subnet: "blockchains",
  L1: "blockchains",
  L2: "blockchains",
  Blockchain: "blockchains",
  "Modular Blockchain": "blockchains",
  "Bitcoin Sidechain": "blockchains",
  "Optimistic Rollup": "blockchains",
  "ZK Rollup": "blockchains",
  Validium: "blockchains",
  DA: "blockchains",

  // Stablecoins
  Stablecoins: "stablecoins",

  // Consumer
  "NFT Marketplace": "consumer",
  "NFT Lending": "consumer",
  Gaming: "consumer",
  Social: "consumer",
  "Prediction Market": "consumer",
  Launchpad: "consumer",
  SocialFi: "consumer",
  "Fan Token": "consumer",
  Gambling: "consumer",
  Identity: "consumer",
  Music: "consumer",
  Metaverse: "consumer",
  "Play-To-Earn": "consumer",
  "Move-To-Earn": "consumer",
  NFT: "consumer",
  Creator: "consumer",

  // Wallets / Payments
  Wallet: "wallets",
  Payment: "wallets",
  Payments: "wallets",

  // DePIN
  DePIN: "depin",
  Compute: "depin",
  Storage: "depin",
  IoT: "depin",
  DeWi: "depin",

  // Infrastructure
  Middleware: "infrastructure",
  Oracle: "infrastructure",
  Data: "infrastructure",
  Infrastructure: "infrastructure",
  Interoperability: "infrastructure",
  Privacy: "infrastructure",
  Automation: "infrastructure",
  Relayer: "infrastructure",
  RPC: "infrastructure",
  API: "infrastructure",
  Analytics: "infrastructure",

  // Other
  Other: "other",
};

/** Map a DefiLlama category string to our sector key. */
function mapCategoryToSector(category: string): string {
  return CATEGORY_TO_SECTOR[category] ?? "other";
}

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
// Pie chart color palette for live data sectors
// ---------------------------------------------------------------------------

const PIE_COLORS_LIVE: Record<string, string> = {
  "DeFi/Finance": "#3b82f6",
  Dexes: "#3b82f6",
  Lending: "#2563eb",
  Derivatives: "#1d4ed8",
  "Liquid Staking": "#60a5fa",
  Yield: "#93c5fd",
  Bridge: "#7dd3fc",
  CDP: "#38bdf8",
  Chain: "#8b5cf6",
  EVM: "#a78bfa",
  Rollup: "#7c3aed",
  Blockchains: "#8b5cf6",
  Stablecoins: "#10b981",
  Wallet: "#06b6d4",
  Wallets: "#06b6d4",
  CEX: "#8b5cf6",
  Exchanges: "#8b5cf6",
  Consumer: "#f59e0b",
  DePIN: "#ec4899",
  Infrastructure: "#6366f1",
  Payments: "#14b8a6",
  Other: "#94a3b8",
};

function getPieColor(name: string): string {
  return PIE_COLORS_LIVE[name] ?? SECTOR_COLORS[name.toLowerCase()] ?? "#94a3b8";
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
// Compact currency formatter
// ---------------------------------------------------------------------------

function formatCompactValue(value: number | null | undefined): string {
  if (value == null || !isFinite(value)) return "\u2014";
  const abs = Math.abs(value);
  if (abs >= 1e12) return `$${(value / 1e12).toFixed(1)}T`;
  if (abs >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `$${(value / 1e3).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
}

function formatPctValue(value: number | null | undefined): string {
  if (value == null || !isFinite(value)) return "\u2014";
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

// ---------------------------------------------------------------------------
// Sector Drill-Down: constituent projects per sector with P&L, FDV
// ---------------------------------------------------------------------------

interface SectorProtocol {
  name: string;
  displayName: string;
  revenue24h: number;
  revenue30d: number;
  revenueAnn: number;
  marketCap: number | null;
  fdv: number | null;
  earnings: number | null;
  margin: number | null;
  change7d: number | null;
  sector: string;
}

interface SectorSummary {
  sector: string;
  sectorLabel: string;
  color: string;
  protocols: SectorProtocol[];
  totalRevAnn: number;
  totalFdv: number;
  totalMcap: number;
  protocolCount: number;
}

function SectorDrillDown({
  protocols,
  coinGeckoTokens,
  earningsProtocols,
  topN,
}: {
  protocols: LiveProtocolFee[];
  coinGeckoTokens: Array<{
    id: string;
    symbol: string;
    name: string;
    currentPrice: number;
    marketCap: number;
    fullyDilutedValuation: number | null;
    totalVolume24h: number;
  }>;
  earningsProtocols: Array<{
    id: string;
    name: string;
    aliases: string[];
    latestRevenue: number;
    latestEarnings: number;
    margin: number;
  }>;
  topN: number;
}) {
  const [expandedSectors, setExpandedSectors] = useState<Set<string>>(new Set());

  const sectorData = useMemo(() => {
    // Build lookup maps
    const tokenById = new Map<string, (typeof coinGeckoTokens)[0]>();
    const tokenByName = new Map<string, (typeof coinGeckoTokens)[0]>();
    for (const t of coinGeckoTokens) {
      tokenById.set(t.id.toLowerCase(), t);
      tokenByName.set(t.name.toLowerCase(), t);
    }
    // Build earnings lookup using aliases for robust cross-source matching
    const earningsByKey = new Map<string, (typeof earningsProtocols)[0]>();
    for (const e of earningsProtocols) {
      earningsByKey.set(e.name.toLowerCase(), e);
      earningsByKey.set(e.id.toLowerCase(), e);
      for (const alias of e.aliases) {
        earningsByKey.set(alias.toLowerCase(), e);
      }
    }

    // Group protocols by sector
    const sectorMap = new Map<string, SectorProtocol[]>();
    for (const p of protocols) {
      if (p.total24h <= 0) continue;
      const sector = mapCategoryToSector(p.category || "Other");
      const mapping = findProtocolMapping(p.name);
      const tokenMatch = mapping?.coinGeckoId
        ? tokenById.get(mapping.coinGeckoId.toLowerCase())
        : (tokenByName.get(p.name.toLowerCase()) || tokenById.get(p.name.toLowerCase()) || tokenByName.get((p.displayName || "").toLowerCase()));
      const earningsMatch = earningsByKey.get(p.name.toLowerCase()) || earningsByKey.get((p.displayName || "").toLowerCase());

      const sp: SectorProtocol = {
        name: p.name,
        displayName: p.displayName || p.name,
        revenue24h: p.total24h,
        revenue30d: p.total30d || 0,
        revenueAnn: p.total24h * 365,
        marketCap: tokenMatch?.marketCap ?? null,
        fdv: tokenMatch?.fullyDilutedValuation ?? null,
        earnings: earningsMatch?.latestEarnings ?? null,
        margin: earningsMatch?.margin ?? null,
        change7d: p.change_7d,
        sector,
      };

      if (!sectorMap.has(sector)) sectorMap.set(sector, []);
      sectorMap.get(sector)!.push(sp);
    }

    // Build summaries
    const summaries: SectorSummary[] = [];
    const sectorLabelMap: Record<string, string> = {
      defi: "DeFi",
      exchanges: "Exchanges",
      stablecoins: "Stablecoins",
      blockchains: "Blockchains",
      consumer: "Consumer",
      wallets: "Wallets",
      depin: "DePIN",
      infrastructure: "Infrastructure",
      payments: "Payments",
      other: "Other",
    };

    for (const [sector, protos] of sectorMap.entries()) {
      // Sort by revenue desc
      protos.sort((a, b) => b.revenue24h - a.revenue24h);
      // Apply topN
      const displayed = topN > 0 ? protos.slice(0, topN) : protos;

      summaries.push({
        sector,
        sectorLabel: sectorLabelMap[sector] || sector,
        color: SECTOR_COLORS[sector] || "#94a3b8",
        protocols: displayed,
        totalRevAnn: displayed.reduce((s, p) => s + p.revenueAnn, 0),
        totalFdv: displayed.reduce((s, p) => s + (p.fdv ?? 0), 0),
        totalMcap: displayed.reduce((s, p) => s + (p.marketCap ?? 0), 0),
        protocolCount: protos.length,
      });
    }

    // Sort sectors by total revenue desc
    summaries.sort((a, b) => b.totalRevAnn - a.totalRevAnn);
    return summaries;
  }, [protocols, coinGeckoTokens, earningsProtocols, topN]);

  const toggleSector = (sector: string) => {
    setExpandedSectors((prev) => {
      const next = new Set(prev);
      if (next.has(sector)) next.delete(sector);
      else next.add(sector);
      return next;
    });
  };

  const grandTotalFdv = sectorData.reduce((s, sec) => s + sec.totalFdv, 0);
  const grandTotalRevAnn = sectorData.reduce((s, sec) => s + sec.totalRevAnn, 0);

  return (
    <div>
      {/* Grand total row */}
      <div style={{ display: "flex", gap: 16, marginBottom: 12, padding: "8px 0", borderBottom: "2px solid #111111" }}>
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#999999" }}>
            Total FDV (All Sectors)
          </span>
          <p style={{ fontSize: "20px", fontWeight: 700, fontFamily: "Georgia, serif", color: "#111111", marginTop: 2 }}>
            {formatCompactValue(grandTotalFdv)}
          </p>
        </div>
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#999999" }}>
            Total Revenue (Ann.)
          </span>
          <p style={{ fontSize: "20px", fontWeight: 700, fontFamily: "Georgia, serif", color: "#111111", marginTop: 2 }}>
            {formatCompactValue(grandTotalRevAnn)}
          </p>
        </div>
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#999999" }}>
            Implied P/S (FDV)
          </span>
          <p style={{ fontSize: "20px", fontWeight: 700, fontFamily: "Georgia, serif", color: "#111111", marginTop: 2 }}>
            {grandTotalRevAnn > 0 ? `${(grandTotalFdv / grandTotalRevAnn).toFixed(1)}x` : "\u2014"}
          </p>
        </div>
      </div>

      {/* Sector rows */}
      {sectorData.map((sec) => (
        <div key={sec.sector} style={{ marginBottom: 2 }}>
          {/* Sector header (clickable) */}
          <button
            onClick={() => toggleSector(sec.sector)}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "10px 8px",
              backgroundColor: expandedSectors.has(sec.sector) ? "#f8f9fa" : "#ffffff",
              border: "none",
              borderBottom: "1px solid #e8e8e8",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: "14px", color: "#666666", width: 16, textAlign: "center" }}>
                {expandedSectors.has(sec.sector) ? "\u25BC" : "\u25B6"}
              </span>
              <span
                style={{ width: 10, height: 10, backgroundColor: sec.color, display: "inline-block", flexShrink: 0 }}
              />
              <span style={{ fontSize: "14px", fontWeight: 700, color: "#111111", fontFamily: "Georgia, serif" }}>
                {sec.sectorLabel}
              </span>
              <span style={{ fontSize: "12px", color: "#999999" }}>
                ({sec.protocolCount} project{sec.protocolCount !== 1 ? "s" : ""})
              </span>
            </div>
            <div style={{ display: "flex", gap: 24, fontSize: "13px", fontVariantNumeric: "tabular-nums" }}>
              <span style={{ minWidth: 90, textAlign: "right" }}>
                <span style={{ color: "#999999", fontSize: "10px", marginRight: 4 }}>REV</span>
                <span style={{ fontWeight: 600, color: "#111111" }}>{formatCompactValue(sec.totalRevAnn)}</span>
              </span>
              <span style={{ minWidth: 90, textAlign: "right" }}>
                <span style={{ color: "#999999", fontSize: "10px", marginRight: 4 }}>FDV</span>
                <span style={{ fontWeight: 600, color: "#111111" }}>{formatCompactValue(sec.totalFdv)}</span>
              </span>
              <span style={{ minWidth: 70, textAlign: "right" }}>
                <span style={{ color: "#999999", fontSize: "10px", marginRight: 4 }}>P/S</span>
                <span style={{ fontWeight: 600, color: "#111111" }}>
                  {sec.totalRevAnn > 0 && sec.totalFdv > 0
                    ? `${(sec.totalFdv / sec.totalRevAnn).toFixed(1)}x`
                    : "\u2014"}
                </span>
              </span>
            </div>
          </button>

          {/* Expanded protocol table */}
          {expandedSectors.has(sec.sector) && (
            <div style={{ backgroundColor: "#fafafa", borderBottom: "1px solid #e8e8e8" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #d4d4d4" }}>
                    <th style={{ textAlign: "left", padding: "6px 8px", fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#999999" }}>Protocol</th>
                    <th style={{ textAlign: "right", padding: "6px 8px", fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#999999" }}>Rev (24h)</th>
                    <th style={{ textAlign: "right", padding: "6px 8px", fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#999999" }}>Rev (30d)</th>
                    <th style={{ textAlign: "right", padding: "6px 8px", fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#999999" }}>Rev (Ann.)</th>
                    <th style={{ textAlign: "right", padding: "6px 8px", fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#999999" }}>Market Cap</th>
                    <th style={{ textAlign: "right", padding: "6px 8px", fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#999999" }}>FDV</th>
                    <th style={{ textAlign: "right", padding: "6px 8px", fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#999999" }}>Earnings</th>
                    <th style={{ textAlign: "right", padding: "6px 8px", fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#999999" }}>Margin</th>
                    <th style={{ textAlign: "right", padding: "6px 8px", fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#999999" }}>7d</th>
                  </tr>
                </thead>
                <tbody>
                  {sec.protocols.map((p, idx) => (
                    <tr
                      key={p.name}
                      style={{
                        borderBottom: "1px solid #f0f0f0",
                        backgroundColor: idx % 2 === 0 ? "#fafafa" : "#ffffff",
                      }}
                    >
                      <td style={{ padding: "6px 8px", fontWeight: 600, color: "#111111" }}>
                        <a
                          href={`/protocol/${p.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")}`}
                          style={{ color: "#111111", textDecoration: "none" }}
                          onMouseOver={(e) => (e.currentTarget.style.color = "#0274B6")}
                          onMouseOut={(e) => (e.currentTarget.style.color = "#111111")}
                        >
                          {p.displayName}
                        </a>
                      </td>
                      <td style={{ textAlign: "right", padding: "6px 8px", fontVariantNumeric: "tabular-nums" }}>
                        {formatCompactValue(p.revenue24h)}
                      </td>
                      <td style={{ textAlign: "right", padding: "6px 8px", fontVariantNumeric: "tabular-nums" }}>
                        {formatCompactValue(p.revenue30d)}
                      </td>
                      <td style={{ textAlign: "right", padding: "6px 8px", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
                        {formatCompactValue(p.revenueAnn)}
                      </td>
                      <td style={{ textAlign: "right", padding: "6px 8px", fontVariantNumeric: "tabular-nums" }}>
                        {formatCompactValue(p.marketCap)}
                      </td>
                      <td style={{ textAlign: "right", padding: "6px 8px", fontVariantNumeric: "tabular-nums" }}>
                        {formatCompactValue(p.fdv)}
                      </td>
                      <td style={{ textAlign: "right", padding: "6px 8px", fontVariantNumeric: "tabular-nums" }}>
                        {formatCompactValue(p.earnings)}
                      </td>
                      <td style={{ textAlign: "right", padding: "6px 8px", fontVariantNumeric: "tabular-nums", color: p.margin != null && p.margin >= 0 ? "#2e7d32" : "#9e2b25" }}>
                        {p.margin != null ? `${(p.margin * 100).toFixed(0)}%` : "\u2014"}
                      </td>
                      <td style={{
                        textAlign: "right",
                        padding: "6px 8px",
                        fontVariantNumeric: "tabular-nums",
                        fontWeight: 500,
                        color: p.change7d == null ? "#999999" : p.change7d >= 0 ? "#2e7d32" : "#9e2b25",
                      }}>
                        {formatPctValue(p.change7d)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function Section3Quality() {
  const ctx = useDataContext();
  const hasLiveFees = !!(ctx.fees?.protocols && ctx.fees.protocols.length > 0);
  const [sectorTopN, setSectorTopN] = useState<number>(0); // 0 = all

  // ----- Live data: group protocols by DefiLlama category -----
  const liveCategoryGroups = useMemo(() => {
    if (!hasLiveFees) return null;
    return groupByCategory(ctx.fees!.protocols);
  }, [hasLiveFees, ctx.fees]);

  // ----- Pie chart data: live DefiLlama categories or static fallback -----
  const pieData = useMemo(() => {
    if (liveCategoryGroups) {
      // Build pie slices from live DefiLlama category data.
      // Group into our sector buckets for consistency.
      const sectorTotals: Record<string, number> = {};
      for (const [cat, data] of Object.entries(liveCategoryGroups)) {
        const sector = mapCategoryToSector(cat);
        const sectorLabel =
          sector === "defi"
            ? "DeFi/Finance"
            : sector === "exchanges"
            ? "Exchanges"
            : sector === "stablecoins"
            ? "Stablecoins"
            : sector === "blockchains"
            ? "Blockchains"
            : sector === "consumer"
            ? "Consumer"
            : sector === "wallets"
            ? "Wallets"
            : sector === "depin"
            ? "DePIN"
            : sector === "infrastructure"
            ? "Infrastructure"
            : sector === "payments"
            ? "Payments"
            : "Other";
        sectorTotals[sectorLabel] = (sectorTotals[sectorLabel] || 0) + data.total30d;
      }

      const total = Object.values(sectorTotals).reduce((s, v) => s + v, 0);
      const entries = Object.entries(sectorTotals)
        .filter(([, v]) => v > 0)
        .sort((a, b) => b[1] - a[1])
        .map(([sector, value]) => ({
          sector,
          name: sector,
          // Annualize from 30d to yearly, then convert to billions
          value: (value / 30) * 365 / 1e9,
          share: total > 0 ? Math.round((value / total) * 100) : 0,
          color: getPieColor(sector),
        }));

      return entries;
    }

    // Fallback to static data
    return h1_2025_sectorBreakdown.map((d) => ({
      ...d,
      name: d.sector,
    }));
  }, [liveCategoryGroups]);

  // ----- Sector detail list (for the side panel) -----
  const sectorDetailList = useMemo(() => {
    if (liveCategoryGroups) {
      const sectorTotals: Record<string, number> = {};
      for (const [cat, data] of Object.entries(liveCategoryGroups)) {
        const sector = mapCategoryToSector(cat);
        const sectorLabel =
          sector === "defi"
            ? "DeFi/Finance"
            : sector === "exchanges"
            ? "Exchanges"
            : sector === "stablecoins"
            ? "Stablecoins"
            : sector === "blockchains"
            ? "Blockchains"
            : sector === "consumer"
            ? "Consumer"
            : sector === "wallets"
            ? "Wallets"
            : sector === "depin"
            ? "DePIN"
            : sector === "infrastructure"
            ? "Infrastructure"
            : sector === "payments"
            ? "Payments"
            : "Other";
        sectorTotals[sectorLabel] = (sectorTotals[sectorLabel] || 0) + data.total30d;
      }
      const total = Object.values(sectorTotals).reduce((s, v) => s + v, 0);

      return Object.entries(sectorTotals)
        .filter(([, v]) => v > 0)
        .sort((a, b) => b[1] - a[1])
        .map(([sector, value]) => ({
          sector,
          // Annualize from 30d to yearly, then convert to billions
          value: (value / 30) * 365 / 1e9,
          share: total > 0 ? Math.round((value / total) * 100) : 0,
          color: getPieColor(sector),
          // YoY growth not available from live 30d snapshot; show N/A
          yoyGrowth: null as number | null,
        }));
    }

    return h1_2025_sectorBreakdown.map((d) => ({
      sector: d.sector,
      value: d.value,
      share: d.share,
      color: d.color,
      yoyGrowth: d.yoyGrowth as number | null,
    }));
  }, [liveCategoryGroups]);

  // ----- Stacked area chart: static base + live-updated latest period -----
  const areaData = useMemo(() => {
    const base = sectorBreakdownTimeSeries.map((d) => ({
      ...d,
      name: d.year.toString(),
    }));

    if (liveCategoryGroups) {
      // Build a live "latest" row from grouped protocol fees.
      const liveSectorTotals: Record<string, number> = {};
      for (const key of SECTOR_KEYS) {
        liveSectorTotals[key] = 0;
      }
      for (const [cat, data] of Object.entries(liveCategoryGroups)) {
        const sector = mapCategoryToSector(cat);
        if (liveSectorTotals[sector] !== undefined) {
          // Annualize from 30d data: (total30d / 30) * 365, convert to billions
          liveSectorTotals[sector] += (data.total30d / 30) * 365 / 1e9;
        }
      }

      // Update the most recent period (last row) with live-derived annualized figures
      const lastIdx = base.length - 1;
      if (lastIdx >= 0) {
        const updated = { ...base[lastIdx] };
        for (const key of SECTOR_KEYS) {
          if (liveSectorTotals[key] > 0) {
            (updated as Record<string, unknown>)[key] = Math.round(liveSectorTotals[key] * 10) / 10;
          }
        }
        base[lastIdx] = updated;
      }
    }

    return base;
  }, [liveCategoryGroups]);

  // ----- Exchange deep-dive: live DEX/CEX from protocols or static -----
  const exchangeData = useMemo(() => {
    const base = exchangeRevenueHistory.map((d) => ({
      ...d,
      name: d.year.toString(),
    }));

    if (hasLiveFees && ctx.fees) {
      // Filter for Dexes and Derivatives (on-chain exchange) protocols
      const dexProtocols = ctx.fees.protocols.filter(
        (p) => p.category === "Dexes" || p.category === "Derivatives"
      );
      const cexProtocols = ctx.fees.protocols.filter(
        (p) => p.category === "CEX"
      );

      const dexAnnualized =
        dexProtocols.reduce((s, p) => s + (p.total30d || 0), 0) / 30 * 365 / 1e9;
      const cexAnnualized =
        cexProtocols.reduce((s, p) => s + (p.total30d || 0), 0) / 30 * 365 / 1e9;

      // Only update the latest row if we got meaningful DEX data
      if (dexAnnualized > 0) {
        const lastIdx = base.length - 1;
        if (lastIdx >= 0) {
          const total = dexAnnualized + cexAnnualized;
          const cexDom = total > 0 ? Math.round((cexAnnualized / total) * 100) : base[lastIdx].cexDominance;
          base[lastIdx] = {
            ...base[lastIdx],
            dex: Math.round(dexAnnualized * 10) / 10,
            cex: cexAnnualized > 0 ? Math.round(cexAnnualized * 10) / 10 : base[lastIdx].cex,
            total: Math.round(total * 10) / 10 || base[lastIdx].total,
            cexDominance: cexDom,
          };
        }
      }
    }

    return base;
  }, [hasLiveFees, ctx.fees]);

  // ----- Exchange history for dominance sidebar: live-updated latest -----
  const exchangeHistoryForDominance = useMemo(() => {
    const base = [...exchangeRevenueHistory];

    if (hasLiveFees && ctx.fees) {
      const dexProtocols = ctx.fees.protocols.filter(
        (p) => p.category === "Dexes" || p.category === "Derivatives"
      );
      const cexProtocols = ctx.fees.protocols.filter(
        (p) => p.category === "CEX"
      );

      const dexAnnualized =
        dexProtocols.reduce((s, p) => s + (p.total30d || 0), 0) / 30 * 365 / 1e9;
      const cexAnnualized =
        cexProtocols.reduce((s, p) => s + (p.total30d || 0), 0) / 30 * 365 / 1e9;

      if (dexAnnualized > 0) {
        const lastIdx = base.length - 1;
        if (lastIdx >= 0) {
          const total = dexAnnualized + cexAnnualized;
          base[lastIdx] = {
            ...base[lastIdx],
            dex: Math.round(dexAnnualized * 10) / 10,
            cex: cexAnnualized > 0 ? Math.round(cexAnnualized * 10) / 10 : base[lastIdx].cex,
            total: Math.round(total * 10) / 10 || base[lastIdx].total,
            cexDominance: total > 0 ? Math.round((cexAnnualized / total) * 100) : base[lastIdx].cexDominance,
          };
        }
      }
    }

    return base;
  }, [hasLiveFees, ctx.fees]);

  // ----- Live stat cards: compute from live data when available -----
  const liveStats = useMemo(() => {
    if (!liveCategoryGroups) {
      return null; // Will use static values
    }

    // Total across all sectors
    const allTotal30d = Object.values(liveCategoryGroups).reduce(
      (s, g) => s + g.total30d,
      0
    );

    // Stablecoins share
    const stablecoinTotal = liveCategoryGroups["Stablecoins"]?.total30d ?? 0;
    const stablecoinShare = allTotal30d > 0 ? Math.round((stablecoinTotal / allTotal30d) * 100) : 0;

    // DEX vs CEX
    const dexTotal =
      (liveCategoryGroups["Dexes"]?.total30d ?? 0) +
      (liveCategoryGroups["Derivatives"]?.total30d ?? 0);
    const cexTotal = liveCategoryGroups["CEX"]?.total30d ?? 0;
    const exchangeTotal = dexTotal + cexTotal;
    const dexShare = exchangeTotal > 0 ? Math.round((dexTotal / exchangeTotal) * 100) : 55;

    // Consumer share
    let consumerTotal = 0;
    for (const [cat, data] of Object.entries(liveCategoryGroups)) {
      if (mapCategoryToSector(cat) === "consumer") {
        consumerTotal += data.total30d;
      }
    }
    const consumerShare = allTotal30d > 0 ? Math.round((consumerTotal / allTotal30d) * 100) : 6;

    return { stablecoinShare, dexShare, consumerShare };
  }, [liveCategoryGroups]);

  // Stablecoin + rate data — editorial/static (interest income breakdowns not in DefiLlama)
  const stablecoinData = useMemo(
    () =>
      stablecoinRevenueBreakdown.map((d) => ({
        ...d,
        name: d.year.toString(),
      })),
    []
  );

  // Interest income dependency percentage
  const latestStablecoin = stablecoinRevenueBreakdown[stablecoinRevenueBreakdown.length - 1] ?? {
    interestIncome: 0, transactionFees: 0, other: 0, fedRate: 0, total: 1,
  };
  const interestPct = latestStablecoin.total > 0
    ? Math.round((latestStablecoin.interestIncome / latestStablecoin.total) * 100)
    : 0;

  // ----- Live data indicator -----
  const isLive = hasLiveFees;

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

        {/* Live data indicator */}
        {isLive && (
          <div className="flex items-center gap-2 mb-4 text-xs text-emerald-600">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            Live data from DefiLlama
            {ctx.lastUpdated && (
              <span className="text-slate-400 ml-1">
                (updated {ctx.lastUpdated.toLocaleTimeString()})
              </span>
            )}
          </div>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* Key Metrics Row                                                  */}
        {/* ---------------------------------------------------------------- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          <StatCard
            label="Stablecoin Share"
            value={liveStats ? `${liveStats.stablecoinShare}%` : "40%"}
            subvalue="of total crypto revenue"
            change={liveStats ? "Live from DefiLlama" : "Up from 6% in 2020"}
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
            value={liveStats ? `${liveStats.dexShare}% DEX` : "55% DEX"}
            subvalue="DEX share of exchange rev"
            change={liveStats ? "Live from DefiLlama" : "DEXs overtook CEXs in 2025"}
            changeType="positive"
          />
          <StatCard
            label="Consumer Share"
            value={liveStats ? `${liveStats.consumerShare}%` : "6%"}
            subvalue="of onchain revenue (H1 2025)"
            change={liveStats ? "Live from DefiLlama" : "-20% YoY growth"}
            changeType="negative"
          />
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* 1. Stacked Area — Sector Revenue Over Time                       */}
        {/* ---------------------------------------------------------------- */}
        <Card className="mb-10">
          <ChartExport
            data={areaData}
            filename="sector-revenue-composition"
          >
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              Sector Revenue Composition (2020 - 2025)
            </h3>
            <p className="text-sm text-slate-500 mb-6">
              Exchanges dominated in 2020-21. Stablecoins took over in the bear market. DeFi surged again in 2024-25.
              {isLive && <span className="text-emerald-500 ml-1">(latest period live-updated)</span>}
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
          </ChartExport>

          <DataSource sources={["DefiLlama (live)", "TokenTerminal (live)"]} />
        </Card>

        {/* ---------------------------------------------------------------- */}
        {/* 1b. Sector Drill-Down — Constituent Projects with P&L + FDV      */}
        {/* ---------------------------------------------------------------- */}
        {hasLiveFees && (
          <Card className="mb-10">
            <h3 className="text-lg font-bold text-slate-900 mb-1" style={{ fontFamily: "Georgia, serif" }}>
              Sector Revenue Drill-Down
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              Click any sector to see constituent projects with revenue, earnings, margin, and FDV.
              {ctx.coinGecko?.tokens && <span className="text-emerald-500 ml-1">(FDV from CoinGecko live)</span>}
            </p>

            {/* Top-N filter */}
            <div className="flex flex-wrap gap-2 mb-4 items-center">
              <span style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#999999", marginRight: 4 }}>
                Show:
              </span>
              {([0, 10, 25, 50, 100] as const).map((n) => (
                <button
                  key={n}
                  onClick={() => setSectorTopN(n)}
                  style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase" as const,
                    border: "1px solid",
                    borderColor: sectorTopN === n ? "#111111" : "#d4d4d4",
                    backgroundColor: sectorTopN === n ? "#111111" : "#ffffff",
                    color: sectorTopN === n ? "#ffffff" : "#666666",
                    borderRadius: 0,
                    cursor: "pointer",
                    padding: "4px 10px",
                  }}
                >
                  {n === 0 ? "All" : `Top ${n}`}
                </button>
              ))}
            </div>

            <SectorDrillDown
              protocols={ctx.fees!.protocols}
              coinGeckoTokens={ctx.coinGecko?.tokens ?? []}
              earningsProtocols={ctx.earnings?.protocols ?? []}
              topN={sectorTopN}
            />

            <DataSource sources={["DefiLlama (live)", "CoinGecko (live)", "TokenTerminal (live)"]} />
          </Card>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* 2. Pie / Donut — Sector Breakdown (live or H1 2025 static)       */}
        {/* ---------------------------------------------------------------- */}
        <Card className="mb-10">
          <h3 className="text-lg font-bold text-slate-900 mb-1">
            {isLive ? "Current Onchain Revenue Breakdown" : "H1 2025 Onchain Revenue Breakdown"}
          </h3>
          <p className="text-sm text-slate-500 mb-6">
            {isLive
              ? "Live sector breakdown from DefiLlama protocol fees (30-day annualized)."
              : "$9.7B in onchain fees. DeFi/Finance dominates at 63%, while Consumer contributes just 6%."}
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Donut chart */}
            <ChartExport
              data={pieData.map((d) => ({
                sector: d.sector,
                value: d.value,
                share: d.share,
              }))}
              filename="sector-breakdown-pie"
            >
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
            </ChartExport>

            {/* Sector detail cards */}
            <div className="space-y-3">
              {sectorDetailList.map((s) => (
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
                  {s.yoyGrowth !== null ? (
                    <span
                      className={`text-sm font-bold ${
                        s.yoyGrowth >= 0 ? "text-emerald-600" : "text-red-500"
                      }`}
                    >
                      {s.yoyGrowth >= 0 ? "+" : ""}
                      {s.yoyGrowth}% YoY
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400">Live</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <DataSource
            sources={["DefiLlama (live)", "TokenTerminal (live)"]}
          />
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
            {isLive && <span className="text-emerald-500 ml-1">(latest period live-updated)</span>}
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Bar chart */}
            <div className="lg:col-span-2">
              <ChartExport
                data={exchangeData.map((d) => ({
                  year: d.name,
                  cex: d.cex,
                  dex: d.dex,
                  total: d.total,
                  cexDominance: d.cexDominance,
                }))}
                filename="exchange-revenue-cex-vs-dex"
              >
                <div className="h-[360px]">
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
              </ChartExport>
            </div>

            {/* CEX dominance trend */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
                CEX Dominance Trend
              </h4>
              {exchangeHistoryForDominance.map((d) => (
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
        {/* 4. Consumer Crypto Failure Analysis (editorial — static data)    */}
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
        {/* 5. Stablecoin Interest Rate Dependency (editorial — static data) */}
        {/* ---------------------------------------------------------------- */}
        <Card className="mb-10">
          <ChartExport
            data={stablecoinData}
            filename="stablecoin-interest-rate-dependency"
          >
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
          </ChartExport>

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
            "DefiLlama (live)",
            "TokenTerminal (live)",
            "Tether & Circle financial reports",
            "Federal Reserve FRED data",
          ]}
        />
      </div>
    </section>
  );
}
