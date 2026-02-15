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
import { getCategoryGroup, GROUP_COLORS, CATEGORY_GROUP } from "@/lib/categories";
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
// Drill-down tree data types
// ---------------------------------------------------------------------------

interface ProtocolRow {
  name: string;
  slug: string;
  value: number;
  change7d: number | null;
  revenue24h: number | null;
  margin: number | null;
}

interface SubcategoryRow {
  name: string;
  value: number;
  count: number;
  protocols: ProtocolRow[];
}

interface DrillDownData {
  group: string;
  totalValue: number;
  subcategories: SubcategoryRow[];
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function SectionCategoryRevenue() {
  const { fees } = useDataContext();

  const [period, setPeriod] = useState<TimePeriod>("24h");
  const [viewMode, setViewMode] = useState<"category" | "project">("category");
  const [zoomIdx, setZoomIdx] = useState(0); // index into ZOOM_LEVELS
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [expandedSubcats, setExpandedSubcats] = useState<Set<string>>(new Set());

  const topN = ZOOM_LEVELS[zoomIdx];
  const protocols = fees?.protocols ?? [];

  // --- Build resolved protocol list with group + subcategory ---
  const resolvedProtocols = useMemo(() => {
    return protocols
      .map((p) => {
        const slug = p.slug || p.name.toLowerCase().replace(/\s+/g, "-");
        const group = getCategoryGroup(p.category || "Other", slug);
        // Determine subcategory: use the raw category if it maps to this group,
        // otherwise use the override subcategory or fallback to group name
        const rawCat = p.category || "Other";
        const rawGroup = CATEGORY_GROUP[rawCat];
        const subcategory = rawGroup === group ? rawCat : group;
        return {
          protocol: p,
          slug,
          group,
          subcategory,
          value: getFieldForPeriod(p, period),
        };
      })
      .filter((r) => r.value > 0);
  }, [protocols, period]);

  // --- Category data ---
  const categoryData = useMemo(() => {
    const groups = new Map<string, { value: number; count: number }>();
    for (const r of resolvedProtocols) {
      const existing = groups.get(r.group) ?? { value: 0, count: 0 };
      existing.value += r.value;
      existing.count += 1;
      groups.set(r.group, existing);
    }
    return Array.from(groups.entries())
      .map(([name, { value, count }]) => ({
        name,
        value,
        count,
        color: GROUP_COLORS[name] || "#94a3b8",
      }))
      .sort((a, b) => b.value - a.value);
  }, [resolvedProtocols]);

  // --- Project data ---
  const projectData = useMemo(() => {
    return resolvedProtocols
      .map((r) => ({
        name: r.protocol.displayName || r.protocol.name,
        slug: r.slug,
        value: r.value,
        color: GROUP_COLORS[r.group] || "#94a3b8",
        category: r.group,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, topN);
  }, [resolvedProtocols, topN]);

  // --- Drill-down data for selected group ---
  const drillDownData = useMemo((): DrillDownData | null => {
    if (!selectedGroup || viewMode !== "category") return null;

    const groupProtocols = resolvedProtocols.filter(
      (r) => r.group === selectedGroup
    );
    if (groupProtocols.length === 0) return null;

    // Group by subcategory
    const subcatMap = new Map<string, ProtocolRow[]>();
    for (const r of groupProtocols) {
      const key = r.subcategory;
      if (!subcatMap.has(key)) subcatMap.set(key, []);
      subcatMap.get(key)!.push({
        name: r.protocol.displayName || r.protocol.name,
        slug: r.slug,
        value: r.value,
        change7d: r.protocol.change_7d ?? null,
        revenue24h: r.protocol.revenue24h ?? null,
        margin: r.protocol.margin ?? null,
      });
    }

    const subcategories: SubcategoryRow[] = Array.from(subcatMap.entries())
      .map(([name, protos]) => ({
        name,
        value: protos.reduce((s, p) => s + p.value, 0),
        count: protos.length,
        protocols: protos.sort((a, b) => b.value - a.value),
      }))
      .sort((a, b) => b.value - a.value);

    return {
      group: selectedGroup,
      totalValue: groupProtocols.reduce((s, r) => s + r.value, 0),
      subcategories,
    };
  }, [selectedGroup, viewMode, resolvedProtocols]);

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

  const handleBarClick = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (data: any) => {
      if (viewMode !== "category") return;
      const name = data?.name || data?.payload?.name;
      if (!name) return;
      setSelectedGroup((prev) => (prev === name ? null : name));
      setExpandedSubcats(new Set());
    },
    [viewMode],
  );

  const toggleSubcat = useCallback((name: string) => {
    setExpandedSubcats((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
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
        {viewMode === "category" && (
          <span style={{ color: "#999999" }}>
            {" "}&mdash; click a category to drill down
          </span>
        )}
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
              onClick={() => { setPeriod(key); setSelectedGroup(null); }}
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
            onClick={() => { setViewMode("category"); setSelectedGroup(null); }}
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
            onClick={() => { setViewMode("project"); setSelectedGroup(null); }}
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
                  onClick={handleBarClick}
                  style={{ cursor: viewMode === "category" ? "pointer" : "default" }}
                  label={{
                    position: "right",
                    formatter: (v: number) => formatCompact(v),
                    fill: "#666666",
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                >
                  {chartData.map((entry, idx) => (
                    <Cell
                      key={idx}
                      fill={entry.color}
                      stroke={
                        viewMode === "category" && selectedGroup === entry.name
                          ? "#111111"
                          : "none"
                      }
                      strokeWidth={selectedGroup === entry.name ? 2 : 0}
                    />
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

        {/* Drill-down tree table */}
        {drillDownData && (
          <div
            style={{
              borderTop: "2px solid #111111",
              marginTop: 16,
              paddingTop: 12,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 8,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div
                  style={{
                    width: 12,
                    height: 12,
                    backgroundColor: GROUP_COLORS[drillDownData.group] || "#94a3b8",
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontFamily: "Georgia, serif",
                    fontWeight: 700,
                    fontSize: "16px",
                    color: "#111111",
                  }}
                >
                  {drillDownData.group}
                </span>
                <span style={{ fontSize: "12px", color: "#999999" }}>
                  {drillDownData.subcategories.reduce((s, sc) => s + sc.count, 0)} protocols
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span
                  style={{ fontSize: "13px", fontWeight: 700, color: "#111111" }}
                >
                  {formatCompact(drillDownData.totalValue)}
                </span>
                <button
                  onClick={() => setSelectedGroup(null)}
                  style={{
                    fontSize: "10px",
                    fontWeight: 600,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    padding: "3px 8px",
                    border: "1px solid #d4d4d4",
                    backgroundColor: "#ffffff",
                    color: "#666666",
                    cursor: "pointer",
                    borderRadius: 0,
                  }}
                >
                  Close
                </button>
              </div>
            </div>

            {/* Table */}
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "12px",
                }}
              >
                <thead>
                  <tr
                    style={{
                      borderBottom: "1px solid #d4d4d4",
                    }}
                  >
                    <th
                      style={{
                        textAlign: "left",
                        padding: "6px 8px",
                        fontWeight: 600,
                        fontSize: "10px",
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        color: "#999999",
                      }}
                    >
                      Subcategory / Protocol
                    </th>
                    <th
                      style={{
                        textAlign: "right",
                        padding: "6px 8px",
                        fontWeight: 600,
                        fontSize: "10px",
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        color: "#999999",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Fees ({PERIODS.find((p) => p.key === period)?.label})
                    </th>
                    <th
                      style={{
                        textAlign: "right",
                        padding: "6px 8px",
                        fontWeight: 600,
                        fontSize: "10px",
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        color: "#999999",
                      }}
                    >
                      Share
                    </th>
                    <th
                      style={{
                        textAlign: "center",
                        padding: "6px 8px",
                        fontWeight: 600,
                        fontSize: "10px",
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        color: "#999999",
                      }}
                    >
                      #
                    </th>
                    <th
                      style={{
                        textAlign: "right",
                        padding: "6px 8px",
                        fontWeight: 600,
                        fontSize: "10px",
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        color: "#999999",
                      }}
                    >
                      7d Chg
                    </th>
                    <th
                      style={{
                        textAlign: "right",
                        padding: "6px 8px",
                        fontWeight: 600,
                        fontSize: "10px",
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        color: "#999999",
                      }}
                    >
                      Margin
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {drillDownData.subcategories.map((subcat) => {
                    const isExpanded = expandedSubcats.has(subcat.name);
                    const share =
                      drillDownData.totalValue > 0
                        ? (subcat.value / drillDownData.totalValue) * 100
                        : 0;

                    return (
                      <React.Fragment key={subcat.name}>
                        {/* Subcategory row */}
                        <tr
                          onClick={() => toggleSubcat(subcat.name)}
                          style={{
                            cursor: "pointer",
                            borderBottom: "1px solid #f0f0f0",
                            backgroundColor: isExpanded ? "#fafafa" : "transparent",
                          }}
                        >
                          <td
                            style={{
                              padding: "7px 8px",
                              fontWeight: 600,
                              color: "#111111",
                            }}
                          >
                            <span style={{ color: "#999999", marginRight: 6, fontSize: "10px" }}>
                              {isExpanded ? "\u25BC" : "\u25B6"}
                            </span>
                            {subcat.name}
                          </td>
                          <td
                            style={{
                              textAlign: "right",
                              padding: "7px 8px",
                              fontWeight: 600,
                              color: "#111111",
                            }}
                          >
                            {formatCompact(subcat.value)}
                          </td>
                          <td
                            style={{
                              textAlign: "right",
                              padding: "7px 8px",
                              color: "#666666",
                            }}
                          >
                            {share.toFixed(1)}%
                          </td>
                          <td
                            style={{
                              textAlign: "center",
                              padding: "7px 8px",
                              color: "#999999",
                            }}
                          >
                            {subcat.count}
                          </td>
                          <td
                            style={{
                              textAlign: "right",
                              padding: "7px 8px",
                              color: "#999999",
                            }}
                          >
                            &mdash;
                          </td>
                          <td
                            style={{
                              textAlign: "right",
                              padding: "7px 8px",
                              color: "#999999",
                            }}
                          >
                            &mdash;
                          </td>
                        </tr>

                        {/* Protocol rows (expanded) */}
                        {isExpanded &&
                          subcat.protocols.map((proto) => {
                            const protoShare =
                              drillDownData.totalValue > 0
                                ? (proto.value / drillDownData.totalValue) * 100
                                : 0;
                            const change7d = proto.change7d;
                            const margin = proto.margin;

                            return (
                              <tr
                                key={proto.slug}
                                style={{
                                  borderBottom: "1px solid #f5f5f5",
                                  backgroundColor: "#fafafa",
                                }}
                              >
                                <td
                                  style={{
                                    padding: "5px 8px 5px 32px",
                                    color: "#333333",
                                  }}
                                >
                                  {proto.name}
                                </td>
                                <td
                                  style={{
                                    textAlign: "right",
                                    padding: "5px 8px",
                                    color: "#333333",
                                    fontWeight: 500,
                                  }}
                                >
                                  {formatCompact(proto.value)}
                                </td>
                                <td
                                  style={{
                                    textAlign: "right",
                                    padding: "5px 8px",
                                    color: "#999999",
                                    fontSize: "11px",
                                  }}
                                >
                                  {protoShare < 0.1
                                    ? "<0.1%"
                                    : `${protoShare.toFixed(1)}%`}
                                </td>
                                <td
                                  style={{
                                    textAlign: "center",
                                    padding: "5px 8px",
                                    color: "#999999",
                                  }}
                                />
                                <td
                                  style={{
                                    textAlign: "right",
                                    padding: "5px 8px",
                                    fontSize: "11px",
                                    color:
                                      change7d == null
                                        ? "#999999"
                                        : change7d >= 0
                                        ? "#16a34a"
                                        : "#dc2626",
                                    fontWeight: change7d != null ? 600 : 400,
                                  }}
                                >
                                  {change7d == null
                                    ? "\u2014"
                                    : `${change7d >= 0 ? "+" : ""}${change7d.toFixed(1)}%`}
                                </td>
                                <td
                                  style={{
                                    textAlign: "right",
                                    padding: "5px 8px",
                                    fontSize: "11px",
                                    color:
                                      margin == null
                                        ? "#999999"
                                        : margin >= 0.5
                                        ? "#16a34a"
                                        : margin >= 0.2
                                        ? "#333333"
                                        : "#dc2626",
                                  }}
                                >
                                  {margin == null
                                    ? "\u2014"
                                    : `${(margin * 100).toFixed(0)}%`}
                                </td>
                              </tr>
                            );
                          })}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <DataSource sources={["DefiLlama (live)"]} />
      </Card>
    </section>
  );
}
