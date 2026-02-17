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
import { PROTOCOL_CATEGORY_OVERRIDES } from "@/lib/categories";
import { Card, SectionHeader, DataSource } from "@/components/ui/Card";
import { ChartExport } from "@/components/ui/ChartExport";

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
// Category mapping — only blockchain-related categories
// ---------------------------------------------------------------------------

const BLOCKCHAIN_CATEGORIES = new Set([
  "Chain", "EVM", "Rollup", "Parachain", "Cosmos", "L1", "L2",
  "Blockchain", "DA", "Sidechain", "Subnet", "EVM Compatible",
  "Modular Blockchain", "Optimistic Rollup", "ZK Rollup", "Validium", "Appchain",
]);

// Subcategory type: L1 or L2
const L2_CATEGORIES = new Set([
  "Rollup", "L2", "Optimistic Rollup", "ZK Rollup", "Validium", "Appchain", "Sidechain",
]);

// Colors for L1 vs L2
const CHAIN_TYPE_COLORS: Record<string, string> = {
  L1: "#e07714",  // deep amber
  L2: "#2563eb",  // blue
  Other: "#94a3b8",
};

const CHAIN_TYPE_LABELS: Record<string, string> = {
  L1: "Layer 1",
  L2: "Layer 2 / Rollup",
  Other: "Other",
};

// ---------------------------------------------------------------------------
// Enriched blockchain data structure
// ---------------------------------------------------------------------------

interface EnrichedBlockchain {
  name: string;
  displayName: string;
  chainType: string; // "L1" | "L2" | "Other"
  chainTypeLabel: string;
  subcategory: string; // raw DefiLlama category
  color: string;
  tokenSymbol: string | null;
  fees24h: number;
  feesAnn: number;
  revenueAnn: number;
  revenue24h: number;
  fdv: number | null;
  marketCap: number | null;
  ps: number | null;
  pf: number | null;
  margin: number | null;
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
  maxWidth: 300,
  fontFamily: "'Inter', -apple-system, sans-serif",
};

function PSTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: EnrichedBlockchain }>;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={tooltipStyle}>
      <p style={{ fontWeight: 700, color: "#111111", marginBottom: 2, fontFamily: "Georgia, serif", fontSize: "14px" }}>
        {d.displayName}
        {d.tokenSymbol && <span style={{ fontWeight: 400, color: "#999", fontSize: "12px" }}> ({d.tokenSymbol})</span>}
      </p>
      <p style={{ fontSize: "10px", color: "#999999", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>
        {d.chainTypeLabel} \u00B7 {d.subcategory}
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
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
          <span style={{ color: "#666" }}>Fees (24h)</span>
          <span style={{ fontWeight: 600, color: "#111", fontVariantNumeric: "tabular-nums" }}>{formatCompact(d.fees24h)}</span>
        </div>
        {d.margin != null && (
          <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
            <span style={{ color: "#666" }}>Margin</span>
            <span style={{ fontWeight: 600, color: "#111", fontVariantNumeric: "tabular-nums" }}>{(d.margin * 100).toFixed(1)}%</span>
          </div>
        )}
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
  payload?: Array<{ payload: EnrichedBlockchain }>;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={tooltipStyle}>
      <p style={{ fontWeight: 700, color: "#111111", marginBottom: 2, fontFamily: "Georgia, serif", fontSize: "14px" }}>
        {d.displayName}
        {d.tokenSymbol && <span style={{ fontWeight: 400, color: "#999", fontSize: "12px" }}> ({d.tokenSymbol})</span>}
      </p>
      <p style={{ fontSize: "10px", color: "#999999", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>
        {d.chainTypeLabel} \u00B7 {d.subcategory}
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
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
          <span style={{ color: "#666" }}>Fees (24h)</span>
          <span style={{ fontWeight: 600, color: "#111", fontVariantNumeric: "tabular-nums" }}>{formatCompact(d.fees24h)}</span>
        </div>
        {d.margin != null && (
          <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
            <span style={{ color: "#666" }}>Margin</span>
            <span style={{ fontWeight: 600, color: "#111", fontVariantNumeric: "tabular-nums" }}>{(d.margin * 100).toFixed(1)}%</span>
          </div>
        )}
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

  // Build enriched blockchain list — ONLY chains (L1s, L2s, Rollups)
  const allBlockchains = useMemo(() => {
    if (!hasLiveFees || !ctx.fees) return [];

    // ── CoinGecko lookup maps ──
    const tokenById = new Map<string, { marketCap: number; fullyDilutedValuation: number | null; totalVolume24h: number }>();
    const tokenByName = new Map<string, { marketCap: number; fullyDilutedValuation: number | null; totalVolume24h: number }>();
    const tokenBySymbol = new Map<string, { marketCap: number; fullyDilutedValuation: number | null; totalVolume24h: number }>();
    for (const t of ctx.coinGecko?.tokens ?? []) {
      tokenById.set(t.id.toLowerCase(), t);
      tokenByName.set(t.name.toLowerCase(), t);
      if (t.symbol) tokenBySymbol.set(t.symbol.toLowerCase(), t);
    }

    // ── DefiLlama TVL lookup maps (comprehensive key variants) ──
    const tvlByKey = new Map<string, { mcap: number | null; fdv: number | null }>();
    for (const t of ctx.tvl?.allProtocolsTVL ?? []) {
      const keys = [
        t.name.toLowerCase(),
        t.slug.toLowerCase(),
        t.name.toLowerCase().replace(/\s+/g, "-"),
        t.slug.toLowerCase().replace(/\s+/g, "-"),
      ];
      for (const k of keys) {
        if (k && !tvlByKey.has(k)) tvlByKey.set(k, t);
      }
    }

    // ── Chain slug set from PROTOCOL_CATEGORY_OVERRIDES ──
    const chainSlugs = new Set<string>();
    for (const [slug, cat] of Object.entries(PROTOCOL_CATEGORY_OVERRIDES)) {
      if (cat === "Chain") chainSlugs.add(slug.toLowerCase());
    }

    const results: EnrichedBlockchain[] = [];
    for (const p of ctx.fees.protocols) {
      if (p.total24h <= 0) continue;

      const cat = p.category || "";
      const mapping = findProtocolMapping(p.name);
      const slug = (p.slug || p.name || "").toLowerCase().replace(/\s+/g, "-");
      const nameKey = p.name.toLowerCase().replace(/\s+/g, "-");
      const displayKey = (p.displayName || "").toLowerCase().replace(/\s+/g, "-");

      // Accept protocol if ANY of these identify it as a blockchain:
      const isBlockchain =
        BLOCKCHAIN_CATEGORIES.has(cat) ||
        (mapping != null && mapping.categoryGroup === "Blockchains") ||
        chainSlugs.has(slug) ||
        chainSlugs.has(nameKey) ||
        chainSlugs.has(displayKey);
      if (!isBlockchain) continue;

      // Determine L1 vs L2
      let chainType = "Other";
      if (mapping && mapping.categoryGroup === "Blockchains") {
        chainType = mapping.subcategory === "L2" ? "L2" : "L1";
      } else if (L2_CATEGORIES.has(cat)) {
        chainType = "L2";
      } else {
        chainType = "L1";
      }

      // ── FDV matching: try every available path ──
      // CoinGecko: try coinGeckoId from mapping, then name variants
      let tokenMatch = mapping?.coinGeckoId
        ? tokenById.get(mapping.coinGeckoId.toLowerCase()) ?? null
        : null;
      if (!tokenMatch) {
        tokenMatch =
          tokenByName.get(p.name.toLowerCase()) ??
          tokenById.get(p.name.toLowerCase()) ??
          tokenByName.get((p.displayName || "").toLowerCase()) ??
          tokenById.get(slug) ??
          tokenById.get(nameKey) ??
          (mapping?.tokenSymbol ? tokenBySymbol.get(mapping.tokenSymbol.toLowerCase()) ?? null : null) ??
          null;
      }

      // DefiLlama TVL: try name, slug, displayName, and defiLlamaName from mapping
      const tvlMatch =
        tvlByKey.get(p.name.toLowerCase()) ??
        tvlByKey.get(slug) ??
        tvlByKey.get(nameKey) ??
        tvlByKey.get(displayKey) ??
        tvlByKey.get((p.displayName || "").toLowerCase()) ??
        (mapping?.defiLlamaName ? tvlByKey.get(mapping.defiLlamaName.toLowerCase()) : null) ??
        null;

      const fdv = tokenMatch?.fullyDilutedValuation ?? tvlMatch?.fdv ?? null;
      const marketCap = tokenMatch?.marketCap ?? tvlMatch?.mcap ?? null;
      const feesAnn = p.total24h * 365;
      const revenue24h = p.revenue24h ?? 0;
      const revenueAnn = revenue24h > 0 ? revenue24h * 365 : feesAnn;

      let ps: number | null = null;
      let pf: number | null = null;
      if (fdv != null && fdv > 0) {
        ps = revenueAnn > 0 ? fdv / revenueAnn : null;
        pf = feesAnn > 0 ? fdv / feesAnn : null;
        // Filter extreme outliers from scatter (but still keep in tables)
        if (ps != null && (ps > 5000 || ps < 0.01)) ps = null;
        if (pf != null && (pf > 5000 || pf < 0.01)) pf = null;
      }

      const margin = (p.revenue24h != null && p.total24h > 0)
        ? Math.min(p.revenue24h / p.total24h, 1)
        : null;

      results.push({
        name: p.name,
        displayName: p.displayName || p.name,
        chainType,
        chainTypeLabel: CHAIN_TYPE_LABELS[chainType] || chainType,
        subcategory: cat,
        color: CHAIN_TYPE_COLORS[chainType] || CHAIN_TYPE_COLORS.Other,
        tokenSymbol: mapping?.tokenSymbol ?? null,
        fees24h: p.total24h,
        feesAnn,
        revenueAnn,
        revenue24h,
        fdv,
        marketCap,
        ps,
        pf,
        margin,
      });
    }

    // Sort by fees (descending) as primary sort — works for all chains regardless of FDV
    results.sort((a, b) => b.fees24h - a.fees24h);
    return results;
  }, [hasLiveFees, ctx.fees, ctx.coinGecko, ctx.tvl]);

  // Chains with FDV data (for scatter plots)
  const scatterData = useMemo(() =>
    allBlockchains.filter((b) => b.fdv != null && b.ps != null && b.pf != null),
    [allBlockchains]
  );

  // Compute medians (from scatter-eligible data only)
  const medians = useMemo(() => {
    if (scatterData.length === 0) return { fdv: 0, ps: 0, pf: 0, feesAnn: 0, revenueAnn: 0 };
    return {
      fdv: median(scatterData.map((p) => p.fdv!)),
      ps: median(scatterData.map((p) => p.ps!)),
      pf: median(scatterData.map((p) => p.pf!)),
      feesAnn: median(scatterData.map((p) => p.feesAnn)),
      revenueAnn: median(scatterData.map((p) => p.revenueAnn)),
    };
  }, [scatterData]);

  // Summary stats
  const stats = useMemo(() => {
    if (allBlockchains.length === 0) return null;
    const l1Count = allBlockchains.filter((b) => b.chainType === "L1").length;
    const l2Count = allBlockchains.filter((b) => b.chainType === "L2").length;
    const withFDV = scatterData;
    const lowestPS = [...withFDV].sort((a, b) => a.ps! - b.ps!).slice(0, 5);
    const lowestPF = [...withFDV].sort((a, b) => a.pf! - b.pf!).slice(0, 5);
    const highestFees = [...allBlockchains].sort((a, b) => b.fees24h - a.fees24h).slice(0, 5);
    return { l1Count, l2Count, lowestPS, lowestPF, highestFees, total: allBlockchains.length, withFDV: withFDV.length };
  }, [allBlockchains, scatterData]);

  if (!hasLiveFees || allBlockchains.length === 0) return null;

  const chainTypes = Array.from(new Set(allBlockchains.map((b) => b.chainType)));
  const scatterChainTypes = Array.from(new Set(scatterData.map((b) => b.chainType)));

  return (
    <section className="mb-16">
      <SectionHeader
        number="8"
        title="Blockchain Valuation Multiples"
        subtitle="Comparing all L1 and L2 blockchain valuations against their fee and revenue generation. Chains below the median ratio lines may represent relative value."
      />

      {/* Summary Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
        <div style={{ padding: "16px 20px", backgroundColor: "#fffff8", border: "1px solid #d4d4d4" }}>
          <p style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "#999999", marginBottom: 6 }}>
            Blockchains
          </p>
          <p style={{ fontSize: "28px", fontWeight: 700, color: "#111111", fontFamily: "Georgia, serif", lineHeight: 1 }}>
            {stats?.total}
          </p>
          <p style={{ fontSize: "11px", color: "#999", marginTop: 4 }}>
            {stats?.l1Count} L1 \u00B7 {stats?.l2Count} L2 \u00B7 {stats?.withFDV} w/ FDV
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
        <div style={{ padding: "16px 20px", backgroundColor: "#fffff8", border: "1px solid #d4d4d4" }}>
          <p style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "#999999", marginBottom: 6 }}>
            Median Fees (Ann.)
          </p>
          <p style={{ fontSize: "28px", fontWeight: 700, color: "#111111", fontFamily: "Georgia, serif", lineHeight: 1 }}>
            {formatCompact(medians.feesAnn)}
          </p>
        </div>
      </div>

      {/* ===== CHART 1: P/S vs FDV ===== */}
      <Card className="mb-8">
        <ChartExport
          data={scatterData.map((b) => ({
            name: b.displayName,
            type: b.chainTypeLabel,
            symbol: b.tokenSymbol,
            fdv: b.fdv,
            revenueAnn: b.revenueAnn,
            fees24h: b.fees24h,
            ps: b.ps,
          }))}
          filename="blockchain-ps-vs-fdv"
          title=""
        >
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: "20px", fontWeight: 700, color: "#111111", fontFamily: "Georgia, Cambria, serif", marginBottom: 4 }}>
              Blockchain Price-to-Sales vs. Fully Diluted Valuation
            </h3>
            <p style={{ fontSize: "13px", color: "#666666", lineHeight: 1.5, maxWidth: 640 }}>
              Every dot is a blockchain (L1 or L2). Bubble size reflects daily fee generation.
              Dashed lines mark median values across {stats?.withFDV} chains with FDV data
              ({stats?.total} total blockchains tracked).
            </p>
          </div>

          {/* Legend */}
          <div style={{ display: "flex", gap: 20, marginBottom: 16 }}>
            {scatterChainTypes.map((ct) => (
              <div key={ct} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "12px" }}>
                <span style={{
                  width: 12,
                  height: 12,
                  backgroundColor: CHAIN_TYPE_COLORS[ct] || "#94a3b8",
                  display: "inline-block",
                  border: "1px solid rgba(0,0,0,0.08)",
                  borderRadius: "50%",
                }} />
                <span style={{ fontWeight: 500, color: "#333" }}>{CHAIN_TYPE_LABELS[ct] || ct}</span>
                <span style={{ fontSize: "10px", color: "#999" }}>
                  ({scatterData.filter((b) => b.chainType === ct).length})
                </span>
              </div>
            ))}
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
                  range={[40, 600]}
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
                <Scatter data={scatterData} shape="circle">
                  {scatterData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} fillOpacity={0.7} stroke={entry.color} strokeWidth={1.5} />
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
                {"\u2196"} High P/S, Low FDV
              </p>
              <p style={{ fontSize: "11px", color: "#666", lineHeight: 1.4 }}>
                Smaller chains with expensive multiples relative to revenue
              </p>
            </div>
            <div style={{ padding: "10px 14px", borderBottom: "1px solid #e8e8e8" }}>
              <p style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#c67100", marginBottom: 2 }}>
                {"\u2197"} High P/S, High FDV
              </p>
              <p style={{ fontSize: "11px", color: "#666", lineHeight: 1.4 }}>
                Major chains priced for aggressive growth expectations
              </p>
            </div>
            <div style={{ padding: "10px 14px", borderRight: "1px solid #e8e8e8" }}>
              <p style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#666666", marginBottom: 2 }}>
                {"\u2199"} Low P/S, Low FDV
              </p>
              <p style={{ fontSize: "11px", color: "#666", lineHeight: 1.4 }}>
                Smaller chains with modest valuations and reasonable multiples
              </p>
            </div>
            <div style={{ padding: "10px 14px" }}>
              <p style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#2e7d32", marginBottom: 2 }}>
                {"\u2198"} Low P/S, High FDV
              </p>
              <p style={{ fontSize: "11px", color: "#666", lineHeight: 1.4 }}>
                Large, revenue-efficient chains with attractive multiples
              </p>
            </div>
          </div>
        </ChartExport>
      </Card>

      {/* ===== CHART 2: P/F vs FDV ===== */}
      <Card className="mb-8">
        <ChartExport
          data={scatterData.map((b) => ({
            name: b.displayName,
            type: b.chainTypeLabel,
            symbol: b.tokenSymbol,
            fdv: b.fdv,
            feesAnn: b.feesAnn,
            fees24h: b.fees24h,
            pf: b.pf,
          }))}
          filename="blockchain-pf-vs-fdv"
          title=""
        >
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: "20px", fontWeight: 700, color: "#111111", fontFamily: "Georgia, Cambria, serif", marginBottom: 4 }}>
              Blockchain Price-to-Fees vs. Fully Diluted Valuation
            </h3>
            <p style={{ fontSize: "13px", color: "#666666", lineHeight: 1.5, maxWidth: 640 }}>
              P/F uses total fees (what users pay to use the chain) instead of protocol revenue.
              Chains with low P/F multiples generate high fees relative to their valuation.
            </p>
          </div>

          {/* Legend */}
          <div style={{ display: "flex", gap: 20, marginBottom: 16 }}>
            {scatterChainTypes.map((ct) => (
              <div key={ct} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "12px" }}>
                <span style={{
                  width: 12,
                  height: 12,
                  backgroundColor: CHAIN_TYPE_COLORS[ct] || "#94a3b8",
                  display: "inline-block",
                  border: "1px solid rgba(0,0,0,0.08)",
                  borderRadius: "50%",
                }} />
                <span style={{ fontWeight: 500, color: "#333" }}>{CHAIN_TYPE_LABELS[ct] || ct}</span>
                <span style={{ fontSize: "10px", color: "#999" }}>
                  ({scatterData.filter((b) => b.chainType === ct).length})
                </span>
              </div>
            ))}
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
                  range={[40, 600]}
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
                {/* Median Fee Generation */}
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
                <Scatter data={scatterData} shape="circle">
                  {scatterData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} fillOpacity={0.7} stroke={entry.color} strokeWidth={1.5} />
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
                {"\u2196"} High P/F, Low FDV
              </p>
              <p style={{ fontSize: "11px", color: "#666", lineHeight: 1.4 }}>
                Small chains generating minimal fees relative to their valuation
              </p>
            </div>
            <div style={{ padding: "10px 14px", borderBottom: "1px solid #e8e8e8" }}>
              <p style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#c67100", marginBottom: 2 }}>
                {"\u2197"} High P/F, High FDV
              </p>
              <p style={{ fontSize: "11px", color: "#666", lineHeight: 1.4 }}>
                Highly valued chains with low fee capture \u2014 narrative-driven pricing
              </p>
            </div>
            <div style={{ padding: "10px 14px", borderRight: "1px solid #e8e8e8" }}>
              <p style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#666666", marginBottom: 2 }}>
                {"\u2199"} Low P/F, Low FDV
              </p>
              <p style={{ fontSize: "11px", color: "#666", lineHeight: 1.4 }}>
                Under-the-radar fee generators with modest market presence
              </p>
            </div>
            <div style={{ padding: "10px 14px" }}>
              <p style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#2e7d32", marginBottom: 2 }}>
                {"\u2198"} Low P/F, High FDV
              </p>
              <p style={{ fontSize: "11px", color: "#666", lineHeight: 1.4 }}>
                Major chains with strong fee generation \u2014 fundamentally justified valuations
              </p>
            </div>
          </div>
        </ChartExport>
      </Card>

      {/* ===== CHAIN TYPE LEGEND ===== */}
      <Card>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <h4 style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#333333" }}>
            Chain Type Legend
          </h4>
          <div style={{ flex: 1, height: 1, backgroundColor: "#e8e8e8" }} />
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 20 }}>
          {chainTypes.map((ct) => {
            const count = allBlockchains.filter((b) => b.chainType === ct).length;
            return (
              <div key={ct} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "12px", color: "#333333" }}>
                <span style={{
                  width: 12,
                  height: 12,
                  backgroundColor: CHAIN_TYPE_COLORS[ct] || "#94a3b8",
                  display: "inline-block",
                  border: "1px solid rgba(0,0,0,0.08)",
                  borderRadius: "50%",
                }} />
                <span style={{ fontWeight: 500 }}>{CHAIN_TYPE_LABELS[ct] || ct}</span>
                <span style={{ fontSize: "10px", color: "#999" }}>({count})</span>
              </div>
            );
          })}
        </div>

        {/* Top Fee Generators Table */}
        <div style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid #e8e8e8" }}>
          <h4 style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#333333", marginBottom: 12 }}>
            Highest Fee Generating Blockchains
          </h4>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #111111" }}>
                  <th style={{ textAlign: "left", padding: "8px 12px", fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#999999" }}>Blockchain</th>
                  <th style={{ textAlign: "left", padding: "8px 12px", fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#999999" }}>Type</th>
                  <th style={{ textAlign: "right", padding: "8px 12px", fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#999999" }}>Fees (24h)</th>
                  <th style={{ textAlign: "right", padding: "8px 12px", fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#999999" }}>Fees (Ann.)</th>
                  <th style={{ textAlign: "right", padding: "8px 12px", fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#999999" }}>FDV</th>
                  <th style={{ textAlign: "right", padding: "8px 12px", fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#999999" }}>P/S</th>
                  <th style={{ textAlign: "right", padding: "8px 12px", fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#999999" }}>P/F</th>
                </tr>
              </thead>
              <tbody>
                {stats?.highestFees.map((b, idx) => (
                  <tr key={b.name} style={{ borderBottom: "1px solid #f0f0f0", backgroundColor: idx % 2 === 0 ? "#fafafa" : "#ffffff" }}>
                    <td style={{ padding: "10px 12px", fontWeight: 600, color: "#111111", fontFamily: "Georgia, serif" }}>
                      <a
                        href={`/protocol/${b.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")}`}
                        style={{ color: "#111111", textDecoration: "none" }}
                        onMouseOver={(e) => (e.currentTarget.style.color = "#0274B6")}
                        onMouseOut={(e) => (e.currentTarget.style.color = "#111111")}
                      >
                        {b.displayName}
                        {b.tokenSymbol && <span style={{ fontWeight: 400, color: "#999", fontSize: "11px" }}> {b.tokenSymbol}</span>}
                      </a>
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                        <span style={{ width: 8, height: 8, backgroundColor: b.color, display: "inline-block", borderRadius: "50%" }} />
                        <span style={{ color: "#666" }}>{b.chainTypeLabel}</span>
                      </span>
                    </td>
                    <td style={{ padding: "10px 12px", textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>{formatCompact(b.fees24h)}</td>
                    <td style={{ padding: "10px 12px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{formatCompact(b.feesAnn)}</td>
                    <td style={{ padding: "10px 12px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{formatCompact(b.fdv)}</td>
                    <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{formatRatio(b.ps)}</td>
                    <td style={{ padding: "10px 12px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{formatRatio(b.pf)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Lowest P/S Blockchains */}
        <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid #e8e8e8" }}>
          <h4 style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#333333", marginBottom: 12 }}>
            Most Attractively Valued Chains (Lowest P/S)
          </h4>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #111111" }}>
                  <th style={{ textAlign: "left", padding: "8px 12px", fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#999999" }}>Blockchain</th>
                  <th style={{ textAlign: "left", padding: "8px 12px", fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#999999" }}>Type</th>
                  <th style={{ textAlign: "right", padding: "8px 12px", fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#999999" }}>FDV</th>
                  <th style={{ textAlign: "right", padding: "8px 12px", fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#999999" }}>Revenue (Ann.)</th>
                  <th style={{ textAlign: "right", padding: "8px 12px", fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#999999" }}>Fees (Ann.)</th>
                  <th style={{ textAlign: "right", padding: "8px 12px", fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#999999" }}>P/S</th>
                  <th style={{ textAlign: "right", padding: "8px 12px", fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#999999" }}>P/F</th>
                </tr>
              </thead>
              <tbody>
                {stats?.lowestPS.map((b, idx) => (
                  <tr key={b.name} style={{ borderBottom: "1px solid #f0f0f0", backgroundColor: idx % 2 === 0 ? "#fafafa" : "#ffffff" }}>
                    <td style={{ padding: "10px 12px", fontWeight: 600, color: "#111111", fontFamily: "Georgia, serif" }}>
                      <a
                        href={`/protocol/${b.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")}`}
                        style={{ color: "#111111", textDecoration: "none" }}
                        onMouseOver={(e) => (e.currentTarget.style.color = "#0274B6")}
                        onMouseOut={(e) => (e.currentTarget.style.color = "#111111")}
                      >
                        {b.displayName}
                        {b.tokenSymbol && <span style={{ fontWeight: 400, color: "#999", fontSize: "11px" }}> {b.tokenSymbol}</span>}
                      </a>
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                        <span style={{ width: 8, height: 8, backgroundColor: b.color, display: "inline-block", borderRadius: "50%" }} />
                        <span style={{ color: "#666" }}>{b.chainTypeLabel}</span>
                      </span>
                    </td>
                    <td style={{ padding: "10px 12px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{formatCompact(b.fdv)}</td>
                    <td style={{ padding: "10px 12px", textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 500 }}>{formatCompact(b.revenueAnn)}</td>
                    <td style={{ padding: "10px 12px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{formatCompact(b.feesAnn)}</td>
                    <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700, fontVariantNumeric: "tabular-nums", color: "#2e7d32" }}>{formatRatio(b.ps)}</td>
                    <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{formatRatio(b.pf)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Lowest P/F Blockchains */}
        <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid #e8e8e8" }}>
          <h4 style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#333333", marginBottom: 12 }}>
            Most Efficient Fee Capture (Lowest P/F)
          </h4>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #111111" }}>
                  <th style={{ textAlign: "left", padding: "8px 12px", fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#999999" }}>Blockchain</th>
                  <th style={{ textAlign: "left", padding: "8px 12px", fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#999999" }}>Type</th>
                  <th style={{ textAlign: "right", padding: "8px 12px", fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#999999" }}>FDV</th>
                  <th style={{ textAlign: "right", padding: "8px 12px", fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#999999" }}>Fees (Ann.)</th>
                  <th style={{ textAlign: "right", padding: "8px 12px", fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#999999" }}>Revenue (Ann.)</th>
                  <th style={{ textAlign: "right", padding: "8px 12px", fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#999999" }}>P/F</th>
                  <th style={{ textAlign: "right", padding: "8px 12px", fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#999999" }}>P/S</th>
                </tr>
              </thead>
              <tbody>
                {stats?.lowestPF.map((b, idx) => (
                  <tr key={b.name} style={{ borderBottom: "1px solid #f0f0f0", backgroundColor: idx % 2 === 0 ? "#fafafa" : "#ffffff" }}>
                    <td style={{ padding: "10px 12px", fontWeight: 600, color: "#111111", fontFamily: "Georgia, serif" }}>
                      <a
                        href={`/protocol/${b.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")}`}
                        style={{ color: "#111111", textDecoration: "none" }}
                        onMouseOver={(e) => (e.currentTarget.style.color = "#0274B6")}
                        onMouseOut={(e) => (e.currentTarget.style.color = "#111111")}
                      >
                        {b.displayName}
                        {b.tokenSymbol && <span style={{ fontWeight: 400, color: "#999", fontSize: "11px" }}> {b.tokenSymbol}</span>}
                      </a>
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                        <span style={{ width: 8, height: 8, backgroundColor: b.color, display: "inline-block", borderRadius: "50%" }} />
                        <span style={{ color: "#666" }}>{b.chainTypeLabel}</span>
                      </span>
                    </td>
                    <td style={{ padding: "10px 12px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{formatCompact(b.fdv)}</td>
                    <td style={{ padding: "10px 12px", textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 500 }}>{formatCompact(b.feesAnn)}</td>
                    <td style={{ padding: "10px 12px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{formatCompact(b.revenueAnn)}</td>
                    <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700, fontVariantNumeric: "tabular-nums", color: "#2e7d32" }}>{formatRatio(b.pf)}</td>
                    <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{formatRatio(b.ps)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ALL BLOCKCHAINS TABLE */}
        <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid #e8e8e8" }}>
          <h4 style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#333333", marginBottom: 12 }}>
            All Blockchains ({allBlockchains.length})
          </h4>
          <div style={{ overflowX: "auto", maxHeight: 600, overflowY: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
              <thead style={{ position: "sticky", top: 0, background: "#fffff8", zIndex: 1 }}>
                <tr style={{ borderBottom: "2px solid #111111" }}>
                  <th style={{ textAlign: "left", padding: "8px 12px", fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#999999" }}>#</th>
                  <th style={{ textAlign: "left", padding: "8px 12px", fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#999999" }}>Blockchain</th>
                  <th style={{ textAlign: "left", padding: "8px 12px", fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#999999" }}>Type</th>
                  <th style={{ textAlign: "right", padding: "8px 12px", fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#999999" }}>FDV</th>
                  <th style={{ textAlign: "right", padding: "8px 12px", fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#999999" }}>Fees (24h)</th>
                  <th style={{ textAlign: "right", padding: "8px 12px", fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#999999" }}>Fees (Ann.)</th>
                  <th style={{ textAlign: "right", padding: "8px 12px", fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#999999" }}>Rev. (Ann.)</th>
                  <th style={{ textAlign: "right", padding: "8px 12px", fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#999999" }}>P/S</th>
                  <th style={{ textAlign: "right", padding: "8px 12px", fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#999999" }}>P/F</th>
                </tr>
              </thead>
              <tbody>
                {allBlockchains.map((b, idx) => (
                  <tr key={b.name} style={{ borderBottom: "1px solid #f0f0f0", backgroundColor: idx % 2 === 0 ? "#fafafa" : "#ffffff" }}>
                    <td style={{ padding: "8px 12px", color: "#999", fontSize: "11px" }}>{idx + 1}</td>
                    <td style={{ padding: "8px 12px", fontWeight: 600, color: "#111111", fontFamily: "Georgia, serif" }}>
                      <a
                        href={`/protocol/${b.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")}`}
                        style={{ color: "#111111", textDecoration: "none" }}
                        onMouseOver={(e) => (e.currentTarget.style.color = "#0274B6")}
                        onMouseOut={(e) => (e.currentTarget.style.color = "#111111")}
                      >
                        {b.displayName}
                        {b.tokenSymbol && <span style={{ fontWeight: 400, color: "#999", fontSize: "11px" }}> {b.tokenSymbol}</span>}
                      </a>
                    </td>
                    <td style={{ padding: "8px 12px" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                        <span style={{ width: 7, height: 7, backgroundColor: b.color, display: "inline-block", borderRadius: "50%" }} />
                        <span style={{ color: "#666", fontSize: "11px" }}>{b.chainType}</span>
                      </span>
                    </td>
                    <td style={{ padding: "8px 12px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{formatCompact(b.fdv)}</td>
                    <td style={{ padding: "8px 12px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{formatCompact(b.fees24h)}</td>
                    <td style={{ padding: "8px 12px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{formatCompact(b.feesAnn)}</td>
                    <td style={{ padding: "8px 12px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{formatCompact(b.revenueAnn)}</td>
                    <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: 600, fontVariantNumeric: "tabular-nums", color: b.ps != null && b.ps < medians.ps ? "#2e7d32" : "#111" }}>{formatRatio(b.ps)}</td>
                    <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: 600, fontVariantNumeric: "tabular-nums", color: b.pf != null && b.pf < medians.pf ? "#2e7d32" : "#111" }}>{formatRatio(b.pf)}</td>
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
