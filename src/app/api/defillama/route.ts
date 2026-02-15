import { NextRequest, NextResponse } from "next/server";

// ----------------------------------------------------------------
// GET /api/defillama?type=overview|protocol|chain|revenue|holders[&name=<slug>]
//
// Proxies DefiLlama fee / revenue endpoints and returns a
// normalised JSON envelope.  Cached for 1 hour (ISR-style).
//
// When DEFILLAMA_API_KEY is set, routes through the Pro API at
// https://pro-api.llama.fi/{KEY}/... for higher rate limits and
// additional data.
// ----------------------------------------------------------------

export const revalidate = 3600; // 1 hour
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

interface ProtocolFeeRecord {
  name: string;
  slug: string;
  category: string | null;
  total24h: number | null;
  total7d: number | null;
  total30d: number | null;
  revenue24h: number | null;
  revenue7d: number | null;
  revenue30d: number | null;
  change1d: number | null;
  change7d: number | null;
  change1m: number | null;
  chains: string[];
}

interface OverviewResponse {
  type: "overview";
  totalFees24h: number;
  totalRevenue24h: number;
  totalFees7d: number;
  totalRevenue7d: number;
  totalFees30d: number;
  totalRevenue30d: number;
  totalDataChart: Array<{ date: number; fees: number; revenue: number }>;
  protocols: ProtocolFeeRecord[];
}

interface ProtocolDetailResponse {
  type: "protocol";
  name: string;
  slug: string;
  category: string | null;
  totalFees24h: number;
  totalRevenue24h: number;
  totalFees7d: number;
  totalRevenue7d: number;
  totalFees30d: number;
  totalRevenue30d: number;
  chains: string[];
  feeHistory: Array<{ date: number; fees: number; revenue: number }>;
}

interface ChainResponse {
  type: "chain";
  chain: string;
  totalFees24h: number;
  totalRevenue24h: number;
  totalFees7d: number;
  totalRevenue7d: number;
  totalFees30d: number;
  totalRevenue30d: number;
  totalDataChart: Array<{ date: number; fees: number; revenue: number }>;
  protocols: ProtocolFeeRecord[];
}

interface RevenueChartEntry {
  date: number;
  revenue: number;
}

interface RevenueResponse {
  type: "revenue";
  totalDataChart: RevenueChartEntry[];
  total24h: number;
  total7d: number;
  total30d: number;
}

interface HoldersRevenueChartEntry {
  date: number;
  holdersRevenue: number;
}

interface HoldersRevenueResponse {
  type: "holders";
  totalDataChart: HoldersRevenueChartEntry[];
  total24h: number;
  total7d: number;
  total30d: number;
}

// ---------- helpers ----------

async function fetchJSON(url: string): Promise<unknown> {
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) {
    throw new Error(`DefiLlama API error: ${res.status} ${res.statusText} for ${url}`);
  }
  return res.json();
}

function safeNum(v: unknown): number | null {
  if (v === undefined || v === null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function parseProtocol(p: Record<string, unknown>): ProtocolFeeRecord {
  return {
    name: String(p.name ?? ""),
    slug: String(p.slug ?? p.module ?? p.name ?? ""),
    category: p.category ? String(p.category) : null,
    total24h: safeNum(p.total24h),
    total7d: safeNum(p.total7d),
    total30d: safeNum(p.total30d),
    revenue24h: safeNum(p.revenue24h),
    revenue7d: safeNum(p.revenue7d),
    revenue30d: safeNum(p.revenue30d),
    change1d: safeNum(p.change_1d),
    change7d: safeNum(p.change_7d),
    change1m: safeNum(p.change_1m),
    chains: Array.isArray(p.chains) ? p.chains.map(String) : [],
  };
}

function parseTotalDataChart(
  raw: unknown,
): Array<{ date: number; fees: number; revenue: number }> {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry: unknown) => {
      // DefiLlama returns [[timestamp, value], ...] or [{date, ...}]
      if (Array.isArray(entry) && entry.length >= 2) {
        return {
          date: Number(entry[0]),
          fees: Number(entry[1]) || 0,
          revenue: 0,
        };
      }
      if (entry && typeof entry === "object") {
        const obj = entry as Record<string, unknown>;
        return {
          date: Number(obj.date ?? 0),
          fees: Number(obj.Fees ?? obj.fees ?? obj.dailyFees ?? 0),
          revenue: Number(obj.Revenue ?? obj.revenue ?? obj.dailyRevenue ?? 0),
        };
      }
      return null;
    })
    .filter(Boolean) as Array<{ date: number; fees: number; revenue: number }>;
}

function parseSingleValueChart(
  raw: unknown,
  valueKey: string,
): Array<{ date: number; value: number }> {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry: unknown) => {
      if (Array.isArray(entry) && entry.length >= 2) {
        return { date: Number(entry[0]), value: Number(entry[1]) || 0 };
      }
      if (entry && typeof entry === "object") {
        const obj = entry as Record<string, unknown>;
        return {
          date: Number(obj.date ?? 0),
          value: Number(obj[valueKey] ?? 0),
        };
      }
      return null;
    })
    .filter(Boolean) as Array<{ date: number; value: number }>;
}

// ---------- handlers by type ----------

async function handleOverview(): Promise<NextResponse<OverviewResponse>> {
  const base = getBaseUrl();
  const data = (await fetchJSON(
    `${base}/overview/fees?excludeTotalDataChart=false`,
  )) as Record<string, unknown>;

  const protocols: ProtocolFeeRecord[] = Array.isArray(data.protocols)
    ? (data.protocols as Record<string, unknown>[])
        .map(parseProtocol)
        .sort((a, b) => (b.total24h ?? 0) - (a.total24h ?? 0))
    : [];

  const totalDataChart = parseTotalDataChart(data.totalDataChart);

  const totalFees24h = safeNum(data.total24h) ?? protocols.reduce((s, p) => s + (p.total24h ?? 0), 0);
  const totalRevenue24h = safeNum(data.totalRevenue24h) ?? protocols.reduce((s, p) => s + (p.revenue24h ?? 0), 0);
  const totalFees7d = safeNum(data.total7d) ?? protocols.reduce((s, p) => s + (p.total7d ?? 0), 0);
  const totalRevenue7d = safeNum(data.totalRevenue7d) ?? protocols.reduce((s, p) => s + (p.revenue7d ?? 0), 0);
  const totalFees30d = safeNum(data.total30d) ?? protocols.reduce((s, p) => s + (p.total30d ?? 0), 0);
  const totalRevenue30d = safeNum(data.totalRevenue30d) ?? protocols.reduce((s, p) => s + (p.revenue30d ?? 0), 0);

  return NextResponse.json({
    type: "overview" as const,
    totalFees24h,
    totalRevenue24h,
    totalFees7d,
    totalRevenue7d,
    totalFees30d,
    totalRevenue30d,
    totalDataChart,
    protocols,
  });
}

async function handleProtocol(name: string): Promise<NextResponse<ProtocolDetailResponse>> {
  const base = getBaseUrl();
  const data = (await fetchJSON(
    `${base}/summary/fees/${encodeURIComponent(name)}`,
  )) as Record<string, unknown>;

  // Fee history comes from totalDataChart
  const feeHistory = parseTotalDataChart(data.totalDataChart);

  return NextResponse.json({
    type: "protocol" as const,
    name: String(data.name ?? name),
    slug: String(data.slug ?? data.module ?? name),
    category: data.category ? String(data.category) : null,
    totalFees24h: safeNum(data.total24h) ?? 0,
    totalRevenue24h: safeNum(data.totalRevenue24h) ?? 0,
    totalFees7d: safeNum(data.total7d) ?? 0,
    totalRevenue7d: safeNum(data.totalRevenue7d) ?? 0,
    totalFees30d: safeNum(data.total30d) ?? 0,
    totalRevenue30d: safeNum(data.totalRevenue30d) ?? 0,
    chains: Array.isArray(data.chains) ? data.chains.map(String) : [],
    feeHistory,
  });
}

async function handleChain(name: string): Promise<NextResponse<ChainResponse>> {
  const base = getBaseUrl();
  const data = (await fetchJSON(
    `${base}/overview/fees/${encodeURIComponent(name)}`,
  )) as Record<string, unknown>;

  const protocols: ProtocolFeeRecord[] = Array.isArray(data.protocols)
    ? (data.protocols as Record<string, unknown>[])
        .map(parseProtocol)
        .sort((a, b) => (b.total24h ?? 0) - (a.total24h ?? 0))
    : [];

  const totalDataChart = parseTotalDataChart(data.totalDataChart);

  return NextResponse.json({
    type: "chain" as const,
    chain: name,
    totalFees24h: safeNum(data.total24h) ?? 0,
    totalRevenue24h: safeNum(data.totalRevenue24h) ?? 0,
    totalFees7d: safeNum(data.total7d) ?? 0,
    totalRevenue7d: safeNum(data.totalRevenue7d) ?? 0,
    totalFees30d: safeNum(data.total30d) ?? 0,
    totalRevenue30d: safeNum(data.totalRevenue30d) ?? 0,
    totalDataChart,
    protocols,
  });
}

async function handleRevenue(): Promise<NextResponse<RevenueResponse>> {
  const base = getBaseUrl();
  const data = (await fetchJSON(
    `${base}/overview/fees?excludeTotalDataChart=false&dataType=dailyRevenue`,
  )) as Record<string, unknown>;

  const chartRaw = parseSingleValueChart(data.totalDataChart, "dailyRevenue");
  const totalDataChart: RevenueChartEntry[] = chartRaw.map((e) => ({
    date: e.date,
    revenue: e.value,
  }));

  return NextResponse.json({
    type: "revenue" as const,
    totalDataChart,
    total24h: safeNum(data.total24h) ?? 0,
    total7d: safeNum(data.total7d) ?? 0,
    total30d: safeNum(data.total30d) ?? 0,
  });
}

async function handleHolders(): Promise<NextResponse<HoldersRevenueResponse>> {
  const base = getBaseUrl();
  const data = (await fetchJSON(
    `${base}/overview/fees?excludeTotalDataChart=false&dataType=dailyHoldersRevenue`,
  )) as Record<string, unknown>;

  const chartRaw = parseSingleValueChart(data.totalDataChart, "dailyHoldersRevenue");
  const totalDataChart: HoldersRevenueChartEntry[] = chartRaw.map((e) => ({
    date: e.date,
    holdersRevenue: e.value,
  }));

  return NextResponse.json({
    type: "holders" as const,
    totalDataChart,
    total24h: safeNum(data.total24h) ?? 0,
    total7d: safeNum(data.total7d) ?? 0,
    total30d: safeNum(data.total30d) ?? 0,
  });
}

// ---------- route handler ----------

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = request.nextUrl;
    const type = searchParams.get("type") ?? "overview";
    const name = searchParams.get("name");

    switch (type) {
      case "overview":
        return await handleOverview();

      case "protocol": {
        if (!name) {
          return NextResponse.json(
            { error: "Missing required query parameter: name" },
            { status: 400 },
          );
        }
        return await handleProtocol(name);
      }

      case "chain": {
        if (!name) {
          return NextResponse.json(
            { error: "Missing required query parameter: name" },
            { status: 400 },
          );
        }
        return await handleChain(name);
      }

      case "revenue":
        return await handleRevenue();

      case "holders":
        return await handleHolders();

      default:
        return NextResponse.json(
          { error: `Invalid type "${type}". Must be one of: overview, protocol, chain, revenue, holders` },
          { status: 400 },
        );
    }
  } catch (err) {
    console.error("[/api/defillama] Error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json(
      { error: message },
      { status: 502 },
    );
  }
}
