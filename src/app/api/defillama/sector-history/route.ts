import { NextResponse } from "next/server";
import { getCategoryGroup, CATEGORY_GROUP, GROUP_ORDER, PROTOCOL_CATEGORY_OVERRIDES } from "@/lib/categories";

// ----------------------------------------------------------------
// GET /api/defillama/sector-history
//
// Returns daily fee/revenue totals grouped by sector AND subcategory.
// Uses DefiLlama's totalDataChartBreakdown for per-protocol daily data,
// then aggregates server-side to keep the client payload small.
//
// Returns ALL available data (no cutoff) — client filters by time range.
//
// Response shape:
//   {
//     dates: number[],
//     fees: Record<sector, number[]>,
//     feesSub: Record<subcategory, number[]>,
//     revenue: Record<sector, number[]>,
//     revenueSub: Record<subcategory, number[]>,
//     revenueDates: number[],
//     protocolCount: number,
//     subcategories: Record<sector, string[]>
//   }
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

interface ProtocolInfo {
  sector: string;
  subcategory: string;
}

// Build protocol-name → { sector, subcategory } mapping
function buildProtocolMap(protocols: unknown[]): Map<string, ProtocolInfo> {
  const map = new Map<string, ProtocolInfo>();
  for (const p of protocols) {
    const proto = p as Record<string, unknown>;
    const name = String(proto.name ?? "").toLowerCase();
    const slug = String(proto.slug ?? proto.module ?? proto.name ?? "").toLowerCase();
    const rawCat = proto.category ? String(proto.category) : null;

    // Get subcategory (raw DeFi Llama category) and sector (our 8 groups)
    const override = PROTOCOL_CATEGORY_OVERRIDES[slug];
    const subcategory = override || rawCat || "Other";
    const sector = getCategoryGroup(subcategory, slug);

    const info: ProtocolInfo = { sector, subcategory };
    map.set(name, info);
    if (slug !== name) map.set(slug, info);
    if (proto.defillamaId != null) {
      map.set(String(proto.defillamaId), info);
    }
  }
  return map;
}

// Collect unique subcategories per sector
function getSubcategoriesPerSector(protocolMap: Map<string, ProtocolInfo>): Record<string, string[]> {
  const result: Record<string, Set<string>> = {};
  for (const s of GROUP_ORDER) result[s] = new Set();

  for (const info of protocolMap.values()) {
    if (result[info.sector]) {
      result[info.sector].add(info.subcategory);
    }
  }

  const out: Record<string, string[]> = {};
  for (const [sector, subs] of Object.entries(result)) {
    out[sector] = Array.from(subs).sort();
  }
  return out;
}

interface AggResult {
  dates: number[];
  sectors: Record<string, number[]>;
  subcats: Record<string, number[]>;
}

// Parse breakdown array and aggregate by both sector and subcategory
function aggregateBreakdown(
  breakdown: unknown[],
  protocolMap: Map<string, ProtocolInfo>,
): AggResult {
  const sectors: Record<string, number[]> = {};
  for (const s of GROUP_ORDER) sectors[s] = [];

  const subcatArrays: Record<string, number[]> = {};
  const dates: number[] = [];

  // Collect all known subcategories
  const knownSubs = new Set<string>();
  for (const info of protocolMap.values()) {
    knownSubs.add(info.subcategory);
  }
  for (const sub of knownSubs) {
    subcatArrays[sub] = [];
  }

  for (const entry of breakdown) {
    if (!Array.isArray(entry) || entry.length < 2) continue;
    const ts = Number(entry[0]);

    const dayData = entry[1] as Record<string, unknown> | null;
    if (!dayData || typeof dayData !== "object") continue;

    const daySectorSums: Record<string, number> = {};
    for (const s of GROUP_ORDER) daySectorSums[s] = 0;

    const daySubSums: Record<string, number> = {};

    for (const [protocolKey, val] of Object.entries(dayData)) {
      const v = Number(val);
      if (!Number.isFinite(v) || v <= 0) continue;
      const key = protocolKey.toLowerCase();
      const info = protocolMap.get(key);
      const sector = info?.sector ?? "Other";
      const sub = info?.subcategory ?? "Other";

      daySectorSums[sector] = (daySectorSums[sector] || 0) + v;
      daySubSums[sub] = (daySubSums[sub] || 0) + v;
    }

    dates.push(ts);
    for (const s of GROUP_ORDER) {
      sectors[s].push(daySectorSums[s] || 0);
    }
    for (const sub of knownSubs) {
      subcatArrays[sub].push(daySubSums[sub] || 0);
    }
  }

  // Remove subcategories that are all zeros (no data)
  const subcats: Record<string, number[]> = {};
  for (const [sub, arr] of Object.entries(subcatArrays)) {
    if (arr.some(v => v > 0)) {
      subcats[sub] = arr;
    }
  }

  return { dates, sectors, subcats };
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

    // Build protocol map from the protocols list
    const protocols = Array.isArray(feesRaw.protocols) ? feesRaw.protocols : [];
    const protocolMap = buildProtocolMap(protocols);

    // Also add protocols from revenue response if available
    if (revenueRaw && Array.isArray(revenueRaw.protocols)) {
      for (const p of revenueRaw.protocols) {
        const proto = p as Record<string, unknown>;
        const name = String(proto.name ?? "").toLowerCase();
        if (!protocolMap.has(name)) {
          const slug = String(proto.slug ?? proto.module ?? proto.name ?? "").toLowerCase();
          const rawCat = proto.category ? String(proto.category) : null;
          const override = PROTOCOL_CATEGORY_OVERRIDES[slug];
          const subcategory = override || rawCat || "Other";
          const sector = getCategoryGroup(subcategory, slug);
          const info: ProtocolInfo = { sector, subcategory };
          protocolMap.set(name, info);
          if (slug !== name) protocolMap.set(slug, info);
        }
      }
    }

    // Get subcategory list per sector
    const subcategories = getSubcategoriesPerSector(protocolMap);

    // Parse fee breakdown — NO cutoff, return all available data
    const feesBreakdown = Array.isArray(feesRaw.totalDataChartBreakdown)
      ? feesRaw.totalDataChartBreakdown
      : [];
    const feesAgg = aggregateBreakdown(feesBreakdown, protocolMap);

    // Parse revenue breakdown
    let revenueAgg: AggResult | null = null;
    if (revenueRaw && Array.isArray(revenueRaw.totalDataChartBreakdown)) {
      revenueAgg = aggregateBreakdown(revenueRaw.totalDataChartBreakdown, protocolMap);
    }

    return NextResponse.json({
      dates: feesAgg.dates,
      fees: feesAgg.sectors,
      feesSub: feesAgg.subcats,
      revenue: revenueAgg?.sectors ?? null,
      revenueSub: revenueAgg?.subcats ?? null,
      revenueDates: revenueAgg?.dates ?? null,
      protocolCount: protocols.length,
      sectorCount: protocolMap.size,
      subcategories,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[/api/defillama/sector-history] Error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
