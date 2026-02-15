export interface ProtocolTokenMapping {
  defiLlamaName: string;
  coinGeckoId: string | null;
  hasToken: boolean;
  tokenSymbol: string | null;
  subcategory: string;
  categoryGroup: string;
}

export const PROTOCOL_TOKEN_MAP: Record<string, ProtocolTokenMapping> = {
  // DeFi: DEXes
  "uniswap": { defiLlamaName: "uniswap", coinGeckoId: "uniswap", hasToken: true, tokenSymbol: "UNI", subcategory: "Dexes", categoryGroup: "DeFi" },
  "raydium": { defiLlamaName: "raydium", coinGeckoId: "raydium", hasToken: true, tokenSymbol: "RAY", subcategory: "Dexes", categoryGroup: "DeFi" },
  "pancakeswap": { defiLlamaName: "pancakeswap", coinGeckoId: "pancakeswap-token", hasToken: true, tokenSymbol: "CAKE", subcategory: "Dexes", categoryGroup: "DeFi" },
  "curve-finance": { defiLlamaName: "curve-finance", coinGeckoId: "curve-dao-token", hasToken: true, tokenSymbol: "CRV", subcategory: "Dexes", categoryGroup: "DeFi" },
  "sushiswap": { defiLlamaName: "sushiswap", coinGeckoId: "sushi", hasToken: true, tokenSymbol: "SUSHI", subcategory: "Dexes", categoryGroup: "DeFi" },
  "aerodrome": { defiLlamaName: "aerodrome", coinGeckoId: "aerodrome-finance", hasToken: true, tokenSymbol: "AERO", subcategory: "Dexes", categoryGroup: "DeFi" },
  "trader-joe": { defiLlamaName: "trader-joe", coinGeckoId: "joe", hasToken: true, tokenSymbol: "JOE", subcategory: "Dexes", categoryGroup: "DeFi" },
  "orca": { defiLlamaName: "orca", coinGeckoId: "orca", hasToken: true, tokenSymbol: "ORCA", subcategory: "Dexes", categoryGroup: "DeFi" },

  // DeFi: Lending
  "aave": { defiLlamaName: "aave", coinGeckoId: "aave", hasToken: true, tokenSymbol: "AAVE", subcategory: "Lending", categoryGroup: "DeFi" },
  "compound": { defiLlamaName: "compound", coinGeckoId: "compound-governance-token", hasToken: true, tokenSymbol: "COMP", subcategory: "Lending", categoryGroup: "DeFi" },
  "morpho": { defiLlamaName: "morpho", coinGeckoId: "morpho", hasToken: true, tokenSymbol: "MORPHO", subcategory: "Lending", categoryGroup: "DeFi" },
  "venus": { defiLlamaName: "venus", coinGeckoId: "venus", hasToken: true, tokenSymbol: "XVS", subcategory: "Lending", categoryGroup: "DeFi" },
  "spark": { defiLlamaName: "spark", coinGeckoId: null, hasToken: false, tokenSymbol: null, subcategory: "Lending", categoryGroup: "DeFi" },
  "kamino": { defiLlamaName: "kamino", coinGeckoId: "kamino", hasToken: true, tokenSymbol: "KMNO", subcategory: "Lending", categoryGroup: "DeFi" },

  // DeFi: Liquid Staking
  "lido": { defiLlamaName: "lido", coinGeckoId: "lido-dao", hasToken: true, tokenSymbol: "LDO", subcategory: "Liquid Staking", categoryGroup: "DeFi" },
  "rocket-pool": { defiLlamaName: "rocket-pool", coinGeckoId: "rocket-pool", hasToken: true, tokenSymbol: "RPL", subcategory: "Liquid Staking", categoryGroup: "DeFi" },
  "jito": { defiLlamaName: "jito", coinGeckoId: "jito-governance-token", hasToken: true, tokenSymbol: "JTO", subcategory: "Liquid Staking", categoryGroup: "DeFi" },
  "marinade": { defiLlamaName: "marinade-finance", coinGeckoId: "marinade", hasToken: true, tokenSymbol: "MNDE", subcategory: "Liquid Staking", categoryGroup: "DeFi" },

  // DeFi: Derivatives
  "hyperliquid": { defiLlamaName: "hyperliquid", coinGeckoId: "hyperliquid", hasToken: true, tokenSymbol: "HYPE", subcategory: "Derivatives", categoryGroup: "DeFi" },
  "jupiter": { defiLlamaName: "jupiter", coinGeckoId: "jupiter-exchange-solana", hasToken: true, tokenSymbol: "JUP", subcategory: "Dexes", categoryGroup: "DeFi" },
  "gmx": { defiLlamaName: "gmx", coinGeckoId: "gmx", hasToken: true, tokenSymbol: "GMX", subcategory: "Derivatives", categoryGroup: "DeFi" },
  "dydx": { defiLlamaName: "dydx", coinGeckoId: "dydx-chain", hasToken: true, tokenSymbol: "DYDX", subcategory: "Derivatives", categoryGroup: "DeFi" },
  "synthetix": { defiLlamaName: "synthetix", coinGeckoId: "havven", hasToken: true, tokenSymbol: "SNX", subcategory: "Derivatives", categoryGroup: "DeFi" },

  // DeFi: CDP
  "maker": { defiLlamaName: "maker", coinGeckoId: "maker", hasToken: true, tokenSymbol: "MKR", subcategory: "CDP", categoryGroup: "DeFi" },
  "ethena": { defiLlamaName: "ethena", coinGeckoId: "ethena", hasToken: true, tokenSymbol: "ENA", subcategory: "CDP", categoryGroup: "DeFi" },

  // DeFi: Bridges
  "across": { defiLlamaName: "across", coinGeckoId: "across-protocol", hasToken: true, tokenSymbol: "ACX", subcategory: "Bridge", categoryGroup: "DeFi" },
  "stargate": { defiLlamaName: "stargate", coinGeckoId: "stargate-finance", hasToken: true, tokenSymbol: "STG", subcategory: "Bridge", categoryGroup: "DeFi" },

  // Stablecoins (no governance token)
  "tether": { defiLlamaName: "tether", coinGeckoId: null, hasToken: false, tokenSymbol: null, subcategory: "Stablecoins", categoryGroup: "Stablecoins" },
  "circle": { defiLlamaName: "circle", coinGeckoId: null, hasToken: false, tokenSymbol: null, subcategory: "Stablecoins", categoryGroup: "Stablecoins" },

  // Blockchains
  "ethereum": { defiLlamaName: "ethereum", coinGeckoId: "ethereum", hasToken: true, tokenSymbol: "ETH", subcategory: "L1", categoryGroup: "Blockchains" },
  "solana": { defiLlamaName: "solana", coinGeckoId: "solana", hasToken: true, tokenSymbol: "SOL", subcategory: "L1", categoryGroup: "Blockchains" },
  "base": { defiLlamaName: "base", coinGeckoId: null, hasToken: false, tokenSymbol: null, subcategory: "L2", categoryGroup: "Blockchains" },
  "tron": { defiLlamaName: "tron", coinGeckoId: "tron", hasToken: true, tokenSymbol: "TRX", subcategory: "L1", categoryGroup: "Blockchains" },
  "avalanche": { defiLlamaName: "avalanche", coinGeckoId: "avalanche-2", hasToken: true, tokenSymbol: "AVAX", subcategory: "L1", categoryGroup: "Blockchains" },
  "arbitrum": { defiLlamaName: "arbitrum", coinGeckoId: "arbitrum", hasToken: true, tokenSymbol: "ARB", subcategory: "L2", categoryGroup: "Blockchains" },
  "polygon": { defiLlamaName: "polygon", coinGeckoId: "matic-network", hasToken: true, tokenSymbol: "POL", subcategory: "L2", categoryGroup: "Blockchains" },
  "optimism": { defiLlamaName: "optimism", coinGeckoId: "optimism", hasToken: true, tokenSymbol: "OP", subcategory: "L2", categoryGroup: "Blockchains" },
  "bnb-chain": { defiLlamaName: "bsc", coinGeckoId: "binancecoin", hasToken: true, tokenSymbol: "BNB", subcategory: "L1", categoryGroup: "Blockchains" },

  // Consumer / Other
  "pump-fun": { defiLlamaName: "pump.fun", coinGeckoId: null, hasToken: false, tokenSymbol: null, subcategory: "Launchpad", categoryGroup: "Consumer" },
  "polymarket": { defiLlamaName: "polymarket", coinGeckoId: null, hasToken: false, tokenSymbol: null, subcategory: "Prediction", categoryGroup: "Consumer" },
  "friend-tech": { defiLlamaName: "friend.tech", coinGeckoId: null, hasToken: false, tokenSymbol: null, subcategory: "Social", categoryGroup: "Consumer" },
};

export function getExpandedTokenIds(): string[] {
  const ids = new Set<string>();
  for (const entry of Object.values(PROTOCOL_TOKEN_MAP)) {
    if (entry.coinGeckoId) ids.add(entry.coinGeckoId);
  }
  return Array.from(ids);
}

export function findProtocolMapping(defiLlamaName: string): ProtocolTokenMapping | null {
  // Try exact match first
  const key = defiLlamaName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  if (PROTOCOL_TOKEN_MAP[key]) return PROTOCOL_TOKEN_MAP[key];
  // Try matching by defiLlamaName field
  for (const entry of Object.values(PROTOCOL_TOKEN_MAP)) {
    if (entry.defiLlamaName.toLowerCase() === defiLlamaName.toLowerCase()) return entry;
  }
  return null;
}
