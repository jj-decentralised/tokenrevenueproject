import { NextResponse } from "next/server";

// ----------------------------------------------------------------
// GET /api/tokenterminal/earnings
//
// Fetches earnings / margin data for 50+ key protocols from the
// TokenTerminal v2 API.  For each protocol, retrieves daily
// earnings, revenue, and fees metrics (90 days) and computes
// the margin (earnings / revenue).
//
// When TOKENTERMINAL_API_KEY is not set, returns a static
// fallback so the frontend can degrade gracefully.
//
// Requests are batched in groups of 5 with 150ms delay between
// batches to respect upstream rate limits.  Cached for 1 hour.
// ----------------------------------------------------------------

export const revalidate = 3600; // 1 hour

// ---------- constants ----------

const TOKENTERMINAL_BASE_URL = "https://api.tokenterminal.com/v2";

/**
 * Comprehensive list of TokenTerminal project IDs covering all major
 * sectors: L1 blockchains, L2 rollups, DeFi protocols, stablecoins,
 * infrastructure, and exchanges.
 */
const PROTOCOL_IDS: string[] = [
  // ---- Layer 1 Blockchains ----
  "ethereum",
  "solana",
  "tron",
  "bitcoin",
  "bnb-chain",
  "avalanche",
  "cardano",
  "polkadot",
  "near",
  "sui",
  "aptos",
  "fantom",
  "ton",
  "celestia",
  "sei",
  "injective",
  "cosmos",
  "algorand",
  "hedera",
  "flow",

  // ---- Layer 2 / Rollups ----
  "base",
  "arbitrum",
  "optimism",
  "polygon",
  "starknet",
  "zksync-era",
  "linea",
  "scroll",
  "mantle",
  "blast",
  "manta",
  "mode",

  // ---- DeFi — DEXs ----
  "uniswap",
  "pancakeswap",
  "raydium",
  "curve",
  "sushiswap",
  "trader-joe",
  "orca",
  "aerodrome",
  "velodrome",
  "camelot",
  "balancer",
  "thena",

  // ---- DeFi — Lending ----
  "aave",
  "compound",
  "maker",
  "morpho",
  "venus",
  "spark",
  "radiant",
  "benqi",
  "kamino",

  // ---- DeFi — Derivatives / Perps ----
  "hyperliquid",
  "jupiter",
  "gmx",
  "dydx",
  "synthetix",
  "vertex-protocol",
  "drift",
  "kwenta",
  "gains-network",

  // ---- DeFi — Liquid Staking ----
  "lido",
  "rocket-pool",
  "jito",
  "marinade-finance",
  "coinbase-staked-eth",
  "frax-ether",
  "stakewise",

  // ---- DeFi — Yield / Restaking ----
  "eigenlayer",
  "pendle",
  "convex-finance",
  "yearn-finance",
  "ethena",

  // ---- Stablecoins / Payments ----
  "tether",
  "circle",
  "sky",
  "frax",

  // ---- Infrastructure ----
  "chainlink",
  "the-graph",
  "filecoin",
  "arweave",
  "pyth-network",
  "layerzero",
  "wormhole",
  "across-protocol",

  // ---- NFT / Social ----
  "opensea",
  "blur",
  "friend-tech",
  "lens-protocol",

  // ---- Exchanges (CEX-adjacent) ----
  "1inch",
];

/** Human-readable names for protocol IDs. Maps to DefiLlama-compatible names. */
const PROTOCOL_NAMES: Record<string, string> = {
  // L1s
  ethereum: "Ethereum",
  solana: "Solana",
  tron: "TRON",
  bitcoin: "Bitcoin",
  "bnb-chain": "BSC",
  avalanche: "Avalanche",
  cardano: "Cardano",
  polkadot: "Polkadot",
  near: "NEAR",
  sui: "Sui",
  aptos: "Aptos",
  fantom: "Fantom",
  ton: "TON",
  celestia: "Celestia",
  sei: "Sei",
  injective: "Injective",
  cosmos: "Cosmos",
  algorand: "Algorand",
  hedera: "Hedera",
  flow: "Flow",

  // L2s
  base: "Base",
  arbitrum: "Arbitrum",
  optimism: "Optimism",
  polygon: "Polygon",
  starknet: "Starknet",
  "zksync-era": "zkSync Era",
  linea: "Linea",
  scroll: "Scroll",
  mantle: "Mantle",
  blast: "Blast",
  manta: "Manta",
  mode: "Mode",

  // DEXs
  uniswap: "Uniswap",
  pancakeswap: "PancakeSwap",
  raydium: "Raydium",
  curve: "Curve DEX",
  sushiswap: "SushiSwap",
  "trader-joe": "Trader Joe",
  orca: "Orca",
  aerodrome: "Aerodrome",
  velodrome: "Velodrome",
  camelot: "Camelot",
  balancer: "Balancer",
  thena: "Thena",

  // Lending
  aave: "Aave",
  compound: "Compound",
  maker: "Maker",
  morpho: "Morpho",
  venus: "Venus",
  spark: "Spark",
  radiant: "Radiant",
  benqi: "BENQI",
  kamino: "Kamino",

  // Derivatives
  hyperliquid: "Hyperliquid",
  jupiter: "Jupiter",
  gmx: "GMX",
  dydx: "dYdX",
  synthetix: "Synthetix",
  "vertex-protocol": "Vertex",
  drift: "Drift",
  kwenta: "Kwenta",
  "gains-network": "Gains Network",

  // Liquid Staking
  lido: "Lido",
  "rocket-pool": "Rocket Pool",
  jito: "Jito",
  "marinade-finance": "Marinade Finance",
  "coinbase-staked-eth": "Coinbase Wrapped Staked ETH",
  "frax-ether": "Frax Ether",
  stakewise: "StakeWise",

  // Yield / Restaking
  eigenlayer: "EigenLayer",
  pendle: "Pendle",
  "convex-finance": "Convex Finance",
  "yearn-finance": "Yearn Finance",
  ethena: "Ethena",

  // Stablecoins
  tether: "Tether",
  circle: "Circle",
  sky: "Sky",
  frax: "Frax",

  // Infrastructure
  chainlink: "Chainlink",
  "the-graph": "The Graph",
  filecoin: "Filecoin",
  arweave: "Arweave",
  "pyth-network": "Pyth",
  layerzero: "LayerZero",
  wormhole: "Wormhole",
  "across-protocol": "Across Protocol",

  // NFT / Social
  opensea: "OpenSea",
  blur: "Blur",
  "friend-tech": "Friend.tech",
  "lens-protocol": "Lens Protocol",

  // Exchanges
  "1inch": "1inch",
};

/**
 * Aliases: multiple names that should map to the same TokenTerminal ID.
 * Used for cross-source matching (DefiLlama name -> TT ID).
 */
const NAME_ALIASES: Record<string, string> = {
  // DefiLlama name variants -> TokenTerminal ID
  bsc: "bnb-chain",
  "binance smart chain": "bnb-chain",
  "bnb chain": "bnb-chain",
  "near protocol": "near",
  "the open network": "ton",
  "zksync": "zksync-era",
  "zksync era": "zksync-era",
  "curve finance": "curve",
  "curve dex": "curve",
  makerdao: "maker",
  "dydx v4": "dydx",
  "dydx v3": "dydx",
  "gains": "gains-network",
  "rocket pool": "rocket-pool",
  "marinade": "marinade-finance",
  "cbeth": "coinbase-staked-eth",
  "frxeth": "frax-ether",
  "convex": "convex-finance",
  "yearn": "yearn-finance",
  "trader joe": "trader-joe",
  "the graph": "the-graph",
  "across": "across-protocol",
  "vertex": "vertex-protocol",
  "friend.tech": "friend-tech",
  "friendtech": "friend-tech",
  "lens": "lens-protocol",
  "pyth": "pyth-network",
  "pyth network": "pyth-network",
  "gains network": "gains-network",
};

const BATCH_SIZE = 5;
const RATE_LIMIT_DELAY_MS = 150;

// ---------- response types ----------

interface RevenueHistoryEntry {
  date: string;
  revenue: number;
  earnings: number;
  margin: number;
}

interface ProtocolEarnings {
  id: string;
  name: string;
  aliases: string[];
  latestRevenue: number;
  latestEarnings: number;
  margin: number;
  revenueHistory: RevenueHistoryEntry[];
}

interface EarningsResponse {
  source: "api" | "static";
  protocols: ProtocolEarnings[];
  fetchedAt: string;
}

// ---------- helpers ----------

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function safeNum(v: unknown): number {
  if (v === undefined || v === null || v === "") return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Compute margin as earnings / revenue, clamped to [-1, 1].
 * Returns 0 when revenue is zero to avoid division errors.
 */
function computeMargin(earnings: number, revenue: number): number {
  if (revenue === 0) return 0;
  const raw = earnings / revenue;
  return Math.max(-1, Math.min(1, Math.round(raw * 10000) / 10000));
}

/**
 * Build a list of name aliases for a protocol ID for cross-source matching.
 */
function getAliases(protocolId: string): string[] {
  const names = new Set<string>();
  names.add(protocolId);
  const displayName = PROTOCOL_NAMES[protocolId];
  if (displayName) names.add(displayName.toLowerCase());
  // Add reverse aliases
  for (const [alias, id] of Object.entries(NAME_ALIASES)) {
    if (id === protocolId) names.add(alias.toLowerCase());
  }
  return [...names];
}

// ---------- per-protocol fetcher ----------

async function fetchProtocolEarnings(
  protocolId: string,
  apiKey: string,
): Promise<ProtocolEarnings | null> {
  const url = new URL(
    `${TOKENTERMINAL_BASE_URL}/projects/${protocolId}/metrics`,
  );
  url.searchParams.set("metric_ids", "earnings,revenue,fees");
  url.searchParams.set("interval", "daily");
  url.searchParams.set("limit", "90");

  try {
    const res = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
      },
      next: { revalidate: 3600 },
    } as RequestInit);

    if (!res.ok) {
      // Silently skip protocols that aren't in TokenTerminal
      return null;
    }

    const json = await res.json();

    // TokenTerminal v2 returns { data: [...] } or a raw array
    const rawData: Record<string, unknown>[] = Array.isArray(json)
      ? json
      : Array.isArray(json?.data)
        ? json.data
        : [];

    if (rawData.length === 0) return null;

    // Build daily history sorted by date ascending
    const revenueHistory: RevenueHistoryEntry[] = rawData
      .map((entry) => {
        const dateStr = String(entry.timestamp ?? entry.date ?? "");
        const revenue = safeNum(entry.revenue);
        const earnings = safeNum(entry.earnings);
        return {
          date: dateStr,
          revenue,
          earnings,
          margin: computeMargin(earnings, revenue),
        };
      })
      .sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      );

    // Latest values come from the most recent entry
    const latest = revenueHistory[revenueHistory.length - 1];
    const latestRevenue = latest?.revenue ?? 0;
    const latestEarnings = latest?.earnings ?? 0;

    return {
      id: protocolId,
      name: PROTOCOL_NAMES[protocolId] ?? protocolId,
      aliases: getAliases(protocolId),
      latestRevenue,
      latestEarnings,
      margin: computeMargin(latestEarnings, latestRevenue),
      revenueHistory,
    };
  } catch {
    // Network errors etc. — silently skip
    return null;
  }
}

// ---------- route handler ----------

export async function GET(): Promise<NextResponse> {
  const apiKey = process.env.TOKENTERMINAL_API_KEY;

  // No API key — return static fallback
  if (!apiKey) {
    return NextResponse.json({
      source: "static" as const,
      protocols: [],
      fetchedAt: new Date().toISOString(),
    } satisfies EarningsResponse);
  }

  try {
    const protocols: ProtocolEarnings[] = [];

    // Fetch in batches to balance speed vs rate limits
    for (let i = 0; i < PROTOCOL_IDS.length; i += BATCH_SIZE) {
      if (i > 0) {
        await sleep(RATE_LIMIT_DELAY_MS);
      }

      const batch = PROTOCOL_IDS.slice(i, i + BATCH_SIZE);
      const results = await Promise.allSettled(
        batch.map((id) => fetchProtocolEarnings(id, apiKey)),
      );

      for (const result of results) {
        if (result.status === "fulfilled" && result.value) {
          protocols.push(result.value);
        }
      }
    }

    const body: EarningsResponse = {
      source: "api",
      protocols,
      fetchedAt: new Date().toISOString(),
    };

    return NextResponse.json(body);
  } catch (err) {
    console.error("[/api/tokenterminal/earnings] Error:", err);
    const message =
      err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
