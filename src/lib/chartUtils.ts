// ============================================================
// Shared chart utilities — formatting, colors, tooltips
//
// Extracted from Section6Protocols.tsx for reuse across
// Section6, Section7Analytics, /tokens page, and protocol pages.
// ============================================================

import React from "react";

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

export function formatCompact(value: number | null | undefined): string {
  if (value == null || !isFinite(value)) return "\u2014";
  const abs = Math.abs(value);
  if (abs >= 1e12) return `$${(value / 1e12).toFixed(1)}T`;
  if (abs >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `$${(value / 1e3).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
}

export function formatRatio(value: number | null | undefined): string {
  if (value == null || !isFinite(value)) return "\u2014";
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return `${value.toFixed(1)}x`;
}

export function formatPct(value: number | null | undefined): string {
  if (value == null || !isFinite(value)) return "\u2014";
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

export function formatMargin(value: number | null | undefined): string {
  if (value == null || !isFinite(value)) return "\u2014";
  return `${(value * 100).toFixed(0)}%`;
}

export function logTickFormatter(value: number): string {
  if (value >= 1e12) return `$${(value / 1e12).toFixed(0)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(0)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(0)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

// ---------------------------------------------------------------------------
// Heatmap color helpers
// ---------------------------------------------------------------------------

export function getHeatmapColor(change: number | null): string {
  if (change == null) return "#e8e8e8";
  if (change >= 50) return "#166534";
  if (change >= 20) return "#15803d";
  if (change >= 10) return "#22c55e";
  if (change >= 5) return "#4ade80";
  if (change >= 0) return "#bbf7d0";
  if (change >= -5) return "#fecaca";
  if (change >= -10) return "#f87171";
  if (change >= -20) return "#dc2626";
  return "#991b1b";
}

export function getHeatmapTextColor(change: number | null): string {
  if (change == null) return "#999999";
  if (change >= 20 || change <= -20) return "#ffffff";
  return "#111111";
}

export function abbreviate(name: string, maxLen: number = 6): string {
  if (name.length <= maxLen) return name;
  const words = name.split(/[\s-]+/);
  if (words.length > 1) {
    return words.map((w) => w[0]).join("").toUpperCase().slice(0, maxLen);
  }
  return name.slice(0, maxLen);
}

// ---------------------------------------------------------------------------
// Tooltip style (WSJ — no border-radius)
// ---------------------------------------------------------------------------

export const tooltipStyle: React.CSSProperties = {
  backgroundColor: "#ffffff",
  border: "1px solid #d4d4d4",
  borderRadius: 0,
  padding: "10px 14px",
  fontSize: "13px",
  color: "#333333",
  boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
};

// ---------------------------------------------------------------------------
// Category color map (for scatter chart series)
// ---------------------------------------------------------------------------

export const categoryColorMap: Record<string, string> = {
  DeFi: "#3b82f6",
  Stablecoins: "#10b981",
  Exchanges: "#8b5cf6",
  Blockchains: "#f59e0b",
  Consumer: "#ef4444",
  DePIN: "#ec4899",
  Infrastructure: "#6366f1",
  Other: "#94a3b8",
};

export function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}
