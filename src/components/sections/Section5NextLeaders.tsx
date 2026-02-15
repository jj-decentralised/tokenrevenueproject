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
  Legend,
} from "recharts";
import {
  Card,
  StatCard,
  SectionHeader,
  DataSource,
  InsightBox,
} from "@/components/ui/Card";
import { nextLeaders, CHART_COLORS } from "@/lib/data";
import { useDataContext } from "@/lib/DataContext";
import { ChartExport } from "@/components/ui/ChartExport";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatRevenue(val: number): string {
  if (val >= 1000) return `$${(val / 1000).toFixed(1)}B`;
  return `$${val}M`;
}

const convictionConfig: Record<
  string,
  { label: string; color: string; bg: string; width: string }
> = {
  high: {
    label: "High",
    color: "text-emerald-700",
    bg: "bg-emerald-500",
    width: "w-4/5",
  },
  medium: {
    label: "Medium",
    color: "text-amber-700",
    bg: "bg-amber-500",
    width: "w-3/5",
  },
  speculative: {
    label: "Speculative",
    color: "text-red-600",
    bg: "bg-red-400",
    width: "w-1/4",
  },
};

// Map from protocol display names to DefiLlama protocol slug names
const NEXT_LEADER_SLUG_MAP: Record<string, string[]> = {
  "Ondo Finance": ["ondo-finance", "ondo"],
  "Centrifuge": ["centrifuge"],
  "Maple Finance": ["maple", "maple-finance"],
  "Backed Finance": ["backed-finance", "backed"],
  "Circle/USDC": ["circle"],
  "PayPal (PYUSD)": ["paypal"],
  "MoonPay/Ramp": ["moonpay", "ramp"],
  "Virtuals Protocol": ["virtuals-protocol", "virtuals"],
  "Autonolas (OLAS)": ["autonolas", "olas"],
  "Fetch.ai/ASI": ["fetch-ai", "fetch.ai", "asi"],
  "AIXBT": ["aixbt"],
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Progress bar showing current revenue moving toward projected. */
function RevenueProgressBar({
  current,
  projected,
  accentColor,
}: {
  current: number;
  projected: number;
  accentColor: string;
}) {
  const pct = Math.min((current / projected) * 100, 100);
  return (
    <div className="mt-4">
      <div className="flex justify-between text-xs text-slate-500 mb-1.5">
        <span>Current: {formatRevenue(current)}</span>
        <span>Projected 2027: {formatRevenue(projected)}</span>
      </div>
      <div className="relative h-3 rounded-full bg-slate-100 overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: accentColor }}
        />
      </div>
      <p className="text-right text-[11px] text-slate-400 mt-1">
        {pct.toFixed(1)}% of projected target
      </p>
    </div>
  );
}

/** Growth arrow indicator */
function GrowthArrow({ rate, className = "" }: { rate: string; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-sm font-semibold text-emerald-600 ${className}`}
    >
      <svg
        className="w-4 h-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2.5}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
      </svg>
      {rate}
    </span>
  );
}

/** Protocol cards for each sector */
function ProtocolCard({
  protocol,
}: {
  protocol: { name: string; focus: string; revenue: number; moat: string };
}) {
  return (
    <Card hover className="flex flex-col justify-between">
      <div>
        <h4 className="font-semibold text-slate-900">{protocol.name}</h4>
        <p className="text-xs text-slate-500 mt-0.5">{protocol.focus}</p>
        <p className="text-sm text-slate-600 mt-2 leading-relaxed">{protocol.moat}</p>
      </div>
      <div className="mt-4 pt-3 border-t border-slate-100">
        <p className="text-xs text-slate-400 uppercase tracking-wider">Ann. Revenue</p>
        <p className="text-lg font-bold text-slate-900">{formatRevenue(protocol.revenue)}</p>
      </div>
    </Card>
  );
}

/** "Who captures value?" callout */
function ValueCaptureBox({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-5 mt-6">
      <div className="flex items-start gap-3">
        <span className="flex-shrink-0 mt-0.5 text-indigo-500">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        </span>
        <div>
          <p className="text-sm font-semibold text-indigo-800 mb-1">
            If 10x happens, who captures the value?
          </p>
          <p className="text-sm text-indigo-700 leading-relaxed">{text}</p>
        </div>
      </div>
    </div>
  );
}

/** Catalyst + risk side-by-side */
function CatalystRiskRow({ catalyst, risk }: { catalyst: string; risk: string }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 mb-1">
          Catalysts
        </p>
        <p className="text-sm text-emerald-800 leading-relaxed">{catalyst}</p>
      </div>
      <div className="rounded-xl border border-red-200 bg-red-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-red-600 mb-1">
          Risks
        </p>
        <p className="text-sm text-red-800 leading-relaxed">{risk}</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Custom tooltip for bar chart
// ---------------------------------------------------------------------------

function ProjectionTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-sm">
      <p className="font-semibold text-slate-900 mb-1">{label}</p>
      {payload.map((entry: any) => (
        <p key={entry.dataKey} style={{ color: entry.color }}>
          {entry.name}: {formatRevenue(entry.value)}
        </p>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helper: look up live protocol revenue from DefiLlama data
// ---------------------------------------------------------------------------

function lookupLiveRevenue(
  protocolName: string,
  liveProtocols: { name: string; displayName: string; total24h: number }[] | undefined
): number | null {
  if (!liveProtocols) return null;
  const slugs = NEXT_LEADER_SLUG_MAP[protocolName];
  if (!slugs) return null;

  const match = liveProtocols.find((lp) =>
    slugs.some(
      (slug) =>
        lp.name.toLowerCase() === slug.toLowerCase() ||
        lp.displayName.toLowerCase() === slug.toLowerCase()
    )
  );

  if (match && match.total24h > 0) {
    // Annualize: daily fees * 365, result in $M
    const annualizedM = (match.total24h * 365) / 1e6;
    return annualizedM > 0.01 ? Math.round(annualizedM * 10) / 10 : null;
  }

  return null;
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function Section5NextLeaders() {
  const ctx = useDataContext();
  const liveProtocols = ctx.fees?.protocols;

  // -----------------------------------------------------------------------
  // Enrich each sector's key protocols with live revenue where available
  // -----------------------------------------------------------------------
  const enrichedRwa = useMemo(() => {
    const kp = nextLeaders.rwa.keyProtocols.map((p) => {
      const live = lookupLiveRevenue(p.name, liveProtocols);
      return live !== null ? { ...p, revenue: live } : { ...p };
    });
    const totalCurrent = kp.reduce((s, p) => s + p.revenue, 0);
    // Use sum of protocol revenues as currentRevenue if live data raised it
    const currentRevenue = totalCurrent > nextLeaders.rwa.currentRevenue
      ? Math.round(totalCurrent)
      : nextLeaders.rwa.currentRevenue;
    return { ...nextLeaders.rwa, keyProtocols: kp, currentRevenue };
  }, [liveProtocols]);

  const enrichedPayments = useMemo(() => {
    const kp = nextLeaders.payments.keyProtocols.map((p) => {
      const live = lookupLiveRevenue(p.name, liveProtocols);
      return live !== null ? { ...p, revenue: live } : { ...p };
    });
    const totalCurrent = kp.reduce((s, p) => s + p.revenue, 0);
    const currentRevenue = totalCurrent > nextLeaders.payments.currentRevenue
      ? Math.round(totalCurrent)
      : nextLeaders.payments.currentRevenue;
    return { ...nextLeaders.payments, keyProtocols: kp, currentRevenue };
  }, [liveProtocols]);

  const enrichedAiAgents = useMemo(() => {
    const kp = nextLeaders.aiAgents.keyProtocols.map((p) => {
      const live = lookupLiveRevenue(p.name, liveProtocols);
      return live !== null ? { ...p, revenue: live } : { ...p };
    });
    const totalCurrent = kp.reduce((s, p) => s + p.revenue, 0);
    const currentRevenue = totalCurrent > nextLeaders.aiAgents.currentRevenue
      ? Math.round(totalCurrent * 10) / 10
      : nextLeaders.aiAgents.currentRevenue;
    return { ...nextLeaders.aiAgents, keyProtocols: kp, currentRevenue };
  }, [liveProtocols]);

  // Aliases for template readability
  const rwa = enrichedRwa;
  const payments = enrichedPayments;
  const aiAgents = enrichedAiAgents;

  // -----------------------------------------------------------------------
  // Chart data (recomputed from enriched data)
  // -----------------------------------------------------------------------
  const projectionChartData = useMemo(
    () => [
      { sector: "RWA", current: rwa.currentRevenue, projected: rwa.projectedRevenue2027 },
      { sector: "Payments", current: payments.currentRevenue, projected: payments.projectedRevenue2027 },
      { sector: "AI Agents", current: aiAgents.currentRevenue, projected: aiAgents.projectedRevenue2027 },
    ],
    [rwa, payments, aiAgents]
  );

  const summaryData = useMemo(
    () => [
      {
        sector: "Stablecoin Payments",
        current: payments.currentRevenue,
        projected: payments.projectedRevenue2027,
        growth: payments.growthRate,
        conviction: "high" as const,
      },
      {
        sector: "Real World Assets",
        current: rwa.currentRevenue,
        projected: rwa.projectedRevenue2027,
        growth: rwa.growthRate,
        conviction: "medium" as const,
      },
      {
        sector: "AI Agent Infra",
        current: aiAgents.currentRevenue,
        projected: aiAgents.projectedRevenue2027,
        growth: aiAgents.growthRate,
        conviction: "speculative" as const,
      },
    ],
    [rwa, payments, aiAgents]
  );

  return (
    <section className="py-16 px-4 max-w-6xl mx-auto">
      <SectionHeader
        number="5"
        title="The Next Wave of Revenue Leaders"
        subtitle="Three sectors with outsized potential: Real World Assets, Stablecoin Payments, and AI Agent Infrastructure. Where does real revenue come from next?"
      />

      {/* ------------------------------------------------------------------ */}
      {/* Revenue Projections Overview Chart                                  */}
      {/* ------------------------------------------------------------------ */}
      <Card className="mb-12">
        <h3 className="text-lg font-semibold text-slate-900 mb-1">
          Current vs Projected Revenue (2027)
        </h3>
        <p className="text-sm text-slate-500 mb-6">
          Across three emerging sectors — note the log-scale differences in magnitude
          {ctx.isLive && (
            <span className="ml-2 inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live data
            </span>
          )}
        </p>

        <ChartExport
          data={projectionChartData}
          filename="section5-current-vs-projected-revenue"
        >
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={projectionChartData}
                margin={{ top: 8, right: 24, left: 0, bottom: 0 }}
                barGap={8}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="sector"
                  tick={{ fontSize: 13, fill: "#64748b" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => formatRevenue(v)}
                />
                <Tooltip content={<ProjectionTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                  iconType="circle"
                  iconSize={8}
                />
                <Bar
                  dataKey="current"
                  name="Current Revenue"
                  fill={CHART_COLORS.muted}
                  radius={[6, 6, 0, 0]}
                  maxBarSize={56}
                />
                <Bar
                  dataKey="projected"
                  name="Projected 2027"
                  fill={CHART_COLORS.primary}
                  radius={[6, 6, 0, 0]}
                  maxBarSize={56}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartExport>

        <DataSource sources={["1kx 2025 Onchain Revenue Report", "DefiLlama", "TokenTerminal", "Team estimates"]} />
      </Card>

      {/* ================================================================== */}
      {/* SECTION A: RWA                                                     */}
      {/* ================================================================== */}
      <div className="mb-16">
        <div className="flex items-center gap-3 mb-2">
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-amber-100 text-amber-700 text-xs font-bold">
            A
          </span>
          <h3 className="text-xl font-bold text-slate-900">{rwa.title}</h3>
        </div>
        <p className="text-sm text-slate-500 ml-10 mb-6">
          If it goes 10x, who captures the value?
        </p>

        {/* Stats row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <StatCard
            label="Current Revenue"
            value={formatRevenue(rwa.currentRevenue)}
            subvalue={ctx.isLive ? "Annualized (live)" : "Annualized H1 2025"}
            change={rwa.growthRate}
            changeType="positive"
          />
          <StatCard
            label="Projected 2027"
            value={formatRevenue(rwa.projectedRevenue2027)}
            subvalue="Bull-case scenario"
          />
          <StatCard
            label="BlackRock BUIDL Fund"
            value="$1.7B"
            subvalue="Largest tokenized treasury fund"
            change="Institutional signal"
            changeType="positive"
          />
        </div>

        <RevenueProgressBar
          current={rwa.currentRevenue}
          projected={rwa.projectedRevenue2027}
          accentColor={CHART_COLORS.accent}
        />

        {/* Protocol cards */}
        <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mt-8 mb-4">
          Key Protocols
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {rwa.keyProtocols.map((p) => (
            <ProtocolCard key={p.name} protocol={p} />
          ))}
        </div>

        <ValueCaptureBox text={rwa.whoCaptures10x} />
        <CatalystRiskRow catalyst={rwa.catalyst} risk={rwa.risk} />

        <InsightBox title="RWA Outlook" type="highlight">
          <p>
            RWA is small today ({formatRevenue(rwa.currentRevenue)} revenue) but growing faster
            than any other sector (50x YoY). BlackRock tokenizing treasuries is the clearest
            institutional signal we have seen since the Bitcoin ETF. The key question: will
            TradFi build on public blockchains or create walled-garden private chains? If
            public chains win, infrastructure layers (Chainlink, Ethereum, Aave) capture
            enormous value.
          </p>
        </InsightBox>
      </div>

      {/* ================================================================== */}
      {/* SECTION B: Stablecoin Payments                                     */}
      {/* ================================================================== */}
      <div className="mb-16">
        <div className="flex items-center gap-3 mb-2">
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 text-xs font-bold">
            B
          </span>
          <h3 className="text-xl font-bold text-slate-900">{payments.title}</h3>
        </div>
        <p className="text-sm text-slate-500 ml-10 mb-6">
          The obvious growth vector — already generating billions
        </p>

        {/* Stats row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <StatCard
            label="Current Revenue"
            value={formatRevenue(payments.currentRevenue)}
            subvalue={ctx.isLive ? "Annualized (live)" : "Annualized 2025"}
            change={payments.growthRate}
            changeType="positive"
          />
          <StatCard
            label="Projected 2027"
            value={formatRevenue(payments.projectedRevenue2027)}
            subvalue="Conservative estimate"
          />
          <StatCard
            label="Stablecoin Txn Volume"
            value="$27.6T"
            subvalue="2024 on-chain volume"
            change="Exceeds Visa"
            changeType="positive"
          />
        </div>

        <RevenueProgressBar
          current={payments.currentRevenue}
          projected={payments.projectedRevenue2027}
          accentColor={CHART_COLORS.quaternary}
        />

        {/* Revenue breakdown chart — payments protocols */}
        <Card className="mt-6 mb-6">
          <h4 className="text-sm font-semibold text-slate-700 mb-4">
            Payment Protocol Revenue Comparison
          </h4>

          <ChartExport
            data={payments.keyProtocols.map((p) => ({
              name: p.name,
              revenue: p.revenue,
              focus: p.focus,
            }))}
            filename="section5-payment-protocol-revenue"
          >
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={payments.keyProtocols}
                  layout="vertical"
                  margin={{ top: 4, right: 24, left: 4, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 12, fill: "#94a3b8" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v: number) => formatRevenue(v)}
                  />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tick={{ fontSize: 12, fill: "#475569" }}
                    axisLine={false}
                    tickLine={false}
                    width={120}
                  />
                  <Tooltip content={<ProjectionTooltip />} />
                  <Bar dataKey="revenue" name="Revenue" radius={[0, 6, 6, 0]} maxBarSize={28}>
                    {payments.keyProtocols.map((_, i) => (
                      <Cell
                        key={i}
                        fill={
                          [
                            CHART_COLORS.quaternary,
                            CHART_COLORS.primary,
                            CHART_COLORS.secondary,
                            CHART_COLORS.tertiary,
                          ][i]
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartExport>
        </Card>

        {/* Protocol cards */}
        <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mt-8 mb-4">
          Key Protocols
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {payments.keyProtocols.map((p) => (
            <ProtocolCard key={p.name} protocol={p} />
          ))}
        </div>

        <ValueCaptureBox text={payments.whoCaptures10x} />
        <CatalystRiskRow catalyst={payments.catalyst} risk={payments.risk} />

        <InsightBox title="Why Payments Feels Like the Obvious Winner" type="highlight">
          <p>
            Stablecoin payments already generate {formatRevenue(payments.currentRevenue)} annually
            and are growing at {payments.growthRate}. Unlike RWA or AI agents, this sector has
            proven product-market fit: real businesses sending real payments on-chain. Stripe
            acquired Bridge for $1.1B. PayPal launched PYUSD. Visa and Mastercard are integrating
            stablecoin settlement. The distribution is already built -- the question is how much
            value accrues to crypto-native protocols vs TradFi incumbents.
          </p>
        </InsightBox>
      </div>

      {/* ================================================================== */}
      {/* SECTION C: AI Agent Infrastructure                                 */}
      {/* ================================================================== */}
      <div className="mb-16">
        <div className="flex items-center gap-3 mb-2">
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-purple-100 text-purple-700 text-xs font-bold">
            C
          </span>
          <h3 className="text-xl font-bold text-slate-900">{aiAgents.title}</h3>
        </div>
        <p className="text-sm text-slate-500 ml-10 mb-6">
          Had a mini-cycle in 2024-25. Will it return with substance?
        </p>

        {/* Stats row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <StatCard
            label="Current Revenue"
            value={formatRevenue(aiAgents.currentRevenue)}
            subvalue={ctx.isLive ? "Annualized (live)" : "Annualized 2025"}
            change={aiAgents.growthRate}
            changeType="neutral"
          />
          <StatCard
            label="Projected 2027"
            value={formatRevenue(aiAgents.projectedRevenue2027)}
            subvalue="If real utility emerges"
          />
          <StatCard
            label="2024-25 Token Value"
            value="$30B+"
            subvalue="Created during mini-cycle"
            change="<$10M real revenue"
            changeType="negative"
          />
        </div>

        <RevenueProgressBar
          current={aiAgents.currentRevenue}
          projected={aiAgents.projectedRevenue2027}
          accentColor={CHART_COLORS.secondary}
        />

        {/* Mini-cycle critical analysis */}
        <Card className="mt-8 border-l-4 border-l-amber-400">
          <h4 className="text-base font-semibold text-slate-900 mb-2">
            The 2024-25 AI Agent Mini-Cycle: An Honest Assessment
          </h4>
          <p className="text-sm text-slate-600 leading-relaxed mb-4">
            {aiAgents.miniCycleAnalysis}
          </p>

          {/* Speculation ratio visual */}
          <div className="rounded-lg bg-slate-50 p-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Token Value vs Real Revenue
            </p>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                  <span>Speculative value</span>
                  <span className="font-semibold text-red-600">$30B+</span>
                </div>
                <div className="h-5 rounded-full bg-red-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-red-400"
                    style={{ width: "100%" }}
                  />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                  <span>Real revenue</span>
                  <span className="font-semibold text-emerald-600">&lt;$10M</span>
                </div>
                <div className="h-5 rounded-full bg-emerald-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-400"
                    style={{ width: "0.03%" }}
                  />
                </div>
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-2 text-center">
              Ratio: 3,000x more speculative value than actual revenue generated
            </p>
          </div>
        </Card>

        {/* Bull vs Bear case */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <Card className="border-l-4 border-l-emerald-400">
            <h4 className="text-sm font-bold text-emerald-700 uppercase tracking-wider mb-3">
              Bull Case
            </h4>
            <p className="text-sm font-semibold text-slate-800 mb-2">
              Crypto rails become essential for agent payments
            </p>
            <ul className="space-y-2 text-sm text-slate-600">
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 mt-0.5 flex-shrink-0">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
                <span>AI agents need <strong>permissionless payments</strong> -- no KYC, no bank account, 24/7 settlement</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 mt-0.5 flex-shrink-0">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
                <span><strong>Smart contract wallets</strong> enable autonomous agent accounts with programmable spending limits</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 mt-0.5 flex-shrink-0">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
                <span><strong>DeFi composability</strong> gives agents access to lending, trading, and yield without custom integrations</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 mt-0.5 flex-shrink-0">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
                <span><strong>Agent-to-agent transactions</strong> create a machine economy that needs neutral, programmable money</span>
              </li>
            </ul>
          </Card>
          <Card className="border-l-4 border-l-red-400">
            <h4 className="text-sm font-bold text-red-700 uppercase tracking-wider mb-3">
              Bear Case
            </h4>
            <p className="text-sm font-semibold text-slate-800 mb-2">
              OpenAI + Stripe solve it without blockchain
            </p>
            <ul className="space-y-2 text-sm text-slate-600">
              <li className="flex items-start gap-2">
                <span className="text-red-500 mt-0.5 flex-shrink-0">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1.707-5.293a1 1 0 011.414 0L10 13l.293-.293a1 1 0 011.414 1.414l-1 1a1 1 0 01-1.414 0l-1-1a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                    <path
                      fillRule="evenodd"
                      d="M10 5a1 1 0 011 1v5a1 1 0 11-2 0V6a1 1 0 011-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
                <span>Web2 AI infra (<strong>AWS, GCP, Azure</strong>) is vastly more mature, faster, and cheaper than crypto alternatives</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 mt-0.5 flex-shrink-0">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1.707-5.293a1 1 0 011.414 0L10 13l.293-.293a1 1 0 011.414 1.414l-1 1a1 1 0 01-1.414 0l-1-1a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                    <path
                      fillRule="evenodd"
                      d="M10 5a1 1 0 011 1v5a1 1 0 11-2 0V6a1 1 0 011-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
                <span><strong>Stripe already handles payments</strong> for agents -- adding a blockchain layer adds friction, not value</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 mt-0.5 flex-shrink-0">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1.707-5.293a1 1 0 011.414 0L10 13l.293-.293a1 1 0 011.414 1.414l-1 1a1 1 0 01-1.414 0l-1-1a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                    <path
                      fillRule="evenodd"
                      d="M10 5a1 1 0 011 1v5a1 1 0 11-2 0V6a1 1 0 011-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
                <span>Most <strong>"AI agent" tokens had no real agents</strong> -- 95% of 2024-25 cycle was pure token speculation</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 mt-0.5 flex-shrink-0">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1.707-5.293a1 1 0 011.414 0L10 13l.293-.293a1 1 0 011.414 1.414l-1 1a1 1 0 01-1.414 0l-1-1a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                    <path
                      fillRule="evenodd"
                      d="M10 5a1 1 0 011 1v5a1 1 0 11-2 0V6a1 1 0 011-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
                <span><strong>Latency and cost</strong> of on-chain inference make crypto AI impractical for most real-time applications</span>
              </li>
            </ul>
          </Card>
        </div>

        {/* Protocol cards */}
        <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mt-8 mb-4">
          Key Protocols
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {aiAgents.keyProtocols.map((p) => (
            <ProtocolCard key={p.name} protocol={p} />
          ))}
        </div>

        <ValueCaptureBox text={aiAgents.whoCaptures10x} />
        <CatalystRiskRow catalyst={aiAgents.catalyst} risk={aiAgents.risk} />

        <InsightBox title="AI Agents: Be Honest About Where We Are" type="warning">
          <p>
            The 2024-25 AI agent cycle created $30B+ in token value on less than $10M in
            real revenue -- a 3,000x speculation-to-revenue ratio. That does not mean the
            thesis is wrong. It means we are early and most current projects are vaporware.
            The genuine use case (permissionless agent payments, autonomous DeFi strategies)
            is compelling, but unproven at scale. Watch for actual agent transaction volume
            rather than token market caps. If useful agents emerge, compute providers and
            agent frameworks win. If they do not, this sector remains a narrative trade.
          </p>
        </InsightBox>
      </div>

      {/* ================================================================== */}
      {/* Summary Comparison                                                 */}
      {/* ================================================================== */}
      <Card className="mb-8">
        <h3 className="text-lg font-semibold text-slate-900 mb-1">
          Sector Comparison: Next Revenue Leaders
        </h3>
        <p className="text-sm text-slate-500 mb-6">
          Current state, growth trajectory, and conviction assessment
        </p>

        {/* Summary table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Sector
                </th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Current Revenue
                </th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Projected 2027
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Growth
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Conviction
                </th>
              </tr>
            </thead>
            <tbody>
              {summaryData.map((row, i) => {
                const cv = convictionConfig[row.conviction];
                return (
                  <tr
                    key={row.sector}
                    className={i < summaryData.length - 1 ? "border-b border-slate-100" : ""}
                  >
                    <td className="py-4 px-4 font-medium text-slate-900">{row.sector}</td>
                    <td className="py-4 px-4 text-right text-slate-700">
                      {formatRevenue(row.current)}
                    </td>
                    <td className="py-4 px-4 text-right font-semibold text-slate-900">
                      {formatRevenue(row.projected)}
                    </td>
                    <td className="py-4 px-4">
                      <GrowthArrow rate={row.growth} />
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${cv.bg} ${cv.width}`}
                          />
                        </div>
                        <span className={`text-xs font-semibold ${cv.color}`}>
                          {cv.label}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <DataSource
          sources={[
            "1kx 2025 Onchain Revenue Report",
            "DefiLlama",
            "TokenTerminal",
            "CoinGecko",
            "Team estimates",
          ]}
        />
      </Card>

      {/* ------------------------------------------------------------------ */}
      {/* Final Takeaways                                                    */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <InsightBox title="Payments: Highest Conviction" type="highlight">
          <p>
            Already at {formatRevenue(payments.currentRevenue)} with {payments.growthRate} growth.
            Distribution exists (Stripe, Visa, PayPal). Regulatory tailwinds (GENIUS Act). This
            is the closest thing to a sure bet in crypto revenue growth.
          </p>
        </InsightBox>
        <InsightBox title="RWA: Promising, Watch the Chains" type="insight">
          <p>
            Tiny revenue today but massive potential. BlackRock&apos;s BUIDL fund validates the thesis.
            The question is whether value accrues to public chain protocols or gets captured by
            TradFi on private infrastructure.
          </p>
        </InsightBox>
        <InsightBox title="AI Agents: Show Me the Revenue" type="warning">
          <p>
            Compelling long-term thesis, terrible current execution. $30B+ in tokens, &lt;$10M in
            revenue. Wait for real agent transaction volume before getting excited. The gap between
            narrative and reality is the widest of any sector.
          </p>
        </InsightBox>
      </div>
    </section>
  );
}
