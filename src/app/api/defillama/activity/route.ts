import { NextResponse } from "next/server";

// ----------------------------------------------------------------
// GET /api/defillama/activity
//
// Fetches on-chain user activity data from DefiLlama, combining
// DEX volume and fee-generating activity into a single response.
// Cached for 1 hour.
//
// When DEFILLAMA_API_KEY is set, routes through the Pro API at
// https://pro-api.llama.fi/{KEY}/... for higher rate limits and
// additional data.
// ----------------------------------------------------------------

export const dynamic = "force-dynamic";

// ---------- Pro API helper ----------

function getBaseUrl(): string {
  const key = process.env.DEFILLAMA_API_KEY;
  if (key) {
    return `https://pro-api.llama.fi/${key}/api`;
  }
  return "https://api.llama.fi";
}

// ---------- response types ----------

interface TopProtocolByUsers {
  name: string;
  category: string;
  volume24h: number;
  change7d: number | null;
}

interface DataChartEntry {
  date: number;
  dexVolume: number;
  feeVolume: number;
}

interface ActivityResponse {
  dailyActiveProtocols: number;
  dexVolume24h: number;
  dexVolume7d: number;
  totalDataChart: DataChartEntry[];
  topProtocolsByUsers: TopProtocolByUsers[];
  fetchedAt: string;
}

// ---------- helpers ----------

async function fetchJSON(url: string): Promise<unknown> {
  // Use no-store: the fees overview response (~23MB) exceeds Next.js's 2MB
  // data cache limit — attempting to cache it produces a warning every request.
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(
      `DefiLlama API error: ${res.status} ${res.statusText} for ${url}`,
    );
  }
  return res.json();
}

function safeNum(v: unknown): number {
  if (v === undefined || v === null || v === "") return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function safeNumOrNull(v: unknown): number | null {
  if (v === undefined || v === null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/**
 * Parse totalDataChart from DefiLlama overview responses.
 * Returns a Map<timestamp, value> for easy merging.
 */
function parseChartToMap(raw: unknown): Map<number, number> {
  const map = new Map<number, number>();
  if (!Array.isArray(raw)) return map;

  for (const entry of raw) {
    if (Array.isArray(entry) && entry.length >= 2) {
      const ts = Number(entry[0]);
      const val = safeNum(entry[1]);
      if (ts > 0) map.set(ts, val);
    } else if (entry && typeof entry === "object") {
      const obj = entry as Record<string, unknown>;
      const ts = Number(obj.date ?? 0);
      const val = safeNum(
        obj.value ?? obj.dailyVolume ?? obj.Fees ?? obj.fees ?? obj.dailyFees ?? 0,
      );
      if (ts > 0) map.set(ts, val);
    }
  }

  return map;
}

// ---------- route handler ----------

export async function GET(): Promise<NextResponse> {
  try {
    const base = getBaseUrl();

    // Fetch DEX volume and fees overview in parallel
    const [dexRaw, feesRaw] = await Promise.all([
      fetchJSON(`${base}/overview/dexs?excludeTotalDataChart=false`),
      fetchJSON(`${base}/overview/fees?excludeTotalDataChart=false`),
    ]);

    const dexData = dexRaw as Record<string, unknown>;
    const feesData = feesRaw as Record<string, unknown>;

    // -- DEX volume aggregates --
    const dexVolume24h = safeNum(dexData.total24h);
    const dexVolume7d = safeNum(dexData.total7d);

    // -- Count protocols with >0 fees in last 24h --
    const feeProtocols = Array.isArray(feesData.protocols)
      ? (feesData.protocols as Record<string, unknown>[])
      : [];
    const dailyActiveProtocols = feeProtocols.filter(
      (p) => safeNum(p.total24h) > 0,
    ).length;

    // -- Merge totalDataChart from both sources --
    const dexChartMap = parseChartToMap(dexData.totalDataChart);
    const feesChartMap = parseChartToMap(feesData.totalDataChart);

    // Collect all unique timestamps
    const allTimestamps = new Set([
      ...dexChartMap.keys(),
      ...feesChartMap.keys(),
    ]);
    const sortedTimestamps = [...allTimestamps].sort((a, b) => a - b);

    const totalDataChart: DataChartEntry[] = sortedTimestamps.map((ts) => ({
      date: ts,
      dexVolume: dexChartMap.get(ts) ?? 0,
      feeVolume: feesChartMap.get(ts) ?? 0,
    }));

    // -- Top protocols by 24h volume (from DEX data) --
    const dexProtocols = Array.isArray(dexData.protocols)
      ? (dexData.protocols as Record<string, unknown>[])
      : [];

    const topProtocolsByUsers: TopProtocolByUsers[] = dexProtocols
      .filter((p) => safeNum(p.total24h) > 0)
      .sort((a, b) => safeNum(b.total24h) - safeNum(a.total24h))
      .slice(0, 20)
      .map((p) => ({
        name: String(p.name ?? p.displayName ?? ""),
        category: String(p.category ?? "Other"),
        volume24h: safeNum(p.total24h),
        change7d: safeNumOrNull(p.change_7d),
      }));

    const body: ActivityResponse = {
      dailyActiveProtocols,
      dexVolume24h,
      dexVolume7d,
      totalDataChart,
      topProtocolsByUsers,
      fetchedAt: new Date().toISOString(),
    };

    return NextResponse.json(body);
  } catch (err) {
    console.error("[/api/defillama/activity] Error:", err);
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
