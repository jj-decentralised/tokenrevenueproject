"use client";

import React, { useMemo, useState, useCallback } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { useDataContext } from "@/lib/DataContext";
import type { LiveProtocolFee } from "@/lib/DataContext";
import { getCategoryGroup, GROUP_COLORS } from "@/lib/categories";
import { formatCompact, tooltipStyle } from "@/lib/chartUtils";
import { Card, DataSource } from "@/components/ui/Card";
import { ChartExport } from "@/components/ui/ChartExport";

// ---------------------------------------------------------------------------
// Time period options
// ---------------------------------------------------------------------------

type TimePeriod = "24h" | "7d" | "30d" | "1y" | "all-time";

const PERIODS: { key: TimePeriod; label: string }[] = [
  { key: "24h", label: "24h" },
  { key: "7d", label: "7D" },
  { key: "30d", label: "30D" },
  { key: "1y", label: "1Y" },
  { key: "all-time", label: "All-Time" },
];

function getFieldForPeriod(p: LiveProtocolFee, period: TimePeriod): number {
  switch (period) {
    case "24h":
      return p.total24h || 0;
    case "7d":
      return p.total7d || 0;
    case "30d":
      return p.total30d || 0;
    case "1y":
      return p.total1y ?? 0;
    case "all-time":
      return p.totalAllTime || 0;
  }
}

// ---------------------------------------------------------------------------
// Zoom presets
// ---------------------------------------------------------------------------

const ZOOM_LEVELS = [10, 25, 50, 100, 250] as const;

// ---------------------------------------------------------------------------
// Tooltip
// ---------------------------------------------------------------------------

interface TooltipPayload {
  name: string;
  value: number;
  payload: {
    name: string;
    value: number;
    color: string;
    category?: string;
    count?: number;
  };
}

function CategoryTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{ ...tooltipStyle, maxWidth: 240 }}>
      <p
        style={{
          fontFamily: "Georgia, serif",
          fontWeight: 700,
          fontSize: "13px",
          color: "#111111",
          marginBottom: 4,
        }}
      >
        {d.name}
      </p>
      {d.category && (
        <p style={{ fontSize: "11px", color: "#999999", marginBottom: 2 }}>
          {d.category}
        </p>
      )}
      <p style={{ fontSize: "12px", color: "#333333" }}>
        Fees: <span style={{ fontWeight: 600 }}>{formatCompact(d.value)}</span>
      </p>
      {d.count != null && (
        <p style={{ fontSize: "11px", color: "#999999", marginTop: 2 }}>
          {d.count} protocols
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function SectionCategoryRevenue() {
  const { fees } = useDataContext();

  const [period, setPeriod] = useState<TimePeriod>("24h");
  const [viewMode, setViewMode] = useState<"category" | "project">("category");
  const [zoomIdx, setZoomIdx] = useState(0); // index into ZOOM_LEVELS

  const topN = ZOOM_LEVELS[zoomIdx];
  const protocols = fees?.protocols ?? [];

  // --- Category data ---
  const categoryData = useMemo(() => {
    const groups = new Map<string, { value: number; count: number }>();
    for (const p of protocols) {
      const group = getCategoryGroup(p.category || "Other");
      const value = getFieldForPeriod(p, period);
      if (value <= 0) continue;
      const existing = groups.get(group) ?? { value: 0, count: 0 };
      existing.value += value;
      existing.count += 1;
      groups.set(group, existing);
    }
    return Array.from(groups.entries())
      .map(([name, { value, count }]) => ({
        name,
        value,
        count,
        color: GROUP_COLORS[name] || "#94a3b8",
      }))
      .sort((a, b) => b.value - a.value);
  }, [protocols, period]);

  // --- Project data ---
  const projectData = useMemo(() => {
    return protocols
      .map((p) => ({
        name: p.displayName || p.name,
        slug: p.slug || p.name.toLowerCase().replace(/\s+/g, "-"),
        value: getFieldForPeriod(p, period),
        color:
          GROUP_COLORS[getCategoryGroup(p.category || "Other")] || "#94a3b8",
        category: getCategoryGroup(p.category || "Other"),
      }))
      .filter((p) => p.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, topN);
  }, [protocols, period, topN]);

  const chartData = viewMode === "category" ? categoryData : projectData;

  // Dynamic height: at least 300px, scale with item count
  const barHeight = viewMode === "category" ? 40 : 24;
  const chartHeight = Math.max(300, chartData.length * barHeight + 60);

  // Total for summary
  const totalFees = useMemo(
    () => chartData.reduce((s, d) => s + d.value, 0),
    [chartData],
  );

  const handleZoomIn = useCallback(() => {
    setZoomIdx((i) => Math.min(i + 1, ZOOM_LEVELS.length - 1));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomIdx((i) => Math.max(i - 1, 0));
  }, []);

  const handleReset = useCallback(() => {
    setZoomIdx(0);
  }, []);

  if (protocols.length === 0) return null;

  return (
    <section className="mb-16">
      {/* Header */}
      <p
        className="font-medium uppercase text-[#999999] mb-2"
        style={{ fontSize: "11px", letterSpacing: "0.14em" }}
      >
        Crypto Fee Revenue
      </p>
      <h2
        className="font-serif font-bold text-[#111111] mb-1"
        style={{ fontSize: "28px", lineHeight: "1.15", letterSpacing: "-0.01em" }}
      >
        Revenue by {viewMode === "category" ? "Category" : "Project"}
      </h2>
      <p className="text-[13px] text-[#666666] mb-4" style={{ lineHeight: "1.5" }}>
        Total fees across {protocols.length.toLocaleString()} protocols:{" "}
        <span style={{ fontWeight: 700, color: "#111111" }}>
          {formatCompact(totalFees)}
        </span>{" "}
        ({PERIODS.find((p) => p.key === period)?.label})
      </p>
      <hr className="wsj-rule mb-6" />

      {/* Controls Row */}
      <div
        className="flex flex-wrap items-center gap-3 mb-6"
        style={{ rowGap: 8 }}
      >
        {/* Time Period Toggle */}
        <div className="flex gap-1">
          {PERIODS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setPeriod(key)}
              style={{
                fontSize: "11px",
                fontWeight: 600,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                padding: "5px 10px",
                border: "1px solid",
                borderColor: period === key ? "#111111" : "#d4d4d4",
                backgroundColor: period === key ? "#111111" : "#ffffff",
                color: period === key ? "#ffffff" : "#666666",
                borderRadius: 0,
                cursor: "pointer",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Separator */}
        <div style={{ width: 1, height: 20, backgroundColor: "#d4d4d4" }} />

        {/* View Mode Toggle */}
        <div className="flex gap-1">
          <button
            onClick={() => setViewMode("category")}
            style={{
              fontSize: "11px",
              fontWeight: 600,
              letterSpacing: "0.06em",
              padding: "5px 10px",
              border: "1px solid",
              borderColor: viewMode === "category" ? "#111111" : "#d4d4d4",
              backgroundColor: viewMode === "category" ? "#111111" : "#ffffff",
              color: viewMode === "category" ? "#ffffff" : "#666666",
              borderRadius: 0,
              cursor: "pointer",
            }}
          >
            By Category
          </button>
          <button
            onClick={() => setViewMode("project")}
            style={{
              fontSize: "11px",
              fontWeight: 600,
              letterSpacing: "0.06em",
              padding: "5px 10px",
              border: "1px solid",
              borderColor: viewMode === "project" ? "#111111" : "#d4d4d4",
              backgroundColor: viewMode === "project" ? "#111111" : "#ffffff",
              color: viewMode === "project" ? "#ffffff" : "#666666",
              borderRadius: 0,
              cursor: "pointer",
            }}
          >
            By Project
          </button>
        </div>

        {/* Zoom controls (project view only) */}
        {viewMode === "project" && (
          <>
            <div
              style={{ width: 1, height: 20, backgroundColor: "#d4d4d4" }}
            />
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleZoomOut}
                disabled={zoomIdx === 0}
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  width: 28,
                  height: 28,
                  border: "1px solid #d4d4d4",
                  backgroundColor: zoomIdx === 0 ? "#f5f5f5" : "#ffffff",
                  color: zoomIdx === 0 ? "#999999" : "#333333",
                  cursor: zoomIdx === 0 ? "default" : "pointer",
                  borderRadius: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                &minus;
              </button>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "#666666",
                  minWidth: 50,
                  textAlign: "center",
                }}
              >
                Top {topN}
              </span>
              <button
                onClick={handleZoomIn}
                disabled={zoomIdx === ZOOM_LEVELS.length - 1}
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  width: 28,
                  height: 28,
                  border: "1px solid #d4d4d4",
                  backgroundColor:
                    zoomIdx === ZOOM_LEVELS.length - 1
                      ? "#f5f5f5"
                      : "#ffffff",
                  color:
                    zoomIdx === ZOOM_LEVELS.length - 1
                      ? "#999999"
                      : "#333333",
                  cursor:
                    zoomIdx === ZOOM_LEVELS.length - 1
                      ? "default"
                      : "pointer",
                  borderRadius: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                +
              </button>
              <button
                onClick={handleReset}
                style={{
                  fontSize: "10px",
                  fontWeight: 600,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  padding: "4px 8px",
                  border: "1px solid #d4d4d4",
                  backgroundColor: "#ffffff",
                  color: "#666666",
                  cursor: "pointer",
                  borderRadius: 0,
                }}
              >
                Reset
              </button>
            </div>
          </>
        )}
      </div>

      {/* Chart */}
      <Card>
        <ChartExport
          data={chartData.map((d) => ({
            name: d.name,
            fees: d.value,
            ...(viewMode === "category" && "count" in d
              ? { protocols: (d as typeof categoryData[0]).count }
              : {}),
            ...(viewMode === "project" && "category" in d
              ? { category: (d as typeof projectData[0]).category }
              : {}),
          }))}
          filename={`category-revenue-${period}`}
        >
          <div style={{ height: chartHeight }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 5, right: 60, bottom: 5, left: viewMode === "category" ? 100 : 120 }}
              >
                <CartesianGrid
                  strokeDasharray="none"
                  stroke="#e8e8e8"
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  scale="log"
                  domain={["auto", "auto"]}
                  tickFormatter={(v: number) => formatCompact(v)}
                  tick={{ fontSize: 11, fill: "#999999" }}
                  axisLine={{ stroke: "#d4d4d4" }}
                  tickLine={false}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={viewMode === "category" ? 95 : 115}
                  tick={{ fontSize: viewMode === "category" ? 12 : 11, fill: "#333333", fontWeight: 500 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  content={<CategoryTooltip />}
                  cursor={{ fill: "rgba(0,0,0,0.03)" }}
                />
                <Bar
                  dataKey="value"
                  name="Fees"
                  barSize={viewMode === "category" ? 24 : 16}
                  label={{
                    position: "right",
                    formatter: (v: number) => formatCompact(v),
                    fill: "#666666",
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                >
                  {chartData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartExport>

        {/* Legend for project view */}
        {viewMode === "project" && (
          <div
            className="flex flex-wrap gap-x-4 gap-y-1 mt-4 pt-4"
            style={{ borderTop: "1px solid #e8e8e8" }}
          >
            {Object.entries(GROUP_COLORS).map(([name, color]) => (
              <div key={name} className="flex items-center gap-1.5">
                <div
                  style={{
                    width: 10,
                    height: 10,
                    backgroundColor: color,
                    flexShrink: 0,
                  }}
                />
                <span style={{ fontSize: "11px", color: "#666666" }}>
                  {name}
                </span>
              </div>
            ))}
          </div>
        )}

        <DataSource sources={["DefiLlama (live)"]} />
      </Card>
    </section>
  );
}
