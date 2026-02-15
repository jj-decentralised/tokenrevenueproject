"use client";

import React, { useMemo, useState, useCallback } from "react";
import type { UnifiedToken } from "@/lib/tokenMerge";
import {
  formatCompact,
  formatRatio,
  formatPct,
  formatMargin,
} from "@/lib/chartUtils";

// ---------------------------------------------------------------------------
// Sort configuration
// ---------------------------------------------------------------------------

type SortKey =
  | "rank"
  | "name"
  | "price"
  | "priceChange24h"
  | "marketCap"
  | "fees24h"
  | "protocolRevenue24h"
  | "margin"
  | "psRatio"
  | "fdv"
  | "tvl"
  | "holdersRevenue24h"
  | "feesAnn"
  | "change7d";

type SortDir = "asc" | "desc";

const ROWS_PER_PAGE = 50;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface TokensTableProps {
  tokens: UnifiedToken[];
  categoryFilter: string;
  searchQuery: string;
}

export function TokensTable({
  tokens,
  categoryFilter,
  searchQuery,
}: TokensTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("fees24h");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [currentPage, setCurrentPage] = useState(1);

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [categoryFilter, searchQuery, sortKey, sortDir]);

  const handleSort = useCallback(
    (key: SortKey) => {
      if (sortKey === key) {
        setSortDir((d) => (d === "desc" ? "asc" : "desc"));
      } else {
        setSortKey(key);
        setSortDir("desc");
      }
    },
    [sortKey],
  );

  // Filter
  const filtered = useMemo(() => {
    let result = tokens;
    if (categoryFilter && categoryFilter !== "All") {
      result = result.filter((t) => t.categoryGroup === categoryFilter);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          (t.symbol && t.symbol.toLowerCase().includes(q)) ||
          t.category.toLowerCase().includes(q),
      );
    }
    return result;
  }, [tokens, categoryFilter, searchQuery]);

  // Sort
  const sorted = useMemo(() => {
    const mult = sortDir === "desc" ? -1 : 1;

    return [...filtered].sort((a, b) => {
      let av: number | null = null;
      let bv: number | null = null;

      switch (sortKey) {
        case "rank":
          av = a.marketCapRank;
          bv = b.marketCapRank;
          break;
        case "name":
          return mult * a.name.localeCompare(b.name);
        case "price":
          av = a.currentPrice;
          bv = b.currentPrice;
          break;
        case "priceChange24h":
          av = a.priceChange24h;
          bv = b.priceChange24h;
          break;
        case "marketCap":
          av = a.marketCap;
          bv = b.marketCap;
          break;
        case "fees24h":
          av = a.fees24h;
          bv = b.fees24h;
          break;
        case "protocolRevenue24h":
          av = a.protocolRevenue24h;
          bv = b.protocolRevenue24h;
          break;
        case "margin":
          av = a.margin;
          bv = b.margin;
          break;
        case "psRatio":
          av = a.psRatio;
          bv = b.psRatio;
          break;
        case "fdv":
          av = a.fdv;
          bv = b.fdv;
          break;
        case "tvl":
          av = a.tvl;
          bv = b.tvl;
          break;
        case "holdersRevenue24h":
          av = a.holdersRevenue24h;
          bv = b.holdersRevenue24h;
          break;
        case "feesAnn":
          av = a.feesAnnualized;
          bv = b.feesAnnualized;
          break;
        case "change7d":
          av = a.change7d;
          bv = b.change7d;
          break;
      }

      // Nulls sort last
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      return mult * (av - bv);
    });
  }, [filtered, sortKey, sortDir]);

  // Paginate
  const totalPages = Math.max(1, Math.ceil(sorted.length / ROWS_PER_PAGE));
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * ROWS_PER_PAGE;
    return sorted.slice(start, start + ROWS_PER_PAGE);
  }, [sorted, currentPage]);

  // Header cell helper
  function Th({
    label,
    sortField,
    align = "right",
    minW,
  }: {
    label: string;
    sortField: SortKey;
    align?: "left" | "right";
    minW?: number;
  }) {
    const active = sortKey === sortField;
    const arrow = active ? (sortDir === "desc" ? " \u25BC" : " \u25B2") : "";
    return (
      <th
        onClick={() => handleSort(sortField)}
        style={{
          textAlign: align,
          minWidth: minW,
          cursor: "pointer",
          userSelect: "none",
          fontWeight: active ? 700 : 600,
          color: active ? "#111111" : "#666666",
        }}
      >
        {label}
        {arrow}
      </th>
    );
  }

  function formatPrice(v: number | null | undefined): string {
    if (v == null) return "\u2014";
    if (v >= 1) return `$${v.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
    if (v >= 0.01) return `$${v.toFixed(4)}`;
    return `$${v.toFixed(6)}`;
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table
          className="financial-table w-full"
          style={{ borderCollapse: "collapse" }}
        >
          <thead>
            <tr>
              <Th label="#" sortField="rank" align="left" minW={36} />
              <Th label="Name" sortField="name" align="left" minW={160} />
              <Th label="Price" sortField="price" minW={80} />
              <Th label="24h%" sortField="priceChange24h" minW={60} />
              <Th label="Market Cap" sortField="marketCap" minW={100} />
              <Th label="Fees (24h)" sortField="fees24h" minW={90} />
              <Th label="Revenue (24h)" sortField="protocolRevenue24h" minW={100} />
              <Th label="Margin" sortField="margin" minW={60} />
              <Th label="P/S" sortField="psRatio" minW={60} />
              <Th label="FDV" sortField="fdv" minW={90} />
              <Th label="TVL" sortField="tvl" minW={80} />
              <Th label="Holders Rev." sortField="holdersRevenue24h" minW={90} />
              <th style={{ textAlign: "right", minWidth: 80 }}>Sources</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((t, idx) => {
              const globalIdx =
                (currentPage - 1) * ROWS_PER_PAGE + idx + 1;
              return (
                <tr key={t.id}>
                  <td style={{ textAlign: "left", color: "#999999" }}>
                    {globalIdx}
                  </td>
                  <td style={{ textAlign: "left" }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      {t.logo && (
                        <img
                          src={t.logo}
                          alt=""
                          width={16}
                          height={16}
                          style={{ flexShrink: 0 }}
                          loading="lazy"
                        />
                      )}
                      <div>
                        <a
                          href={`/protocol/${t.slug}`}
                          style={{
                            color: "#111111",
                            fontWeight: 600,
                            textDecoration: "none",
                          }}
                        >
                          {t.name}
                        </a>
                        {t.symbol && (
                          <span
                            style={{
                              fontSize: "10px",
                              color: "#999999",
                              marginLeft: 4,
                            }}
                          >
                            {t.symbol.toUpperCase()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ fontSize: "10px", color: "#999999", marginTop: 1 }}>
                      {t.categoryGroup}
                      {t.category !== t.categoryGroup && ` / ${t.category}`}
                    </div>
                  </td>
                  <td
                    style={{
                      textAlign: "right",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {formatPrice(t.currentPrice)}
                  </td>
                  <td
                    style={{
                      textAlign: "right",
                      fontVariantNumeric: "tabular-nums",
                      color:
                        t.priceChange24h == null
                          ? "#999999"
                          : t.priceChange24h >= 0
                            ? "#2e7d32"
                            : "#9e2b25",
                      fontWeight: 500,
                    }}
                  >
                    {formatPct(t.priceChange24h)}
                  </td>
                  <td
                    style={{
                      textAlign: "right",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {formatCompact(t.marketCap)}
                  </td>
                  <td
                    style={{
                      textAlign: "right",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {formatCompact(t.fees24h)}
                  </td>
                  <td
                    style={{
                      textAlign: "right",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {t.protocolRevenue24h != null
                      ? formatCompact(t.protocolRevenue24h)
                      : "\u2014"}
                  </td>
                  <td
                    style={{
                      textAlign: "right",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {formatMargin(t.margin)}
                  </td>
                  <td
                    style={{
                      textAlign: "right",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {formatRatio(t.psRatio)}
                  </td>
                  <td
                    style={{
                      textAlign: "right",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {formatCompact(t.fdv)}
                  </td>
                  <td
                    style={{
                      textAlign: "right",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {formatCompact(t.tvl)}
                  </td>
                  <td
                    style={{
                      textAlign: "right",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {t.holdersRevenue24h != null
                      ? formatCompact(t.holdersRevenue24h)
                      : "\u2014"}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <div className="flex justify-end gap-1">
                      {t.sources.map((s) => (
                        <span
                          key={s}
                          style={{
                            fontSize: "9px",
                            padding: "1px 4px",
                            border: "1px solid #e8e8e8",
                            color:
                              s === "defillama"
                                ? "#3b82f6"
                                : s === "coingecko"
                                  ? "#f59e0b"
                                  : "#8b5cf6",
                            letterSpacing: "0.03em",
                            textTransform: "uppercase",
                          }}
                        >
                          {s === "defillama"
                            ? "DL"
                            : s === "coingecko"
                              ? "CG"
                              : "TT"}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              );
            })}
            {sorted.length === 0 && (
              <tr>
                <td
                  colSpan={13}
                  style={{
                    textAlign: "center",
                    padding: "24px 0",
                    color: "#999999",
                  }}
                >
                  No tokens found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 16,
            padding: "8px 0",
            borderTop: "1px solid #e8e8e8",
          }}
        >
          <span style={{ fontSize: "12px", color: "#666666" }}>
            Showing {(currentPage - 1) * ROWS_PER_PAGE + 1}&ndash;
            {Math.min(currentPage * ROWS_PER_PAGE, sorted.length)} of{" "}
            {sorted.length} tokens
          </span>
          <div style={{ display: "flex", gap: 4 }}>
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              style={{
                padding: "4px 12px",
                fontSize: "11px",
                fontWeight: 600,
                border: "1px solid #d4d4d4",
                backgroundColor:
                  currentPage === 1 ? "#f5f5f5" : "#ffffff",
                color: currentPage === 1 ? "#999999" : "#333333",
                cursor: currentPage === 1 ? "default" : "pointer",
                borderRadius: 0,
              }}
            >
              Previous
            </button>
            <span
              style={{
                padding: "4px 8px",
                fontSize: "12px",
                color: "#666666",
                alignSelf: "center",
              }}
            >
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() =>
                setCurrentPage((p) => Math.min(totalPages, p + 1))
              }
              disabled={currentPage === totalPages}
              style={{
                padding: "4px 12px",
                fontSize: "11px",
                fontWeight: 600,
                border: "1px solid #d4d4d4",
                backgroundColor:
                  currentPage === totalPages ? "#f5f5f5" : "#ffffff",
                color:
                  currentPage === totalPages ? "#999999" : "#333333",
                cursor:
                  currentPage === totalPages ? "default" : "pointer",
                borderRadius: 0,
              }}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
