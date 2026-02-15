// ============================================================
// Shared category classification system
// ============================================================

// ---------------------------------------------------------------------------
// Category → Group mapping (8 top-level groups)
// ---------------------------------------------------------------------------

export const CATEGORY_GROUP: Record<string, string> = {
  // DeFi
  DeFi: "DeFi",
  Dexes: "DeFi",
  Dexs: "DeFi", // actual DefiLlama API spelling
  DEX: "DeFi",
  Lending: "DeFi",
  Yield: "DeFi",
  "Yield Aggregator": "DeFi",
  "Liquid Staking": "DeFi",
  Derivatives: "DeFi",
  Perpetuals: "DeFi",
  Bridge: "DeFi",
  CDP: "DeFi",
  "CDP Manager": "DeFi",
  Options: "DeFi",
  "Options Vault": "DeFi",
  Insurance: "DeFi",
  Liquidations: "DeFi",
  "Leveraged Farming": "DeFi",
  "DEX Aggregator": "DeFi",
  Synthetics: "DeFi",
  Indexes: "DeFi",
  "Reserve Currency": "DeFi",
  "Algo-Stables": "DeFi",
  "NFT Fi": "DeFi",
  "Liquid Restaking": "DeFi",
  Restaking: "DeFi",
  RWA: "DeFi",
  MEV: "DeFi",
  "Liquidity Manager": "DeFi",
  "Liquidity manager": "DeFi", // case variant from API
  Farm: "DeFi",
  "Leveraged Yield": "DeFi",
  "Uncollateralized Lending": "DeFi",
  "Flash Loans": "DeFi",
  AMM: "DeFi",
  "Margin Trading": "DeFi",
  "Borrowing Lending": "DeFi",
  SoFi: "DeFi",
  "Structured Products": "DeFi",
  "Staking Pool": "DeFi",
  "Cross Chain": "DeFi",
  "Decentralized Stablecoin": "DeFi",
  "Prediction Market": "DeFi",
  "Leveraged Lending": "DeFi",
  "NFT Lending": "DeFi",
  Staking: "DeFi",
  "Liquid Staking Governance": "DeFi",
  "Basis Trading": "DeFi",
  "Leveraged Staking": "DeFi",
  "Concentrated Liquidity Manager": "DeFi",

  // Stablecoins
  Stablecoins: "Stablecoins",
  Stablecoin: "Stablecoins",

  // Exchanges
  Exchanges: "Exchanges",
  CEX: "Exchanges",

  // Blockchains
  Blockchains: "Blockchains",
  Chain: "Blockchains",
  EVM: "Blockchains",
  "EVM Compatible": "Blockchains",
  Rollup: "Blockchains",
  Parachain: "Blockchains",
  Cosmos: "Blockchains",
  Sidechain: "Blockchains",
  Subnet: "Blockchains",
  L1: "Blockchains",
  L2: "Blockchains",
  Blockchain: "Blockchains",
  "Modular Blockchain": "Blockchains",
  "Bitcoin Sidechain": "Blockchains",
  "Optimistic Rollup": "Blockchains",
  "ZK Rollup": "Blockchains",
  Validium: "Blockchains",
  DA: "Blockchains",
  Appchain: "Blockchains",
  "Move VM": "Blockchains",

  // Consumer
  Consumer: "Consumer",
  NFT: "Consumer",
  "NFT Marketplace": "Consumer",
  Gaming: "Consumer",
  Social: "Consumer",
  Launchpad: "Consumer",
  SocialFi: "Consumer",
  "Fan Token": "Consumer",
  Gambling: "Consumer",
  Identity: "Consumer",
  Music: "Consumer",
  Metaverse: "Consumer",
  "Play-To-Earn": "Consumer",
  "Move-To-Earn": "Consumer",
  Creator: "Consumer",
  Wallet: "Consumer",
  Payment: "Consumer",
  Payments: "Consumer",
  Meme: "Consumer",

  // DePIN
  DePIN: "DePIN",
  Compute: "DePIN",
  Storage: "DePIN",
  IoT: "DePIN",
  DeWi: "DePIN",
  AI: "DePIN",
  GPU: "DePIN",

  // Infrastructure
  Middleware: "Infrastructure",
  Oracle: "Infrastructure",
  Data: "Infrastructure",
  Infrastructure: "Infrastructure",
  Interoperability: "Infrastructure",
  Privacy: "Infrastructure",
  Automation: "Infrastructure",
  Relayer: "Infrastructure",
  RPC: "Infrastructure",
  API: "Infrastructure",
  Analytics: "Infrastructure",
  Indexer: "Infrastructure",

  // Other
  Other: "Other",
};

// ---------------------------------------------------------------------------
// Protocol slug → category overrides for protocols with null categories
// Many top fee-generating protocols on DefiLlama have null categories.
// ---------------------------------------------------------------------------

export const PROTOCOL_CATEGORY_OVERRIDES: Record<string, string> = {
  // DEXes / AMMs
  "pancakeswap": "Dexs",
  "pancakeswap-amm": "Dexs",
  "pancakeswap-amm-v3": "Dexs",
  "raydium": "Dexs",
  "raydium-amm": "Dexs",
  "raydium-cpmm": "Dexs",
  "orca": "Dexs",
  "trader-joe": "Dexs",
  "trader-joe-v2.1": "Dexs",
  "sushiswap": "Dexs",
  "camelot": "Dexs",
  "camelot-v3": "Dexs",
  "velodrome": "Dexs",
  "aerodrome": "Dexs",
  "thena": "Dexs",
  "balancer": "Dexs",
  "balancer-v2": "Dexs",
  "jupiter-aggregator": "DEX Aggregator",
  "1inch-network": "DEX Aggregator",
  "paraswap": "DEX Aggregator",
  "0x-protocol": "DEX Aggregator",
  "dodo": "Dexs",
  "maverick-protocol": "Dexs",
  "ambient-finance": "Dexs",
  "meteora": "Dexs",

  // Perps / Derivatives
  "hyperliquid": "Perpetuals",
  "gmx": "Perpetuals",
  "gmx-v2": "Perpetuals",
  "dydx": "Perpetuals",
  "dydx-v4": "Perpetuals",
  "drift-protocol": "Perpetuals",
  "jupiter-perpetual-exchange": "Perpetuals",
  "vertex-protocol": "Perpetuals",
  "kwenta": "Perpetuals",
  "gains-network": "Perpetuals",
  "synthetix": "Derivatives",
  "polymarket": "Prediction Market",
  "azuro": "Prediction Market",

  // Wallets
  "metamask": "Wallet",
  "metamask-swap": "Wallet",
  "phantom": "Wallet",
  "phantom-swap": "Wallet",
  "rabby-swap": "Wallet",
  "coinbase-wallet": "Wallet",
  "trust-wallet-swap": "Wallet",

  // Liquid Staking / MEV
  "jito": "MEV",
  "jito-tips": "MEV",
  "lido": "Liquid Staking",
  "rocket-pool": "Liquid Staking",
  "eigenlayer": "Restaking",
  "eigenpie": "Liquid Restaking",
  "marinade-finance": "Liquid Staking",
  "coinbase-wrapped-staked-eth": "Liquid Staking",

  // Lending
  "aave": "Lending",
  "aave-v2": "Lending",
  "aave-v3": "Lending",
  "compound": "Lending",
  "compound-v3": "Lending",
  "morpho": "Lending",
  "morpho-blue": "Lending",
  "spark": "Lending",
  "venus": "Lending",
  "benqi-lending": "Lending",
  "kamino-lending": "Lending",

  // Stablecoins / CDP
  "maker": "CDP",
  "makerdao": "CDP",
  "sky-lending": "CDP",
  "tether": "Stablecoins",
  "circle": "Stablecoins",
  "dai": "Stablecoins",
  "ethena": "Stablecoins",
  "frax": "Stablecoins",
  "rai": "CDP",

  // Bridges
  "across-protocol": "Bridge",
  "stargate": "Bridge",
  "wormhole": "Bridge",
  "layerzero": "Bridge",
  "hop-protocol": "Bridge",
  "synapse": "Bridge",

  // Consumer / Launchpads
  "pump.fun": "Launchpad",
  "pumpfun": "Launchpad",
  "friend.tech": "SocialFi",
  "friendtech": "SocialFi",
  "opensea": "NFT Marketplace",
  "blur": "NFT Marketplace",
  "magic-eden": "NFT Marketplace",
  "rarible": "NFT Marketplace",
  "x2y2": "NFT Marketplace",
  "moonwell": "Lending",
  "farcaster": "SocialFi",
  "lens-protocol": "SocialFi",
  "stepn": "Move-To-Earn",
  "axie-infinity": "Gaming",

  // Infrastructure / Oracles
  "chainlink": "Oracle",
  "pyth-network": "Oracle",
  "the-graph": "Indexer",
  "filecoin": "Storage",
  "arweave": "Storage",
  "render": "Compute",
  "akash-network": "Compute",
  "helium": "DeWi",
  "hivemapper": "DePIN",

  // Chains (parent protocols sometimes have null category)
  "ethereum": "Chain",
  "bitcoin": "Chain",
  "solana": "Chain",
  "avalanche": "Chain",
  "polygon": "Chain",
  "arbitrum": "Chain",
  "optimism": "Chain",
  "base": "Chain",
  "bnb-chain": "Chain",
  "bsc": "Chain",
  "tron": "Chain",
  "fantom": "Chain",
  "sui": "Chain",
  "aptos": "Chain",
  "near": "Chain",
  "sei": "Chain",
  "mantle": "Chain",
  "scroll": "Chain",
  "linea": "Chain",
  "zksync-era": "Chain",
  "starknet": "Chain",
  "blast": "Chain",
  "mode": "Chain",
  "manta-pacific": "Chain",
  "merlin-chain": "Chain",
  "celo": "Chain",
  "gnosis": "Chain",
  "moonbeam": "Chain",
  "cronos": "Chain",
  "kava": "Chain",
  "hedera": "Chain",
  "cardano": "Chain",
  "polkadot": "Chain",
  "cosmos-hub": "Chain",
  "injective": "Chain",
  "osmosis": "Chain",
  "ton": "Chain",
};

// ---------------------------------------------------------------------------
// Category → Color mapping (WSJ-style)
// ---------------------------------------------------------------------------

export const GROUP_COLORS: Record<string, string> = {
  DeFi: "#3b82f6",
  Stablecoins: "#10b981",
  Exchanges: "#8b5cf6",
  Blockchains: "#f59e0b",
  Consumer: "#ef4444",
  DePIN: "#ec4899",
  Infrastructure: "#6366f1",
  Other: "#94a3b8",
};

export const CATEGORY_COLORS: Record<string, string> = (() => {
  // Generate from CATEGORY_GROUP → GROUP_COLORS mapping
  const colors: Record<string, string> = {};
  for (const [cat, group] of Object.entries(CATEGORY_GROUP)) {
    colors[cat] = GROUP_COLORS[group] || "#94a3b8";
  }
  return colors;
})();

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------

// Case-insensitive lookup built from CATEGORY_GROUP
const CATEGORY_GROUP_CI = new Map<string, string>();
for (const [k, v] of Object.entries(CATEGORY_GROUP)) {
  CATEGORY_GROUP_CI.set(k.toLowerCase(), v);
}

/**
 * Get the top-level group for a raw category string.
 * Optionally pass a slug to check PROTOCOL_CATEGORY_OVERRIDES.
 */
export function getCategoryGroup(category: string, slug?: string): string {
  // 1. Direct lookup
  const direct = CATEGORY_GROUP[category];
  if (direct) return direct;

  // 2. Case-insensitive lookup
  const ci = CATEGORY_GROUP_CI.get(category.toLowerCase());
  if (ci) return ci;

  // 3. Slug-based override (for protocols with null/Other category)
  if (slug) {
    const override = PROTOCOL_CATEGORY_OVERRIDES[slug.toLowerCase()];
    if (override) {
      const overrideGroup = CATEGORY_GROUP[override];
      if (overrideGroup) return overrideGroup;
    }
  }

  return "Other";
}

export function getCategoryColor(category: string, slug?: string): string {
  const group = getCategoryGroup(category, slug);
  return GROUP_COLORS[group] || "#94a3b8";
}

// CoinGecko category keywords → group mapping
const CG_CATEGORY_KEYWORDS: [RegExp, string, string][] = [
  [/\b(layer-1|smart-contract|proof-of-work|proof-of-stake)\b/i, "Blockchains", "L1"],
  [/\b(layer-2|rollup|optimistic|zk-rollup|scaling)\b/i, "Blockchains", "L2"],
  [/\b(decentral.*(exchange|swap)|dex|amm)\b/i, "DeFi", "Dexes"],
  [/\b(lend|borrow)\b/i, "DeFi", "Lending"],
  [/\b(liquid.staking)\b/i, "DeFi", "Liquid Staking"],
  [/\b(restaking)\b/i, "DeFi", "Restaking"],
  [/\b(yield|farm)\b/i, "DeFi", "Yield"],
  [/\b(deriv|perp|future|option)\b/i, "DeFi", "Derivatives"],
  [/\b(bridge|cross.chain|interop)\b/i, "DeFi", "Bridge"],
  [/\b(stablecoin)\b/i, "Stablecoins", "Stablecoins"],
  [/\b(nft|collectible)\b/i, "Consumer", "NFT"],
  [/\b(gaming|game|play.to.earn|metaverse)\b/i, "Consumer", "Gaming"],
  [/\b(social|fan.token)\b/i, "Consumer", "Social"],
  [/\b(predict|gambl|bet)\b/i, "Consumer", "Prediction Market"],
  [/\b(oracle|data)\b/i, "Infrastructure", "Oracle"],
  [/\b(storage|file)\b/i, "DePIN", "Storage"],
  [/\b(compute|gpu|render)\b/i, "DePIN", "Compute"],
  [/\b(iot|wireless|depin)\b/i, "DePIN", "DePIN"],
  [/\b(privacy|mixer)\b/i, "Infrastructure", "Privacy"],
  [/\b(exchange|cex)\b/i, "Exchanges", "CEX"],
  [/\b(wallet|payment)\b/i, "Consumer", "Wallet"],
  [/\b(meme)\b/i, "Consumer", "Meme"],
  [/\b(governance|dao)\b/i, "DeFi", "DeFi"],
  [/\b(insurance)\b/i, "DeFi", "Insurance"],
  [/\b(identity|did)\b/i, "Consumer", "Identity"],
];

// Name-based keyword heuristics as last resort
const NAME_KEYWORDS: [RegExp, string, string][] = [
  [/swap|dex|exchange/i, "DeFi", "Dexes"],
  [/lend|borrow|credit/i, "DeFi", "Lending"],
  [/stake|staking/i, "DeFi", "Liquid Staking"],
  [/bridge/i, "DeFi", "Bridge"],
  [/chain|network|protocol/i, "Blockchains", "L1"],
  [/nft|art|collect/i, "Consumer", "NFT"],
  [/game|play|quest/i, "Consumer", "Gaming"],
  [/pay|wallet/i, "Consumer", "Wallet"],
  [/stable/i, "Stablecoins", "Stablecoins"],
  [/oracle|feed/i, "Infrastructure", "Oracle"],
  [/render|compute|gpu/i, "DePIN", "Compute"],
  [/storage|file/i, "DePIN", "Storage"],
];

/**
 * Auto-categorize a token/protocol using available signals.
 *
 * Fallback chain:
 * 1. DefiLlama category (via CATEGORY_GROUP)
 * 2. CoinGecko categories (keyword matching)
 * 3. Name-based heuristics
 * 4. "Other" / "Uncategorized"
 */
export function categorizeToken(
  defiLlamaCategory: string | null | undefined,
  coinGeckoCategories: string[] | null | undefined,
  name: string,
): { categoryGroup: string; subcategory: string } {
  // 1. DefiLlama category
  if (defiLlamaCategory && CATEGORY_GROUP[defiLlamaCategory]) {
    return {
      categoryGroup: CATEGORY_GROUP[defiLlamaCategory],
      subcategory: defiLlamaCategory,
    };
  }

  // 2. CoinGecko categories
  if (coinGeckoCategories?.length) {
    const joined = coinGeckoCategories.join(" ");
    for (const [pattern, group, sub] of CG_CATEGORY_KEYWORDS) {
      if (pattern.test(joined)) {
        return { categoryGroup: group, subcategory: sub };
      }
    }
  }

  // 3. Name heuristics
  for (const [pattern, group, sub] of NAME_KEYWORDS) {
    if (pattern.test(name)) {
      return { categoryGroup: group, subcategory: sub };
    }
  }

  // 4. Fallback
  return { categoryGroup: "Other", subcategory: "Other" };
}

// Ordered group list for consistent display
export const GROUP_ORDER = [
  "DeFi",
  "Blockchains",
  "Stablecoins",
  "Exchanges",
  "Consumer",
  "DePIN",
  "Infrastructure",
  "Other",
] as const;

export const FILTER_CATEGORIES = ["All", ...GROUP_ORDER] as const;
export type FilterCategory = (typeof FILTER_CATEGORIES)[number];
