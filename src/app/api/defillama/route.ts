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

// force-dynamic: skip ISR caching — the overview response (~23MB) exceeds
// Next.js's 2MB data-cache limit and would otherwise log a warning every request.
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
  displayName: string;
  slug: string;
  category: string | null;
  logo: string | null;
  defillamaId: string | null;
  parentProtocol: string | null;
  // Fees (from default overview call — what users pay)
  total24h: number | null;
  total7d: number | null;
  total30d: number | null;
  totalAllTime: number | null;
  total1y: number | null;
  average1y: number | null;
  // Revenue (from dataType=dailyRevenue call — what protocol keeps)
  revenue24h: number | null;
  revenue7d: number | null;
  revenue30d: number | null;
  // Holders revenue (from dataType=dailyHoldersRevenue — buybacks/burns/staking)
  holdersRevenue24h: number | null;
  // Derived
  margin: number | null;
  // Changes
  change1d: number | null;
  change7d: number | null;
  change1m: number | null;
  change7dover7d: number | null;
  change30dover30d: number | null;
  chains: string[];
  doublecounted: boolean;
  methodology: Record<string, string> | null;
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
  // Use no-store: the route is force-dynamic so per-fetch caching adds no value,
  // and the overview response (~23MB) exceeds Next.js's 2MB data cache limit.
  const res = await fetch(url, { cache: "no-store" });
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

/** Parse a protocol from the fees overview response (default dataType). */
function parseFeeProtocol(p: Record<string, unknown>): ProtocolFeeRecord {
  const methodology =
    p.methodology && typeof p.methodology === "object" && !Array.isArray(p.methodology)
      ? Object.fromEntries(
          Object.entries(p.methodology as Record<string, unknown>).map(([k, v]) => [k, String(v ?? "")])
        )
      : null;

  return {
    name: String(p.name ?? ""),
    displayName: String(p.displayName ?? p.name ?? ""),
    slug: String(p.slug ?? p.module ?? p.name ?? ""),
    category: p.category ? String(p.category) : null,
    logo: p.logo ? String(p.logo) : null,
    defillamaId: p.defillamaId != null ? String(p.defillamaId) : (p.id != null ? String(p.id) : null),
    parentProtocol: p.parentProtocol ? String(p.parentProtocol) : null,
    total24h: safeNum(p.total24h),
    total7d: safeNum(p.total7d),
    total30d: safeNum(p.total30d),
    totalAllTime: safeNum(p.totalAllTime),
    total1y: safeNum(p.total1y),
    average1y: safeNum(p.average1y),
    // Revenue and holders filled in later by merge
    revenue24h: null,
    revenue7d: null,
    revenue30d: null,
    holdersRevenue24h: null,
    margin: null,
    change1d: safeNum(p.change_1d),
    change7d: safeNum(p.change_7d),
    change1m: safeNum(p.change_1m),
    change7dover7d: safeNum(p.change_7dover7d),
    change30dover30d: safeNum(p.change_30dover30d),
    chains: Array.isArray(p.chains) ? p.chains.map(String) : [],
    doublecounted: p.doublecounted === true,
    methodology,
  };
}

/** Lightweight parse for revenue / holdersRevenue overlay calls. */
function parseRevenueOverlay(p: Record<string, unknown>): {
  name: string;
  slug: string;
  defillamaId: string | null;
  total24h: number | null;
  total7d: number | null;
  total30d: number | null;
} {
  return {
    name: String(p.name ?? ""),
    slug: String(p.slug ?? p.module ?? p.name ?? ""),
    defillamaId: p.defillamaId != null ? String(p.defillamaId) : (p.id != null ? String(p.id) : null),
    total24h: safeNum(p.total24h),
    total7d: safeNum(p.total7d),
    total30d: safeNum(p.total30d),
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

  // 3 parallel calls: fees (default), revenue, holders revenue
  const [feesData, revenueData, holdersData] = await Promise.all([
    fetchJSON(`${base}/overview/fees?excludeTotalDataChart=false`) as Promise<Record<string, unknown>>,
    fetchJSON(`${base}/overview/fees?excludeTotalDataChart=true&dataType=dailyRevenue`)
      .catch(() => null) as Promise<Record<string, unknown> | null>,
    fetchJSON(`${base}/overview/fees?excludeTotalDataChart=true&dataType=dailyHoldersRevenue`)
      .catch(() => null) as Promise<Record<string, unknown> | null>,
  ]);

  // Parse fee protocols (primary dataset)
  const protocols: ProtocolFeeRecord[] = Array.isArray(feesData.protocols)
    ? (feesData.protocols as Record<string, unknown>[])
        .map(parseFeeProtocol)
        .sort((a, b) => (b.total24h ?? 0) - (a.total24h ?? 0))
    : [];

  // Build revenue overlay lookup (by defillamaId → name → slug)
  const revByKey = new Map<string, ReturnType<typeof parseRevenueOverlay>>();
  if (revenueData && Array.isArray(revenueData.protocols)) {
    for (const raw of revenueData.protocols as Record<string, unknown>[]) {
      const r = parseRevenueOverlay(raw);
      if (r.defillamaId) revByKey.set(`id:${r.defillamaId}`, r);
      if (r.name) revByKey.set(`name:${r.name.toLowerCase()}`, r);
      if (r.slug) revByKey.set(`slug:${r.slug.toLowerCase()}`, r);
    }
  }

  // Build holders revenue overlay lookup
  const holdByKey = new Map<string, ReturnType<typeof parseRevenueOverlay>>();
  if (holdersData && Array.isArray(holdersData.protocols)) {
    for (const raw of holdersData.protocols as Record<string, unknown>[]) {
      const h = parseRevenueOverlay(raw);
      if (h.defillamaId) holdByKey.set(`id:${h.defillamaId}`, h);
      if (h.name) holdByKey.set(`name:${h.name.toLowerCase()}`, h);
      if (h.slug) holdByKey.set(`slug:${h.slug.toLowerCase()}`, h);
    }
  }

  // Merge revenue + holders data into each fee protocol
  for (const p of protocols) {
    // Match revenue data
    const rev =
      (p.defillamaId ? revByKey.get(`id:${p.defillamaId}`) : undefined) ??
      revByKey.get(`name:${p.name.toLowerCase()}`) ??
      revByKey.get(`slug:${p.slug.toLowerCase()}`);
    if (rev) {
      p.revenue24h = rev.total24h;
      p.revenue7d = rev.total7d;
      p.revenue30d = rev.total30d;
    }

    // Match holders revenue data
    const hold =
      (p.defillamaId ? holdByKey.get(`id:${p.defillamaId}`) : undefined) ??
      holdByKey.get(`name:${p.name.toLowerCase()}`) ??
      holdByKey.get(`slug:${p.slug.toLowerCase()}`);
    if (hold) {
      p.holdersRevenue24h = hold.total24h;
    }

    // Compute margin (take rate)
    if (p.revenue24h != null && p.total24h != null && p.total24h > 0) {
      p.margin = Math.round((p.revenue24h / p.total24h) * 10000) / 10000;
    }
  }

  // Trim chart to last 730 days to keep payload manageable
  const fullChart = parseTotalDataChart(feesData.totalDataChart);
  const cutoff = Math.floor(Date.now() / 1000) - 730 * 86400;
  const totalDataChart = fullChart.filter((d) => d.date >= cutoff);

  const totalFees24h = safeNum(feesData.total24h) ?? protocols.reduce((s, p) => s + (p.total24h ?? 0), 0);
  const totalRevenue24h = safeNum(revenueData?.total24h) ?? protocols.reduce((s, p) => s + (p.revenue24h ?? 0), 0);
  const totalFees7d = safeNum(feesData.total7d) ?? protocols.reduce((s, p) => s + (p.total7d ?? 0), 0);
  const totalRevenue7d = safeNum(revenueData?.total7d) ?? protocols.reduce((s, p) => s + (p.revenue7d ?? 0), 0);
  const totalFees30d = safeNum(feesData.total30d) ?? protocols.reduce((s, p) => s + (p.total30d ?? 0), 0);
  const totalRevenue30d = safeNum(revenueData?.total30d) ?? protocols.reduce((s, p) => s + (p.revenue30d ?? 0), 0);

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
        .map(parseFeeProtocol)
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
