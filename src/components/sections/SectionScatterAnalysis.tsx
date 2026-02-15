"use client";

import React, { useMemo, useState } from "react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ZAxis,
  Cell,
} from "recharts";
import { useDataContext, LiveProtocolFee } from "@/lib/DataContext";
import { findProtocolMapping } from "@/lib/protocolTokenMap";
import { Card, SectionHeader, DataSource } from "@/components/ui/Card";
import { ChartExport } from "@/components/ui/ChartExport";
import { SECTOR_COLORS } from "@/lib/data";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCompact(value: number | null | undefined): string {
  if (value == null || !isFinite(value)) return "\u2014";
  const abs = Math.abs(value);
  if (abs >= 1e12) return `$${(value / 1e12).toFixed(1)}T`;
  if (abs >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `$${(value / 1e3).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
}

function formatMetric(value: number | null | undefined, metric: MetricKey): string {
  if (value == null || !isFinite(value)) return "\u2014";
  if (metric === "ps") return `${value.toFixed(1)}x`;
  if (metric === "margin" || metric === "takeRate") return `${(value * 100).toFixed(1)}%`;
  return formatCompact(value);
}

// ---------------------------------------------------------------------------
// Category mapping (same as Section3Quality)
// ---------------------------------------------------------------------------

const CATEGORY_TO_SECTOR: Record<string, string> = {
  // DeFi
  Dexs: "defi", Dexes: "defi", DEX: "defi", Lending: "defi", Derivatives: "defi",
  Perpetuals: "defi", "Liquid Staking": "defi", Yield: "defi", Bridge: "defi",
  CDP: "defi", "CDP Manager": "defi", "Yield Aggregator": "defi", Options: "defi",
  "Options Vault": "defi", Insurance: "defi", "DEX Aggregator": "defi",
  Synthetics: "defi", "Liquid Restaking": "defi", Restaking: "defi", RWA: "defi",
  MEV: "defi", "Liquidity Manager": "defi", "Liquidity manager": "defi",
  AMM: "defi", "Margin Trading": "defi", SoFi: "defi", "Staking Pool": "defi",
  "Cross Chain": "defi", "Decentralized Stablecoin": "defi", Indexes: "defi",
  "Reserve Currency": "defi", "Algo-Stables": "defi", "NFT Fi": "defi",
  Farm: "defi", "Leveraged Yield": "defi", "Uncollateralized Lending": "defi",
  "Flash Loans": "defi", "Borrowing Lending": "defi", "Structured Products": "defi",
  "Leveraged Farming": "defi", Liquidations: "defi", "NFT Lending": "defi",
  "Prediction Market": "defi", "Basis Trading": "defi", Staking: "defi",
  // Exchanges
  CEX: "exchanges", Exchanges: "exchanges",
  // Blockchains
  Chain: "blockchains", EVM: "blockchains", Rollup: "blockchains",
  Parachain: "blockchains", Cosmos: "blockchains", L1: "blockchains",
  L2: "blockchains", Blockchain: "blockchains", DA: "blockchains",
  Sidechain: "blockchains", Subnet: "blockchains", "EVM Compatible": "blockchains",
  "Modular Blockchain": "blockchains", "Optimistic Rollup": "blockchains",
  "ZK Rollup": "blockchains", Validium: "blockchains", Appchain: "blockchains",
  // Stablecoins
  Stablecoins: "stablecoins", Stablecoin: "stablecoins",
  // Consumer
  "NFT Marketplace": "consumer", Gaming: "consumer", Social: "consumer",
  Launchpad: "consumer", Gambling: "consumer", NFT: "consumer", SocialFi: "consumer",
  Identity: "consumer", Music: "consumer", Metaverse: "consumer", Meme: "consumer",
  "Play-To-Earn": "consumer", "Move-To-Earn": "consumer", Creator: "consumer",
  // Wallets
  Wallet: "wallets", Payment: "wallets", Payments: "wallets",
  // DePIN
  DePIN: "depin", Compute: "depin", Storage: "depin", IoT: "depin",
  DeWi: "depin", AI: "depin", GPU: "depin",
  // Infrastructure
  Middleware: "infrastructure", Oracle: "infrastructure",
  Infrastructure: "infrastructure", Data: "infrastructure",
  Interoperability: "infrastructure", Privacy: "infrastructure",
  Automation: "infrastructure", Relayer: "infrastructure",
  RPC: "infrastructure", Analytics: "infrastructure", Indexer: "infrastructure",
  // Other
  Other: "other",
};

function mapCategory(cat: string): string {
  return CATEGORY_TO_SECTOR[cat] ?? "other";
}

const SECTOR_LABELS: Record<string, string> = {
  defi: "DeFi",
  exchanges: "Exchanges",
  stablecoins: "Stablecoins",
  blockchains: "Blockchains",
  consumer: "Consumer",
  wallets: "Wallets",
  depin: "DePIN",
  infrastructure: "Infrastructure",
  other: "Other",
};

const ALL_SECTORS = Object.keys(SECTOR_LABELS);

// ---------------------------------------------------------------------------
// Metric definitions
// ---------------------------------------------------------------------------

type MetricKey = "revenueAnn" | "fdv" | "marketCap" | "ps" | "margin" | "takeRate" | "volume24h" | "fees24h";

interface MetricDef {
  key: MetricKey;
  label: string;
  format: (v: number) => string;
}

const METRICS: MetricDef[] = [
  { key: "revenueAnn", label: "Revenue (Ann.)", format: formatCompact },
  { key: "fdv", label: "FDV", format: formatCompact },
  { key: "marketCap", label: "Market Cap", format: formatCompact },
  { key: "ps", label: "P/S (FDV)", format: (v) => `${v.toFixed(1)}x` },
  { key: "margin", label: "Margin", format: (v) => `${(v * 100).toFixed(1)}%` },
  { key: "takeRate", label: "Take Rate", format: (v) => `${(v * 100).toFixed(2)}%` },
  { key: "volume24h", label: "Volume (24h)", format: formatCompact },
  { key: "fees24h", label: "Fees (24h)", format: formatCompact },
];

// ---------------------------------------------------------------------------
// Protocol data structure
// ---------------------------------------------------------------------------

interface EnrichedProtocol {
  name: string;
  displayName: string;
  sector: string;
  sectorLabel: string;
  color: string;
  fees24h: number;
  fees30d: number;
  revenueAnn: number;
  fdv: number | null;
  marketCap: number | null;
  ps: number | null;
  volume24h: number | null;
  takeRate: number | null;
  margin: number | null;
  change7d: number | null;
}

// ---------------------------------------------------------------------------
// Custom Tooltip
// ---------------------------------------------------------------------------

function ScatterTooltipContent({
  active,
  payload,
  xMetric,
  yMetric,
}: {
  active?: boolean;
  payload?: Array<{ payload: EnrichedProtocol }>;
  xMetric: MetricKey;
  yMetric: MetricKey;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const xDef = METRICS.find((m) => m.key === xMetric);
  const yDef = METRICS.find((m) => m.key === yMetric);
  return (
    <div style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 8, padding: 12, fontSize: 12, maxWidth: 260, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}>
      <p style={{ fontWeight: 700, color: "#111111", marginBottom: 4, fontFamily: "Georgia, serif" }}>{d.displayName}</p>
      <p style={{ fontSize: 11, color: "#999999", marginBottom: 6 }}>{d.sectorLabel}</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
          <span style={{ color: "#666" }}>{xDef?.label}:</span>
          <span style={{ fontWeight: 600, color: "#111" }}>{formatMetric(d[xMetric] as number, xMetric)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
          <span style={{ color: "#666" }}>{yDef?.label}:</span>
          <span style={{ fontWeight: 600, color: "#111" }}>{formatMetric(d[yMetric] as number, yMetric)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
          <span style={{ color: "#666" }}>Fees 24h:</span>
          <span style={{ fontWeight: 600, color: "#111" }}>{formatCompact(d.fees24h)}</span>
        </div>
        {d.ps != null && (
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
            <span style={{ color: "#666" }}>P/S:</span>
            <span style={{ fontWeight: 600, color: "#111" }}>{d.ps.toFixed(1)}x</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function SectionScatterAnalysis() {
  const ctx = useDataContext();
  const hasLiveFees = !!(ctx.fees?.protocols && ctx.fees.protocols.length > 0);

  const [selectedSectors, setSelectedSectors] = useState<Set<string>>(new Set(["defi"]));
  const [xMetric, setXMetric] = useState<MetricKey>("revenueAnn");
  const [yMetric, setYMetric] = useState<MetricKey>("ps");
  const [expandedSectors, setExpandedSectors] = useState<Set<string>>(new Set());

  // Build enriched protocol list
  const allProtocols = useMemo(() => {
    if (!hasLiveFees || !ctx.fees) return [];

    const tokenById = new Map<string, { marketCap: number; fullyDilutedValuation: number | null; totalVolume24h: number }>();
    const tokenByName = new Map<string, { marketCap: number; fullyDilutedValuation: number | null; totalVolume24h: number }>();
    for (const t of ctx.coinGecko?.tokens ?? []) {
      tokenById.set(t.id.toLowerCase(), t);
      tokenByName.set(t.name.toLowerCase(), t);
    }

    const tvlByName = new Map<string, { mcap: number | null; fdv: number | null }>();
    for (const t of ctx.tvl?.allProtocolsTVL ?? []) {
      tvlByName.set(t.name.toLowerCase(), t);
      tvlByName.set(t.slug.toLowerCase(), t);
    }

    const results: EnrichedProtocol[] = [];
    for (const p of ctx.fees.protocols) {
      if (p.total24h <= 0) continue;
      const sector = mapCategory(p.category || "Other");
      const mapping = findProtocolMapping(p.name);
      const tokenMatch = mapping?.coinGeckoId
        ? tokenById.get(mapping.coinGeckoId.toLowerCase())
        : (tokenByName.get(p.name.toLowerCase()) ?? tokenById.get(p.name.toLowerCase()) ?? tokenByName.get((p.displayName || "").toLowerCase()));
      const tvlMatch = tvlByName.get(p.name.toLowerCase()) ?? tvlByName.get(p.name.toLowerCase().replace(/\s+/g, "-"));

      const fdv = tokenMatch?.fullyDilutedValuation ?? tvlMatch?.fdv ?? null;
      const marketCap = tokenMatch?.marketCap ?? tvlMatch?.mcap ?? null;
      const revenueAnn = p.total24h * 365;
      const psNumerator = fdv ?? marketCap;
      const ps = psNumerator != null && revenueAnn > 0 ? psNumerator / revenueAnn : null;
      const volume24h = tokenMatch?.totalVolume24h ?? null;
      const takeRate = volume24h != null && volume24h > 0 && p.total24h > 0
        ? p.total24h / volume24h : null;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const protocolRevenue = (p as any).revenue24h as number | undefined;
      const margin = protocolRevenue != null && protocolRevenue > 0 && p.total24h > 0
        ? protocolRevenue / p.total24h : null;

      results.push({
        name: p.name,
        displayName: p.displayName || p.name,
        sector,
        sectorLabel: SECTOR_LABELS[sector] || sector,
        color: SECTOR_COLORS[sector] || "#94a3b8",
        fees24h: p.total24h,
        fees30d: p.total30d || 0,
        revenueAnn,
        fdv,
        marketCap,
        ps,
        volume24h,
        takeRate,
        margin,
        change7d: p.change_7d,
      });
    }

    return results;
  }, [hasLiveFees, ctx.fees, ctx.coinGecko, ctx.tvl]);

  // Filter by selected sectors
  const filteredProtocols = useMemo(
    () => allProtocols.filter((p) => selectedSectors.has(p.sector)),
    [allProtocols, selectedSectors]
  );

  // Scatter plot data: filter to protocols that have both X and Y metrics
  const scatterData = useMemo(
    () => filteredProtocols.filter((p) => {
      const x = p[xMetric];
      const y = p[yMetric];
      return x != null && (x as number) > 0 && y != null && (y as number) > 0;
    }),
    [filteredProtocols, xMetric, yMetric]
  );

  // Grouped by sector for the tree table
  const sectorGroups = useMemo(() => {
    const groups = new Map<string, EnrichedProtocol[]>();
    for (const p of filteredProtocols) {
      if (!groups.has(p.sector)) groups.set(p.sector, []);
      groups.get(p.sector)!.push(p);
    }
    // Sort each group by fees desc
    for (const [, protos] of groups) {
      protos.sort((a, b) => b.fees24h - a.fees24h);
    }
    // Sort groups by total revenue desc
    const sorted = Array.from(groups.entries()).sort(
      (a, b) => b[1].reduce((s, p) => s + p.revenueAnn, 0) - a[1].reduce((s, p) => s + p.revenueAnn, 0)
    );
    return sorted;
  }, [filteredProtocols]);

  const toggleSector = (sector: string) => {
    setSelectedSectors((prev) => {
      const next = new Set(prev);
      if (next.has(sector)) next.delete(sector); else next.add(sector);
      return next;
    });
  };

  const toggleExpandSector = (sector: string) => {
    setExpandedSectors((prev) => {
      const next = new Set(prev);
      if (next.has(sector)) next.delete(sector); else next.add(sector);
      return next;
    });
  };

  if (!hasLiveFees) return null;

  return (
    <section className="mb-16">
      <SectionHeader
        number="8"
        title="Sector Scatter Analysis"
        subtitle="Explore relationships between protocol metrics across sectors. Toggle categories, configure axes, and drill into individual protocols."
      />

      <Card>
        {/* Category Toggles */}
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#999999", marginBottom: 8 }}>
            Select Categories
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {ALL_SECTORS.map((sector) => {
              const isSelected = selectedSectors.has(sector);
              const count = allProtocols.filter((p) => p.sector === sector).length;
              return (
                <button
                  key={sector}
                  onClick={() => toggleSector(sector)}
                  style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    letterSpacing: "0.04em",
                    padding: "5px 12px",
                    border: "1px solid",
                    borderColor: isSelected ? SECTOR_COLORS[sector] || "#111111" : "#d4d4d4",
                    backgroundColor: isSelected ? SECTOR_COLORS[sector] || "#111111" : "#ffffff",
                    color: isSelected ? "#ffffff" : "#666666",
                    borderRadius: 0,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  {SECTOR_LABELS[sector]}
                  <span style={{ fontSize: "10px", opacity: 0.7 }}>({count})</span>
                </button>
              );
            })}
            <button
              onClick={() => setSelectedSectors(new Set(ALL_SECTORS))}
              style={{
                fontSize: "10px", fontWeight: 600, textTransform: "uppercase",
                padding: "5px 10px", border: "1px solid #d4d4d4",
                backgroundColor: "#ffffff", color: "#666666",
                borderRadius: 0, cursor: "pointer",
              }}
            >
              All
            </button>
            <button
              onClick={() => setSelectedSectors(new Set())}
              style={{
                fontSize: "10px", fontWeight: 600, textTransform: "uppercase",
                padding: "5px 10px", border: "1px solid #d4d4d4",
                backgroundColor: "#ffffff", color: "#666666",
                borderRadius: 0, cursor: "pointer",
              }}
            >
              None
            </button>
          </div>
        </div>

        {/* Axis Selectors */}
        <div style={{ display: "flex", gap: 24, marginBottom: 16, flexWrap: "wrap" }}>
          <div>
            <span style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", color: "#999999", marginRight: 8, letterSpacing: "0.08em" }}>X-Axis:</span>
            {METRICS.map((m) => (
              <button
                key={m.key}
                onClick={() => setXMetric(m.key)}
                style={{
                  fontSize: "10px", fontWeight: 600, padding: "3px 8px",
                  border: "1px solid", borderColor: xMetric === m.key ? "#111" : "#d4d4d4",
                  backgroundColor: xMetric === m.key ? "#111" : "#fff",
                  color: xMetric === m.key ? "#fff" : "#666",
                  borderRadius: 0, cursor: "pointer", marginRight: 2,
                }}
              >{m.label}</button>
            ))}
          </div>
          <div>
            <span style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", color: "#999999", marginRight: 8, letterSpacing: "0.08em" }}>Y-Axis:</span>
            {METRICS.map((m) => (
              <button
                key={m.key}
                onClick={() => setYMetric(m.key)}
                style={{
                  fontSize: "10px", fontWeight: 600, padding: "3px 8px",
                  border: "1px solid", borderColor: yMetric === m.key ? "#111" : "#d4d4d4",
                  backgroundColor: yMetric === m.key ? "#111" : "#fff",
                  color: yMetric === m.key ? "#fff" : "#666",
                  borderRadius: 0, cursor: "pointer", marginRight: 2,
                }}
              >{m.label}</button>
            ))}
          </div>
        </div>

        {/* Scatter Plot */}
        <ChartExport
          data={scatterData.map((p) => ({
            name: p.displayName,
            sector: p.sectorLabel,
            [xMetric]: p[xMetric],
            [yMetric]: p[yMetric],
            fees24h: p.fees24h,
            ps: p.ps,
          }))}
          filename={`scatter-${xMetric}-vs-${yMetric}`}
          title={`${METRICS.find((m) => m.key === xMetric)?.label} vs ${METRICS.find((m) => m.key === yMetric)?.label}`}
        >
          <p style={{ fontSize: "13px", color: "#666666", marginBottom: 8 }}>
            {scatterData.length} protocols with both metrics available.
            Bubble size = fees (24h). Hover for details.
          </p>
          <div style={{ height: 480 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  type="number"
                  dataKey={xMetric}
                  name={METRICS.find((m) => m.key === xMetric)?.label}
                  scale={xMetric === "revenueAnn" || xMetric === "fdv" || xMetric === "marketCap" || xMetric === "volume24h" || xMetric === "fees24h" ? "log" : "linear"}
                  domain={["auto", "auto"]}
                  tickFormatter={(v: number) => {
                    const def = METRICS.find((m) => m.key === xMetric);
                    return def ? def.format(v) : String(v);
                  }}
                  tick={{ fontSize: 10, fill: "#94a3b8" }}
                  tickLine={false}
                  axisLine={{ stroke: "#e2e8f0" }}
                  label={{
                    value: METRICS.find((m) => m.key === xMetric)?.label,
                    position: "bottom",
                    offset: 0,
                    style: { fontSize: 11, fill: "#94a3b8" },
                  }}
                />
                <YAxis
                  type="number"
                  dataKey={yMetric}
                  name={METRICS.find((m) => m.key === yMetric)?.label}
                  scale={yMetric === "revenueAnn" || yMetric === "fdv" || yMetric === "marketCap" || yMetric === "volume24h" || yMetric === "fees24h" ? "log" : "linear"}
                  domain={["auto", "auto"]}
                  tickFormatter={(v: number) => {
                    const def = METRICS.find((m) => m.key === yMetric);
                    return def ? def.format(v) : String(v);
                  }}
                  tick={{ fontSize: 10, fill: "#94a3b8" }}
                  tickLine={false}
                  axisLine={false}
                  width={70}
                  label={{
                    value: METRICS.find((m) => m.key === yMetric)?.label,
                    angle: -90,
                    position: "insideLeft",
                    offset: 10,
                    style: { fontSize: 11, fill: "#94a3b8" },
                  }}
                />
                <ZAxis
                  type="number"
                  dataKey="fees24h"
                  range={[30, 600]}
                />
                <Tooltip
                  content={<ScatterTooltipContent xMetric={xMetric} yMetric={yMetric} />}
                />
                <Scatter data={scatterData} shape="circle">
                  {scatterData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} fillOpacity={0.7} stroke={entry.color} strokeWidth={1} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </ChartExport>

        {/* Legend */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginTop: 12, paddingTop: 12, borderTop: "1px solid #e8e8e8" }}>
          {ALL_SECTORS.filter((s) => selectedSectors.has(s)).map((sector) => (
            <div key={sector} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "11px", color: "#666666" }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: SECTOR_COLORS[sector] || "#94a3b8", display: "inline-block" }} />
              {SECTOR_LABELS[sector]}
            </div>
          ))}
        </div>

        {/* Tree Table */}
        <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid #e8e8e8" }}>
          <h4 style={{ fontSize: "13px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#333333", marginBottom: 12 }}>
            Constituent Protocols
          </h4>

          {/* Header */}
          <div style={{ overflowX: "auto" }}>
            <div style={{ minWidth: 950 }}>
              <div style={{
                display: "flex", padding: "6px 8px", borderBottom: "2px solid #111111",
                fontSize: "10px", fontWeight: 600, textTransform: "uppercase",
                letterSpacing: "0.08em", color: "#999999",
              }}>
                <div style={{ width: 180 }}>Protocol</div>
                <div style={{ flex: 1, textAlign: "right" }}>Fees (24h)</div>
                <div style={{ flex: 1, textAlign: "right" }}>Fees (Ann.)</div>
                <div style={{ flex: 1, textAlign: "right" }}>FDV</div>
                <div style={{ flex: 1, textAlign: "right" }}>P/S</div>
                <div style={{ flex: 1, textAlign: "right" }}>Volume (24h)</div>
                <div style={{ flex: 1, textAlign: "right" }}>Take Rate</div>
                <div style={{ flex: 1, textAlign: "right" }}>Margin</div>
                <div style={{ flex: 1, textAlign: "right" }}>7d</div>
              </div>

              {sectorGroups.map(([sector, protos]) => {
                const isExpanded = expandedSectors.has(sector);
                const totalRevAnn = protos.reduce((s, p) => s + p.revenueAnn, 0);
                const totalFdv = protos.reduce((s, p) => s + (p.fdv ?? 0), 0);
                const sectorPS = totalRevAnn > 0 && totalFdv > 0 ? totalFdv / totalRevAnn : null;

                return (
                  <div key={sector}>
                    {/* Sector row */}
                    <button
                      onClick={() => toggleExpandSector(sector)}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        padding: "10px 8px",
                        backgroundColor: isExpanded ? "#f8f9fa" : "#ffffff",
                        border: "none",
                        borderBottom: "1px solid #e8e8e8",
                        cursor: "pointer",
                        fontFamily: "inherit",
                        fontSize: "13px",
                      }}
                    >
                      <div style={{ width: 180, display: "flex", alignItems: "center", gap: 8, textAlign: "left" }}>
                        <span style={{ fontSize: "12px", color: "#999999", width: 14 }}>
                          {isExpanded ? "\u25BC" : "\u25B6"}
                        </span>
                        <span style={{ width: 10, height: 10, backgroundColor: SECTOR_COLORS[sector] || "#94a3b8", display: "inline-block", flexShrink: 0 }} />
                        <span style={{ fontWeight: 700, color: "#111111", fontFamily: "Georgia, serif" }}>
                          {SECTOR_LABELS[sector] || sector}
                        </span>
                        <span style={{ fontSize: "11px", color: "#999999" }}>
                          ({protos.length})
                        </span>
                      </div>
                      <div style={{ flex: 1, textAlign: "right", fontWeight: 600, color: "#111111", fontVariantNumeric: "tabular-nums" }}>
                        {formatCompact(protos.reduce((s, p) => s + p.fees24h, 0))}
                      </div>
                      <div style={{ flex: 1, textAlign: "right", fontWeight: 600, color: "#111111", fontVariantNumeric: "tabular-nums" }}>
                        {formatCompact(totalRevAnn)}
                      </div>
                      <div style={{ flex: 1, textAlign: "right", fontWeight: 600, color: "#111111", fontVariantNumeric: "tabular-nums" }}>
                        {formatCompact(totalFdv)}
                      </div>
                      <div style={{ flex: 1, textAlign: "right", fontWeight: 700, color: sectorPS != null ? "#111111" : "#999999", fontVariantNumeric: "tabular-nums" }}>
                        {sectorPS != null ? `${sectorPS.toFixed(1)}x` : "\u2014"}
                      </div>
                      <div style={{ flex: 1 }} />
                      <div style={{ flex: 1 }} />
                      <div style={{ flex: 1 }} />
                      <div style={{ flex: 1 }} />
                    </button>

                    {/* Protocol rows */}
                    {isExpanded && protos.map((p, idx) => (
                      <div
                        key={p.name}
                        style={{
                          display: "flex",
                          padding: "6px 8px 6px 36px",
                          backgroundColor: idx % 2 === 0 ? "#fafafa" : "#ffffff",
                          borderBottom: "1px solid #f0f0f0",
                          fontSize: "12px",
                        }}
                      >
                        <div style={{ width: 180 - 28, fontWeight: 500, color: "#333333" }}>
                          <a
                            href={`/protocol/${p.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")}`}
                            style={{ color: "#333333", textDecoration: "none" }}
                            onMouseOver={(e) => (e.currentTarget.style.color = "#0274B6")}
                            onMouseOut={(e) => (e.currentTarget.style.color = "#333333")}
                          >
                            {p.displayName}
                          </a>
                        </div>
                        <div style={{ flex: 1, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                          {formatCompact(p.fees24h)}
                        </div>
                        <div style={{ flex: 1, textAlign: "right", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
                          {formatCompact(p.revenueAnn)}
                        </div>
                        <div style={{ flex: 1, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                          {formatCompact(p.fdv)}
                        </div>
                        <div style={{ flex: 1, textAlign: "right", fontWeight: 600, fontVariantNumeric: "tabular-nums", color: p.ps != null ? "#111111" : "#999999" }}>
                          {p.ps != null ? `${p.ps.toFixed(1)}x` : "\u2014"}
                        </div>
                        <div style={{ flex: 1, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                          {formatCompact(p.volume24h)}
                        </div>
                        <div style={{ flex: 1, textAlign: "right", fontVariantNumeric: "tabular-nums", color: p.takeRate != null ? "#111111" : "#999999" }}>
                          {p.takeRate != null ? `${(p.takeRate * 100).toFixed(2)}%` : "\u2014"}
                        </div>
                        <div style={{ flex: 1, textAlign: "right", fontVariantNumeric: "tabular-nums", color: p.margin != null ? (p.margin >= 0 ? "#2e7d32" : "#9e2b25") : "#999999" }}>
                          {p.margin != null ? `${(p.margin * 100).toFixed(0)}%` : "\u2014"}
                        </div>
                        <div style={{
                          flex: 1, textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 500,
                          color: p.change7d == null ? "#999999" : p.change7d >= 0 ? "#2e7d32" : "#9e2b25",
                        }}>
                          {p.change7d != null ? `${p.change7d >= 0 ? "+" : ""}${p.change7d.toFixed(1)}%` : "\u2014"}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <DataSource sources={["DefiLlama (live)", "CoinGecko (live)", "TokenTerminal (live)"]} />
      </Card>
    </section>
  );
}
