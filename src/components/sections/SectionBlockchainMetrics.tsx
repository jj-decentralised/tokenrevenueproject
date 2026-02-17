"use client";

import React, { useMemo } from "react";
import {
  ScatterChart,
  Scatter,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ZAxis,
  Cell,
  ReferenceLine,
  ReferenceDot,
  Label,
  LabelList,
  Customized,
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

/** Format vs-baseline ratio: "baseline" for 1.0x, "Xx" for others */
function formatVsBaseline(pf: number | null, basePf: number | null): string {
  if (pf == null || basePf == null || basePf <= 0) return "\u2014";
  const ratio = pf / basePf;
  if (ratio <= 1.05) return "baseline";
  return `${ratio.toFixed(1)}x`;
}

/** Color for vs-baseline column: green for baseline, gradient to red for expensive */
function vsBaselineColor(pf: number | null, basePf: number | null): string {
  if (pf == null || basePf == null || basePf <= 0) return "#999";
  const ratio = pf / basePf;
  if (ratio <= 1.05) return HIGHLIGHT_GREEN;
  if (ratio < 3) return "#558b2f";
  if (ratio < 8) return "#c67100";
  if (ratio < 20) return "#bf360c";
  return "#9e2b25";
}

/** Returns a color on a green→amber→red gradient based on P/F relative to median */
function pfColor(pf: number | null, medPf: number): string {
  if (pf == null || medPf <= 0) return "#111";
  if (pf < medPf * 0.15) return "#1b5e20";  // dark green — excellent
  if (pf < medPf * 0.4) return "#2e7d32";   // green — good
  if (pf < medPf) return "#558b2f";          // light green — below median
  if (pf < medPf * 3) return "#c67100";      // orange — above median
  return "#9e2b25";                           // red — expensive
}

// ---------------------------------------------------------------------------
// Category mapping — only blockchain-related categories
// ---------------------------------------------------------------------------

const BLOCKCHAIN_CATEGORIES = new Set([
  "Chain", "EVM", "Rollup", "Parachain", "Cosmos", "L1", "L2",
  "Blockchain", "DA", "Sidechain", "Subnet", "EVM Compatible",
  "Modular Blockchain", "Optimistic Rollup", "ZK Rollup", "Validium", "Appchain",
]);

const L2_CATEGORIES = new Set([
  "Rollup", "L2", "Optimistic Rollup", "ZK Rollup", "Validium", "Appchain", "Sidechain",
]);

const CHAIN_TYPE_COLORS: Record<string, string> = {
  L1: "#e07714",
  L2: "#2563eb",
  Other: "#94a3b8",
};

const CHAIN_TYPE_LABELS: Record<string, string> = {
  L1: "Layer 1",
  L2: "Layer 2 / Rollup",
  Other: "Other",
};

// Highlight color for the lowest P/F chain
const HIGHLIGHT_GREEN = "#2e7d32";

// ---------------------------------------------------------------------------
// Enriched blockchain data structure
// ---------------------------------------------------------------------------

interface EnrichedBlockchain {
  name: string;
  displayName: string;
  chainType: string;
  chainTypeLabel: string;
  subcategory: string;
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
// Tooltips
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

function ChainScatterTooltip({
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
        {d.chainTypeLabel} {"\u00B7"} {d.subcategory}
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
          <span style={{ color: "#666" }}>Revenue (Ann.)</span>
          <span style={{ fontWeight: 600, color: "#111", fontVariantNumeric: "tabular-nums" }}>{formatCompact(d.revenueAnn)}</span>
        </div>
        {d.margin != null && (
          <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
            <span style={{ color: "#666" }}>Margin</span>
            <span style={{ fontWeight: 600, color: "#111", fontVariantNumeric: "tabular-nums" }}>{(d.margin * 100).toFixed(1)}%</span>
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 5, paddingTop: 6, borderTop: "1px solid #eee" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
            <span style={{ color: "#666", fontWeight: 600 }}>P/F Ratio</span>
            <span style={{ fontWeight: 700, color: "#111", fontVariantNumeric: "tabular-nums" }}>{formatRatio(d.pf)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
            <span style={{ color: "#666", fontWeight: 600 }}>P/S Ratio</span>
            <span style={{ fontWeight: 700, color: "#111", fontVariantNumeric: "tabular-nums" }}>{formatRatio(d.ps)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function PfBarTooltip({ active, payload }: { active?: boolean; payload?: any[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={tooltipStyle}>
      <p style={{ fontWeight: 700, color: "#111111", marginBottom: 4, fontFamily: "Georgia, serif", fontSize: "14px" }}>
        {d.displayName}
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
          <span style={{ color: "#666" }}>P/F Ratio</span>
          <span style={{ fontWeight: 700, color: HIGHLIGHT_GREEN, fontVariantNumeric: "tabular-nums" }}>{formatRatio(d.pf)}</span>
        </div>
        {d.deviationMultiple != null && d.deviationLabel !== "baseline" && (
          <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
            <span style={{ color: "#666" }}>vs Lowest P/F</span>
            <span style={{ fontWeight: 600, color: "#c67100", fontVariantNumeric: "tabular-nums" }}>{d.deviationMultiple.toFixed(1)}x more expensive</span>
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
          <span style={{ color: "#666" }}>FDV</span>
          <span style={{ fontWeight: 600, color: "#111", fontVariantNumeric: "tabular-nums" }}>{formatCompact(d.fdv)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
          <span style={{ color: "#666" }}>Fees (Ann.)</span>
          <span style={{ fontWeight: 600, color: "#111", fontVariantNumeric: "tabular-nums" }}>{formatCompact(d.feesAnn)}</span>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Diagonal ratio reference lines (rendered via Customized)
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function RatioLines(props: any) {
  const { xAxisMap, yAxisMap } = props;
  if (!xAxisMap || !yAxisMap) return null;

  const xAxisKey = Object.keys(xAxisMap)[0];
  const yAxisKey = Object.keys(yAxisMap)[0];
  const xAxis = xAxisMap[xAxisKey];
  const yAxis = yAxisMap[yAxisKey];
  if (!xAxis?.scale || !yAxis?.scale) return null;

  const xScale = xAxis.scale;
  const yScale = yAxis.scale;
  const [xMin, xMax] = xScale.domain();
  const [yMax, yMin] = yScale.domain();

  const yLo = Math.min(yMin, yMax);
  const yHi = Math.max(yMin, yMax);

  const { ratios, color, labelSuffix } = props;
  if (!ratios || !Array.isArray(ratios)) return null;

  return (
    <g>
      {(ratios as number[]).map((ratio: number) => {
        const lxMin = Math.max(xMin, yLo * ratio);
        const lxMax = Math.min(xMax, yHi * ratio);
        if (lxMin >= lxMax) return null;

        const lyMin = lxMin / ratio;
        const lyMax = lxMax / ratio;
        if (lyMin <= 0 || lyMax <= 0) return null;

        const px1 = xScale(lxMin);
        const py1 = yScale(lyMin);
        const px2 = xScale(lxMax);
        const py2 = yScale(lyMax);

        const ratioLabel = ratio >= 1000 ? `${ratio / 1000}Kx` : `${ratio}x`;

        return (
          <g key={ratio}>
            <line
              x1={px1} y1={py1} x2={px2} y2={py2}
              stroke={color || "#bbb"}
              strokeDasharray="6 3"
              strokeWidth={0.8}
              strokeOpacity={0.6}
            />
            <text
              x={px2 + 4} y={py2 + 3}
              fill={color || "#999"}
              fontSize={8}
              fontFamily="'Inter', sans-serif"
              dominantBaseline="central"
            >
              {ratioLabel}
            </text>
          </g>
        );
      })}
      {labelSuffix && (
        <text
          x={xScale(xMax)} y={yScale(yHi) - 8}
          fill={color || "#999"}
          fontSize={9}
          fontFamily="'Inter', sans-serif"
          textAnchor="end"
          fontStyle="italic"
        >
          {labelSuffix}
        </text>
      )}
    </g>
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

    const tokenById = new Map<string, { marketCap: number; fullyDilutedValuation: number | null; totalVolume24h: number }>();
    const tokenByName = new Map<string, { marketCap: number; fullyDilutedValuation: number | null; totalVolume24h: number }>();
    const tokenBySymbol = new Map<string, { marketCap: number; fullyDilutedValuation: number | null; totalVolume24h: number }>();
    for (const t of ctx.coinGecko?.tokens ?? []) {
      tokenById.set(t.id.toLowerCase(), t);
      tokenByName.set(t.name.toLowerCase(), t);
      if (t.symbol) tokenBySymbol.set(t.symbol.toLowerCase(), t);
    }

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

      const isBlockchain =
        BLOCKCHAIN_CATEGORIES.has(cat) ||
        (mapping != null && mapping.categoryGroup === "Blockchains") ||
        chainSlugs.has(slug) ||
        chainSlugs.has(nameKey) ||
        chainSlugs.has(displayKey);
      if (!isBlockchain) continue;

      let chainType = "Other";
      if (mapping && mapping.categoryGroup === "Blockchains") {
        chainType = mapping.subcategory === "L2" ? "L2" : "L1";
      } else if (L2_CATEGORIES.has(cat)) {
        chainType = "L2";
      } else {
        chainType = "L1";
      }

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

    results.sort((a, b) => b.fees24h - a.fees24h);
    return results;
  }, [hasLiveFees, ctx.fees, ctx.coinGecko, ctx.tvl]);

  // Chains with FDV data for scatter plots
  const scatterData = useMemo(() =>
    allBlockchains.filter((b) => b.fdv != null && b.fdv > 0 && b.feesAnn > 0),
    [allBlockchains]
  );

  // The chain with the LOWEST P/F (dynamically found)
  const lowestPFChain = useMemo(() => {
    const withPF = scatterData.filter((b) => b.pf != null && b.pf > 0);
    if (withPF.length === 0) return null;
    return withPF.reduce((min, b) => (b.pf! < min.pf! ? b : min), withPF[0]);
  }, [scatterData]);

  // P/F comparison data: top 12 fee-generating chains, ensure lowest P/F is included
  const pfComparisonData = useMemo(() => {
    const withPF = scatterData.filter((b) => b.pf != null && b.pf > 0);
    const topByFees = [...withPF].sort((a, b) => b.fees24h - a.fees24h).slice(0, 12);
    // Ensure the lowest P/F chain is in the list
    if (lowestPFChain && !topByFees.find((b) => b.name === lowestPFChain.name)) {
      topByFees.pop(); // remove the 12th to make room
      topByFees.push(lowestPFChain);
    }
    // Sort by P/F ascending (lowest = best at top)
    return topByFees.sort((a, b) => a.pf! - b.pf!);
  }, [scatterData, lowestPFChain]);

  // Compute medians from scatter-eligible data
  const medians = useMemo(() => {
    if (scatterData.length === 0) return { fdv: 0, ps: 0, pf: 0, feesAnn: 0, revenueAnn: 0 };
    const psVals = scatterData.filter((p) => p.ps != null).map((p) => p.ps!);
    const pfVals = scatterData.filter((p) => p.pf != null).map((p) => p.pf!);
    return {
      fdv: median(scatterData.map((p) => p.fdv!)),
      ps: psVals.length > 0 ? median(psVals) : 0,
      pf: pfVals.length > 0 ? median(pfVals) : 0,
      feesAnn: median(scatterData.map((p) => p.feesAnn)),
      revenueAnn: median(scatterData.map((p) => p.revenueAnn)),
    };
  }, [scatterData]);

  // Deviation data: how many multiples more expensive each peer is vs the lowest P/F chain
  const pfDeviationData = useMemo(() => {
    if (!lowestPFChain || lowestPFChain.pf == null) return [];
    const basePF = lowestPFChain.pf!;
    return pfComparisonData.map((b) => ({
      ...b,
      deviationMultiple: b.pf! / basePF,       // 1.0 = same as baseline, 5.0 = 5x more expensive
      deviationLabel: b.name === lowestPFChain.name
        ? "baseline"
        : `${(b.pf! / basePF).toFixed(1)}x`,
    }));
  }, [pfComparisonData, lowestPFChain]);

  // Implied valuation: what the lowest P/F chain *would* be worth at median P/F
  const impliedValuation = useMemo(() => {
    if (!lowestPFChain || lowestPFChain.pf == null || lowestPFChain.feesAnn <= 0) return null;
    const basePF = lowestPFChain.pf!;
    const currentFDV = lowestPFChain.fdv ?? 0;
    const impliedAtMedian = lowestPFChain.feesAnn * medians.pf;
    const impliedAtAvgTop5 = (() => {
      const top5 = [...scatterData]
        .filter((b) => b.pf != null && b.pf > 0 && b.name !== lowestPFChain.name)
        .sort((a, b) => b.fees24h - a.fees24h)
        .slice(0, 5);
      if (top5.length === 0) return null;
      const avgPF = top5.reduce((sum, b) => sum + b.pf!, 0) / top5.length;
      return { fdv: lowestPFChain.feesAnn * avgPF, pf: avgPF, label: "Top 5 Avg" };
    })();
    const discount = currentFDV > 0 ? ((impliedAtMedian - currentFDV) / currentFDV) * 100 : null;
    return {
      currentFDV,
      impliedAtMedian,
      impliedAtAvgTop5,
      discount,
      basePF,
      medianPF: medians.pf,
    };
  }, [lowestPFChain, medians.pf, scatterData]);

  // Summary stats
  const stats = useMemo(() => {
    if (allBlockchains.length === 0) return null;
    const l1Count = allBlockchains.filter((b) => b.chainType === "L1").length;
    const l2Count = allBlockchains.filter((b) => b.chainType === "L2").length;
    const withFDV = scatterData;
    const withPS = withFDV.filter((b) => b.ps != null);
    const withPF = withFDV.filter((b) => b.pf != null);
    const lowestPS = [...withPS].sort((a, b) => a.ps! - b.ps!).slice(0, 5);
    const lowestPF = [...withPF].sort((a, b) => a.pf! - b.pf!).slice(0, 5);
    const highestFees = [...allBlockchains].sort((a, b) => b.fees24h - a.fees24h).slice(0, 5);
    return { l1Count, l2Count, lowestPS, lowestPF, highestFees, total: allBlockchains.length, withFDV: withFDV.length };
  }, [allBlockchains, scatterData]);

  if (!hasLiveFees || allBlockchains.length === 0) return null;

  const chainTypes = Array.from(new Set(allBlockchains.map((b) => b.chainType)));
  const scatterChainTypes = Array.from(new Set(scatterData.map((b) => b.chainType)));

  const PF_RATIOS = [10, 50, 200, 1000];
  const PS_RATIOS = [10, 50, 200, 1000];

  // Compute how many times cheaper the lowest P/F chain is vs the median
  const pfVsMedian = lowestPFChain && medians.pf > 0
    ? Math.round(medians.pf / lowestPFChain.pf!)
    : null;

  return (
    <section className="mb-16">
      <SectionHeader
        number="8"
        title="Blockchain Valuation Multiples"
        subtitle="Comparing all L1 and L2 blockchain valuations against their fee and revenue generation. Diagonal lines represent constant valuation multiples."
      />

      {/* Summary Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-4">
        <div style={{ padding: "16px 20px", backgroundColor: "#fffff8", border: "1px solid #d4d4d4" }}>
          <p style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "#999999", marginBottom: 6 }}>
            Blockchains
          </p>
          <p style={{ fontSize: "28px", fontWeight: 700, color: "#111111", fontFamily: "Georgia, serif", lineHeight: 1 }}>
            {stats?.total}
          </p>
          <p style={{ fontSize: "11px", color: "#999", marginTop: 4 }}>
            {stats?.l1Count} L1 {"\u00B7"} {stats?.l2Count} L2 {"\u00B7"} {stats?.withFDV} w/ FDV
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

      {/* ===== LOWEST P/F CALLOUT BANNER ===== */}
      {lowestPFChain && (
        <div style={{
          padding: "16px 24px",
          backgroundColor: "#f0fdf0",
          border: `2px solid ${HIGHLIGHT_GREEN}`,
          marginBottom: 16,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 16,
        }}>
          <div>
            <p style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: HIGHLIGHT_GREEN, marginBottom: 4 }}>
              Lowest Price-to-Fees Multiple
            </p>
            <p style={{ fontSize: "22px", fontWeight: 700, color: "#111111", fontFamily: "Georgia, serif", lineHeight: 1.2 }}>
              {lowestPFChain.displayName}
              {lowestPFChain.tokenSymbol && (
                <span style={{ fontWeight: 400, color: "#666", fontSize: "16px" }}> ({lowestPFChain.tokenSymbol})</span>
              )}
              <span style={{ fontSize: "22px", color: HIGHLIGHT_GREEN, marginLeft: 12 }}>
                {formatRatio(lowestPFChain.pf)}
              </span>
            </p>
          </div>
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: "10px", color: "#999", textTransform: "uppercase", letterSpacing: "0.06em" }}>FDV</p>
              <p style={{ fontSize: "16px", fontWeight: 600, color: "#111", fontVariantNumeric: "tabular-nums" }}>{formatCompact(lowestPFChain.fdv)}</p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: "10px", color: "#999", textTransform: "uppercase", letterSpacing: "0.06em" }}>Fees (Ann.)</p>
              <p style={{ fontSize: "16px", fontWeight: 600, color: "#111", fontVariantNumeric: "tabular-nums" }}>{formatCompact(lowestPFChain.feesAnn)}</p>
            </div>
            {pfVsMedian != null && pfVsMedian > 1 && (
              <div style={{ textAlign: "right" }}>
                <p style={{ fontSize: "10px", color: "#999", textTransform: "uppercase", letterSpacing: "0.06em" }}>vs Median P/F</p>
                <p style={{ fontSize: "16px", fontWeight: 700, color: HIGHLIGHT_GREEN, fontVariantNumeric: "tabular-nums" }}>{pfVsMedian}x cheaper</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== IMPLIED VALUATION CARD ===== */}
      {lowestPFChain && impliedValuation && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 0,
          marginBottom: 24,
          border: "1px solid #d4d4d4",
        }}>
          {/* Current FDV */}
          <div style={{ padding: "16px 20px", borderRight: "1px solid #e8e8e8" }}>
            <p style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "#999", marginBottom: 6 }}>
              Current FDV
            </p>
            <p style={{ fontSize: "24px", fontWeight: 700, color: "#111", fontFamily: "Georgia, serif", lineHeight: 1 }}>
              {formatCompact(impliedValuation.currentFDV)}
            </p>
            <p style={{ fontSize: "11px", color: "#999", marginTop: 4 }}>
              at {formatRatio(impliedValuation.basePF)} P/F
            </p>
          </div>
          {/* Implied at Median */}
          <div style={{ padding: "16px 20px", borderRight: "1px solid #e8e8e8", backgroundColor: "#fafff9" }}>
            <p style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: HIGHLIGHT_GREEN, marginBottom: 6 }}>
              Implied FDV at Median P/F
            </p>
            <p style={{ fontSize: "24px", fontWeight: 700, color: HIGHLIGHT_GREEN, fontFamily: "Georgia, serif", lineHeight: 1 }}>
              {formatCompact(impliedValuation.impliedAtMedian)}
            </p>
            <p style={{ fontSize: "11px", color: "#666", marginTop: 4 }}>
              at median {formatRatio(impliedValuation.medianPF)} P/F
              {impliedValuation.discount != null && (
                <span style={{ fontWeight: 700, color: HIGHLIGHT_GREEN }}>
                  {" "}{"\u2192"} {impliedValuation.discount > 0 ? "+" : ""}{impliedValuation.discount.toFixed(0)}% upside
                </span>
              )}
            </p>
          </div>
          {/* Implied at Top 5 Avg */}
          {impliedValuation.impliedAtAvgTop5 && (
            <div style={{ padding: "16px 20px" }}>
              <p style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "#666", marginBottom: 6 }}>
                Implied FDV at {impliedValuation.impliedAtAvgTop5.label} P/F
              </p>
              <p style={{ fontSize: "24px", fontWeight: 700, color: "#111", fontFamily: "Georgia, serif", lineHeight: 1 }}>
                {formatCompact(impliedValuation.impliedAtAvgTop5.fdv)}
              </p>
              <p style={{ fontSize: "11px", color: "#999", marginTop: 4 }}>
                at {formatRatio(impliedValuation.impliedAtAvgTop5.pf)} avg P/F
              </p>
            </div>
          )}
        </div>
      )}

      {/* ===== P/F DEVIATION BAR CHART — anchored at lowest P/F ===== */}
      {pfDeviationData.length > 0 && lowestPFChain && (
        <Card className="mb-8">
          <ChartExport
            data={pfDeviationData.map((b) => ({
              name: b.displayName,
              type: b.chainTypeLabel,
              pf: b.pf,
              fdv: b.fdv,
              feesAnn: b.feesAnn,
              vsLowestPF: `${b.deviationMultiple.toFixed(1)}x`,
            }))}
            filename="blockchain-pf-deviation"
            title=""
          >
            <div style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: "20px", fontWeight: 700, color: "#111111", fontFamily: "Georgia, Cambria, serif", marginBottom: 4 }}>
                How Much More Expensive Is Each Chain vs. {lowestPFChain.displayName}?
              </h3>
              <p style={{ fontSize: "13px", color: "#666666", lineHeight: 1.5, maxWidth: 720 }}>
                Each bar shows how many times more expensive a chain is relative to {lowestPFChain.displayName}{"\u2019"}s
                {" "}{formatRatio(lowestPFChain.pf)} P/F (the baseline at 1.0x). A bar at 10x means that chain{"\u2019"}s P/F multiple
                is 10 times higher — its valuation per dollar of fees generated is 10x richer.
              </p>
            </div>

            {/* Legend */}
            <div style={{ display: "flex", gap: 20, marginBottom: 16, flexWrap: "wrap" }}>
              {scatterChainTypes.map((ct) => (
                <div key={ct} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "12px" }}>
                  <span style={{
                    width: 12, height: 12,
                    backgroundColor: CHAIN_TYPE_COLORS[ct] || "#94a3b8",
                    display: "inline-block",
                    border: "1px solid rgba(0,0,0,0.08)",
                    borderRadius: "50%",
                  }} />
                  <span style={{ fontWeight: 500, color: "#333" }}>{CHAIN_TYPE_LABELS[ct] || ct}</span>
                </div>
              ))}
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "12px" }}>
                <span style={{ width: 12, height: 12, backgroundColor: HIGHLIGHT_GREEN, display: "inline-block", borderRadius: "50%" }} />
                <span style={{ fontWeight: 600, color: HIGHLIGHT_GREEN }}>{lowestPFChain.displayName} (baseline)</span>
              </div>
            </div>

            <div style={{ height: Math.max(300, pfDeviationData.length * 36 + 60) }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={pfDeviationData}
                  margin={{ top: 10, right: 100, bottom: 30, left: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="2 4"
                    stroke="#e8e8e8"
                    strokeOpacity={0.7}
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    scale="log"
                    domain={[0.8, "auto"]}
                    tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}Kx` : `${v.toFixed(v < 10 ? 1 : 0)}x`}
                    tick={{ fontSize: 10, fill: "#999999", fontFamily: "'Inter', sans-serif" }}
                    tickLine={false}
                    axisLine={{ stroke: "#d4d4d4", strokeWidth: 1 }}
                  >
                    <Label
                      value={`\u2192 times more expensive than ${lowestPFChain.displayName}`}
                      position="bottom"
                      offset={6}
                      style={{ fontSize: 11, fill: "#999", fontFamily: "'Inter', sans-serif" }}
                    />
                  </XAxis>
                  <YAxis
                    type="category"
                    dataKey="displayName"
                    width={110}
                    tick={{ fontSize: 11, fill: "#333333", fontFamily: "'Inter', sans-serif", fontWeight: 500 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  {/* Baseline reference at 1.0x */}
                  <ReferenceLine
                    x={1}
                    stroke={HIGHLIGHT_GREEN}
                    strokeWidth={2}
                    strokeOpacity={0.8}
                  >
                    <Label
                      value={`${lowestPFChain.displayName}: ${formatRatio(lowestPFChain.pf)}`}
                      position="insideTopLeft"
                      style={{ fontSize: 10, fill: HIGHLIGHT_GREEN, fontWeight: 700, fontFamily: "'Inter', sans-serif" }}
                      offset={4}
                    />
                  </ReferenceLine>
                  {/* Median reference */}
                  {medians.pf > 0 && lowestPFChain.pf != null && (
                    <ReferenceLine
                      x={medians.pf / lowestPFChain.pf}
                      stroke="#111111"
                      strokeDasharray="6 4"
                      strokeWidth={1}
                      strokeOpacity={0.5}
                    >
                      <Label
                        value={`Median: ${formatRatio(medians.pf)} (${(medians.pf / lowestPFChain.pf!).toFixed(1)}x)`}
                        position="insideTopRight"
                        style={{ fontSize: 10, fill: "#111111", fontWeight: 600, fontFamily: "'Inter', sans-serif" }}
                        offset={6}
                      />
                    </ReferenceLine>
                  )}
                  <Tooltip content={<PfBarTooltip />} cursor={{ fill: "rgba(0,0,0,0.02)" }} />
                  <Bar dataKey="deviationMultiple" radius={[0, 2, 2, 0]} maxBarSize={24}>
                    <LabelList
                      dataKey="deviationLabel"
                      position="right"
                      style={{ fontSize: 10, fontWeight: 600, fontFamily: "'Inter', sans-serif", fill: "#666" }}
                    />
                    {pfDeviationData.map((entry, idx) => (
                      <Cell
                        key={idx}
                        fill={entry.name === lowestPFChain.name ? HIGHLIGHT_GREEN : entry.color}
                        fillOpacity={entry.name === lowestPFChain.name ? 1 : 0.7}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartExport>
        </Card>
      )}

      {/* ===== CHART 1: Annualized Fees vs FDV ===== */}
      <Card className="mb-8">
        <ChartExport
          data={scatterData.map((b) => ({
            name: b.displayName,
            type: b.chainTypeLabel,
            symbol: b.tokenSymbol,
            fdv: b.fdv,
            feesAnn: b.feesAnn,
            revenueAnn: b.revenueAnn,
            pf: b.pf,
            ps: b.ps,
          }))}
          filename="blockchain-fees-vs-fdv"
          title=""
        >
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: "20px", fontWeight: 700, color: "#111111", fontFamily: "Georgia, Cambria, serif", marginBottom: 4 }}>
              Annualized Fees vs. Fully Diluted Valuation
            </h3>
            <p style={{ fontSize: "13px", color: "#666666", lineHeight: 1.5, maxWidth: 680 }}>
              Each dot is a blockchain (L1 or L2). Diagonal lines mark constant Price-to-Fees (P/F) multiples.
              Chains <strong>above</strong> a line generate more fees per dollar of FDV (cheaper valuation);
              chains <strong>below</strong> generate fewer (more expensive).
              {lowestPFChain && (
                <span style={{ color: HIGHLIGHT_GREEN, fontWeight: 600 }}>
                  {" "}{lowestPFChain.displayName} ({formatRatio(lowestPFChain.pf)}) is highlighted.
                </span>
              )}
              {stats && stats.withFDV < stats.total && (
                <span style={{ color: "#999" }}>
                  {" "}Showing {stats.withFDV} of {stats.total} chains with FDV data.
                </span>
              )}
            </p>
          </div>

          {/* Legend */}
          <div style={{ display: "flex", gap: 20, marginBottom: 16, flexWrap: "wrap" }}>
            {scatterChainTypes.map((ct) => (
              <div key={ct} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "12px" }}>
                <span style={{
                  width: 12, height: 12,
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
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "12px" }}>
              <span style={{ width: 20, height: 0, borderTop: "2px dashed #b0b0b0", display: "inline-block" }} />
              <span style={{ fontWeight: 500, color: "#999" }}>P/F multiple</span>
            </div>
            {lowestPFChain && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "12px" }}>
                <span style={{ width: 12, height: 12, border: `2px solid ${HIGHLIGHT_GREEN}`, display: "inline-block", borderRadius: "50%", backgroundColor: "transparent" }} />
                <span style={{ fontWeight: 600, color: HIGHLIGHT_GREEN }}>Lowest P/F</span>
              </div>
            )}
          </div>

          <div style={{ height: 540 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 30, right: 60, bottom: 50, left: 80 }}>
                <CartesianGrid strokeDasharray="2 4" stroke="#e8e8e8" strokeOpacity={0.7} />
                <XAxis
                  type="number" dataKey="fdv" name="FDV" scale="log"
                  domain={["auto", "auto"]}
                  tickFormatter={(v: number) => formatCompact(v)}
                  tick={{ fontSize: 11, fill: "#999999", fontFamily: "'Inter', sans-serif" }}
                  tickLine={false}
                  axisLine={{ stroke: "#d4d4d4", strokeWidth: 1 }}
                >
                  <Label value={"Fully Diluted Valuation \u2192"} position="bottom" offset={20}
                    style={{ fontSize: 12, fill: "#666666", fontWeight: 500, fontFamily: "'Inter', sans-serif" }} />
                </XAxis>
                <YAxis
                  type="number" dataKey="feesAnn" name="Fees (Ann.)" scale="log"
                  domain={["auto", "auto"]}
                  tickFormatter={(v: number) => formatCompact(v)}
                  tick={{ fontSize: 11, fill: "#999999", fontFamily: "'Inter', sans-serif" }}
                  tickLine={false} axisLine={false} width={65}
                >
                  <Label value={"Annualized Fees \u2192"} angle={-90} position="insideLeft" offset={-10}
                    style={{ fontSize: 12, fill: "#666666", fontWeight: 500, fontFamily: "'Inter', sans-serif" }} />
                </YAxis>
                <ZAxis range={[70, 70]} />
                <Customized
                  component={(chartProps: Record<string, unknown>) => (
                    <RatioLines {...chartProps} ratios={PF_RATIOS} color="#b0b0b0" labelSuffix={"P/F multiples \u2191 cheaper"} />
                  )}
                />
                <ReferenceLine x={medians.fdv} stroke="#111111" strokeDasharray="6 4" strokeWidth={1} strokeOpacity={0.3}>
                  <Label value={`Median FDV: ${formatCompact(medians.fdv)}`} position="insideTopRight"
                    style={{ fontSize: 10, fill: "#111111", fontWeight: 600, fontFamily: "'Inter', sans-serif" }} offset={8} />
                </ReferenceLine>
                {/* Highlight the lowest P/F chain */}
                {lowestPFChain && lowestPFChain.fdv && (
                  <ReferenceDot
                    x={lowestPFChain.fdv}
                    y={lowestPFChain.feesAnn}
                    r={12}
                    fill="none"
                    stroke={HIGHLIGHT_GREEN}
                    strokeWidth={2.5}
                    isFront
                  >
                    <Label
                      value={`${lowestPFChain.displayName} \u2014 ${formatRatio(lowestPFChain.pf)} P/F`}
                      position="top"
                      offset={14}
                      style={{ fontSize: 11, fill: HIGHLIGHT_GREEN, fontWeight: 700, fontFamily: "'Inter', sans-serif" }}
                    />
                  </ReferenceDot>
                )}
                <Tooltip content={<ChainScatterTooltip />} cursor={{ stroke: "#d4d4d4", strokeDasharray: "3 3" }} />
                <Scatter data={scatterData} shape="circle">
                  {scatterData.map((entry, idx) => (
                    <Cell
                      key={idx}
                      fill={lowestPFChain && entry.name === lowestPFChain.name ? HIGHLIGHT_GREEN : entry.color}
                      fillOpacity={lowestPFChain && entry.name === lowestPFChain.name ? 1 : 0.75}
                      stroke={lowestPFChain && entry.name === lowestPFChain.name ? HIGHLIGHT_GREEN : entry.color}
                      strokeWidth={lowestPFChain && entry.name === lowestPFChain.name ? 2.5 : 1.5}
                    />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>

          {/* Interpretation guide */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0, marginTop: 16, border: "1px solid #e8e8e8" }}>
            <div style={{ padding: "10px 14px", borderRight: "1px solid #e8e8e8", borderBottom: "1px solid #e8e8e8" }}>
              <p style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#2e7d32", marginBottom: 2 }}>
                {"\u2196"} High Fees, Low FDV
              </p>
              <p style={{ fontSize: "11px", color: "#666", lineHeight: 1.4 }}>
                Chains generating significant fees at modest valuations — potential value plays
              </p>
            </div>
            <div style={{ padding: "10px 14px", borderBottom: "1px solid #e8e8e8" }}>
              <p style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#111111", marginBottom: 2 }}>
                {"\u2197"} High Fees, High FDV
              </p>
              <p style={{ fontSize: "11px", color: "#666", lineHeight: 1.4 }}>
                Dominant chains with strong fee generation and large market presence
              </p>
            </div>
            <div style={{ padding: "10px 14px", borderRight: "1px solid #e8e8e8" }}>
              <p style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#666666", marginBottom: 2 }}>
                {"\u2199"} Low Fees, Low FDV
              </p>
              <p style={{ fontSize: "11px", color: "#666", lineHeight: 1.4 }}>
                Small, early-stage chains with modest fee generation and valuation
              </p>
            </div>
            <div style={{ padding: "10px 14px" }}>
              <p style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#9e2b25", marginBottom: 2 }}>
                {"\u2198"} Low Fees, High FDV
              </p>
              <p style={{ fontSize: "11px", color: "#666", lineHeight: 1.4 }}>
                Highly valued chains generating few fees — narrative-driven or speculative pricing
              </p>
            </div>
          </div>
        </ChartExport>
      </Card>

      {/* ===== CHART 2: Annualized Revenue vs FDV ===== */}
      <Card className="mb-8">
        <ChartExport
          data={scatterData.map((b) => ({
            name: b.displayName,
            type: b.chainTypeLabel,
            symbol: b.tokenSymbol,
            fdv: b.fdv,
            revenueAnn: b.revenueAnn,
            feesAnn: b.feesAnn,
            pf: b.pf,
            ps: b.ps,
          }))}
          filename="blockchain-revenue-vs-fdv"
          title=""
        >
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: "20px", fontWeight: 700, color: "#111111", fontFamily: "Georgia, Cambria, serif", marginBottom: 4 }}>
              Annualized Revenue vs. Fully Diluted Valuation
            </h3>
            <p style={{ fontSize: "13px", color: "#666666", lineHeight: 1.5, maxWidth: 680 }}>
              Revenue measures the portion of fees retained by the protocol (after paying validators, LPs, etc.).
              Diagonal lines mark constant Price-to-Sales (P/S) multiples.
              Chains <strong>above</strong> a line earn more revenue per dollar of FDV.
              {stats && stats.withFDV < stats.total && (
                <span style={{ color: "#999" }}>
                  {" "}Chains without separate revenue data use total fees as a proxy.
                </span>
              )}
            </p>
          </div>

          {/* Legend */}
          <div style={{ display: "flex", gap: 20, marginBottom: 16, flexWrap: "wrap" }}>
            {scatterChainTypes.map((ct) => (
              <div key={ct} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "12px" }}>
                <span style={{
                  width: 12, height: 12,
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
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "12px" }}>
              <span style={{ width: 20, height: 0, borderTop: "2px dashed #b0b0b0", display: "inline-block" }} />
              <span style={{ fontWeight: 500, color: "#999" }}>P/S multiple</span>
            </div>
          </div>

          <div style={{ height: 540 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 30, right: 60, bottom: 50, left: 80 }}>
                <CartesianGrid strokeDasharray="2 4" stroke="#e8e8e8" strokeOpacity={0.7} />
                <XAxis
                  type="number" dataKey="fdv" name="FDV" scale="log"
                  domain={["auto", "auto"]}
                  tickFormatter={(v: number) => formatCompact(v)}
                  tick={{ fontSize: 11, fill: "#999999", fontFamily: "'Inter', sans-serif" }}
                  tickLine={false}
                  axisLine={{ stroke: "#d4d4d4", strokeWidth: 1 }}
                >
                  <Label value={"Fully Diluted Valuation \u2192"} position="bottom" offset={20}
                    style={{ fontSize: 12, fill: "#666666", fontWeight: 500, fontFamily: "'Inter', sans-serif" }} />
                </XAxis>
                <YAxis
                  type="number" dataKey="revenueAnn" name="Revenue (Ann.)" scale="log"
                  domain={["auto", "auto"]}
                  tickFormatter={(v: number) => formatCompact(v)}
                  tick={{ fontSize: 11, fill: "#999999", fontFamily: "'Inter', sans-serif" }}
                  tickLine={false} axisLine={false} width={65}
                >
                  <Label value={"Annualized Revenue \u2192"} angle={-90} position="insideLeft" offset={-10}
                    style={{ fontSize: 12, fill: "#666666", fontWeight: 500, fontFamily: "'Inter', sans-serif" }} />
                </YAxis>
                <ZAxis range={[70, 70]} />
                <Customized
                  component={(chartProps: Record<string, unknown>) => (
                    <RatioLines {...chartProps} ratios={PS_RATIOS} color="#b0b0b0" labelSuffix={"P/S multiples \u2191 cheaper"} />
                  )}
                />
                <ReferenceLine x={medians.fdv} stroke="#111111" strokeDasharray="6 4" strokeWidth={1} strokeOpacity={0.3}>
                  <Label value={`Median FDV: ${formatCompact(medians.fdv)}`} position="insideTopRight"
                    style={{ fontSize: 10, fill: "#111111", fontWeight: 600, fontFamily: "'Inter', sans-serif" }} offset={8} />
                </ReferenceLine>
                {/* Highlight the lowest P/F chain on revenue chart too */}
                {lowestPFChain && lowestPFChain.fdv && (
                  <ReferenceDot
                    x={lowestPFChain.fdv}
                    y={lowestPFChain.revenueAnn}
                    r={12}
                    fill="none"
                    stroke={HIGHLIGHT_GREEN}
                    strokeWidth={2.5}
                    isFront
                  >
                    <Label
                      value={`${lowestPFChain.displayName}`}
                      position="top"
                      offset={14}
                      style={{ fontSize: 11, fill: HIGHLIGHT_GREEN, fontWeight: 700, fontFamily: "'Inter', sans-serif" }}
                    />
                  </ReferenceDot>
                )}
                <Tooltip content={<ChainScatterTooltip />} cursor={{ stroke: "#d4d4d4", strokeDasharray: "3 3" }} />
                <Scatter data={scatterData} shape="circle">
                  {scatterData.map((entry, idx) => (
                    <Cell
                      key={idx}
                      fill={lowestPFChain && entry.name === lowestPFChain.name ? HIGHLIGHT_GREEN : entry.color}
                      fillOpacity={lowestPFChain && entry.name === lowestPFChain.name ? 1 : 0.75}
                      stroke={lowestPFChain && entry.name === lowestPFChain.name ? HIGHLIGHT_GREEN : entry.color}
                      strokeWidth={lowestPFChain && entry.name === lowestPFChain.name ? 2.5 : 1.5}
                    />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>

          {/* Interpretation guide */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0, marginTop: 16, border: "1px solid #e8e8e8" }}>
            <div style={{ padding: "10px 14px", borderRight: "1px solid #e8e8e8", borderBottom: "1px solid #e8e8e8" }}>
              <p style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#2e7d32", marginBottom: 2 }}>
                {"\u2196"} High Revenue, Low FDV
              </p>
              <p style={{ fontSize: "11px", color: "#666", lineHeight: 1.4 }}>
                Strong revenue generators with modest valuations — attractive value propositions
              </p>
            </div>
            <div style={{ padding: "10px 14px", borderBottom: "1px solid #e8e8e8" }}>
              <p style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#111111", marginBottom: 2 }}>
                {"\u2197"} High Revenue, High FDV
              </p>
              <p style={{ fontSize: "11px", color: "#666", lineHeight: 1.4 }}>
                Market leaders with established revenue streams and premium valuations
              </p>
            </div>
            <div style={{ padding: "10px 14px", borderRight: "1px solid #e8e8e8" }}>
              <p style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#666666", marginBottom: 2 }}>
                {"\u2199"} Low Revenue, Low FDV
              </p>
              <p style={{ fontSize: "11px", color: "#666", lineHeight: 1.4 }}>
                Emerging chains — early-stage with limited revenue capture
              </p>
            </div>
            <div style={{ padding: "10px 14px" }}>
              <p style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#9e2b25", marginBottom: 2 }}>
                {"\u2198"} Low Revenue, High FDV
              </p>
              <p style={{ fontSize: "11px", color: "#666", lineHeight: 1.4 }}>
                Overvalued relative to revenue — priced on growth expectations or speculation
              </p>
            </div>
          </div>
        </ChartExport>
      </Card>

      {/* ===== CHAIN TYPE LEGEND + TABLES ===== */}
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
                  width: 12, height: 12,
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
                  {lowestPFChain && <th style={{ textAlign: "right", padding: "8px 12px", fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: HIGHLIGHT_GREEN }}>vs {lowestPFChain.displayName}</th>}
                </tr>
              </thead>
              <tbody>
                {stats?.highestFees.map((b, idx) => (
                  <tr key={b.name} style={{ borderBottom: "1px solid #f0f0f0", backgroundColor: idx % 2 === 0 ? "#fafafa" : "#ffffff" }}>
                    <td style={{ padding: "10px 12px", fontWeight: 600, color: "#111111", fontFamily: "Georgia, serif" }}>
                      <a href={`/protocol/${b.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")}`}
                        style={{ color: "#111111", textDecoration: "none" }}
                        onMouseOver={(e) => (e.currentTarget.style.color = "#0274B6")}
                        onMouseOut={(e) => (e.currentTarget.style.color = "#111111")}>
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
                    <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700, fontVariantNumeric: "tabular-nums", color: pfColor(b.pf, medians.pf) }}>{formatRatio(b.pf)}</td>
                    {lowestPFChain && <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700, fontVariantNumeric: "tabular-nums", color: vsBaselineColor(b.pf, lowestPFChain.pf) }}>{formatVsBaseline(b.pf, lowestPFChain.pf)}</td>}
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
                  {lowestPFChain && <th style={{ textAlign: "right", padding: "8px 12px", fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: HIGHLIGHT_GREEN }}>vs {lowestPFChain.displayName}</th>}
                </tr>
              </thead>
              <tbody>
                {stats?.lowestPS.map((b, idx) => (
                  <tr key={b.name} style={{ borderBottom: "1px solid #f0f0f0", backgroundColor: idx % 2 === 0 ? "#fafafa" : "#ffffff" }}>
                    <td style={{ padding: "10px 12px", fontWeight: 600, color: "#111111", fontFamily: "Georgia, serif" }}>
                      <a href={`/protocol/${b.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")}`}
                        style={{ color: "#111111", textDecoration: "none" }}
                        onMouseOver={(e) => (e.currentTarget.style.color = "#0274B6")}
                        onMouseOut={(e) => (e.currentTarget.style.color = "#111111")}>
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
                    <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 600, fontVariantNumeric: "tabular-nums", color: pfColor(b.pf, medians.pf) }}>{formatRatio(b.pf)}</td>
                    {lowestPFChain && <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700, fontVariantNumeric: "tabular-nums", color: vsBaselineColor(b.pf, lowestPFChain.pf) }}>{formatVsBaseline(b.pf, lowestPFChain.pf)}</td>}
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
                  {lowestPFChain && <th style={{ textAlign: "right", padding: "8px 12px", fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: HIGHLIGHT_GREEN }}>vs {lowestPFChain.displayName}</th>}
                </tr>
              </thead>
              <tbody>
                {stats?.lowestPF.map((b, idx) => (
                  <tr key={b.name} style={{ borderBottom: "1px solid #f0f0f0", backgroundColor: idx % 2 === 0 ? "#fafafa" : "#ffffff" }}>
                    <td style={{ padding: "10px 12px", fontWeight: 600, color: "#111111", fontFamily: "Georgia, serif" }}>
                      <a href={`/protocol/${b.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")}`}
                        style={{ color: "#111111", textDecoration: "none" }}
                        onMouseOver={(e) => (e.currentTarget.style.color = "#0274B6")}
                        onMouseOut={(e) => (e.currentTarget.style.color = "#111111")}>
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
                    <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700, fontVariantNumeric: "tabular-nums", color: pfColor(b.pf, medians.pf) }}>{formatRatio(b.pf)}</td>
                    <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{formatRatio(b.ps)}</td>
                    {lowestPFChain && <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700, fontVariantNumeric: "tabular-nums", color: vsBaselineColor(b.pf, lowestPFChain.pf) }}>{formatVsBaseline(b.pf, lowestPFChain.pf)}</td>}
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
                  {lowestPFChain && <th style={{ textAlign: "right", padding: "8px 12px", fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: HIGHLIGHT_GREEN }}>vs {lowestPFChain.displayName}</th>}
                </tr>
              </thead>
              <tbody>
                {allBlockchains.map((b, idx) => {
                  const isHighlight = lowestPFChain && b.name === lowestPFChain.name;
                  return (
                    <tr key={b.name} style={{
                      borderBottom: "1px solid #f0f0f0",
                      backgroundColor: isHighlight ? "#f0fdf0" : (idx % 2 === 0 ? "#fafafa" : "#ffffff"),
                      borderLeft: isHighlight ? `3px solid ${HIGHLIGHT_GREEN}` : "none",
                    }}>
                      <td style={{ padding: "8px 12px", color: "#999", fontSize: "11px" }}>{idx + 1}</td>
                      <td style={{ padding: "8px 12px", fontWeight: 600, color: "#111111", fontFamily: "Georgia, serif" }}>
                        <a href={`/protocol/${b.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")}`}
                          style={{ color: isHighlight ? HIGHLIGHT_GREEN : "#111111", textDecoration: "none" }}
                          onMouseOver={(e) => (e.currentTarget.style.color = "#0274B6")}
                          onMouseOut={(e) => (e.currentTarget.style.color = isHighlight ? HIGHLIGHT_GREEN : "#111111")}>
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
                      <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: 700, fontVariantNumeric: "tabular-nums", color: pfColor(b.pf, medians.pf) }}>{formatRatio(b.pf)}</td>
                      {lowestPFChain && <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: 700, fontVariantNumeric: "tabular-nums", color: vsBaselineColor(b.pf, lowestPFChain.pf) }}>{formatVsBaseline(b.pf, lowestPFChain.pf)}</td>}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <DataSource sources={["DefiLlama (live fees & revenue)", "CoinGecko (live FDV)", "DefiLlama (TVL + FDV fallback)"]} />
      </Card>
    </section>
  );
}
