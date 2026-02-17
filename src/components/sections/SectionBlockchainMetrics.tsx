"use client";

import React, { useMemo } from "react";
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
  ReferenceLine,
  Label,
} from "recharts";
import { useDataContext } from "@/lib/DataContext";
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

function formatRatio(value: number | null | undefined): string {
  if (value == null || !isFinite(value)) return "\u2014";
  if (value >= 1000) return `${(value / 1000).toFixed(1)}Kx`;
  return `${value.toFixed(1)}x`;
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

// ---------------------------------------------------------------------------
// Category mapping
// ---------------------------------------------------------------------------

const CATEGORY_TO_SECTOR: Record<string, string> = {
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
  CEX: "exchanges", Exchanges: "exchanges",
  Chain: "blockchains", EVM: "blockchains", Rollup: "blockchains",
  Parachain: "blockchains", Cosmos: "blockchains", L1: "blockchains",
  L2: "blockchains", Blockchain: "blockchains", DA: "blockchains",
  Sidechain: "blockchains", Subnet: "blockchains", "EVM Compatible": "blockchains",
  "Modular Blockchain": "blockchains", "Optimistic Rollup": "blockchains",
  "ZK Rollup": "blockchains", Validium: "blockchains", Appchain: "blockchains",
  Stablecoins: "stablecoins", Stablecoin: "stablecoins",
  "NFT Marketplace": "consumer", Gaming: "consumer", Social: "consumer",
  Launchpad: "consumer", Gambling: "consumer", NFT: "consumer", SocialFi: "consumer",
  Identity: "consumer", Music: "consumer", Metaverse: "consumer", Meme: "consumer",
  "Play-To-Earn": "consumer", "Move-To-Earn": "consumer", Creator: "consumer",
  Wallet: "wallets", Payment: "wallets", Payments: "wallets",
  DePIN: "depin", Compute: "depin", Storage: "depin", IoT: "depin",
  DeWi: "depin", AI: "depin", GPU: "depin",
  Middleware: "infrastructure", Oracle: "infrastructure",
  Infrastructure: "infrastructure", Data: "infrastructure",
  Interoperability: "infrastructure", Privacy: "infrastructure",
  Automation: "infrastructure", Relayer: "infrastructure",
  RPC: "infrastructure", Analytics: "infrastructure", Indexer: "infrastructure",
  Other: "other",
};

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

// ---------------------------------------------------------------------------
// Protocol data structure
// ---------------------------------------------------------------------------

interface EnrichedProtocol {
  name: string;
  displayName: string;
  sector: string;
  sectorLabel: string;
  subcategory: string;
  color: string;
  fees24h: number;
  feesAnn: number;
  revenueAnn: number;
  fdv: number;
  ps: number;
  pf: number;
}

// ---------------------------------------------------------------------------
// Custom Tooltips
// ---------------------------------------------------------------------------

const tooltipStyle: React.CSSProperties = {
  backgroundColor: "#fffff8",
  border: "1px solid #d4d4d4",
  borderRadius: 0,
  padding: "14px 18px",
  fontSize: "12px",
  color: "#333333",
  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
  maxWidth: 280,
  fontFamily: "'Inter', -apple-system, sans-serif",
};

function PSTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: EnrichedProtocol }>;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={tooltipStyle}>
      <p style={{ fontWeight: 700, color: "#111111", marginBottom: 2, fontFamily: "Georgia, serif", fontSize: "14px" }}>
        {d.displayName}
      </p>
      <p style={{ fontSize: "10px", color: "#999999", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>
        {d.subcategory} \u00B7 {d.sectorLabel}
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
          <span style={{ color: "#666" }}>FDV</span>
          <span style={{ fontWeight: 600, color: "#111", fontVariantNumeric: "tabular-nums" }}>{formatCompact(d.fdv)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
          <span style={{ color: "#666" }}>Revenue (Ann.)</span>
          <span style={{ fontWeight: 600, color: "#111", fontVariantNumeric: "tabular-nums" }}>{formatCompact(d.revenueAnn)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, paddingTop: 4, borderTop: "1px solid #eee" }}>
          <span style={{ color: "#666", fontWeight: 600 }}>P/S Ratio</span>
          <span style={{ fontWeight: 700, color: "#111", fontVariantNumeric: "tabular-nums" }}>{formatRatio(d.ps)}</span>
        </div>
      </div>
    </div>
  );
}

function PFTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: EnrichedProtocol }>;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={tooltipStyle}>
      <p style={{ fontWeight: 700, color: "#111111", marginBottom: 2, fontFamily: "Georgia, serif", fontSize: "14px" }}>
        {d.displayName}
      </p>
      <p style={{ fontSize: "10px", color: "#999999", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>
        {d.subcategory} \u00B7 {d.sectorLabel}
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
          <span style={{ color: "#666" }}>FDV</span>
          <span style={{ fontWeight: 600, color: "#111", fontVariantNumeric: "tabular-nums" }}>{formatCompact(d.fdv)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
          <span style={{ color: "#666" }}>Fees (Ann.)</span>
          <span style={{ fontWeight: 600, color: "#111", fontVariantNumeric: "tabular-nums" }}>{formatCompact(d.feesAnn)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, paddingTop: 4, borderTop: "1px solid #eee" }}>
          <span style={{ color: "#666", fontWeight: 600 }}>P/F Ratio</span>
          <span style={{ fontWeight: 700, color: "#111", fontVariantNumeric: "tabular-nums" }}>{formatRatio(d.pf)}</span>
        </div>
      </div>
    </div>
  );
}



// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function SectionBlockchainMetrics() {
  const ctx = useDataContext();
  const hasLiveFees = !!(ctx.fees?.protocols && ctx.fees.protocols.length > 0);

  // Build enriched protocol list with P/S and P/F
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

      const sector = CATEGORY_TO_SECTOR[p.category || "Other"] ?? "other";
      const mapping = findProtocolMapping(p.name);
      const tokenMatch = mapping?.coinGeckoId
        ? tokenById.get(mapping.coinGeckoId.toLowerCase())
        : (tokenByName.get(p.name.toLowerCase()) ?? tokenById.get(p.name.toLowerCase()) ?? tokenByName.get((p.displayName || "").toLowerCase()));
      const tvlMatch = tvlByName.get(p.name.toLowerCase()) ?? tvlByName.get(p.name.toLowerCase().replace(/\s+/g, "-"));

      const fdv = tokenMatch?.fullyDilutedValuation ?? tvlMatch?.fdv ?? null;
      if (fdv == null || fdv <= 0) continue;

      const feesAnn = p.total24h * 365;
      const revenue24h = p.revenue24h ?? 0;
      const revenueAnn = revenue24h > 0 ? revenue24h * 365 : feesAnn; // fallback to fees if no revenue data

      const ps = revenueAnn > 0 ? fdv / revenueAnn : null;
      const pf = feesAnn > 0 ? fdv / feesAnn : null;

      if (ps == null || pf == null) continue;
      // Filter extreme outliers for chart readability
      if (ps > 2000 || pf > 2000) continue;
      if (ps < 0.01 || pf < 0.01) continue;

      results.push({
        name: p.name,
        displayName: p.displayName || p.name,
        sector,
        sectorLabel: SECTOR_LABELS[sector] || sector,
        subcategory: p.category || "Other",
        color: SECTOR_COLORS[sector] || "#94a3b8",
        fees24h: p.total24h,
        feesAnn,
        revenueAnn,
        fdv,
        ps,
        pf,
      });
    }

    // Sort by FDV desc to get "top" projects
    results.sort((a, b) => b.fdv - a.fdv);
    return results;
  }, [hasLiveFees, ctx.fees, ctx.coinGecko, ctx.tvl]);

  // Compute medians
  const medians = useMemo(() => {
    if (allProtocols.length === 0) return { fdv: 0, ps: 0, pf: 0, feesAnn: 0, revenueAnn: 0 };
    return {
      fdv: median(allProtocols.map((p) => p.fdv)),
      ps: median(allProtocols.map((p) => p.ps)),
      pf: median(allProtocols.map((p) => p.pf)),
      feesAnn: median(allProtocols.map((p) => p.feesAnn)),
      revenueAnn: median(allProtocols.map((p) => p.revenueAnn)),
    };
  }, [allProtocols]);

  // Summary stats
  const stats = useMemo(() => {
    if (allProtocols.length === 0) return null;
    const topByFDV = allProtocols.slice(0, 5);
    const lowestPS = [...allProtocols].sort((a, b) => a.ps - b.ps).slice(0, 3);
    const lowestPF = [...allProtocols].sort((a, b) => a.pf - b.pf).slice(0, 3);
    return { topByFDV, lowestPS, lowestPF, total: allProtocols.length };
  }, [allProtocols]);

  if (!hasLiveFees || allProtocols.length === 0) return null;

  const sectorLegend = Array.from(new Set(allProtocols.map((p) => p.sector)));

  return (
    <section className="mb-16">
      <SectionHeader
        number="8"
        title="Blockchain Valuation Multiples"
        subtitle="Comparing fully diluted valuations against revenue and fee generation. Protocols below the median ratio lines may represent relative value; those above may be priced for growth."
      />

      {/* Summary Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div style={{ padding: "16px 20px", backgroundColor: "#fffff8", border: "1px solid #d4d4d4" }}>
          <p style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "#999999", marginBottom: 6 }}>
            Protocols Analyzed
          </p>
          <p style={{ fontSize: "28px", fontWeight: 700, color: "#111111", fontFamily: "Georgia, serif", lineHeight: 1 }}>
            {stats?.total}
          </p>
        </div>
        <div style={{ padding: "16px 20px", backgroundColor: "#fffff8", border: "1px solid #d4d4d4" }}>
          <p style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "#999999", marginBottom: 6 }}>
            Median P/S
          </p>
          <p style={{ fontSize: "28px", fontWeight: 700, color: "#111111", fontFamily: "Georgia, serif", lineHeight: 1 }}>
            {formatRatio(medians.ps)}
          </p>
        </div>
        <div style={{ padding: "16px 20px", backgroundColor: "#fffff8", border: "1px solid #d4d4d4" }}>
          <p style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "#999999", marginBottom: 6 }}>
            Median P/F
          </p>
          <p style={{ fontSize: "28px", fontWeight: 700, color: "#111111", fontFamily: "Georgia, serif", lineHeight: 1 }}>
            {formatRatio(medians.pf)}
          </p>
        </div>
        <div style={{ padding: "16px 20px", backgroundColor: "#fffff8", border: "1px solid #d4d4d4" }}>
          <p style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "#999999", marginBottom: 6 }}>
            Median FDV
          </p>
          <p style={{ fontSize: "28px", fontWeight: 700, color: "#111111", fontFamily: "Georgia, serif", lineHeight: 1 }}>
            {formatCompact(medians.fdv)}
          </p>
        </div>
      </div>

      {/* ===== CHART 1: P/S vs FDV ===== */}
      <Card className="mb-8">
        <ChartExport
          data={allProtocols.map((p) => ({
            name: p.displayName,
            sector: p.sectorLabel,
            fdv: p.fdv,
            revenueAnn: p.revenueAnn,
            ps: p.ps,
          }))}
          filename="ps-vs-fdv-scatter"
          title=""
        >
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: "20px", fontWeight: 700, color: "#111111", fontFamily: "Georgia, Cambria, serif", marginBottom: 4 }}>
              Price-to-Sales vs. Fully Diluted Valuation
            </h3>
            <p style={{ fontSize: "13px", color: "#666666", lineHeight: 1.5, maxWidth: 640 }}>
              Each dot represents a blockchain protocol. Size reflects daily fee generation.
              Dashed lines indicate median values across all {stats?.total} protocols.
            </p>
          </div>

          <div style={{ height: 520 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 30, right: 30, bottom: 50, left: 80 }}>
                <CartesianGrid
                  strokeDasharray="2 4"
                  stroke="#e8e8e8"
                  strokeOpacity={0.7}
                />
                <XAxis
                  type="number"
                  dataKey="fdv"
                  name="FDV"
                  scale="log"
                  domain={["auto", "auto"]}
                  tickFormatter={(v: number) => formatCompact(v)}
                  tick={{ fontSize: 11, fill: "#999999", fontFamily: "'Inter', sans-serif" }}
                  tickLine={false}
                  axisLine={{ stroke: "#d4d4d4", strokeWidth: 1 }}
                >
                  <Label
                    value="Fully Diluted Valuation \u2192"
                    position="bottom"
                    offset={20}
                    style={{ fontSize: 12, fill: "#666666", fontWeight: 500, fontFamily: "'Inter', sans-serif" }}
                  />
                </XAxis>
                <YAxis
                  type="number"
                  dataKey="ps"
                  name="P/S"
                  scale="log"
                  domain={["auto", "auto"]}
                  tickFormatter={(v: number) => `${v.toFixed(0)}x`}
                  tick={{ fontSize: 11, fill: "#999999", fontFamily: "'Inter', sans-serif" }}
                  tickLine={false}
                  axisLine={false}
                  width={65}
                >
                  <Label
                    value="P/S Ratio \u2192"
                    angle={-90}
                    position="insideLeft"
                    offset={-10}
                    style={{ fontSize: 12, fill: "#666666", fontWeight: 500, fontFamily: "'Inter', sans-serif" }}
                  />
                </YAxis>
                <ZAxis
                  type="number"
                  dataKey="fees24h"
                  range={[25, 500]}
                />
                {/* Median FDV — vertical */}
                <ReferenceLine
                  x={medians.fdv}
                  stroke="#111111"
                  strokeDasharray="6 4"
                  strokeWidth={1}
                  strokeOpacity={0.5}
                >
                  <Label
                    value={`Median FDV: ${formatCompact(medians.fdv)}`}
                    position="insideTopRight"
                    style={{ fontSize: 10, fill: "#111111", fontWeight: 600, fontFamily: "'Inter', sans-serif" }}
                    offset={8}
                  />
                </ReferenceLine>
                {/* Median P/S — horizontal */}
                <ReferenceLine
                  y={medians.ps}
                  stroke="#111111"
                  strokeDasharray="6 4"
                  strokeWidth={1}
                  strokeOpacity={0.5}
                >
                  <Label
                    value={`Median P/S: ${formatRatio(medians.ps)}`}
                    position="insideTopRight"
                    style={{ fontSize: 10, fill: "#111111", fontWeight: 600, fontFamily: "'Inter', sans-serif" }}
                    offset={8}
                  />
                </ReferenceLine>
                <Tooltip
                  content={<PSTooltip />}
                  cursor={{ stroke: "#d4d4d4", strokeDasharray: "3 3" }}
                />
                <Scatter data={allProtocols} shape="circle">
                  {allProtocols.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} fillOpacity={0.65} stroke={entry.color} strokeWidth={1} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>

          {/* Quadrant interpretation */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 0,
            marginTop: 16,
            border: "1px solid #e8e8e8",
          }}>
            <div style={{ padding: "10px 14px", borderRight: "1px solid #e8e8e8", borderBottom: "1px solid #e8e8e8" }}>
              <p style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#9e2b25", marginBottom: 2 }}>
                \u2196 High P/S, Low FDV
              </p>
              <p style={{ fontSize: "11px", color: "#666", lineHeight: 1.4 }}>
                Small protocols with expensive multiples relative to revenue
              </p>
            </div>
            <div style={{ padding: "10px 14px", borderBottom: "1px solid #e8e8e8" }}>
              <p style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#c67100", marginBottom: 2 }}>
                \u2197 High P/S, High FDV
              </p>
              <p style={{ fontSize: "11px", color: "#666", lineHeight: 1.4 }}>
                Large protocols priced for aggressive growth expectations
              </p>
            </div>
            <div style={{ padding: "10px 14px", borderRight: "1px solid #e8e8e8" }}>
              <p style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#666666", marginBottom: 2 }}>
                \u2199 Low P/S, Low FDV
              </p>
              <p style={{ fontSize: "11px", color: "#666", lineHeight: 1.4 }}>
                Smaller protocols with modest valuations and reasonable multiples
              </p>
            </div>
            <div style={{ padding: "10px 14px" }}>
              <p style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#2e7d32", marginBottom: 2 }}>
                \u2198 Low P/S, High FDV
              </p>
              <p style={{ fontSize: "11px", color: "#666", lineHeight: 1.4 }}>
                Large, revenue-efficient protocols with attractive multiples
              </p>
            </div>
          </div>
        </ChartExport>
      </Card>

      {/* ===== CHART 2: P/F vs FDV ===== */}
      <Card className="mb-8">
        <ChartExport
          data={allProtocols.map((p) => ({
            name: p.displayName,
            sector: p.sectorLabel,
            fdv: p.fdv,
            feesAnn: p.feesAnn,
            pf: p.pf,
          }))}
          filename="pf-vs-fdv-scatter"
          title=""
        >
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: "20px", fontWeight: 700, color: "#111111", fontFamily: "Georgia, Cambria, serif", marginBottom: 4 }}>
              Price-to-Fees vs. Fully Diluted Valuation
            </h3>
            <p style={{ fontSize: "13px", color: "#666666", lineHeight: 1.5, maxWidth: 640 }}>
              P/F uses total fees (what users pay) instead of protocol revenue.
              The median fee generation line highlights protocols above and below typical fee output.
            </p>
          </div>

          <div style={{ height: 520 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 30, right: 30, bottom: 50, left: 80 }}>
                <CartesianGrid
                  strokeDasharray="2 4"
                  stroke="#e8e8e8"
                  strokeOpacity={0.7}
                />
                <XAxis
                  type="number"
                  dataKey="fdv"
                  name="FDV"
                  scale="log"
                  domain={["auto", "auto"]}
                  tickFormatter={(v: number) => formatCompact(v)}
                  tick={{ fontSize: 11, fill: "#999999", fontFamily: "'Inter', sans-serif" }}
                  tickLine={false}
                  axisLine={{ stroke: "#d4d4d4", strokeWidth: 1 }}
                >
                  <Label
                    value="Fully Diluted Valuation \u2192"
                    position="bottom"
                    offset={20}
                    style={{ fontSize: 12, fill: "#666666", fontWeight: 500, fontFamily: "'Inter', sans-serif" }}
                  />
                </XAxis>
                <YAxis
                  type="number"
                  dataKey="pf"
                  name="P/F"
                  scale="log"
                  domain={["auto", "auto"]}
                  tickFormatter={(v: number) => `${v.toFixed(0)}x`}
                  tick={{ fontSize: 11, fill: "#999999", fontFamily: "'Inter', sans-serif" }}
                  tickLine={false}
                  axisLine={false}
                  width={65}
                >
                  <Label
                    value="P/F Ratio \u2192"
                    angle={-90}
                    position="insideLeft"
                    offset={-10}
                    style={{ fontSize: 12, fill: "#666666", fontWeight: 500, fontFamily: "'Inter', sans-serif" }}
                  />
                </YAxis>
                <ZAxis
                  type="number"
                  dataKey="fees24h"
                  range={[25, 500]}
                />
                {/* Median FDV — vertical */}
                <ReferenceLine
                  x={medians.fdv}
                  stroke="#111111"
                  strokeDasharray="6 4"
                  strokeWidth={1}
                  strokeOpacity={0.5}
                >
                  <Label
                    value={`Median FDV: ${formatCompact(medians.fdv)}`}
                    position="insideTopRight"
                    style={{ fontSize: 10, fill: "#111111", fontWeight: 600, fontFamily: "'Inter', sans-serif" }}
                    offset={8}
                  />
                </ReferenceLine>
                {/* Median P/F — horizontal */}
                <ReferenceLine
                  y={medians.pf}
                  stroke="#111111"
                  strokeDasharray="6 4"
                  strokeWidth={1}
                  strokeOpacity={0.5}
                >
                  <Label
                    value={`Median P/F: ${formatRatio(medians.pf)}`}
                    position="insideTopRight"
                    style={{ fontSize: 10, fill: "#111111", fontWeight: 600, fontFamily: "'Inter', sans-serif" }}
                    offset={8}
                  />
                </ReferenceLine>
                {/* Median Fee Generation — as a diagonal concept, show as horizontal reference */}
                <ReferenceLine
                  y={medians.feesAnn > 0 ? medians.fdv / medians.feesAnn : undefined}
                  stroke="#0274B6"
                  strokeDasharray="4 6"
                  strokeWidth={1}
                  strokeOpacity={0.4}
                  ifOverflow="extendDomain"
                >
                  <Label
                    value={`Median Fee Gen.: ${formatCompact(medians.feesAnn)}/yr`}
                    position="insideBottomRight"
                    style={{ fontSize: 10, fill: "#0274B6", fontWeight: 600, fontFamily: "'Inter', sans-serif" }}
                    offset={8}
                  />
                </ReferenceLine>
                <Tooltip
                  content={<PFTooltip />}
                  cursor={{ stroke: "#d4d4d4", strokeDasharray: "3 3" }}
                />
                <Scatter data={allProtocols} shape="circle">
                  {allProtocols.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} fillOpacity={0.65} stroke={entry.color} strokeWidth={1} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>

          {/* Quadrant interpretation */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 0,
            marginTop: 16,
            border: "1px solid #e8e8e8",
          }}>
            <div style={{ padding: "10px 14px", borderRight: "1px solid #e8e8e8", borderBottom: "1px solid #e8e8e8" }}>
              <p style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#9e2b25", marginBottom: 2 }}>
                \u2196 High P/F, Low FDV
              </p>
              <p style={{ fontSize: "11px", color: "#666", lineHeight: 1.4 }}>
                Small protocols generating minimal fees relative to their valuation
              </p>
            </div>
            <div style={{ padding: "10px 14px", borderBottom: "1px solid #e8e8e8" }}>
              <p style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#c67100", marginBottom: 2 }}>
                \u2197 High P/F, High FDV
              </p>
              <p style={{ fontSize: "11px", color: "#666", lineHeight: 1.4 }}>
                Highly valued protocols with low fee capture \u2014 narrative-driven pricing
              </p>
            </div>
            <div style={{ padding: "10px 14px", borderRight: "1px solid #e8e8e8" }}>
              <p style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#666666", marginBottom: 2 }}>
                \u2199 Low P/F, Low FDV
              </p>
              <p style={{ fontSize: "11px", color: "#666", lineHeight: 1.4 }}>
                Under-the-radar fee generators with modest market presence
              </p>
            </div>
            <div style={{ padding: "10px 14px" }}>
              <p style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#2e7d32", marginBottom: 2 }}>
                \u2198 Low P/F, High FDV
              </p>
              <p style={{ fontSize: "11px", color: "#666", lineHeight: 1.4 }}>
                Major protocols with strong fee generation \u2014 fundamentally justified valuations
              </p>
            </div>
          </div>
        </ChartExport>
      </Card>

      {/* ===== SECTOR LEGEND ===== */}
      <Card>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <h4 style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#333333" }}>
            Sector Legend
          </h4>
          <div style={{ flex: 1, height: 1, backgroundColor: "#e8e8e8" }} />
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 20 }}>
          {sectorLegend.map((sector) => {
            const count = allProtocols.filter((p) => p.sector === sector).length;
            return (
              <div key={sector} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "12px", color: "#333333" }}>
                <span style={{
                  width: 12,
                  height: 12,
                  backgroundColor: SECTOR_COLORS[sector] || "#94a3b8",
                  display: "inline-block",
                  border: "1px solid rgba(0,0,0,0.08)",
                }} />
                <span style={{ fontWeight: 500 }}>{SECTOR_LABELS[sector] || sector}</span>
                <span style={{ fontSize: "10px", color: "#999" }}>({count})</span>
              </div>
            );
          })}
        </div>

        {/* Top Protocols Table */}
        <div style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid #e8e8e8" }}>
          <h4 style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#333333", marginBottom: 12 }}>
            Most Attractively Valued (Lowest P/S)
          </h4>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #111111" }}>
                  <th style={{ textAlign: "left", padding: "8px 12px", fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#999999" }}>Protocol</th>
                  <th style={{ textAlign: "left", padding: "8px 12px", fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#999999" }}>Sector</th>
                  <th style={{ textAlign: "right", padding: "8px 12px", fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#999999" }}>FDV</th>
                  <th style={{ textAlign: "right", padding: "8px 12px", fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#999999" }}>Revenue (Ann.)</th>
                  <th style={{ textAlign: "right", padding: "8px 12px", fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#999999" }}>Fees (Ann.)</th>
                  <th style={{ textAlign: "right", padding: "8px 12px", fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#999999" }}>P/S</th>
                  <th style={{ textAlign: "right", padding: "8px 12px", fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#999999" }}>P/F</th>
                </tr>
              </thead>
              <tbody>
                {stats?.lowestPS.map((p, idx) => (
                  <tr key={p.name} style={{ borderBottom: "1px solid #f0f0f0", backgroundColor: idx % 2 === 0 ? "#fafafa" : "#ffffff" }}>
                    <td style={{ padding: "10px 12px", fontWeight: 600, color: "#111111", fontFamily: "Georgia, serif" }}>
                      <a
                        href={`/protocol/${p.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")}`}
                        style={{ color: "#111111", textDecoration: "none" }}
                        onMouseOver={(e) => (e.currentTarget.style.color = "#0274B6")}
                        onMouseOut={(e) => (e.currentTarget.style.color = "#111111")}
                      >
                        {p.displayName}
                      </a>
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                        <span style={{ width: 8, height: 8, backgroundColor: p.color, display: "inline-block" }} />
                        <span style={{ color: "#666" }}>{p.sectorLabel}</span>
                      </span>
                    </td>
                    <td style={{ padding: "10px 12px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{formatCompact(p.fdv)}</td>
                    <td style={{ padding: "10px 12px", textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 500 }}>{formatCompact(p.revenueAnn)}</td>
                    <td style={{ padding: "10px 12px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{formatCompact(p.feesAnn)}</td>
                    <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700, fontVariantNumeric: "tabular-nums", color: "#2e7d32" }}>{formatRatio(p.ps)}</td>
                    <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{formatRatio(p.pf)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Lowest P/F Table */}
        <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid #e8e8e8" }}>
          <h4 style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#333333", marginBottom: 12 }}>
            Most Efficient Fee Capture (Lowest P/F)
          </h4>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #111111" }}>
                  <th style={{ textAlign: "left", padding: "8px 12px", fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#999999" }}>Protocol</th>
                  <th style={{ textAlign: "left", padding: "8px 12px", fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#999999" }}>Sector</th>
                  <th style={{ textAlign: "right", padding: "8px 12px", fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#999999" }}>FDV</th>
                  <th style={{ textAlign: "right", padding: "8px 12px", fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#999999" }}>Fees (Ann.)</th>
                  <th style={{ textAlign: "right", padding: "8px 12px", fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#999999" }}>Revenue (Ann.)</th>
                  <th style={{ textAlign: "right", padding: "8px 12px", fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#999999" }}>P/F</th>
                  <th style={{ textAlign: "right", padding: "8px 12px", fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#999999" }}>P/S</th>
                </tr>
              </thead>
              <tbody>
                {stats?.lowestPF.map((p, idx) => (
                  <tr key={p.name} style={{ borderBottom: "1px solid #f0f0f0", backgroundColor: idx % 2 === 0 ? "#fafafa" : "#ffffff" }}>
                    <td style={{ padding: "10px 12px", fontWeight: 600, color: "#111111", fontFamily: "Georgia, serif" }}>
                      <a
                        href={`/protocol/${p.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")}`}
                        style={{ color: "#111111", textDecoration: "none" }}
                        onMouseOver={(e) => (e.currentTarget.style.color = "#0274B6")}
                        onMouseOut={(e) => (e.currentTarget.style.color = "#111111")}
                      >
                        {p.displayName}
                      </a>
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                        <span style={{ width: 8, height: 8, backgroundColor: p.color, display: "inline-block" }} />
                        <span style={{ color: "#666" }}>{p.sectorLabel}</span>
                      </span>
                    </td>
                    <td style={{ padding: "10px 12px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{formatCompact(p.fdv)}</td>
                    <td style={{ padding: "10px 12px", textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 500 }}>{formatCompact(p.feesAnn)}</td>
                    <td style={{ padding: "10px 12px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{formatCompact(p.revenueAnn)}</td>
                    <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700, fontVariantNumeric: "tabular-nums", color: "#2e7d32" }}>{formatRatio(p.pf)}</td>
                    <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{formatRatio(p.ps)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <DataSource sources={["DefiLlama (live fees & revenue)", "CoinGecko (live FDV)", "DefiLlama (TVL + FDV fallback)"]} />
      </Card>
    </section>
  );
}
