"use client";

import React, { useMemo, useState, useCallback } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useDataContext } from "@/lib/DataContext";
import { Card, SectionHeader, DataSource } from "@/components/ui/Card";
import { ChartExport } from "@/components/ui/ChartExport";
import { formatCompact, tooltipStyle } from "@/lib/chartUtils";
import { GROUP_ORDER, GROUP_COLORS } from "@/lib/categories";
import { categorizeToken } from "@/lib/categories";

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function ChartSkeleton({ height = "h-[420px]" }: { height?: string }) {
  return (
    <div className={`${height} w-full flex items-center justify-center`}>
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-slate-400">Loading sector data...</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Time range options
// ---------------------------------------------------------------------------

type TimeRange = "30d" | "90d" | "180d" | "365d";
const TIME_RANGES: { key: TimeRange; label: string }[] = [
  { key: "30d", label: "30D" },
  { key: "90d", label: "90D" },
  { key: "180d", label: "6M" },
  { key: "365d", label: "1Y" },
];

// ---------------------------------------------------------------------------
// Shared tooltip
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function SectorTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;

  // Sort payload by value descending for this data point
  const sorted = [...payload]
    .filter((p: { value: number }) => p.value > 0)
    .sort((a: { value: number }, b: { value: number }) => b.value - a.value);
  const total = sorted.reduce((s: number, p: { value: number }) => s + p.value, 0);

  const dateStr = label
    ? new Date(Number(label) * 1000).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "";

  return (
    <div style={{ ...tooltipStyle, minWidth: 200 }}>
      <p style={{ fontWeight: 700, color: "#111", marginBottom: 6, fontSize: 12 }}>{dateStr}</p>
      <p style={{ fontSize: 11, color: "#666", marginBottom: 6 }}>
        Total: <strong style={{ color: "#111" }}>{formatCompact(total)}</strong>
      </p>
      {sorted.map((entry: { name: string; value: number; color: string }) => (
        <div
          key={entry.name}
          style={{ display: "flex", justifyContent: "space-between", gap: 16, fontSize: 11, marginBottom: 2 }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 8, height: 8, backgroundColor: entry.color, display: "inline-block" }} />
            {entry.name}
          </span>
          <span style={{ fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>
            {formatCompact(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sector Toggle Panel
// ---------------------------------------------------------------------------

function SectorToggle({
  disabled,
  onToggle,
  onAll,
  onNone,
}: {
  disabled: Set<string>;
  onToggle: (s: string) => void;
  onAll: () => void;
  onNone: () => void;
}) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 16 }}>
      {GROUP_ORDER.map((sector) => {
        const isActive = !disabled.has(sector);
        return (
          <button
            key={sector}
            onClick={() => onToggle(sector)}
            style={{
              fontSize: "11px",
              fontWeight: 600,
              letterSpacing: "0.04em",
              padding: "4px 10px",
              border: "1px solid",
              borderColor: isActive ? GROUP_COLORS[sector] || "#111" : "#d4d4d4",
              backgroundColor: isActive ? GROUP_COLORS[sector] || "#111" : "#fff",
              color: isActive ? "#fff" : "#999",
              borderRadius: 0,
              cursor: "pointer",
              opacity: isActive ? 1 : 0.4,
            }}
          >
            {sector}
          </button>
        );
      })}
      <button
        onClick={onAll}
        style={{
          fontSize: "10px",
          fontWeight: 600,
          textTransform: "uppercase",
          padding: "4px 8px",
          border: "1px solid #d4d4d4",
          backgroundColor: "#fff",
          color: "#666",
          borderRadius: 0,
          cursor: "pointer",
        }}
      >
        All
      </button>
      <button
        onClick={onNone}
        style={{
          fontSize: "10px",
          fontWeight: 600,
          textTransform: "uppercase",
          padding: "4px 8px",
          border: "1px solid #d4d4d4",
          backgroundColor: "#fff",
          color: "#666",
          borderRadius: 0,
          cursor: "pointer",
        }}
      >
        None
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Section Component
// ---------------------------------------------------------------------------

export default function SectionSectorTimeSeries() {
  const { sectorHistory, coinGecko, isLoading } = useDataContext();

  const [timeRange, setTimeRange] = useState<TimeRange>("365d");
  const [disabledSectors, setDisabledSectors] = useState<Set<string>>(new Set());

  const toggleSector = useCallback((s: string) => {
    setDisabledSectors((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });
  }, []);
  const selectAll = useCallback(() => setDisabledSectors(new Set()), []);
  const selectNone = useCallback(() => setDisabledSectors(new Set(GROUP_ORDER)), []);

  // ===================================================================
  // A. Fee Revenue time series by sector (from DefiLlama breakdown)
  // ===================================================================
  const feeChartData = useMemo(() => {
    if (!sectorHistory?.dates?.length) return [];
    const { dates, fees } = sectorHistory;

    const rangeDays = parseInt(timeRange);
    const cutoff = Math.floor(Date.now() / 1000) - rangeDays * 86400;

    // Apply 7-day rolling average for smoother display
    const windowSize = rangeDays <= 30 ? 1 : 7;
    const raw: Record<string, number>[] = [];

    for (let i = 0; i < dates.length; i++) {
      if (dates[i] < cutoff) continue;
      const row: Record<string, number> = { date: dates[i] };
      for (const sector of GROUP_ORDER) {
        const vals = fees[sector];
        if (!vals) { row[sector] = 0; continue; }
        if (windowSize <= 1) {
          row[sector] = vals[i] || 0;
        } else {
          let sum = 0;
          let count = 0;
          for (let j = Math.max(0, i - windowSize + 1); j <= i; j++) {
            sum += vals[j] || 0;
            count++;
          }
          row[sector] = count > 0 ? sum / count : 0;
        }
      }
      raw.push(row);
    }

    return raw;
  }, [sectorHistory, timeRange]);

  // ===================================================================
  // B. Revenue time series by sector (from DefiLlama breakdown)
  // ===================================================================
  const revenueChartData = useMemo(() => {
    if (!sectorHistory?.revenueDates?.length || !sectorHistory.revenue) return [];
    const { revenueDates, revenue } = sectorHistory;

    const rangeDays = parseInt(timeRange);
    const cutoff = Math.floor(Date.now() / 1000) - rangeDays * 86400;
    const windowSize = rangeDays <= 30 ? 1 : 7;

    const raw: Record<string, number>[] = [];
    for (let i = 0; i < revenueDates.length; i++) {
      if (revenueDates[i] < cutoff) continue;
      const row: Record<string, number> = { date: revenueDates[i] };
      for (const sector of GROUP_ORDER) {
        const vals = revenue[sector];
        if (!vals) { row[sector] = 0; continue; }
        if (windowSize <= 1) {
          row[sector] = vals[i] || 0;
        } else {
          let sum = 0;
          let count = 0;
          for (let j = Math.max(0, i - windowSize + 1); j <= i; j++) {
            sum += vals[j] || 0;
            count++;
          }
          row[sector] = count > 0 ? sum / count : 0;
        }
      }
      raw.push(row);
    }

    return raw;
  }, [sectorHistory, timeRange]);

  // ===================================================================
  // C. Market cap by sector (from CoinGecko tokens × historical total)
  // ===================================================================
  const mcapChartData = useMemo(() => {
    if (!coinGecko?.historicalMarketCap?.length || !coinGecko.tokens?.length) return [];

    // 1. Compute current sector weights from CoinGecko tokens
    const sectorMcap: Record<string, number> = {};
    for (const s of GROUP_ORDER) sectorMcap[s] = 0;

    for (const t of coinGecko.tokens) {
      if (!t.marketCap || t.marketCap <= 0) continue;
      // Categorize token into our sectors
      const { categoryGroup } = categorizeToken(null, [], t.name);
      sectorMcap[categoryGroup] = (sectorMcap[categoryGroup] || 0) + t.marketCap;
    }

    const totalSectorMcap = Object.values(sectorMcap).reduce((s, v) => s + v, 0);
    if (totalSectorMcap <= 0) return [];

    // Compute fractional weights
    const weights: Record<string, number> = {};
    for (const s of GROUP_ORDER) {
      weights[s] = sectorMcap[s] / totalSectorMcap;
    }

    // 2. Apply weights to historical total market cap
    const rangeDays = parseInt(timeRange);
    const cutoffMs = Date.now() - rangeDays * 86400 * 1000;

    // The historical data may be BTC-only from free API or global from Pro
    // We need to scale: if it's BTC, use BTC dominance to estimate total
    const hasBtcDominance = coinGecko.global?.btcDominance > 0;
    const btcToTotal = hasBtcDominance ? 100 / coinGecko.global.btcDominance : 1;
    // If the last historical point is close to the global total, it's already global data
    const lastHistMcap = coinGecko.historicalMarketCap[coinGecko.historicalMarketCap.length - 1]?.marketCap || 0;
    const globalMcap = coinGecko.global?.totalMarketCap || 0;
    const isAlreadyGlobal = globalMcap > 0 && Math.abs(lastHistMcap - globalMcap) / globalMcap < 0.2;
    const scale = isAlreadyGlobal ? 1 : btcToTotal;

    return coinGecko.historicalMarketCap
      .filter((d) => d.date >= cutoffMs)
      .map((d) => {
        const totalMcap = d.marketCap * scale;
        const row: Record<string, number> = { date: Math.floor(d.date / 1000) };
        for (const s of GROUP_ORDER) {
          row[s] = totalMcap * (weights[s] || 0);
        }
        return row;
      });
  }, [coinGecko, timeRange]);

  // ===================================================================
  // Summary stats
  // ===================================================================
  const feeStats = useMemo(() => {
    if (!feeChartData.length) return null;
    const latest = feeChartData[feeChartData.length - 1];
    const totalLatest = GROUP_ORDER.reduce((s, sect) => s + ((latest[sect] as number) || 0), 0);
    return { totalDaily: totalLatest, dataPoints: feeChartData.length };
  }, [feeChartData]);

  const activeSectors = GROUP_ORDER.filter((s) => !disabledSectors.has(s));

  // ===================================================================
  // Render
  // ===================================================================
  return (
    <section className="mb-16">
      <SectionHeader
        number="9"
        title="Sector Trends Over Time"
        subtitle="Daily fees, revenue, and market capitalisation broken down by sector. Toggle categories and adjust the time window to explore trends."
      />

      {/* Time Range + Sector Toggles */}
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
          <div>
            <p style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#999", marginBottom: 6 }}>
              Time Range
            </p>
            <div style={{ display: "flex", gap: 2 }}>
              {TIME_RANGES.map((tr) => (
                <button
                  key={tr.key}
                  onClick={() => setTimeRange(tr.key)}
                  style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    padding: "4px 12px",
                    border: "1px solid",
                    borderColor: timeRange === tr.key ? "#111" : "#d4d4d4",
                    backgroundColor: timeRange === tr.key ? "#111" : "#fff",
                    color: timeRange === tr.key ? "#fff" : "#666",
                    borderRadius: 0,
                    cursor: "pointer",
                  }}
                >
                  {tr.label}
                </button>
              ))}
            </div>
          </div>

          {feeStats && (
            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#999", marginBottom: 2 }}>
                Latest Daily Fees
              </p>
              <p style={{ fontSize: "20px", fontWeight: 700, color: "#111", fontVariantNumeric: "tabular-nums" }}>
                {formatCompact(feeStats.totalDaily)}
              </p>
            </div>
          )}
        </div>

        <SectorToggle
          disabled={disabledSectors}
          onToggle={toggleSector}
          onAll={selectAll}
          onNone={selectNone}
        />
      </Card>

      {/* ================================================================ */}
      {/* A. Daily Fees by Sector (Stacked Area)                           */}
      {/* ================================================================ */}
      <Card>
        <ChartExport
          data={feeChartData.map((row) => {
            const obj: Record<string, unknown> = {
              date: new Date(Number(row.date) * 1000).toISOString().slice(0, 10),
            };
            for (const s of GROUP_ORDER) obj[s] = row[s] || 0;
            return obj;
          })}
          filename="sector-fees-timeseries"
          title="Daily Fees by Sector"
        >
          <p style={{ fontSize: "14px", color: "#666", lineHeight: "1.5", marginBottom: 12 }}>
            Total protocol fees generated per day, stacked by sector. 7-day rolling average applied
            for time ranges over 30 days to smooth daily volatility.
          </p>

          {isLoading || !sectorHistory ? (
            <ChartSkeleton />
          ) : feeChartData.length === 0 ? (
            <div className="h-[420px] flex items-center justify-center text-sm" style={{ color: "#999" }}>
              No fee breakdown data available.
            </div>
          ) : (
            <div className="h-[420px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={feeChartData} margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8e8e8" />
                  <XAxis
                    dataKey="date"
                    type="number"
                    domain={["dataMin", "dataMax"]}
                    tickFormatter={(v: number) =>
                      new Date(v * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                    }
                    tick={{ fontSize: 10, fill: "#999" }}
                    tickLine={false}
                    axisLine={{ stroke: "#d4d4d4" }}
                    minTickGap={40}
                  />
                  <YAxis
                    tickFormatter={(v: number) => formatCompact(v)}
                    tick={{ fontSize: 10, fill: "#999" }}
                    tickLine={false}
                    axisLine={false}
                    width={60}
                  />
                  <Tooltip content={<SectorTooltip />} />
                  {activeSectors.map((sector) => (
                    <Area
                      key={sector}
                      type="monotone"
                      dataKey={sector}
                      stackId="1"
                      fill={GROUP_COLORS[sector]}
                      stroke={GROUP_COLORS[sector]}
                      fillOpacity={0.7}
                      strokeWidth={0.5}
                    />
                  ))}
                  <Legend
                    verticalAlign="top"
                    height={36}
                    iconSize={10}
                    wrapperStyle={{ fontSize: 11 }}
                    payload={activeSectors.map((s) => ({
                      value: s,
                      type: "square" as const,
                      color: GROUP_COLORS[s],
                    }))}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartExport>
        <DataSource sources={["DefiLlama (live)"]} />
      </Card>

      {/* ================================================================ */}
      {/* B. Daily Revenue by Sector (Stacked Area)                        */}
      {/* ================================================================ */}
      <Card>
        <ChartExport
          data={revenueChartData.map((row) => {
            const obj: Record<string, unknown> = {
              date: new Date(Number(row.date) * 1000).toISOString().slice(0, 10),
            };
            for (const s of GROUP_ORDER) obj[s] = row[s] || 0;
            return obj;
          })}
          filename="sector-revenue-timeseries"
          title="Daily Revenue by Sector"
        >
          <p style={{ fontSize: "14px", color: "#666", lineHeight: "1.5", marginBottom: 12 }}>
            Protocol revenue (what the protocol keeps after paying liquidity providers/validators) per day, stacked
            by sector. Revenue is a subset of total fees &mdash; the take rate varies widely by protocol type.
          </p>

          {isLoading || !sectorHistory ? (
            <ChartSkeleton />
          ) : revenueChartData.length === 0 ? (
            <div className="h-[420px] flex items-center justify-center text-sm" style={{ color: "#999" }}>
              No revenue breakdown data available.
            </div>
          ) : (
            <div className="h-[420px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueChartData} margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8e8e8" />
                  <XAxis
                    dataKey="date"
                    type="number"
                    domain={["dataMin", "dataMax"]}
                    tickFormatter={(v: number) =>
                      new Date(v * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                    }
                    tick={{ fontSize: 10, fill: "#999" }}
                    tickLine={false}
                    axisLine={{ stroke: "#d4d4d4" }}
                    minTickGap={40}
                  />
                  <YAxis
                    tickFormatter={(v: number) => formatCompact(v)}
                    tick={{ fontSize: 10, fill: "#999" }}
                    tickLine={false}
                    axisLine={false}
                    width={60}
                  />
                  <Tooltip content={<SectorTooltip />} />
                  {activeSectors.map((sector) => (
                    <Area
                      key={sector}
                      type="monotone"
                      dataKey={sector}
                      stackId="1"
                      fill={GROUP_COLORS[sector]}
                      stroke={GROUP_COLORS[sector]}
                      fillOpacity={0.7}
                      strokeWidth={0.5}
                    />
                  ))}
                  <Legend
                    verticalAlign="top"
                    height={36}
                    iconSize={10}
                    wrapperStyle={{ fontSize: 11 }}
                    payload={activeSectors.map((s) => ({
                      value: s,
                      type: "square" as const,
                      color: GROUP_COLORS[s],
                    }))}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartExport>
        <DataSource sources={["DefiLlama (live)"]} />
      </Card>

      {/* ================================================================ */}
      {/* C. Market Cap by Sector (Stacked Area)                           */}
      {/* ================================================================ */}
      <Card>
        <ChartExport
          data={mcapChartData.map((row) => {
            const obj: Record<string, unknown> = {
              date: new Date(Number(row.date) * 1000).toISOString().slice(0, 10),
            };
            for (const s of GROUP_ORDER) obj[s] = row[s] || 0;
            return obj;
          })}
          filename="sector-marketcap-timeseries"
          title="Market Capitalisation by Sector"
        >
          <p style={{ fontSize: "14px", color: "#666", lineHeight: "1.5", marginBottom: 12 }}>
            Estimated total market capitalisation by sector over time. Sector weights are derived from the current
            CoinGecko top-1000 token breakdown and applied to the historical total market cap.
            <span style={{ fontSize: "12px", color: "#999", fontStyle: "italic" }}>
              {" "}(Weights are held constant — actual sector shares shift over time.)
            </span>
          </p>

          {isLoading || !coinGecko ? (
            <ChartSkeleton />
          ) : mcapChartData.length === 0 ? (
            <div className="h-[420px] flex items-center justify-center text-sm" style={{ color: "#999" }}>
              No historical market cap data available.
            </div>
          ) : (
            <div className="h-[420px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mcapChartData} margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8e8e8" />
                  <XAxis
                    dataKey="date"
                    type="number"
                    domain={["dataMin", "dataMax"]}
                    tickFormatter={(v: number) =>
                      new Date(v * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                    }
                    tick={{ fontSize: 10, fill: "#999" }}
                    tickLine={false}
                    axisLine={{ stroke: "#d4d4d4" }}
                    minTickGap={40}
                  />
                  <YAxis
                    tickFormatter={(v: number) => formatCompact(v)}
                    tick={{ fontSize: 10, fill: "#999" }}
                    tickLine={false}
                    axisLine={false}
                    width={65}
                  />
                  <Tooltip content={<SectorTooltip />} />
                  {activeSectors.map((sector) => (
                    <Area
                      key={sector}
                      type="monotone"
                      dataKey={sector}
                      stackId="1"
                      fill={GROUP_COLORS[sector]}
                      stroke={GROUP_COLORS[sector]}
                      fillOpacity={0.7}
                      strokeWidth={0.5}
                    />
                  ))}
                  <Legend
                    verticalAlign="top"
                    height={36}
                    iconSize={10}
                    wrapperStyle={{ fontSize: 11 }}
                    payload={activeSectors.map((s) => ({
                      value: s,
                      type: "square" as const,
                      color: GROUP_COLORS[s],
                    }))}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartExport>
        <DataSource sources={["CoinGecko (live)"]} />
      </Card>
    </section>
  );
}
