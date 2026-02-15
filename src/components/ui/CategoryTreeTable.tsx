"use client";

import React, { useState, useMemo } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MergedProtocol {
  rank: number;
  name: string;
  displayName: string;
  category: string;
  categoryGroup: string;
  slug: string;
  revenue24h: number;
  revenue30d: number | null;
  revenueAnn: number;
  marketCap: number | null;
  psRatio: number | null;
  tvl: number | null;
  revenueTvl: number | null;
  margin: number | null;
  change1d: number | null;
  change7d: number | null;
  hasToken: boolean;
  fdv: number | null;
  psFdv: number | null;
  revenueFdv: number | null;
}

interface CategoryNode {
  name: string;
  level: "group" | "category" | "protocol";
  protocolCount: number;
  revenue24h: number;
  revenueAnn: number;
  totalMarketCap: number | null;
  totalTvl: number | null;
  medianPsRatio: number | null;
  medianChange7d: number | null;
  tokenProjectsPct: number | null;
  hhi: number | null;
  top5Share: number | null;
  protocol: MergedProtocol | null;
  children: CategoryNode[];
}

interface CategoryTreeTableProps {
  protocols: MergedProtocol[];
}

// ---------------------------------------------------------------------------
// Formatting helpers
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

function formatPct(value: number | null | undefined): string {
  if (value == null || !isFinite(value)) return "\u2014";
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

function formatRatio(value: number | null | undefined): string {
  if (value == null || !isFinite(value)) return "\u2014";
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return `${value.toFixed(1)}x`;
}

// ---------------------------------------------------------------------------
// Statistical helpers
// ---------------------------------------------------------------------------

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

function computeHHI(protocols: MergedProtocol[]): number {
  const totalRevenue = protocols.reduce((s, p) => s + p.revenue24h, 0);
  if (totalRevenue === 0) return 0;
  let hhi = 0;
  for (const p of protocols) {
    const share = (p.revenue24h / totalRevenue) * 100;
    hhi += share * share;
  }
  return Math.round(hhi);
}

function computeTop5Share(protocols: MergedProtocol[]): number | null {
  const totalRevenue = protocols.reduce((s, p) => s + p.revenue24h, 0);
  if (totalRevenue === 0) return null;
  const sorted = [...protocols].sort((a, b) => b.revenue24h - a.revenue24h);
  const top5Revenue = sorted.slice(0, 5).reduce((s, p) => s + p.revenue24h, 0);
  return (top5Revenue / totalRevenue) * 100;
}

function sumNonNull(values: (number | null)[]): number | null {
  const filtered = values.filter((v): v is number => v != null);
  if (filtered.length === 0) return null;
  return filtered.reduce((s, v) => s + v, 0);
}

// ---------------------------------------------------------------------------
// HHI label and color
// ---------------------------------------------------------------------------

function getHHILabel(hhi: number | null): string {
  if (hhi == null) return "\u2014";
  if (hhi > 4000) return "Concentrated";
  if (hhi >= 2000) return "Moderate";
  return "Competitive";
}

function getHHIColor(hhi: number | null): string {
  if (hhi == null) return "#999999";
  if (hhi > 4000) return "#9e2b25";
  if (hhi >= 2000) return "#b45309";
  return "#2e7d32";
}

// ---------------------------------------------------------------------------
// Tree building
// ---------------------------------------------------------------------------

const GROUP_ORDER = ["DeFi", "Blockchains", "Stablecoins", "Exchanges", "Consumer", "Other"];

function buildAggregateNode(
  name: string,
  level: "group" | "category",
  protocols: MergedProtocol[],
  children: CategoryNode[]
): CategoryNode {
  const revenue24h = protocols.reduce((s, p) => s + p.revenue24h, 0);
  const revenueAnn = protocols.reduce((s, p) => s + p.revenueAnn, 0);
  const totalMarketCap = sumNonNull(protocols.map((p) => p.marketCap));
  const totalTvl = sumNonNull(protocols.map((p) => p.tvl));

  const psValues = protocols
    .map((p) => p.psRatio)
    .filter((v): v is number => v != null && isFinite(v) && v <= 1000);
  const medianPsRatio = median(psValues);

  const change7dValues = protocols
    .map((p) => p.change7d)
    .filter((v): v is number => v != null && isFinite(v));
  const medianChange7d = median(change7dValues);

  const tokenCount = protocols.filter((p) => p.hasToken).length;
  const tokenProjectsPct =
    protocols.length > 0 ? (tokenCount / protocols.length) * 100 : null;

  const hhi = computeHHI(protocols);
  const top5Share = computeTop5Share(protocols);

  return {
    name,
    level,
    protocolCount: protocols.length,
    revenue24h,
    revenueAnn,
    totalMarketCap,
    totalTvl,
    medianPsRatio,
    medianChange7d,
    tokenProjectsPct,
    hhi,
    top5Share,
    protocol: null,
    children,
  };
}

function buildProtocolNode(protocol: MergedProtocol): CategoryNode {
  return {
    name: protocol.displayName,
    level: "protocol",
    protocolCount: 1,
    revenue24h: protocol.revenue24h,
    revenueAnn: protocol.revenueAnn,
    totalMarketCap: protocol.marketCap,
    totalTvl: protocol.tvl,
    medianPsRatio: protocol.psRatio,
    medianChange7d: protocol.change7d,
    tokenProjectsPct: protocol.hasToken ? 100 : 0,
    hhi: null,
    top5Share: null,
    protocol,
    children: [],
  };
}

function buildTree(protocols: MergedProtocol[]): CategoryNode[] {
  // Group by categoryGroup
  const groupMap = new Map<string, MergedProtocol[]>();
  for (const p of protocols) {
    const group = p.categoryGroup || "Other";
    if (!groupMap.has(group)) groupMap.set(group, []);
    groupMap.get(group)!.push(p);
  }

  const tree: CategoryNode[] = [];

  for (const groupName of GROUP_ORDER) {
    const groupProtocols = groupMap.get(groupName);
    if (!groupProtocols || groupProtocols.length === 0) continue;

    // Sub-group by category
    const categoryMap = new Map<string, MergedProtocol[]>();
    for (const p of groupProtocols) {
      const cat = p.category || "Other";
      if (!categoryMap.has(cat)) categoryMap.set(cat, []);
      categoryMap.get(cat)!.push(p);
    }

    // Sort categories by total revenue desc
    const sortedCategories = [...categoryMap.entries()].sort(
      (a, b) => {
        const revA = a[1].reduce((s, p) => s + p.revenue24h, 0);
        const revB = b[1].reduce((s, p) => s + p.revenue24h, 0);
        return revB - revA;
      }
    );

    const categoryNodes: CategoryNode[] = sortedCategories.map(
      ([catName, catProtocols]) => {
        // Sort protocols by revenue24h desc
        const sorted = [...catProtocols].sort(
          (a, b) => b.revenue24h - a.revenue24h
        );
        const protocolNodes = sorted.map(buildProtocolNode);
        return buildAggregateNode(catName, "category", catProtocols, protocolNodes);
      }
    );

    const groupNode = buildAggregateNode(
      groupName,
      "group",
      groupProtocols,
      categoryNodes
    );
    tree.push(groupNode);
  }

  // Handle any groups not in GROUP_ORDER
  for (const [groupName, groupProtocols] of groupMap) {
    if (GROUP_ORDER.includes(groupName)) continue;

    const categoryMap = new Map<string, MergedProtocol[]>();
    for (const p of groupProtocols) {
      const cat = p.category || "Other";
      if (!categoryMap.has(cat)) categoryMap.set(cat, []);
      categoryMap.get(cat)!.push(p);
    }

    const sortedCategories = [...categoryMap.entries()].sort(
      (a, b) => {
        const revA = a[1].reduce((s, p) => s + p.revenue24h, 0);
        const revB = b[1].reduce((s, p) => s + p.revenue24h, 0);
        return revB - revA;
      }
    );

    const categoryNodes: CategoryNode[] = sortedCategories.map(
      ([catName, catProtocols]) => {
        const sorted = [...catProtocols].sort(
          (a, b) => b.revenue24h - a.revenue24h
        );
        const protocolNodes = sorted.map(buildProtocolNode);
        return buildAggregateNode(catName, "category", catProtocols, protocolNodes);
      }
    );

    const groupNode = buildAggregateNode(
      groupName,
      "group",
      groupProtocols,
      categoryNodes
    );
    tree.push(groupNode);
  }

  // Sort top-level groups by revenue desc (but keep GROUP_ORDER priority)
  return tree;
}

// ---------------------------------------------------------------------------
// Table styles (WSJ design system: no border-radius, Georgia serif, flat)
// ---------------------------------------------------------------------------

const tableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: "12px",
  fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
};

const headerCellStyle: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  color: "#666666",
  borderBottom: "2px solid #111111",
  padding: "6px 8px",
  whiteSpace: "nowrap",
};

const cellBase: React.CSSProperties = {
  padding: "5px 8px",
  borderBottom: "1px solid #e8e8e8",
  color: "#333333",
  fontSize: "12px",
};

const numericCell: React.CSSProperties = {
  ...cellBase,
  textAlign: "right",
  fontVariantNumeric: "tabular-nums",
};

const groupRowStyle: React.CSSProperties = {
  backgroundColor: "#f5f5f0",
};

const categoryRowStyle: React.CSSProperties = {
  backgroundColor: "#fafaf8",
};

const protocolRowStyle: React.CSSProperties = {
  backgroundColor: "#ffffff",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CategoryTreeTable({ protocols }: CategoryTreeTableProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(["DeFi"])
  );
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set()
  );

  const tree = useMemo(() => buildTree(protocols), [protocols]);

  const toggleGroup = (name: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };

  const toggleCategory = (groupName: string, catName: string) => {
    const key = `${groupName}::${catName}`;
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  // Build flat row list for rendering
  const rows: Array<{
    node: CategoryNode;
    groupName: string;
    depth: number;
  }> = [];

  for (const groupNode of tree) {
    rows.push({ node: groupNode, groupName: groupNode.name, depth: 0 });

    if (expandedGroups.has(groupNode.name)) {
      for (const catNode of groupNode.children) {
        rows.push({ node: catNode, groupName: groupNode.name, depth: 1 });

        const catKey = `${groupNode.name}::${catNode.name}`;
        if (expandedCategories.has(catKey)) {
          for (const protocolNode of catNode.children) {
            rows.push({
              node: protocolNode,
              groupName: groupNode.name,
              depth: 2,
            });
          }
        }
      }
    }
  }

  if (protocols.length === 0) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "32px 0",
          color: "#999999",
          fontSize: "13px",
        }}
      >
        No protocol data available.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={{ ...headerCellStyle, textAlign: "left", minWidth: 200 }}>
              Name
            </th>
            <th style={{ ...headerCellStyle, textAlign: "right", minWidth: 36 }}>
              #
            </th>
            <th style={{ ...headerCellStyle, textAlign: "right", minWidth: 90 }}>
              Rev 24h
            </th>
            <th style={{ ...headerCellStyle, textAlign: "right", minWidth: 90 }}>
              Rev Ann.
            </th>
            <th style={{ ...headerCellStyle, textAlign: "right", minWidth: 90 }}>
              Mkt Cap
            </th>
            <th style={{ ...headerCellStyle, textAlign: "right", minWidth: 60 }}>
              P/S
            </th>
            <th style={{ ...headerCellStyle, textAlign: "right", minWidth: 90 }}>
              TVL
            </th>
            <th style={{ ...headerCellStyle, textAlign: "right", minWidth: 80 }}>
              Rev/TVL
            </th>
            <th style={{ ...headerCellStyle, textAlign: "right", minWidth: 70 }}>
              7d Chg
            </th>
            <th style={{ ...headerCellStyle, textAlign: "left", minWidth: 110 }}>
              Concentration
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => {
            const { node, groupName, depth } = row;

            if (node.level === "group") {
              const isExpanded = expandedGroups.has(node.name);
              return (
                <tr key={`group-${node.name}`} style={groupRowStyle}>
                  <td
                    style={{
                      ...cellBase,
                      fontFamily:
                        "Georgia, Cambria, 'Times New Roman', Times, serif",
                      fontSize: "13px",
                      fontWeight: 700,
                      color: "#111111",
                      cursor: "pointer",
                      userSelect: "none",
                      paddingLeft: "8px",
                    }}
                    onClick={() => toggleGroup(node.name)}
                  >
                    <span
                      style={{
                        display: "inline-block",
                        width: "14px",
                        fontSize: "11px",
                        color: "#666666",
                      }}
                    >
                      {isExpanded ? "\u25BE" : "\u25B8"}
                    </span>
                    {node.name}
                  </td>
                  <td
                    style={{
                      ...numericCell,
                      fontWeight: 700,
                      color: "#666666",
                      fontSize: "12px",
                      backgroundColor: "transparent",
                    }}
                  >
                    {node.protocolCount}
                  </td>
                  <td
                    style={{
                      ...numericCell,
                      fontWeight: 700,
                      color: "#111111",
                      fontSize: "13px",
                      backgroundColor: "transparent",
                    }}
                  >
                    {formatCompact(node.revenue24h)}
                  </td>
                  <td
                    style={{
                      ...numericCell,
                      fontWeight: 700,
                      color: "#111111",
                      fontSize: "13px",
                      backgroundColor: "transparent",
                    }}
                  >
                    {formatCompact(node.revenueAnn)}
                  </td>
                  <td
                    style={{
                      ...numericCell,
                      fontWeight: 600,
                      backgroundColor: "transparent",
                    }}
                  >
                    {formatCompact(node.totalMarketCap)}
                  </td>
                  <td
                    style={{
                      ...numericCell,
                      fontWeight: 600,
                      backgroundColor: "transparent",
                    }}
                  >
                    {formatRatio(node.medianPsRatio)}
                  </td>
                  <td
                    style={{
                      ...numericCell,
                      fontWeight: 600,
                      backgroundColor: "transparent",
                    }}
                  >
                    {formatCompact(node.totalTvl)}
                  </td>
                  <td
                    style={{
                      ...numericCell,
                      backgroundColor: "transparent",
                    }}
                  >
                    {"\u2014"}
                  </td>
                  <td
                    style={{
                      ...numericCell,
                      fontWeight: 600,
                      color:
                        node.medianChange7d == null
                          ? "#999999"
                          : node.medianChange7d >= 0
                          ? "#2e7d32"
                          : "#9e2b25",
                      backgroundColor: "transparent",
                    }}
                  >
                    {formatPct(node.medianChange7d)}
                  </td>
                  <td
                    style={{
                      ...cellBase,
                      fontWeight: 700,
                      fontSize: "11px",
                      color: getHHIColor(node.hhi),
                      backgroundColor: "transparent",
                    }}
                  >
                    {getHHILabel(node.hhi)}
                    {node.hhi != null && (
                      <span
                        style={{
                          fontSize: "10px",
                          color: "#999999",
                          fontWeight: 400,
                          marginLeft: 4,
                        }}
                      >
                        ({node.hhi.toLocaleString()})
                      </span>
                    )}
                  </td>
                </tr>
              );
            }

            if (node.level === "category") {
              const catKey = `${groupName}::${node.name}`;
              const isExpanded = expandedCategories.has(catKey);
              return (
                <tr key={`cat-${groupName}-${node.name}`} style={categoryRowStyle}>
                  <td
                    style={{
                      ...cellBase,
                      fontWeight: 600,
                      color: "#333333",
                      cursor: "pointer",
                      userSelect: "none",
                      paddingLeft: "24px",
                      fontSize: "12px",
                    }}
                    onClick={() => toggleCategory(groupName, node.name)}
                  >
                    <span
                      style={{
                        display: "inline-block",
                        width: "14px",
                        fontSize: "10px",
                        color: "#999999",
                      }}
                    >
                      {isExpanded ? "\u25BE" : "\u25B8"}
                    </span>
                    {node.name}
                  </td>
                  <td
                    style={{
                      ...numericCell,
                      color: "#666666",
                      fontSize: "12px",
                      backgroundColor: "transparent",
                    }}
                  >
                    {node.protocolCount}
                  </td>
                  <td
                    style={{
                      ...numericCell,
                      fontWeight: 600,
                      color: "#333333",
                      backgroundColor: "transparent",
                    }}
                  >
                    {formatCompact(node.revenue24h)}
                  </td>
                  <td
                    style={{
                      ...numericCell,
                      fontWeight: 600,
                      color: "#333333",
                      backgroundColor: "transparent",
                    }}
                  >
                    {formatCompact(node.revenueAnn)}
                  </td>
                  <td
                    style={{
                      ...numericCell,
                      backgroundColor: "transparent",
                    }}
                  >
                    {formatCompact(node.totalMarketCap)}
                  </td>
                  <td
                    style={{
                      ...numericCell,
                      backgroundColor: "transparent",
                    }}
                  >
                    {formatRatio(node.medianPsRatio)}
                  </td>
                  <td
                    style={{
                      ...numericCell,
                      backgroundColor: "transparent",
                    }}
                  >
                    {formatCompact(node.totalTvl)}
                  </td>
                  <td
                    style={{
                      ...numericCell,
                      backgroundColor: "transparent",
                    }}
                  >
                    {"\u2014"}
                  </td>
                  <td
                    style={{
                      ...numericCell,
                      color:
                        node.medianChange7d == null
                          ? "#999999"
                          : node.medianChange7d >= 0
                          ? "#2e7d32"
                          : "#9e2b25",
                      fontWeight: 500,
                      backgroundColor: "transparent",
                    }}
                  >
                    {formatPct(node.medianChange7d)}
                  </td>
                  <td
                    style={{
                      ...cellBase,
                      fontSize: "11px",
                      color: getHHIColor(node.hhi),
                      fontWeight: 600,
                      backgroundColor: "transparent",
                    }}
                  >
                    {getHHILabel(node.hhi)}
                  </td>
                </tr>
              );
            }

            // Protocol row (level === "protocol")
            const protocol = node.protocol!;
            const revTvlDisplay =
              protocol.tvl != null && protocol.tvl > 0 && protocol.revenueTvl != null
                ? `${(protocol.revenueTvl * 100).toFixed(1)}%`
                : "\u2014";

            return (
              <tr key={`proto-${protocol.slug}-${idx}`} style={protocolRowStyle}>
                <td
                  style={{
                    ...cellBase,
                    paddingLeft: "48px",
                    fontSize: "12px",
                  }}
                >
                  <a
                    href={`/protocol/${protocol.slug}`}
                    style={{
                      color: "#111111",
                      fontWeight: 500,
                      textDecoration: "none",
                    }}
                    onMouseOver={(e) =>
                      (e.currentTarget.style.color = "#0274B6")
                    }
                    onMouseOut={(e) =>
                      (e.currentTarget.style.color = "#111111")
                    }
                  >
                    {protocol.displayName}
                  </a>
                  {protocol.hasToken && (
                    <span
                      style={{
                        display: "inline-block",
                        marginLeft: 6,
                        padding: "0 4px",
                        border: "1px solid #e8e8e8",
                        fontSize: "9px",
                        letterSpacing: "0.04em",
                        textTransform: "uppercase",
                        color: "#999999",
                        lineHeight: "16px",
                      }}
                    >
                      TOKEN
                    </span>
                  )}
                </td>
                <td
                  style={{
                    ...numericCell,
                    color: "#999999",
                    fontSize: "11px",
                  }}
                >
                  {protocol.rank}
                </td>
                <td style={numericCell}>
                  {formatCompact(protocol.revenue24h)}
                </td>
                <td style={{ ...numericCell, fontWeight: 500 }}>
                  {formatCompact(protocol.revenueAnn)}
                </td>
                <td style={numericCell}>
                  {formatCompact(protocol.marketCap)}
                </td>
                <td style={numericCell}>
                  {formatRatio(protocol.psRatio)}
                </td>
                <td style={numericCell}>
                  {formatCompact(protocol.tvl)}
                </td>
                <td style={numericCell}>{revTvlDisplay}</td>
                <td
                  style={{
                    ...numericCell,
                    color:
                      protocol.change7d == null
                        ? "#999999"
                        : protocol.change7d >= 0
                        ? "#2e7d32"
                        : "#9e2b25",
                    fontWeight: 500,
                  }}
                >
                  {formatPct(protocol.change7d)}
                </td>
                <td style={{ ...cellBase, color: "#999999", fontSize: "11px" }}>
                  {"\u2014"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export { CategoryTreeTable };
export type { CategoryTreeTableProps, CategoryNode, MergedProtocol as TreeMergedProtocol };
