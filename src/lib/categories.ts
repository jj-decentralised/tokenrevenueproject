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
  DEX: "DeFi",
  Lending: "DeFi",
  Yield: "DeFi",
  "Yield Aggregator": "DeFi",
  "Liquid Staking": "DeFi",
  Derivatives: "DeFi",
  Perpetuals: "DeFi",
  Bridge: "DeFi",
  CDP: "DeFi",
  Options: "DeFi",
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

  // Stablecoins
  Stablecoins: "Stablecoins",

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

  // Consumer
  Consumer: "Consumer",
  NFT: "Consumer",
  "NFT Marketplace": "Consumer",
  "NFT Lending": "Consumer",
  Gaming: "Consumer",
  Social: "Consumer",
  "Prediction Market": "Consumer",
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

  // DePIN
  DePIN: "DePIN",
  Compute: "DePIN",
  Storage: "DePIN",
  IoT: "DePIN",
  DeWi: "DePIN",

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

  // Other
  Other: "Other",
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

export const CATEGORY_COLORS: Record<string, string> = {
  // DeFi
  DeFi: "#3b82f6",
  Dexes: "#3b82f6",
  DEX: "#3b82f6",
  Lending: "#3b82f6",
  Yield: "#3b82f6",
  "Yield Aggregator": "#3b82f6",
  "Liquid Staking": "#3b82f6",
  Derivatives: "#3b82f6",
  Perpetuals: "#3b82f6",
  Bridge: "#3b82f6",
  CDP: "#3b82f6",
  Liquidations: "#3b82f6",
  "Leveraged Farming": "#3b82f6",
  Options: "#3b82f6",
  Insurance: "#3b82f6",
  "DEX Aggregator": "#3b82f6",
  Synthetics: "#3b82f6",
  Indexes: "#3b82f6",
  "Reserve Currency": "#3b82f6",
  "Algo-Stables": "#3b82f6",
  "NFT Fi": "#3b82f6",
  "Liquid Restaking": "#3b82f6",
  Restaking: "#3b82f6",
  RWA: "#3b82f6",
  MEV: "#3b82f6",
  "Liquidity Manager": "#3b82f6",
  Farm: "#3b82f6",
  "Leveraged Yield": "#3b82f6",
  "Uncollateralized Lending": "#3b82f6",
  "Flash Loans": "#3b82f6",
  AMM: "#3b82f6",
  "Margin Trading": "#3b82f6",
  "Borrowing Lending": "#3b82f6",
  SoFi: "#3b82f6",
  "Structured Products": "#3b82f6",
  "Staking Pool": "#3b82f6",
  "Cross Chain": "#3b82f6",
  "Decentralized Stablecoin": "#3b82f6",
  // Stablecoins
  Stablecoins: "#10b981",
  // Exchanges
  Exchanges: "#8b5cf6",
  CEX: "#8b5cf6",
  // Blockchains
  Blockchains: "#f59e0b",
  Chain: "#f59e0b",
  EVM: "#f59e0b",
  "EVM Compatible": "#f59e0b",
  Rollup: "#f59e0b",
  Parachain: "#f59e0b",
  Cosmos: "#f59e0b",
  Sidechain: "#f59e0b",
  Subnet: "#f59e0b",
  L1: "#f59e0b",
  L2: "#f59e0b",
  Blockchain: "#f59e0b",
  "Modular Blockchain": "#f59e0b",
  "Bitcoin Sidechain": "#f59e0b",
  "Optimistic Rollup": "#f59e0b",
  "ZK Rollup": "#f59e0b",
  Validium: "#f59e0b",
  DA: "#f59e0b",
  // Consumer
  Consumer: "#ef4444",
  "NFT Marketplace": "#ef4444",
  "NFT Lending": "#ef4444",
  Gaming: "#ef4444",
  Social: "#ef4444",
  "Prediction Market": "#ef4444",
  Launchpad: "#ef4444",
  SocialFi: "#ef4444",
  "Fan Token": "#ef4444",
  Gambling: "#ef4444",
  Identity: "#ef4444",
  Music: "#ef4444",
  Metaverse: "#ef4444",
  "Play-To-Earn": "#ef4444",
  "Move-To-Earn": "#ef4444",
  NFT: "#ef4444",
  Creator: "#ef4444",
  // DePIN
  DePIN: "#ec4899",
  Compute: "#ec4899",
  Storage: "#ec4899",
  IoT: "#ec4899",
  DeWi: "#ec4899",
  // Infrastructure
  Middleware: "#6366f1",
  Oracle: "#6366f1",
  Data: "#6366f1",
  Infrastructure: "#6366f1",
  Interoperability: "#6366f1",
  Privacy: "#6366f1",
  Automation: "#6366f1",
  Relayer: "#6366f1",
  RPC: "#6366f1",
  API: "#6366f1",
  Analytics: "#6366f1",
  // Wallets
  Wallet: "#06b6d4",
  Payment: "#06b6d4",
  Payments: "#06b6d4",
};

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------

export function getCategoryGroup(category: string): string {
  return CATEGORY_GROUP[category] || "Other";
}

export function getCategoryColor(category: string): string {
  const group = getCategoryGroup(category);
  return CATEGORY_COLORS[category] || GROUP_COLORS[group] || "#94a3b8";
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
