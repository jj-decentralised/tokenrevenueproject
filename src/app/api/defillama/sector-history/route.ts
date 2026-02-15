import { NextResponse } from "next/server";
import { getCategoryGroup, GROUP_ORDER } from "@/lib/categories";

// ----------------------------------------------------------------
// GET /api/defillama/sector-history
//
// Returns daily fee/revenue totals grouped by sector (GROUP_ORDER).
// Uses DefiLlama's totalDataChartBreakdown for per-protocol daily data,
// then aggregates server-side to keep the client payload small.
//
// Response shape:
//   { dates: number[], fees: Record<sector, number[]>, revenue: Record<sector, number[]> }
//
// Cached for 1 hour.
// ----------------------------------------------------------------

export const revalidate = 3600;

function getBaseUrl(): string {
  const key = process.env.DEFILLAMA_API_KEY;
  if (key) return `https://pro-api.llama.fi/${key}/api`;
  return "https://api.llama.fi";
}

async function fetchJSON(url: string): Promise<unknown> {
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`DefiLlama ${res.status} for ${url}`);
  return res.json();
}

// Build a protocol-name → sector mapping from the overview protocols list
function buildSectorMap(protocols: unknown[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const p of protocols) {
    const proto = p as Record<string, unknown>;
    const name = String(proto.name ?? "").toLowerCase();
    const slug = String(proto.slug ?? proto.module ?? proto.name ?? "").toLowerCase();
    const cat = proto.category ? String(proto.category) : "Other";
    const sector = getCategoryGroup(cat, slug);
    map.set(name, sector);
    if (slug !== name) map.set(slug, sector);
    // Also index by defillamaId if present
    if (proto.defillamaId != null) {
      map.set(String(proto.defillamaId), sector);
    }
  }
  return map;
}

// Parse the breakdown array: each entry is [timestamp, { protocolName: value, ... }]
function aggregateBreakdown(
  breakdown: unknown[],
  sectorMap: Map<string, string>,
  cutoffTs: number,
): { dates: number[]; sectors: Record<string, number[]> } {
  const sectors: Record<string, number[]> = {};
  for (const s of GROUP_ORDER) sectors[s] = [];
  const dates: number[] = [];

  for (const entry of breakdown) {
    if (!Array.isArray(entry) || entry.length < 2) continue;
    const ts = Number(entry[0]);
    if (ts < cutoffTs) continue;

    const dayData = entry[1] as Record<string, unknown> | null;
    if (!dayData || typeof dayData !== "object") continue;

    const daySums: Record<string, number> = {};
    for (const s of GROUP_ORDER) daySums[s] = 0;

    for (const [protocolKey, val] of Object.entries(dayData)) {
      const v = Number(val);
      if (!Number.isFinite(v) || v <= 0) continue;
      const key = protocolKey.toLowerCase();
      const sector = sectorMap.get(key) ?? "Other";
      daySums[sector] = (daySums[sector] || 0) + v;
    }

    dates.push(ts);
    for (const s of GROUP_ORDER) {
      sectors[s].push(daySums[s] || 0);
    }
  }

  return { dates, sectors };
}

export async function GET(): Promise<NextResponse> {
  try {
    const base = getBaseUrl();

    // Fetch fees overview WITH breakdown (per-protocol daily data)
    // Also fetch revenue breakdown in parallel
    const [feesRaw, revenueRaw] = await Promise.all([
      fetchJSON(
        `${base}/overview/fees?excludeTotalDataChart=true&excludeTotalDataChartBreakdown=false`
      ) as Promise<Record<string, unknown>>,
      fetchJSON(
        `${base}/overview/fees?excludeTotalDataChart=true&excludeTotalDataChartBreakdown=false&dataType=dailyRevenue`
      ).catch(() => null) as Promise<Record<string, unknown> | null>,
    ]);

    // Build sector map from the protocols list
    const protocols = Array.isArray(feesRaw.protocols) ? feesRaw.protocols : [];
    const sectorMap = buildSectorMap(protocols);

    // Also add protocols from revenue response if available
    if (revenueRaw && Array.isArray(revenueRaw.protocols)) {
      const revMap = buildSectorMap(revenueRaw.protocols);
      for (const [k, v] of revMap) {
        if (!sectorMap.has(k)) sectorMap.set(k, v);
      }
    }

    // Cutoff: last 365 days
    const cutoffTs = Math.floor(Date.now() / 1000) - 365 * 86400;

    // Parse fee breakdown
    const feesBreakdown = Array.isArray(feesRaw.totalDataChartBreakdown)
      ? feesRaw.totalDataChartBreakdown
      : [];
    const feesAgg = aggregateBreakdown(feesBreakdown, sectorMap, cutoffTs);

    // Parse revenue breakdown
    let revenueAgg: { dates: number[]; sectors: Record<string, number[]> } | null = null;
    if (revenueRaw && Array.isArray(revenueRaw.totalDataChartBreakdown)) {
      revenueAgg = aggregateBreakdown(revenueRaw.totalDataChartBreakdown, sectorMap, cutoffTs);
    }

    return NextResponse.json({
      dates: feesAgg.dates,
      fees: feesAgg.sectors,
      revenue: revenueAgg?.sectors ?? null,
      revenueDates: revenueAgg?.dates ?? null,
      protocolCount: protocols.length,
      sectorCount: sectorMap.size,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[/api/defillama/sector-history] Error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
