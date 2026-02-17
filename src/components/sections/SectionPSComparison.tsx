"use client";

import React, { useMemo } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
  Legend,
} from "recharts";
import {
  Card,
  StatCard,
  SectionHeader,
  DataSource,
  InsightBox,
} from "@/components/ui/Card";
import {
  formatRatio,
  tooltipStyle,
} from "@/lib/chartUtils";
import {
  dotComCompanies,
  cryptoProjects,
  computeDotComMedianPS,
  computeCryptoMedianPS,
  computeDistribution,
  computeDotComSectorHeatmap,
  computeCryptoSectorHeatmap,
  computeDotComSurvival,
  computeCryptoSurvival,
  ERA_COLORS,
  type MedianPSPoint,
} from "@/lib/psComparisonData";
import { useDataContext } from "@/lib/DataContext";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const AXIS_TICK = { fontSize: 11, fill: "#94a3b8" };
const GRID_PROPS = { strokeDasharray: "3 3", stroke: "#e2e8f0", vertical: false };

function formatPS(v: number): string {
  if (v >= 10000) return `${(v / 1000).toFixed(0)}Kx`;
  if (v >= 1000) return `${(v / 1000).toFixed(1)}Kx`;
  if (v >= 100) return `${Math.round(v)}x`;
  return `${v.toFixed(1)}x`;
}

function yearFromPeakLabel(v: number): string {
  if (v === 0) return "Peak";
  if (v > 0) return `+${v}yr`;
  return `${v}yr`;
}

const bucketColors = [
  "#22c55e", // 0-5x (green)
  "#4ade80", // 5-10x
  "#facc15", // 10-25x (yellow)
  "#f59e0b", // 25-50x (amber)
  "#f97316", // 50-100x (orange)
  "#ef4444", // 100-500x (red)
  "#991b1b", // 500x+ (dark red)
];

// Sector color map for dot-com
const dotComSectorColors: Record<string, string> = {
  Internet: "#ef4444",
  Software: "#3b82f6",
  Hardware: "#10b981",
  Networking: "#8b5cf6",
  Semiconductors: "#f59e0b",
  Telecom: "#ec4899",
};

// Sector color map for crypto (reuse existing)
const cryptoSectorColors: Record<string, string> = {
  DeFi: "#3b82f6",
  Blockchains: "#f59e0b",
  Stablecoins: "#10b981",
  Consumer: "#ef4444",
  Infrastructure: "#6366f1",
  DePIN: "#ec4899",
  Exchanges: "#8b5cf6",
  Other: "#94a3b8",
};

function getHeatmapBg(ps: number | null): string {
  if (ps == null) return "#f8f8f8";
  if (ps <= 5) return "#dcfce7";
  if (ps <= 15) return "#bbf7d0";
  if (ps <= 30) return "#fef9c3";
  if (ps <= 60) return "#fde68a";
  if (ps <= 100) return "#fed7aa";
  if (ps <= 300) return "#fecaca";
  if (ps <= 1000) return "#f87171";
  return "#991b1b";
}

function getHeatmapText(ps: number | null): string {
  if (ps == null) return "#999999";
  if (ps > 300) return "#ffffff";
  return "#111111";
}

// ---------------------------------------------------------------------------
// Custom Tooltip Components
// ---------------------------------------------------------------------------

function TimelineTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={tooltipStyle}>
      <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ fontSize: 12, color: p.color }}>
          {p.name}: {formatPS(p.value)}
        </p>
      ))}
    </div>
  );
}

function BarTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: { name?: string; label?: string; company?: string }; value: number }> }) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div style={tooltipStyle}>
      <p style={{ fontSize: 12, fontWeight: 600 }}>{d.payload.name || d.payload.label || d.payload.company}</p>
      <p style={{ fontSize: 12 }}>{formatPS(d.value)}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

interface SectionPSComparisonProps {
  livePSMap?: Map<string, number>;
}

export default function SectionPSComparison({ livePSMap }: SectionPSComparisonProps) {
  // Compute all derived data
  const dotComMedian = useMemo(() => computeDotComMedianPS(), []);
  const cryptoMedian = useMemo(() => computeCryptoMedianPS(livePSMap), [livePSMap]);

  // Overlay data: normalize to "years from peak"
  const overlayData = useMemo(() => {
    const points: { yearsFromPeak: number; dotComMedian: number | null; dotComP25: number | null; dotComP75: number | null; cryptoMedian: number | null; cryptoP25: number | null; cryptoP75: number | null }[] = [];
    for (let offset = -1; offset <= 4; offset++) {
      const dc = dotComMedian.find((d) => d.yearsFromPeak === offset);
      const cr = cryptoMedian.find((d) => d.yearsFromPeak === offset);
      points.push({
        yearsFromPeak: offset,
        dotComMedian: dc && dc.count > 0 ? dc.median : null,
        dotComP25: dc && dc.count > 0 ? dc.p25 : null,
        dotComP75: dc && dc.count > 0 ? dc.p75 : null,
        cryptoMedian: cr && cr.count > 0 ? cr.median : null,
        cryptoP25: cr && cr.count > 0 ? cr.p25 : null,
        cryptoP75: cr && cr.count > 0 ? cr.p75 : null,
      });
    }
    return points;
  }, [dotComMedian, cryptoMedian]);

  // Distribution
  const dotComDist = useMemo(() => computeDistribution(dotComCompanies), []);
  const cryptoDist = useMemo(() => computeDistribution(cryptoProjects), []);

  // Top 20 by peak P/S
  const dotComTop20 = useMemo(
    () => [...dotComCompanies].sort((a, b) => b.peakPS - a.peakPS).slice(0, 20).reverse(),
    []
  );
  const cryptoTop20 = useMemo(
    () => [...cryptoProjects].sort((a, b) => b.peakPS - a.peakPS).slice(0, 20).reverse(),
    []
  );

  // Survival
  const dotComSurvival = useMemo(() => computeDotComSurvival(), []);
  const cryptoSurvival = useMemo(() => computeCryptoSurvival(), []);

  // Sector heatmaps
  const dotComHeatmap = useMemo(() => computeDotComSectorHeatmap(), []);
  const cryptoHeatmap = useMemo(() => computeCryptoSectorHeatmap(), []);

  // Hero stats
  const dcPeakMedian = dotComMedian.find((d) => d.yearsFromPeak === 0)?.median ?? 0;
  const dcEndMedian = dotComMedian.find((d) => d.yearsFromPeak === 4)?.median ?? 0;
  const crPeakMedian = cryptoMedian.find((d) => d.yearsFromPeak === 0)?.median ?? 0;
  const crLatestMedian = cryptoMedian.filter((d) => d.count > 0).slice(-1)[0]?.median ?? 0;
  const crLatestYear = cryptoMedian.filter((d) => d.count > 0).slice(-1)[0]?.year ?? 2024;

  return (
    <div className="space-y-16">
      {/* ============ HEADER ============ */}
      <SectionHeader
        number="P/S"
        title="Bubble Anatomy: Dot-Com vs Crypto P/S Ratios"
        subtitle="Comparing Price-to-Sales ratios of the top 50 tech firms during the dot-com boom (1999-2004) with the top 50 token projects in the crypto era (2021-2026). History doesn't repeat, but it rhymes."
      />

      {/* ============ HERO STAT CARDS ============ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Dot-Com Peak Median P/S"
          value={formatPS(dcPeakMedian)}
          subvalue="Year 2000 — 50 companies"
          className="border-l-4 border-l-slate-400"
        />
        <StatCard
          label="Crypto Peak Median P/S"
          value={formatPS(crPeakMedian)}
          subvalue="Year 2021 — 50 projects"
          className="border-l-4 border-l-blue-500"
        />
        <StatCard
          label="Dot-Com +4yr P/S"
          value={formatPS(dcEndMedian)}
          subvalue="Year 2004"
          change={`${(((dcEndMedian - dcPeakMedian) / dcPeakMedian) * 100).toFixed(0)}% from peak`}
          changeType="negative"
        />
        <StatCard
          label={`Crypto P/S (${crLatestYear})`}
          value={formatPS(crLatestMedian)}
          subvalue={`Latest available`}
          change={crPeakMedian > 0 ? `${(((crLatestMedian - crPeakMedian) / crPeakMedian) * 100).toFixed(0)}% from peak` : undefined}
          changeType={crLatestMedian < crPeakMedian ? "negative" : "positive"}
        />
      </div>

      {/* ============ CHART B: PARALLEL TIMELINES ============ */}
      <Card>
        <h3 className="font-serif font-bold text-[#111111] mb-1" style={{ fontSize: 18 }}>
          Parallel Timelines: Median P/S Band
        </h3>
        <p className="text-[13px] text-[#666666] mb-6">
          10th-90th percentile range with median line. Same Y-axis scale for direct comparison.
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Dot-Com */}
          <div>
            <p className="text-[11px] uppercase font-medium text-[#999999] mb-2" style={{ letterSpacing: "0.1em" }}>
              Dot-Com Era (1999-2004)
            </p>
            <div style={{ overflowX: "auto" }}>
              <div style={{ minWidth: 380 }}>
                <ResponsiveContainer width="100%" height={320}>
                  <AreaChart data={dotComMedian.map((d) => ({ ...d, label: String(d.year) }))}>
                    <defs>
                      <linearGradient id="gradDC90" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={ERA_COLORS.dotCom} stopOpacity={0.15} />
                        <stop offset="95%" stopColor={ERA_COLORS.dotCom} stopOpacity={0.02} />
                      </linearGradient>
                      <linearGradient id="gradDC50" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={ERA_COLORS.dotCom} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={ERA_COLORS.dotCom} stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid {...GRID_PROPS} />
                    <XAxis dataKey="label" tick={AXIS_TICK} tickLine={false} axisLine={{ stroke: "#e2e8f0" }} />
                    <YAxis tickFormatter={formatPS} tick={AXIS_TICK} tickLine={false} axisLine={false} width={55} domain={[0, 250]} />
                    <Tooltip content={<TimelineTooltip />} />
                    <Area type="monotone" dataKey="p90" stackId="band" stroke="none" fill="url(#gradDC90)" name="90th pctl" />
                    <Area type="monotone" dataKey="p75" stackId="band2" stroke="none" fill="url(#gradDC50)" name="75th pctl" />
                    <Line type="monotone" dataKey="median" stroke={ERA_COLORS.dotCom} strokeWidth={3} dot={{ r: 4, fill: "#fff", stroke: ERA_COLORS.dotCom, strokeWidth: 2 }} name="Median P/S" />
                    <Line type="monotone" dataKey="p10" stroke={ERA_COLORS.dotComLight} strokeWidth={1} strokeDasharray="4 3" dot={false} name="10th pctl" />
                    <ReferenceLine y={3} stroke={ERA_COLORS.reference} strokeDasharray="6 4" label={{ value: "S&P 500 avg", position: "right", fontSize: 10, fill: ERA_COLORS.reference }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          {/* Crypto */}
          <div>
            <p className="text-[11px] uppercase font-medium text-[#999999] mb-2" style={{ letterSpacing: "0.1em" }}>
              Crypto Era (2021-2026)
            </p>
            <div style={{ overflowX: "auto" }}>
              <div style={{ minWidth: 380 }}>
                <ResponsiveContainer width="100%" height={320}>
                  <AreaChart data={cryptoMedian.map((d) => ({ ...d, label: String(d.year) }))}>
                    <defs>
                      <linearGradient id="gradCR90" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={ERA_COLORS.crypto} stopOpacity={0.15} />
                        <stop offset="95%" stopColor={ERA_COLORS.crypto} stopOpacity={0.02} />
                      </linearGradient>
                      <linearGradient id="gradCR50" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={ERA_COLORS.crypto} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={ERA_COLORS.crypto} stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid {...GRID_PROPS} />
                    <XAxis dataKey="label" tick={AXIS_TICK} tickLine={false} axisLine={{ stroke: "#e2e8f0" }} />
                    <YAxis tickFormatter={formatPS} tick={AXIS_TICK} tickLine={false} axisLine={false} width={55} domain={[0, 250]} />
                    <Tooltip content={<TimelineTooltip />} />
                    <Area type="monotone" dataKey="p90" stackId="band" stroke="none" fill="url(#gradCR90)" name="90th pctl" />
                    <Area type="monotone" dataKey="p75" stackId="band2" stroke="none" fill="url(#gradCR50)" name="75th pctl" />
                    <Line type="monotone" dataKey="median" stroke={ERA_COLORS.crypto} strokeWidth={3} dot={{ r: 4, fill: "#fff", stroke: ERA_COLORS.crypto, strokeWidth: 2 }} name="Median P/S" />
                    <Line type="monotone" dataKey="p10" stroke={ERA_COLORS.cryptoLight} strokeWidth={1} strokeDasharray="4 3" dot={false} name="10th pctl" />
                    <ReferenceLine y={3} stroke={ERA_COLORS.reference} strokeDasharray="6 4" label={{ value: "S&P 500 avg", position: "right", fontSize: 10, fill: ERA_COLORS.reference }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
        <DataSource sources={["SEC 10-K filings", "MacroTrends", "DefiLlama", "CoinGecko", "TokenTerminal"]} />
      </Card>

      {/* ============ CHART C: OVERLAY COMPARISON ============ */}
      <Card>
        <h3 className="font-serif font-bold text-[#111111] mb-1" style={{ fontSize: 18 }}>
          Overlay: Both Eras on "Years from Peak" Axis
        </h3>
        <p className="text-[13px] text-[#666666] mb-6">
          Dot-com peak = 2000, Crypto peak = 2021. Showing median P/S with 25th-75th percentile bands.
        </p>
        <div style={{ overflowX: "auto" }}>
          <div style={{ minWidth: 500 }}>
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={overlayData}>
                <defs>
                  <linearGradient id="gradOverlayDC" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={ERA_COLORS.dotCom} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={ERA_COLORS.dotCom} stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="gradOverlayCR" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={ERA_COLORS.crypto} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={ERA_COLORS.crypto} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid {...GRID_PROPS} />
                <XAxis
                  dataKey="yearsFromPeak"
                  tickFormatter={yearFromPeakLabel}
                  tick={AXIS_TICK}
                  tickLine={false}
                  axisLine={{ stroke: "#e2e8f0" }}
                />
                <YAxis tickFormatter={formatPS} tick={AXIS_TICK} tickLine={false} axisLine={false} width={55} />
                <Tooltip
                  formatter={(value: number, name: string) => [formatPS(value), name]}
                  labelFormatter={yearFromPeakLabel}
                  contentStyle={tooltipStyle}
                />
                <Legend
                  wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                />
                <Area type="monotone" dataKey="dotComP75" stroke="none" fill="url(#gradOverlayDC)" name="Dot-Com 75th pctl" legendType="none" />
                <Area type="monotone" dataKey="cryptoP75" stroke="none" fill="url(#gradOverlayCR)" name="Crypto 75th pctl" legendType="none" />
                <Line type="monotone" dataKey="dotComMedian" stroke={ERA_COLORS.dotCom} strokeWidth={3} dot={{ r: 5, fill: "#fff", stroke: ERA_COLORS.dotCom, strokeWidth: 2 }} name="Dot-Com Median" connectNulls />
                <Line type="monotone" dataKey="cryptoMedian" stroke={ERA_COLORS.crypto} strokeWidth={3} dot={{ r: 5, fill: "#fff", stroke: ERA_COLORS.crypto, strokeWidth: 2 }} name="Crypto Median" connectNulls />
                <ReferenceLine y={3} stroke={ERA_COLORS.reference} strokeDasharray="6 4" label={{ value: "S&P 500 avg ~3x", position: "insideTopRight", fontSize: 10, fill: ERA_COLORS.reference }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <DataSource sources={["SEC 10-K filings", "MacroTrends", "DefiLlama", "CoinGecko"]} />
      </Card>

      {/* ============ INSIGHT BOX ============ */}
      <InsightBox title="History Rhymes" type="insight">
        <p>
          At the dot-com peak (2000), the median P/S among top 50 tech firms was <strong>{formatPS(dcPeakMedian)}</strong>.
          Four years later, it had compressed to <strong>{formatPS(dcEndMedian)}</strong> — a{" "}
          {dcPeakMedian > 0 ? `${((1 - dcEndMedian / dcPeakMedian) * 100).toFixed(0)}%` : "—"} decline.
          Crypto&apos;s peak median P/S in 2021 was <strong>{formatPS(crPeakMedian)}</strong>, and its latest reading is{" "}
          <strong>{formatPS(crLatestMedian)}</strong>. The compression pattern is strikingly similar — speculative premiums
          deflate, but survivors with real revenue emerge stronger.
        </p>
      </InsightBox>

      {/* ============ CHART D: DISTRIBUTION HISTOGRAM ============ */}
      <Card>
        <h3 className="font-serif font-bold text-[#111111] mb-1" style={{ fontSize: 18 }}>
          P/S Distribution at Peak
        </h3>
        <p className="text-[13px] text-[#666666] mb-6">
          How many companies/projects fell in each P/S bucket at their era&apos;s peak (2000 vs 2021).
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Dot-Com Distribution */}
          <div>
            <p className="text-[11px] uppercase font-medium text-[#999999] mb-2" style={{ letterSpacing: "0.1em" }}>
              Dot-Com (Peak P/S, 2000)
            </p>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={dotComDist} layout="vertical">
                <CartesianGrid {...GRID_PROPS} horizontal={false} vertical />
                <XAxis type="number" tick={AXIS_TICK} tickLine={false} axisLine={{ stroke: "#e2e8f0" }} allowDecimals={false} />
                <YAxis type="category" dataKey="label" tick={AXIS_TICK} tickLine={false} axisLine={false} width={65} />
                <Tooltip content={<BarTooltip />} />
                <Bar dataKey="count" name="Companies" radius={[0, 2, 2, 0]}>
                  {dotComDist.map((_, i) => (
                    <Cell key={i} fill={bucketColors[i]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          {/* Crypto Distribution */}
          <div>
            <p className="text-[11px] uppercase font-medium text-[#999999] mb-2" style={{ letterSpacing: "0.1em" }}>
              Crypto (Peak P/S, 2021)
            </p>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={cryptoDist} layout="vertical">
                <CartesianGrid {...GRID_PROPS} horizontal={false} vertical />
                <XAxis type="number" tick={AXIS_TICK} tickLine={false} axisLine={{ stroke: "#e2e8f0" }} allowDecimals={false} />
                <YAxis type="category" dataKey="label" tick={AXIS_TICK} tickLine={false} axisLine={false} width={65} />
                <Tooltip content={<BarTooltip />} />
                <Bar dataKey="count" name="Projects" radius={[0, 2, 2, 0]}>
                  {cryptoDist.map((_, i) => (
                    <Cell key={i} fill={bucketColors[i]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <DataSource sources={["SEC 10-K filings", "DefiLlama", "CoinGecko"]} />
      </Card>

      {/* ============ CHART E: TOP 20 RANKED ============ */}
      <Card>
        <h3 className="font-serif font-bold text-[#111111] mb-1" style={{ fontSize: 18 }}>
          Top 20 by Peak P/S Ratio
        </h3>
        <p className="text-[13px] text-[#666666] mb-6">
          The most extreme valuations in each era — sorted by peak P/S.
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Dot-Com Top 20 */}
          <div>
            <p className="text-[11px] uppercase font-medium text-[#999999] mb-2" style={{ letterSpacing: "0.1em" }}>
              Dot-Com Top 20
            </p>
            <div style={{ overflowX: "auto" }}>
              <div style={{ minWidth: 380 }}>
                <ResponsiveContainer width="100%" height={500}>
                  <BarChart data={dotComTop20} layout="vertical" margin={{ left: 10, right: 20 }}>
                    <CartesianGrid {...GRID_PROPS} horizontal={false} vertical />
                    <XAxis type="number" tickFormatter={formatPS} tick={AXIS_TICK} tickLine={false} axisLine={{ stroke: "#e2e8f0" }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#333333" }} tickLine={false} axisLine={false} width={120} />
                    <Tooltip content={<BarTooltip />} />
                    <Bar dataKey="peakPS" name="Peak P/S" radius={[0, 2, 2, 0]}>
                      {dotComTop20.map((c, i) => (
                        <Cell key={i} fill={dotComSectorColors[c.sector] || "#94a3b8"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          {/* Crypto Top 20 */}
          <div>
            <p className="text-[11px] uppercase font-medium text-[#999999] mb-2" style={{ letterSpacing: "0.1em" }}>
              Crypto Top 20
            </p>
            <div style={{ overflowX: "auto" }}>
              <div style={{ minWidth: 380 }}>
                <ResponsiveContainer width="100%" height={500}>
                  <BarChart data={cryptoTop20} layout="vertical" margin={{ left: 10, right: 20 }}>
                    <CartesianGrid {...GRID_PROPS} horizontal={false} vertical />
                    <XAxis type="number" tickFormatter={formatPS} tick={AXIS_TICK} tickLine={false} axisLine={{ stroke: "#e2e8f0" }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#333333" }} tickLine={false} axisLine={false} width={120} />
                    <Tooltip content={<BarTooltip />} />
                    <Bar dataKey="peakPS" name="Peak P/S" radius={[0, 2, 2, 0]}>
                      {cryptoTop20.map((c, i) => (
                        <Cell key={i} fill={cryptoSectorColors[c.sector] || "#94a3b8"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
        {/* Sector legends */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
          <div className="flex flex-wrap gap-3">
            {Object.entries(dotComSectorColors).map(([sector, color]) => (
              <span key={sector} className="flex items-center gap-1.5 text-[11px] text-[#666666]">
                <span style={{ width: 10, height: 10, background: color, display: "inline-block" }} />
                {sector}
              </span>
            ))}
          </div>
          <div className="flex flex-wrap gap-3">
            {Object.entries(cryptoSectorColors).map(([sector, color]) => (
              <span key={sector} className="flex items-center gap-1.5 text-[11px] text-[#666666]">
                <span style={{ width: 10, height: 10, background: color, display: "inline-block" }} />
                {sector}
              </span>
            ))}
          </div>
        </div>
        <DataSource sources={["SEC 10-K filings", "MacroTrends", "Jay Ritter IPO data", "DefiLlama", "CoinGecko"]} />
      </Card>

      {/* ============ INSIGHT BOX: SURVIVORS ============ */}
      <InsightBox title="The Survivors" type="highlight">
        <p>
          Of the 50 dot-com companies tracked, only <strong>{dotComCompanies.filter((c) => c.survived).length}</strong> survived
          as independent public entities (or via major acquisition). Amazon, eBay, Microsoft, Intel, Cisco, Qualcomm — the
          survivors shared one trait: <strong>real, growing revenue</strong>. In crypto, virtually all 50 tracked projects
          remain active in 2026, but the true test is whether their protocol revenue can sustain current valuations as
          speculative premiums compress.
        </p>
      </InsightBox>

      {/* ============ CHART F: SURVIVAL TRACKER ============ */}
      <Card>
        <h3 className="font-serif font-bold text-[#111111] mb-1" style={{ fontSize: 18 }}>
          Survival by P/S Bucket
        </h3>
        <p className="text-[13px] text-[#666666] mb-6">
          Did higher peak P/S predict failure? Survival rate by valuation bucket at peak.
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Dot-Com Survival */}
          <div>
            <p className="text-[11px] uppercase font-medium text-[#999999] mb-2" style={{ letterSpacing: "0.1em" }}>
              Dot-Com Survival (to 2024)
            </p>
            <div className="space-y-2">
              {dotComSurvival.filter((b) => b.total > 0).map((b) => (
                <div key={b.label} className="flex items-center gap-3">
                  <span className="text-[12px] text-[#666666] w-[60px] text-right font-mono">{b.label}</span>
                  <div className="flex-1 h-6 bg-[#f5f5f5] relative" style={{ borderRadius: 0 }}>
                    <div
                      className="h-full"
                      style={{
                        width: `${b.rate * 100}%`,
                        background: b.rate >= 0.5 ? "#22c55e" : b.rate >= 0.25 ? "#f59e0b" : "#ef4444",
                        borderRadius: 0,
                        transition: "width 0.5s ease",
                      }}
                    />
                    <span
                      className="absolute inset-0 flex items-center justify-center text-[11px] font-medium"
                      style={{ color: b.rate >= 0.5 ? "#fff" : "#333" }}
                    >
                      {b.survived}/{b.total} ({(b.rate * 100).toFixed(0)}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Crypto Survival */}
          <div>
            <p className="text-[11px] uppercase font-medium text-[#999999] mb-2" style={{ letterSpacing: "0.1em" }}>
              Crypto Still Active (2026)
            </p>
            <div className="space-y-2">
              {cryptoSurvival.filter((b) => b.total > 0).map((b) => (
                <div key={b.label} className="flex items-center gap-3">
                  <span className="text-[12px] text-[#666666] w-[60px] text-right font-mono">{b.label}</span>
                  <div className="flex-1 h-6 bg-[#f5f5f5] relative" style={{ borderRadius: 0 }}>
                    <div
                      className="h-full"
                      style={{
                        width: `${b.rate * 100}%`,
                        background: b.rate >= 0.5 ? "#22c55e" : b.rate >= 0.25 ? "#f59e0b" : "#ef4444",
                        borderRadius: 0,
                        transition: "width 0.5s ease",
                      }}
                    />
                    <span
                      className="absolute inset-0 flex items-center justify-center text-[11px] font-medium"
                      style={{ color: b.rate >= 0.5 ? "#fff" : "#333" }}
                    >
                      {b.survived}/{b.total} ({(b.rate * 100).toFixed(0)}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <DataSource sources={["Company records", "CoinGecko", "DefiLlama"]} />
      </Card>

      {/* ============ CHART G: SECTOR HEATMAP ============ */}
      <Card>
        <h3 className="font-serif font-bold text-[#111111] mb-1" style={{ fontSize: 18 }}>
          Sector P/S Heatmap
        </h3>
        <p className="text-[13px] text-[#666666] mb-6">
          Median P/S by sector and year. Shows which sectors deflated fastest.
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Dot-Com Heatmap */}
          <div>
            <p className="text-[11px] uppercase font-medium text-[#999999] mb-2" style={{ letterSpacing: "0.1em" }}>
              Dot-Com Sectors
            </p>
            <div style={{ overflowX: "auto" }}>
              <table className="w-full" style={{ fontSize: 12, borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th className="text-left p-2 text-[11px] text-[#999999] font-medium" style={{ width: 100 }}>Sector</th>
                    {[1999, 2000, 2001, 2002, 2003, 2004].map((y) => (
                      <th key={y} className="text-center p-2 text-[11px] text-[#999999] font-medium" style={{ width: 60 }}>{y}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dotComHeatmap.map((row) => (
                    <tr key={row.sector}>
                      <td className="p-2 text-[12px] font-medium text-[#333333] border-t border-[#e8e8e8]">
                        <span className="flex items-center gap-1.5">
                          <span style={{ width: 8, height: 8, background: dotComSectorColors[row.sector] || "#94a3b8", display: "inline-block" }} />
                          {row.sector}
                        </span>
                      </td>
                      {[1999, 2000, 2001, 2002, 2003, 2004].map((y) => {
                        const val = row[y] as number | null;
                        return (
                          <td
                            key={y}
                            className="text-center p-2 font-mono border-t border-[#e8e8e8]"
                            style={{
                              backgroundColor: getHeatmapBg(val),
                              color: getHeatmapText(val),
                              fontSize: 11,
                              fontWeight: 600,
                            }}
                          >
                            {val != null ? formatPS(val) : "—"}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {/* Crypto Heatmap */}
          <div>
            <p className="text-[11px] uppercase font-medium text-[#999999] mb-2" style={{ letterSpacing: "0.1em" }}>
              Crypto Sectors
            </p>
            <div style={{ overflowX: "auto" }}>
              <table className="w-full" style={{ fontSize: 12, borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th className="text-left p-2 text-[11px] text-[#999999] font-medium" style={{ width: 100 }}>Sector</th>
                    {[2021, 2022, 2023, 2024].map((y) => (
                      <th key={y} className="text-center p-2 text-[11px] text-[#999999] font-medium" style={{ width: 60 }}>{y}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {cryptoHeatmap.map((row) => (
                    <tr key={row.sector}>
                      <td className="p-2 text-[12px] font-medium text-[#333333] border-t border-[#e8e8e8]">
                        <span className="flex items-center gap-1.5">
                          <span style={{ width: 8, height: 8, background: cryptoSectorColors[row.sector] || "#94a3b8", display: "inline-block" }} />
                          {row.sector}
                        </span>
                      </td>
                      {[2021, 2022, 2023, 2024].map((y) => {
                        const val = row[y] as number | null;
                        return (
                          <td
                            key={y}
                            className="text-center p-2 font-mono border-t border-[#e8e8e8]"
                            style={{
                              backgroundColor: getHeatmapBg(val),
                              color: getHeatmapText(val),
                              fontSize: 11,
                              fontWeight: 600,
                            }}
                          >
                            {val != null ? formatPS(val) : "—"}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <DataSource sources={["SEC 10-K filings", "DefiLlama", "CoinGecko"]} />
      </Card>

      {/* ============ INSIGHT BOX: WHERE ARE WE NOW ============ */}
      <InsightBox title="Where Are We Now?" type="warning">
        <p>
          By 2004 — four years after the dot-com peak — the median tech P/S had compressed from {formatPS(dcPeakMedian)} to{" "}
          {formatPS(dcEndMedian)}. Survivors like Amazon ({formatPS(2.7)}) and Microsoft ({formatPS(7.5)}) traded at modest
          multiples but had built enormous revenue engines. Crypto in {crLatestYear} shows a similar pattern: DeFi protocols
          with real revenue are converging toward traditional SaaS multiples, while L1 blockchains and speculative projects
          still carry dot-com-era premiums. The question isn&apos;t <em>if</em> compression continues — it&apos;s which
          projects will be the Amazon of crypto.
        </p>
      </InsightBox>

      {/* ============ FULL DATA TABLE ============ */}
      <Card>
        <h3 className="font-serif font-bold text-[#111111] mb-1" style={{ fontSize: 18 }}>
          Full Dataset: 50 Dot-Com Companies
        </h3>
        <p className="text-[13px] text-[#666666] mb-4">
          Peak P/S, market cap, revenue, and survival status.
        </p>
        <div style={{ overflowX: "auto" }}>
          <table className="w-full" style={{ fontSize: 12, borderCollapse: "collapse", minWidth: 700 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #111111" }}>
                <th className="text-left p-2 text-[11px] text-[#999999] font-medium">Company</th>
                <th className="text-left p-2 text-[11px] text-[#999999] font-medium">Sector</th>
                <th className="text-right p-2 text-[11px] text-[#999999] font-medium">Peak P/S</th>
                <th className="text-right p-2 text-[11px] text-[#999999] font-medium">Peak MCap</th>
                <th className="text-right p-2 text-[11px] text-[#999999] font-medium">Revenue</th>
                <th className="text-center p-2 text-[11px] text-[#999999] font-medium">Survived</th>
              </tr>
            </thead>
            <tbody>
              {[...dotComCompanies]
                .sort((a, b) => b.peakPS - a.peakPS)
                .map((c) => (
                  <tr key={c.ticker} className="border-t border-[#e8e8e8] hover:bg-[#f9f9f9]">
                    <td className="p-2 font-medium text-[#111111]">
                      {c.name}
                      <span className="text-[#999999] ml-1">({c.ticker})</span>
                    </td>
                    <td className="p-2">
                      <span className="flex items-center gap-1.5">
                        <span style={{ width: 8, height: 8, background: dotComSectorColors[c.sector] || "#94a3b8", display: "inline-block" }} />
                        {c.sector}
                      </span>
                    </td>
                    <td className="p-2 text-right font-mono font-semibold">{formatPS(c.peakPS)}</td>
                    <td className="p-2 text-right font-mono">${c.peakMarketCapB.toFixed(1)}B</td>
                    <td className="p-2 text-right font-mono">${c.peakRevenueB >= 1 ? `${c.peakRevenueB.toFixed(1)}B` : `${(c.peakRevenueB * 1000).toFixed(0)}M`}</td>
                    <td className="p-2 text-center">
                      <span style={{ color: c.survived ? "#22c55e" : "#ef4444", fontWeight: 600 }}>
                        {c.survived ? "Yes" : "No"}
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <h3 className="font-serif font-bold text-[#111111] mb-1" style={{ fontSize: 18 }}>
          Full Dataset: 50 Crypto Projects
        </h3>
        <p className="text-[13px] text-[#666666] mb-4">
          Peak P/S, market cap, revenue, and activity status.
        </p>
        <div style={{ overflowX: "auto" }}>
          <table className="w-full" style={{ fontSize: 12, borderCollapse: "collapse", minWidth: 700 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #111111" }}>
                <th className="text-left p-2 text-[11px] text-[#999999] font-medium">Project</th>
                <th className="text-left p-2 text-[11px] text-[#999999] font-medium">Sector</th>
                <th className="text-right p-2 text-[11px] text-[#999999] font-medium">Peak P/S</th>
                <th className="text-right p-2 text-[11px] text-[#999999] font-medium">Peak MCap</th>
                <th className="text-right p-2 text-[11px] text-[#999999] font-medium">Revenue</th>
                <th className="text-center p-2 text-[11px] text-[#999999] font-medium">Active</th>
              </tr>
            </thead>
            <tbody>
              {[...cryptoProjects]
                .sort((a, b) => b.peakPS - a.peakPS)
                .map((c) => (
                  <tr key={c.coinGeckoId} className="border-t border-[#e8e8e8] hover:bg-[#f9f9f9]">
                    <td className="p-2 font-medium text-[#111111]">{c.name}</td>
                    <td className="p-2">
                      <span className="flex items-center gap-1.5">
                        <span style={{ width: 8, height: 8, background: cryptoSectorColors[c.sector] || "#94a3b8", display: "inline-block" }} />
                        {c.sector}
                      </span>
                    </td>
                    <td className="p-2 text-right font-mono font-semibold">{formatPS(c.peakPS)}</td>
                    <td className="p-2 text-right font-mono">${c.peakMarketCapB.toFixed(1)}B</td>
                    <td className="p-2 text-right font-mono">${c.peakRevenueB >= 1 ? `${c.peakRevenueB.toFixed(1)}B` : `${(c.peakRevenueB * 1000).toFixed(0)}M`}</td>
                    <td className="p-2 text-center">
                      <span style={{ color: c.stillActive ? "#22c55e" : "#ef4444", fontWeight: 600 }}>
                        {c.stillActive ? "Yes" : "No"}
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ============ FOOTER SOURCE ============ */}
      <div
        className="text-center py-6"
        style={{ borderTop: "1px solid #e8e8e8", color: "#999999", fontSize: "11px" }}
      >
        Data compiled from SEC 10-K filings, MacroTrends, Jay Ritter (U of Florida) IPO data, Bloomberg,
        DefiLlama, TokenTerminal, CoinGecko, Messari, The Block Research. P/S = Market Cap / TTM Revenue.
      </div>
    </div>
  );
}
