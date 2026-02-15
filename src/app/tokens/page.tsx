"use client";

import React, { useMemo, useState } from "react";
import { useDataContext } from "@/lib/DataContext";
import { TokensTable } from "@/components/tokens/TokensTable";
import { GlobalNav } from "@/components/ui/GlobalNav";
import { DataStatus } from "@/components/ui/DataStatus";
import { formatCompact } from "@/lib/chartUtils";

// ---------------------------------------------------------------------------
// Filter categories
// ---------------------------------------------------------------------------

const CATEGORY_FILTERS = [
  "All",
  "DeFi",
  "Exchanges",
  "Stablecoins",
  "Blockchains",
  "Consumer",
  "Infrastructure",
  "DePIN",
] as const;

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function TokensPage() {
  const { unifiedTokens, isLive, isLoading, lastUpdated } = useDataContext();

  const [categoryFilter, setCategoryFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Summary stats
  const stats = useMemo(() => {
    if (!unifiedTokens || unifiedTokens.length === 0) {
      return {
        totalTokens: 0,
        withFees: 0,
        withRevenue: 0,
        totalFees24h: 0,
        totalRevenue24h: 0,
        totalMarketCap: 0,
        medianPS: null as number | null,
      };
    }

    const withFees = unifiedTokens.filter((t) => t.fees24h != null && t.fees24h > 0);
    const withRevenue = unifiedTokens.filter(
      (t) => t.protocolRevenue24h != null && t.protocolRevenue24h > 0,
    );
    const totalFees24h = withFees.reduce((s, t) => s + (t.fees24h ?? 0), 0);
    const totalRevenue24h = withRevenue.reduce(
      (s, t) => s + (t.protocolRevenue24h ?? 0),
      0,
    );
    const totalMarketCap = unifiedTokens.reduce(
      (s, t) => s + (t.marketCap ?? 0),
      0,
    );

    const psValues = unifiedTokens
      .map((t) => t.psRatio)
      .filter((v): v is number => v != null && v > 0 && v < 1000)
      .sort((a, b) => a - b);

    const medianPS =
      psValues.length > 0
        ? psValues[Math.floor(psValues.length / 2)]
        : null;

    return {
      totalTokens: unifiedTokens.length,
      withFees: withFees.length,
      withRevenue: withRevenue.length,
      totalFees24h,
      totalRevenue24h,
      totalMarketCap,
      medianPS,
    };
  }, [unifiedTokens]);

  return (
    <div className="min-h-screen">
      <GlobalNav />

      {/* Header */}
      <header className="pt-8 pb-6">
        <div className="flex items-start justify-between">
          <div>
            <p
              className="font-medium uppercase text-[#999999] mb-2"
              style={{ fontSize: "11px", letterSpacing: "0.14em" }}
            >
              All Tokens &amp; Protocols
            </p>
            <h1
              className="font-serif font-bold text-[#111111]"
              style={{
                fontSize: "32px",
                lineHeight: "1.15",
                letterSpacing: "-0.01em",
              }}
            >
              Token Revenue Explorer
            </h1>
            <p
              className="mt-2 text-[#666666] max-w-2xl"
              style={{ fontSize: "14px", lineHeight: "1.5" }}
            >
              {stats.totalTokens.toLocaleString()} tokens and protocols from
              CoinGecko, DefiLlama, and TokenTerminal — unified with full
              income statement data.
            </p>
          </div>
          <div className="flex-shrink-0 pt-1">
            <DataStatus
              isLive={isLive}
              isLoading={isLoading}
              lastUpdated={lastUpdated}
            />
          </div>
        </div>
        <hr className="wsj-rule-heavy mt-4" />
      </header>

      {/* Summary Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: 0,
          border: "1px solid #e8e8e8",
          marginBottom: 24,
        }}
      >
        {[
          { label: "Total Tokens", value: stats.totalTokens.toLocaleString() },
          { label: "With Fee Data", value: stats.withFees.toLocaleString() },
          {
            label: "With Revenue Data",
            value: stats.withRevenue.toLocaleString(),
          },
          {
            label: "Total Fees (24h)",
            value: formatCompact(stats.totalFees24h),
          },
          {
            label: "Total Revenue (24h)",
            value: formatCompact(stats.totalRevenue24h),
          },
          {
            label: "Total Market Cap",
            value: formatCompact(stats.totalMarketCap),
          },
          {
            label: "Median P/S",
            value:
              stats.medianPS != null
                ? `${stats.medianPS.toFixed(1)}x`
                : "\u2014",
          },
        ].map(({ label, value }) => (
          <div
            key={label}
            style={{
              padding: "12px 16px",
              borderRight: "1px solid #e8e8e8",
            }}
          >
            <p
              style={{
                fontSize: "10px",
                fontWeight: 600,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "#999999",
                marginBottom: 4,
              }}
            >
              {label}
            </p>
            <p
              style={{
                fontSize: "20px",
                fontWeight: 700,
                fontFamily: "Georgia, serif",
                color: "#111111",
              }}
            >
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {/* Category filter */}
        <div className="flex flex-wrap gap-1.5">
          {CATEGORY_FILTERS.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              style={{
                fontSize: "11px",
                fontWeight: 600,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                padding: "5px 10px",
                border: "1px solid",
                borderColor:
                  categoryFilter === cat ? "#111111" : "#d4d4d4",
                backgroundColor:
                  categoryFilter === cat ? "#111111" : "#ffffff",
                color: categoryFilter === cat ? "#ffffff" : "#666666",
                borderRadius: 0,
                cursor: "pointer",
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search */}
        <div style={{ marginLeft: "auto" }}>
          <input
            type="text"
            placeholder="Search tokens..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              fontSize: "13px",
              padding: "6px 12px",
              border: "1px solid #d4d4d4",
              borderRadius: 0,
              width: 220,
              outline: "none",
              color: "#333333",
            }}
          />
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="py-16 text-center">
          <div className="inline-block w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-sm text-slate-400">Loading token data...</p>
        </div>
      ) : (
        <TokensTable
          tokens={unifiedTokens ?? []}
          categoryFilter={categoryFilter}
          searchQuery={searchQuery}
        />
      )}

      {/* Footer */}
      <footer className="mt-16 pb-12">
        <hr className="wsj-rule-heavy mb-4" />
        <p
          style={{ fontSize: "11px", color: "#999999", lineHeight: "1.6" }}
        >
          Data Sources: DefiLlama (live) &middot; CoinGecko (live) &middot;
          TokenTerminal (live)
          <br />
          Revenue = protocol revenue (what the protocol keeps). Fees = total
          user fees. Margin = revenue / fees.
          <br />
          P/S uses protocol revenue when available, otherwise total fees.
        </p>
      </footer>
    </div>
  );
}
