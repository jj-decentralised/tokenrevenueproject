import { NextResponse } from "next/server";

// ----------------------------------------------------------------
// GET /api/defillama/etf
//
// Fetches crypto ETF flow data from the DefiLlama Pro API.
// Returns total ETF AUM, net flows by period (daily, weekly,
// monthly), and per-ETF breakdown (BTC ETFs, ETH ETFs).
// Cached for 1 hour.
//
// This is a Pro-only endpoint.  When no DEFILLAMA_API_KEY is set,
// returns { source: "static", data: null } with a 200 status so
// callers can gracefully degrade.
// ----------------------------------------------------------------

export const revalidate = 3600; // 1 hour

// ---------- Pro API helper ----------

function getBaseUrl(): string {
  const key = process.env.DEFILLAMA_API_KEY;
  if (key) {
    return `https://pro-api.llama.fi/${key}`;
  }
  return "https://api.llama.fi";
}

// ---------- response types ----------

interface ETFProduct {
  name: string;
  ticker: string;
  aum: number;
  netFlow1d: number;
  netFlow7d: number;
  netFlow30d: number;
}

interface ETFCategoryBreakdown {
  category: string; // "BTC ETFs" | "ETH ETFs" | etc.
  totalAum: number;
  netFlow1d: number;
  netFlow7d: number;
  netFlow30d: number;
  products: ETFProduct[];
}

interface ETFFlowEntry {
  date: string;
  btcFlows: number;
  ethFlows: number;
  totalFlows: number;
}

interface ETFResponse {
  source: "pro";
  data: {
    totalAum: number;
    netFlowDaily: number;
    netFlowWeekly: number;
    netFlowMonthly: number;
    categories: ETFCategoryBreakdown[];
    flowHistory: ETFFlowEntry[];
    fetchedAt: string;
  };
}

interface ETFStaticResponse {
  source: "static";
  data: null;
}

// ---------- helpers ----------

async function fetchJSON(url: string): Promise<unknown> {
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) {
    throw new Error(
      `DefiLlama ETF API error: ${res.status} ${res.statusText} for ${url}`,
    );
  }
  return res.json();
}

function safeNum(v: unknown): number {
  if (v === undefined || v === null || v === "") return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function parseFlowHistory(
  raw: unknown,
  category: "btc" | "eth",
): Map<string, number> {
  const flowsByDate = new Map<string, number>();
  if (!Array.isArray(raw)) return flowsByDate;

  for (const entry of raw) {
    if (entry && typeof entry === "object") {
      const obj = entry as Record<string, unknown>;
      const ts = obj.date ?? obj.timestamp ?? obj.day;
      const flow = safeNum(
        obj.flow ?? obj.netFlow ?? obj.value ?? obj.totalFlow,
      );
      if (ts) {
        const dateStr =
          typeof ts === "number"
            ? new Date(ts * 1000).toISOString().slice(0, 10)
            : String(ts).slice(0, 10);
        flowsByDate.set(dateStr, flow);
      }
    }
  }

  return flowsByDate;
}

function parseProducts(raw: unknown): ETFProduct[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item: unknown) => {
      if (!item || typeof item !== "object") return null;
      const obj = item as Record<string, unknown>;
      return {
        name: String(obj.name ?? obj.etfName ?? ""),
        ticker: String(obj.ticker ?? obj.symbol ?? ""),
        aum: safeNum(obj.aum ?? obj.totalAssets ?? obj.assets),
        netFlow1d: safeNum(obj.netFlow1d ?? obj.flow1d ?? obj.dailyFlow),
        netFlow7d: safeNum(obj.netFlow7d ?? obj.flow7d ?? obj.weeklyFlow),
        netFlow30d: safeNum(obj.netFlow30d ?? obj.flow30d ?? obj.monthlyFlow),
      };
    })
    .filter(Boolean) as ETFProduct[];
}

function buildCategoryBreakdown(
  data: Record<string, unknown>,
  category: string,
): ETFCategoryBreakdown {
  const products = parseProducts(data.products ?? data.etfs ?? data.funds);
  const totalAum =
    safeNum(data.totalAum ?? data.aum ?? data.totalAssets) ||
    products.reduce((sum, p) => sum + p.aum, 0);

  return {
    category,
    totalAum,
    netFlow1d:
      safeNum(data.netFlow1d ?? data.dailyFlow) ||
      products.reduce((sum, p) => sum + p.netFlow1d, 0),
    netFlow7d:
      safeNum(data.netFlow7d ?? data.weeklyFlow) ||
      products.reduce((sum, p) => sum + p.netFlow7d, 0),
    netFlow30d:
      safeNum(data.netFlow30d ?? data.monthlyFlow) ||
      products.reduce((sum, p) => sum + p.netFlow30d, 0),
    products,
  };
}

// ---------- route handler ----------

export async function GET(): Promise<NextResponse> {
  // Pro-only: require an API key
  const apiKey = process.env.DEFILLAMA_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ source: "static", data: null } as ETFStaticResponse);
  }

  try {
    const base = getBaseUrl();

    // Fetch the ETF overview endpoint from Pro API
    const etfRaw = (await fetchJSON(`${base}/etfs/overview`)) as Record<
      string,
      unknown
    >;

    // The response may contain top-level data or separate BTC/ETH sections
    const categories: ETFCategoryBreakdown[] = [];

    // Try to extract BTC ETF data
    const btcSection = etfRaw.btc ?? etfRaw.bitcoin ?? etfRaw.btcEtfs;
    if (btcSection && typeof btcSection === "object") {
      categories.push(
        buildCategoryBreakdown(
          btcSection as Record<string, unknown>,
          "BTC ETFs",
        ),
      );
    }

    // Try to extract ETH ETF data
    const ethSection = etfRaw.eth ?? etfRaw.ethereum ?? etfRaw.ethEtfs;
    if (ethSection && typeof ethSection === "object") {
      categories.push(
        buildCategoryBreakdown(
          ethSection as Record<string, unknown>,
          "ETH ETFs",
        ),
      );
    }

    // If no category-level breakdown, treat the whole response as one
    if (categories.length === 0 && Array.isArray(etfRaw.data ?? etfRaw.etfs)) {
      categories.push(buildCategoryBreakdown(etfRaw, "All ETFs"));
    }

    // Aggregate totals across categories
    const totalAum = categories.reduce((s, c) => s + c.totalAum, 0);
    const netFlowDaily = categories.reduce((s, c) => s + c.netFlow1d, 0);
    const netFlowWeekly = categories.reduce((s, c) => s + c.netFlow7d, 0);
    const netFlowMonthly = categories.reduce((s, c) => s + c.netFlow30d, 0);

    // Build flow history timeline
    const btcFlowsByDate = parseFlowHistory(
      (btcSection as Record<string, unknown> | undefined)?.flows ??
        (btcSection as Record<string, unknown> | undefined)?.flowHistory ??
        etfRaw.btcFlows,
      "btc",
    );
    const ethFlowsByDate = parseFlowHistory(
      (ethSection as Record<string, unknown> | undefined)?.flows ??
        (ethSection as Record<string, unknown> | undefined)?.flowHistory ??
        etfRaw.ethFlows,
      "eth",
    );

    const allDates = new Set([
      ...btcFlowsByDate.keys(),
      ...ethFlowsByDate.keys(),
    ]);
    const sortedDates = [...allDates].sort();

    const flowHistory: ETFFlowEntry[] = sortedDates.map((date) => {
      const btcFlows = btcFlowsByDate.get(date) ?? 0;
      const ethFlows = ethFlowsByDate.get(date) ?? 0;
      return {
        date,
        btcFlows,
        ethFlows,
        totalFlows: btcFlows + ethFlows,
      };
    });

    const body: ETFResponse = {
      source: "pro",
      data: {
        totalAum,
        netFlowDaily,
        netFlowWeekly,
        netFlowMonthly,
        categories,
        flowHistory,
        fetchedAt: new Date().toISOString(),
      },
    };

    return NextResponse.json(body);
  } catch (err) {
    console.error("[/api/defillama/etf] Error:", err);
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
