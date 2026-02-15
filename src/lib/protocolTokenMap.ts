export interface ProtocolTokenMapping {
  defiLlamaName: string;
  coinGeckoId: string | null;
  hasToken: boolean;
  tokenSymbol: string | null;
  subcategory: string;
  categoryGroup: string;
}

export const PROTOCOL_TOKEN_MAP: Record<string, ProtocolTokenMapping> = {
  // =========================================================================
  // DeFi: DEXes
  // =========================================================================
  "uniswap": { defiLlamaName: "uniswap", coinGeckoId: "uniswap", hasToken: true, tokenSymbol: "UNI", subcategory: "Dexes", categoryGroup: "DeFi" },
  "raydium": { defiLlamaName: "raydium", coinGeckoId: "raydium", hasToken: true, tokenSymbol: "RAY", subcategory: "Dexes", categoryGroup: "DeFi" },
  "pancakeswap": { defiLlamaName: "pancakeswap", coinGeckoId: "pancakeswap-token", hasToken: true, tokenSymbol: "CAKE", subcategory: "Dexes", categoryGroup: "DeFi" },
  "curve-finance": { defiLlamaName: "curve-finance", coinGeckoId: "curve-dao-token", hasToken: true, tokenSymbol: "CRV", subcategory: "Dexes", categoryGroup: "DeFi" },
  "sushiswap": { defiLlamaName: "sushiswap", coinGeckoId: "sushi", hasToken: true, tokenSymbol: "SUSHI", subcategory: "Dexes", categoryGroup: "DeFi" },
  "aerodrome": { defiLlamaName: "aerodrome", coinGeckoId: "aerodrome-finance", hasToken: true, tokenSymbol: "AERO", subcategory: "Dexes", categoryGroup: "DeFi" },
  "trader-joe": { defiLlamaName: "trader-joe", coinGeckoId: "joe", hasToken: true, tokenSymbol: "JOE", subcategory: "Dexes", categoryGroup: "DeFi" },
  "orca": { defiLlamaName: "orca", coinGeckoId: "orca", hasToken: true, tokenSymbol: "ORCA", subcategory: "Dexes", categoryGroup: "DeFi" },
  "velodrome": { defiLlamaName: "velodrome", coinGeckoId: "velodrome-finance", hasToken: true, tokenSymbol: "VELO", subcategory: "Dexes", categoryGroup: "DeFi" },
  "camelot": { defiLlamaName: "camelot", coinGeckoId: "camelot-token", hasToken: true, tokenSymbol: "GRAIL", subcategory: "Dexes", categoryGroup: "DeFi" },
  "thena": { defiLlamaName: "thena", coinGeckoId: "thena", hasToken: true, tokenSymbol: "THE", subcategory: "Dexes", categoryGroup: "DeFi" },
  "balancer": { defiLlamaName: "balancer", coinGeckoId: "balancer", hasToken: true, tokenSymbol: "BAL", subcategory: "Dexes", categoryGroup: "DeFi" },
  "kyberswap": { defiLlamaName: "kyberswap", coinGeckoId: "kyber-network-crystal", hasToken: true, tokenSymbol: "KNC", subcategory: "Dexes", categoryGroup: "DeFi" },
  "meteora": { defiLlamaName: "meteora", coinGeckoId: null, hasToken: false, tokenSymbol: null, subcategory: "Dexes", categoryGroup: "DeFi" },
  "osmosis": { defiLlamaName: "osmosis", coinGeckoId: "osmosis", hasToken: true, tokenSymbol: "OSMO", subcategory: "Dexes", categoryGroup: "DeFi" },
  "thorchain": { defiLlamaName: "thorchain", coinGeckoId: "thorchain", hasToken: true, tokenSymbol: "RUNE", subcategory: "Dexes", categoryGroup: "DeFi" },
  "quickswap": { defiLlamaName: "quickswap", coinGeckoId: "quickswap", hasToken: true, tokenSymbol: "QUICK", subcategory: "Dexes", categoryGroup: "DeFi" },
  "spiritswap": { defiLlamaName: "spiritswap", coinGeckoId: "spiritswap", hasToken: true, tokenSymbol: "SPIRIT", subcategory: "Dexes", categoryGroup: "DeFi" },
  "spookyswap": { defiLlamaName: "spookyswap", coinGeckoId: "spookyswap", hasToken: true, tokenSymbol: "BOO", subcategory: "Dexes", categoryGroup: "DeFi" },
  "biswap": { defiLlamaName: "biswap", coinGeckoId: "biswap", hasToken: true, tokenSymbol: "BSW", subcategory: "Dexes", categoryGroup: "DeFi" },
  "baseswap": { defiLlamaName: "baseswap", coinGeckoId: "baseswap", hasToken: true, tokenSymbol: "BSWAP", subcategory: "Dexes", categoryGroup: "DeFi" },
  "maverick-protocol": { defiLlamaName: "maverick-protocol", coinGeckoId: "maverick-protocol", hasToken: true, tokenSymbol: "MAV", subcategory: "Dexes", categoryGroup: "DeFi" },
  "lifinity": { defiLlamaName: "lifinity", coinGeckoId: "lifinity", hasToken: true, tokenSymbol: "LFNTY", subcategory: "Dexes", categoryGroup: "DeFi" },
  "ambient": { defiLlamaName: "ambient", coinGeckoId: null, hasToken: false, tokenSymbol: null, subcategory: "Dexes", categoryGroup: "DeFi" },

  // =========================================================================
  // DeFi: DEX Aggregators
  // =========================================================================
  "jupiter": { defiLlamaName: "jupiter", coinGeckoId: "jupiter-exchange-solana", hasToken: true, tokenSymbol: "JUP", subcategory: "Dexes", categoryGroup: "DeFi" },
  "1inch": { defiLlamaName: "1inch", coinGeckoId: "1inch", hasToken: true, tokenSymbol: "1INCH", subcategory: "Dexes", categoryGroup: "DeFi" },
  "paraswap": { defiLlamaName: "paraswap", coinGeckoId: "paraswap", hasToken: true, tokenSymbol: "PSP", subcategory: "Dexes", categoryGroup: "DeFi" },
  "cowswap": { defiLlamaName: "cowswap", coinGeckoId: "cow-protocol", hasToken: true, tokenSymbol: "COW", subcategory: "Dexes", categoryGroup: "DeFi" },

  // =========================================================================
  // DeFi: Lending
  // =========================================================================
  "aave": { defiLlamaName: "aave", coinGeckoId: "aave", hasToken: true, tokenSymbol: "AAVE", subcategory: "Lending", categoryGroup: "DeFi" },
  "compound": { defiLlamaName: "compound", coinGeckoId: "compound-governance-token", hasToken: true, tokenSymbol: "COMP", subcategory: "Lending", categoryGroup: "DeFi" },
  "morpho": { defiLlamaName: "morpho", coinGeckoId: "morpho", hasToken: true, tokenSymbol: "MORPHO", subcategory: "Lending", categoryGroup: "DeFi" },
  "venus": { defiLlamaName: "venus", coinGeckoId: "venus", hasToken: true, tokenSymbol: "XVS", subcategory: "Lending", categoryGroup: "DeFi" },
  "spark": { defiLlamaName: "spark", coinGeckoId: null, hasToken: false, tokenSymbol: null, subcategory: "Lending", categoryGroup: "DeFi" },
  "kamino": { defiLlamaName: "kamino", coinGeckoId: "kamino", hasToken: true, tokenSymbol: "KMNO", subcategory: "Lending", categoryGroup: "DeFi" },
  "benqi": { defiLlamaName: "benqi", coinGeckoId: "benqi", hasToken: true, tokenSymbol: "QI", subcategory: "Lending", categoryGroup: "DeFi" },
  "radiant": { defiLlamaName: "radiant", coinGeckoId: "radiant-capital", hasToken: true, tokenSymbol: "RDNT", subcategory: "Lending", categoryGroup: "DeFi" },
  "euler": { defiLlamaName: "euler", coinGeckoId: "euler", hasToken: true, tokenSymbol: "EUL", subcategory: "Lending", categoryGroup: "DeFi" },
  "fluid": { defiLlamaName: "fluid", coinGeckoId: null, hasToken: false, tokenSymbol: null, subcategory: "Lending", categoryGroup: "DeFi" },
  "maple": { defiLlamaName: "maple", coinGeckoId: "maple", hasToken: true, tokenSymbol: "MPL", subcategory: "Lending", categoryGroup: "DeFi" },
  "clearpool": { defiLlamaName: "clearpool", coinGeckoId: "clearpool", hasToken: true, tokenSymbol: "CPOOL", subcategory: "Lending", categoryGroup: "DeFi" },
  "goldfinch": { defiLlamaName: "goldfinch", coinGeckoId: "goldfinch", hasToken: true, tokenSymbol: "GFI", subcategory: "Lending", categoryGroup: "DeFi" },
  "centrifuge": { defiLlamaName: "centrifuge", coinGeckoId: "centrifuge", hasToken: true, tokenSymbol: "CFG", subcategory: "Lending", categoryGroup: "DeFi" },
  "solend": { defiLlamaName: "solend", coinGeckoId: "solend", hasToken: true, tokenSymbol: "SLND", subcategory: "Lending", categoryGroup: "DeFi" },
  "justlend": { defiLlamaName: "justlend", coinGeckoId: "justlend", hasToken: true, tokenSymbol: "JST", subcategory: "Lending", categoryGroup: "DeFi" },
  "marginfi": { defiLlamaName: "marginfi", coinGeckoId: null, hasToken: false, tokenSymbol: null, subcategory: "Lending", categoryGroup: "DeFi" },

  // =========================================================================
  // DeFi: Liquid Staking
  // =========================================================================
  "lido": { defiLlamaName: "lido", coinGeckoId: "lido-dao", hasToken: true, tokenSymbol: "LDO", subcategory: "Liquid Staking", categoryGroup: "DeFi" },
  "rocket-pool": { defiLlamaName: "rocket-pool", coinGeckoId: "rocket-pool", hasToken: true, tokenSymbol: "RPL", subcategory: "Liquid Staking", categoryGroup: "DeFi" },
  "jito": { defiLlamaName: "jito", coinGeckoId: "jito-governance-token", hasToken: true, tokenSymbol: "JTO", subcategory: "Liquid Staking", categoryGroup: "DeFi" },
  "marinade": { defiLlamaName: "marinade-finance", coinGeckoId: "marinade", hasToken: true, tokenSymbol: "MNDE", subcategory: "Liquid Staking", categoryGroup: "DeFi" },
  "mantle-staked-eth": { defiLlamaName: "mantle-staked-eth", coinGeckoId: "mantle-staked-ether", hasToken: false, tokenSymbol: "mETH", subcategory: "Liquid Staking", categoryGroup: "DeFi" },
  "stader": { defiLlamaName: "stader", coinGeckoId: "stader", hasToken: true, tokenSymbol: "SD", subcategory: "Liquid Staking", categoryGroup: "DeFi" },
  "frax-ether": { defiLlamaName: "frax-ether", coinGeckoId: "frax-share", hasToken: true, tokenSymbol: "FXS", subcategory: "Liquid Staking", categoryGroup: "DeFi" },
  "ankr": { defiLlamaName: "ankr", coinGeckoId: "ankr", hasToken: true, tokenSymbol: "ANKR", subcategory: "Liquid Staking", categoryGroup: "DeFi" },
  "benqi-staked-avax": { defiLlamaName: "benqi-staked-avax", coinGeckoId: "benqi-liquid-staked-avax", hasToken: false, tokenSymbol: "sAVAX", subcategory: "Liquid Staking", categoryGroup: "DeFi" },
  "stakewise": { defiLlamaName: "stakewise", coinGeckoId: "stakewise", hasToken: true, tokenSymbol: "SWISE", subcategory: "Liquid Staking", categoryGroup: "DeFi" },
  "coinbase-wrapped-staked-eth": { defiLlamaName: "coinbase-wrapped-staked-eth", coinGeckoId: null, hasToken: false, tokenSymbol: "cbETH", subcategory: "Liquid Staking", categoryGroup: "DeFi" },
  "swell": { defiLlamaName: "swell", coinGeckoId: "swell-network", hasToken: true, tokenSymbol: "SWELL", subcategory: "Liquid Staking", categoryGroup: "DeFi" },

  // =========================================================================
  // DeFi: Derivatives
  // =========================================================================
  "hyperliquid": { defiLlamaName: "hyperliquid", coinGeckoId: "hyperliquid", hasToken: true, tokenSymbol: "HYPE", subcategory: "Derivatives", categoryGroup: "DeFi" },
  "gmx": { defiLlamaName: "gmx", coinGeckoId: "gmx", hasToken: true, tokenSymbol: "GMX", subcategory: "Derivatives", categoryGroup: "DeFi" },
  "dydx": { defiLlamaName: "dydx", coinGeckoId: "dydx-chain", hasToken: true, tokenSymbol: "DYDX", subcategory: "Derivatives", categoryGroup: "DeFi" },
  "synthetix": { defiLlamaName: "synthetix", coinGeckoId: "havven", hasToken: true, tokenSymbol: "SNX", subcategory: "Derivatives", categoryGroup: "DeFi" },
  "vertex": { defiLlamaName: "vertex", coinGeckoId: "vertex-protocol", hasToken: true, tokenSymbol: "VRTX", subcategory: "Derivatives", categoryGroup: "DeFi" },
  "drift": { defiLlamaName: "drift", coinGeckoId: "drift-protocol", hasToken: true, tokenSymbol: "DRIFT", subcategory: "Derivatives", categoryGroup: "DeFi" },
  "kwenta": { defiLlamaName: "kwenta", coinGeckoId: "kwenta", hasToken: true, tokenSymbol: "KWENTA", subcategory: "Derivatives", categoryGroup: "DeFi" },
  "gains-network": { defiLlamaName: "gains-network", coinGeckoId: "gains-network", hasToken: true, tokenSymbol: "GNS", subcategory: "Derivatives", categoryGroup: "DeFi" },
  "perpetual-protocol": { defiLlamaName: "perpetual-protocol", coinGeckoId: "perpetual-protocol", hasToken: true, tokenSymbol: "PERP", subcategory: "Derivatives", categoryGroup: "DeFi" },
  "mux-protocol": { defiLlamaName: "mux-protocol", coinGeckoId: "mux-protocol", hasToken: true, tokenSymbol: "MCB", subcategory: "Derivatives", categoryGroup: "DeFi" },
  "level-finance": { defiLlamaName: "level-finance", coinGeckoId: "level", hasToken: true, tokenSymbol: "LVL", subcategory: "Derivatives", categoryGroup: "DeFi" },

  // =========================================================================
  // DeFi: Options
  // =========================================================================
  "lyra": { defiLlamaName: "lyra", coinGeckoId: "lyra-finance", hasToken: true, tokenSymbol: "LYRA", subcategory: "Options", categoryGroup: "DeFi" },
  "dopex": { defiLlamaName: "dopex", coinGeckoId: "dopex", hasToken: true, tokenSymbol: "DPX", subcategory: "Options", categoryGroup: "DeFi" },
  "premia": { defiLlamaName: "premia", coinGeckoId: "premia", hasToken: true, tokenSymbol: "PREMIA", subcategory: "Options", categoryGroup: "DeFi" },
  "aevo": { defiLlamaName: "aevo", coinGeckoId: "aevo-exchange", hasToken: true, tokenSymbol: "AEVO", subcategory: "Options", categoryGroup: "DeFi" },
  "opyn": { defiLlamaName: "opyn", coinGeckoId: null, hasToken: false, tokenSymbol: null, subcategory: "Options", categoryGroup: "DeFi" },

  // =========================================================================
  // DeFi: CDP / Stablecoins
  // =========================================================================
  "maker": { defiLlamaName: "maker", coinGeckoId: "maker", hasToken: true, tokenSymbol: "MKR", subcategory: "CDP", categoryGroup: "DeFi" },
  "ethena": { defiLlamaName: "ethena", coinGeckoId: "ethena", hasToken: true, tokenSymbol: "ENA", subcategory: "CDP", categoryGroup: "DeFi" },
  "liquity": { defiLlamaName: "liquity", coinGeckoId: "liquity", hasToken: true, tokenSymbol: "LQTY", subcategory: "CDP", categoryGroup: "DeFi" },
  "frax": { defiLlamaName: "frax", coinGeckoId: "frax-share", hasToken: true, tokenSymbol: "FXS", subcategory: "CDP", categoryGroup: "DeFi" },
  "alchemix": { defiLlamaName: "alchemix", coinGeckoId: "alchemix", hasToken: true, tokenSymbol: "ALCX", subcategory: "CDP", categoryGroup: "DeFi" },
  "abracadabra": { defiLlamaName: "abracadabra", coinGeckoId: "spell-token", hasToken: true, tokenSymbol: "SPELL", subcategory: "CDP", categoryGroup: "DeFi" },
  "usual": { defiLlamaName: "usual", coinGeckoId: "usual", hasToken: true, tokenSymbol: "USUAL", subcategory: "CDP", categoryGroup: "DeFi" },
  "prisma": { defiLlamaName: "prisma", coinGeckoId: "prisma-governance-token", hasToken: true, tokenSymbol: "PRISMA", subcategory: "CDP", categoryGroup: "DeFi" },
  "crvusd": { defiLlamaName: "crvusd", coinGeckoId: "curve-dao-token", hasToken: true, tokenSymbol: "CRV", subcategory: "CDP", categoryGroup: "DeFi" },
  "raft": { defiLlamaName: "raft", coinGeckoId: "raft", hasToken: true, tokenSymbol: "RAFT", subcategory: "CDP", categoryGroup: "DeFi" },

  // =========================================================================
  // DeFi: Bridges
  // =========================================================================
  "across": { defiLlamaName: "across", coinGeckoId: "across-protocol", hasToken: true, tokenSymbol: "ACX", subcategory: "Bridge", categoryGroup: "DeFi" },
  "stargate": { defiLlamaName: "stargate", coinGeckoId: "stargate-finance", hasToken: true, tokenSymbol: "STG", subcategory: "Bridge", categoryGroup: "DeFi" },
  "wormhole": { defiLlamaName: "wormhole", coinGeckoId: "wormhole", hasToken: true, tokenSymbol: "W", subcategory: "Bridge", categoryGroup: "DeFi" },
  "layerzero": { defiLlamaName: "layerzero", coinGeckoId: "layerzero", hasToken: true, tokenSymbol: "ZRO", subcategory: "Bridge", categoryGroup: "DeFi" },
  "hop-protocol": { defiLlamaName: "hop-protocol", coinGeckoId: "hop-protocol", hasToken: true, tokenSymbol: "HOP", subcategory: "Bridge", categoryGroup: "DeFi" },
  "synapse": { defiLlamaName: "synapse", coinGeckoId: "synapse-2", hasToken: true, tokenSymbol: "SYN", subcategory: "Bridge", categoryGroup: "DeFi" },
  "celer": { defiLlamaName: "celer", coinGeckoId: "celer-network", hasToken: true, tokenSymbol: "CELR", subcategory: "Bridge", categoryGroup: "DeFi" },
  "multichain": { defiLlamaName: "multichain", coinGeckoId: "multichain", hasToken: true, tokenSymbol: "MULTI", subcategory: "Bridge", categoryGroup: "DeFi" },
  "debridge": { defiLlamaName: "debridge", coinGeckoId: "debridge", hasToken: true, tokenSymbol: "DBR", subcategory: "Bridge", categoryGroup: "DeFi" },

  // =========================================================================
  // DeFi: Yield
  // =========================================================================
  "pendle": { defiLlamaName: "pendle", coinGeckoId: "pendle", hasToken: true, tokenSymbol: "PENDLE", subcategory: "Yield", categoryGroup: "DeFi" },
  "yearn-finance": { defiLlamaName: "yearn-finance", coinGeckoId: "yearn-finance", hasToken: true, tokenSymbol: "YFI", subcategory: "Yield", categoryGroup: "DeFi" },
  "convex-finance": { defiLlamaName: "convex-finance", coinGeckoId: "convex-finance", hasToken: true, tokenSymbol: "CVX", subcategory: "Yield", categoryGroup: "DeFi" },
  "beefy": { defiLlamaName: "beefy", coinGeckoId: "beefy-finance", hasToken: true, tokenSymbol: "BIFI", subcategory: "Yield", categoryGroup: "DeFi" },
  "sommelier": { defiLlamaName: "sommelier", coinGeckoId: "sommelier", hasToken: true, tokenSymbol: "SOMM", subcategory: "Yield", categoryGroup: "DeFi" },
  "harvest-finance": { defiLlamaName: "harvest-finance", coinGeckoId: "harvest-finance", hasToken: true, tokenSymbol: "FARM", subcategory: "Yield", categoryGroup: "DeFi" },
  "concentrator": { defiLlamaName: "concentrator", coinGeckoId: null, hasToken: false, tokenSymbol: null, subcategory: "Yield", categoryGroup: "DeFi" },
  "badger-dao": { defiLlamaName: "badger-dao", coinGeckoId: "badger-dao", hasToken: true, tokenSymbol: "BADGER", subcategory: "Yield", categoryGroup: "DeFi" },
  "aura-finance": { defiLlamaName: "aura-finance", coinGeckoId: "aura-finance", hasToken: true, tokenSymbol: "AURA", subcategory: "Yield", categoryGroup: "DeFi" },
  "instadapp": { defiLlamaName: "instadapp", coinGeckoId: "instadapp", hasToken: true, tokenSymbol: "INST", subcategory: "Yield", categoryGroup: "DeFi" },

  // =========================================================================
  // DeFi: Restaking
  // =========================================================================
  "eigenlayer": { defiLlamaName: "eigenlayer", coinGeckoId: "eigenlayer", hasToken: true, tokenSymbol: "EIGEN", subcategory: "Restaking", categoryGroup: "DeFi" },
  "symbiotic": { defiLlamaName: "symbiotic", coinGeckoId: null, hasToken: false, tokenSymbol: null, subcategory: "Restaking", categoryGroup: "DeFi" },
  "karak": { defiLlamaName: "karak", coinGeckoId: null, hasToken: false, tokenSymbol: null, subcategory: "Restaking", categoryGroup: "DeFi" },
  "ether-fi": { defiLlamaName: "ether-fi", coinGeckoId: "ether-fi", hasToken: true, tokenSymbol: "ETHFI", subcategory: "Restaking", categoryGroup: "DeFi" },
  "renzo": { defiLlamaName: "renzo", coinGeckoId: "renzo", hasToken: true, tokenSymbol: "REZ", subcategory: "Restaking", categoryGroup: "DeFi" },
  "kelp-dao": { defiLlamaName: "kelp-dao", coinGeckoId: "kelp-dao-restaked-eth", hasToken: false, tokenSymbol: "rsETH", subcategory: "Restaking", categoryGroup: "DeFi" },
  "puffer-finance": { defiLlamaName: "puffer-finance", coinGeckoId: "puffer-finance", hasToken: true, tokenSymbol: "PUFFER", subcategory: "Restaking", categoryGroup: "DeFi" },

  // =========================================================================
  // DeFi: Insurance
  // =========================================================================
  "nexus-mutual": { defiLlamaName: "nexus-mutual", coinGeckoId: "nexus-mutual", hasToken: true, tokenSymbol: "NXM", subcategory: "Insurance", categoryGroup: "DeFi" },
  "insurace": { defiLlamaName: "insurace", coinGeckoId: "insurace", hasToken: true, tokenSymbol: "INSUR", subcategory: "Insurance", categoryGroup: "DeFi" },

  // =========================================================================
  // Stablecoins (no governance token)
  // =========================================================================
  "tether": { defiLlamaName: "tether", coinGeckoId: null, hasToken: false, tokenSymbol: null, subcategory: "Stablecoins", categoryGroup: "Stablecoins" },
  "circle": { defiLlamaName: "circle", coinGeckoId: null, hasToken: false, tokenSymbol: null, subcategory: "Stablecoins", categoryGroup: "Stablecoins" },

  // =========================================================================
  // Blockchains: L1
  // =========================================================================
  "ethereum": { defiLlamaName: "ethereum", coinGeckoId: "ethereum", hasToken: true, tokenSymbol: "ETH", subcategory: "L1", categoryGroup: "Blockchains" },
  "solana": { defiLlamaName: "solana", coinGeckoId: "solana", hasToken: true, tokenSymbol: "SOL", subcategory: "L1", categoryGroup: "Blockchains" },
  "tron": { defiLlamaName: "tron", coinGeckoId: "tron", hasToken: true, tokenSymbol: "TRX", subcategory: "L1", categoryGroup: "Blockchains" },
  "avalanche": { defiLlamaName: "avalanche", coinGeckoId: "avalanche-2", hasToken: true, tokenSymbol: "AVAX", subcategory: "L1", categoryGroup: "Blockchains" },
  "bnb-chain": { defiLlamaName: "bsc", coinGeckoId: "binancecoin", hasToken: true, tokenSymbol: "BNB", subcategory: "L1", categoryGroup: "Blockchains" },
  "bitcoin": { defiLlamaName: "bitcoin", coinGeckoId: "bitcoin", hasToken: true, tokenSymbol: "BTC", subcategory: "L1", categoryGroup: "Blockchains" },
  "sui": { defiLlamaName: "sui", coinGeckoId: "sui", hasToken: true, tokenSymbol: "SUI", subcategory: "L1", categoryGroup: "Blockchains" },
  "aptos": { defiLlamaName: "aptos", coinGeckoId: "aptos", hasToken: true, tokenSymbol: "APT", subcategory: "L1", categoryGroup: "Blockchains" },
  "near": { defiLlamaName: "near", coinGeckoId: "near", hasToken: true, tokenSymbol: "NEAR", subcategory: "L1", categoryGroup: "Blockchains" },
  "sei": { defiLlamaName: "sei", coinGeckoId: "sei-network", hasToken: true, tokenSymbol: "SEI", subcategory: "L1", categoryGroup: "Blockchains" },
  "celestia": { defiLlamaName: "celestia", coinGeckoId: "celestia", hasToken: true, tokenSymbol: "TIA", subcategory: "L1", categoryGroup: "Blockchains" },
  "fantom": { defiLlamaName: "fantom", coinGeckoId: "fantom", hasToken: true, tokenSymbol: "FTM", subcategory: "L1", categoryGroup: "Blockchains" },
  "sonic": { defiLlamaName: "sonic", coinGeckoId: "fantom", hasToken: true, tokenSymbol: "FTM", subcategory: "L1", categoryGroup: "Blockchains" },
  "injective": { defiLlamaName: "injective", coinGeckoId: "injective-protocol", hasToken: true, tokenSymbol: "INJ", subcategory: "L1", categoryGroup: "Blockchains" },
  "cosmos": { defiLlamaName: "cosmos", coinGeckoId: "cosmos", hasToken: true, tokenSymbol: "ATOM", subcategory: "L1", categoryGroup: "Blockchains" },
  "polkadot": { defiLlamaName: "polkadot", coinGeckoId: "polkadot", hasToken: true, tokenSymbol: "DOT", subcategory: "L1", categoryGroup: "Blockchains" },
  "cardano": { defiLlamaName: "cardano", coinGeckoId: "cardano", hasToken: true, tokenSymbol: "ADA", subcategory: "L1", categoryGroup: "Blockchains" },
  "hedera": { defiLlamaName: "hedera", coinGeckoId: "hedera-hashgraph", hasToken: true, tokenSymbol: "HBAR", subcategory: "L1", categoryGroup: "Blockchains" },
  "algorand": { defiLlamaName: "algorand", coinGeckoId: "algorand", hasToken: true, tokenSymbol: "ALGO", subcategory: "L1", categoryGroup: "Blockchains" },
  "ton": { defiLlamaName: "ton", coinGeckoId: "the-open-network", hasToken: true, tokenSymbol: "TON", subcategory: "L1", categoryGroup: "Blockchains" },
  "kava": { defiLlamaName: "kava", coinGeckoId: "kava", hasToken: true, tokenSymbol: "KAVA", subcategory: "L1", categoryGroup: "Blockchains" },
  "celo": { defiLlamaName: "celo", coinGeckoId: "celo", hasToken: true, tokenSymbol: "CELO", subcategory: "L1", categoryGroup: "Blockchains" },
  "moonbeam": { defiLlamaName: "moonbeam", coinGeckoId: "moonbeam", hasToken: true, tokenSymbol: "GLMR", subcategory: "L1", categoryGroup: "Blockchains" },
  "gnosis": { defiLlamaName: "gnosis", coinGeckoId: "gnosis", hasToken: true, tokenSymbol: "GNO", subcategory: "L1", categoryGroup: "Blockchains" },
  "cronos": { defiLlamaName: "cronos", coinGeckoId: "crypto-com-chain", hasToken: true, tokenSymbol: "CRO", subcategory: "L1", categoryGroup: "Blockchains" },
  "kaspa": { defiLlamaName: "kaspa", coinGeckoId: "kaspa", hasToken: true, tokenSymbol: "KAS", subcategory: "L1", categoryGroup: "Blockchains" },
  "multiversx": { defiLlamaName: "multiversx", coinGeckoId: "elrond-erd-2", hasToken: true, tokenSymbol: "EGLD", subcategory: "L1", categoryGroup: "Blockchains" },

  // =========================================================================
  // Blockchains: L2 / Rollups
  // =========================================================================
  "base": { defiLlamaName: "base", coinGeckoId: null, hasToken: false, tokenSymbol: null, subcategory: "L2", categoryGroup: "Blockchains" },
  "arbitrum": { defiLlamaName: "arbitrum", coinGeckoId: "arbitrum", hasToken: true, tokenSymbol: "ARB", subcategory: "L2", categoryGroup: "Blockchains" },
  "polygon": { defiLlamaName: "polygon", coinGeckoId: "matic-network", hasToken: true, tokenSymbol: "POL", subcategory: "L2", categoryGroup: "Blockchains" },
  "optimism": { defiLlamaName: "optimism", coinGeckoId: "optimism", hasToken: true, tokenSymbol: "OP", subcategory: "L2", categoryGroup: "Blockchains" },
  "mantle": { defiLlamaName: "mantle", coinGeckoId: "mantle", hasToken: true, tokenSymbol: "MNT", subcategory: "L2", categoryGroup: "Blockchains" },
  "starknet": { defiLlamaName: "starknet", coinGeckoId: "starknet", hasToken: true, tokenSymbol: "STRK", subcategory: "L2", categoryGroup: "Blockchains" },
  "zksync": { defiLlamaName: "zksync", coinGeckoId: "zksync", hasToken: true, tokenSymbol: "ZK", subcategory: "L2", categoryGroup: "Blockchains" },
  "linea": { defiLlamaName: "linea", coinGeckoId: null, hasToken: false, tokenSymbol: null, subcategory: "L2", categoryGroup: "Blockchains" },
  "scroll": { defiLlamaName: "scroll", coinGeckoId: "scroll", hasToken: true, tokenSymbol: "SCR", subcategory: "L2", categoryGroup: "Blockchains" },
  "blast": { defiLlamaName: "blast", coinGeckoId: "blast", hasToken: true, tokenSymbol: "BLAST", subcategory: "L2", categoryGroup: "Blockchains" },
  "manta": { defiLlamaName: "manta", coinGeckoId: "manta-network", hasToken: true, tokenSymbol: "MANTA", subcategory: "L2", categoryGroup: "Blockchains" },
  "mode": { defiLlamaName: "mode", coinGeckoId: "mode", hasToken: true, tokenSymbol: "MODE", subcategory: "L2", categoryGroup: "Blockchains" },
  "metis": { defiLlamaName: "metis", coinGeckoId: "metis-token", hasToken: true, tokenSymbol: "METIS", subcategory: "L2", categoryGroup: "Blockchains" },
  "immutable-zkevm": { defiLlamaName: "immutable-zkevm", coinGeckoId: "immutable-x", hasToken: true, tokenSymbol: "IMX", subcategory: "L2", categoryGroup: "Blockchains" },
  "taiko": { defiLlamaName: "taiko", coinGeckoId: "taiko", hasToken: true, tokenSymbol: "TAIKO", subcategory: "L2", categoryGroup: "Blockchains" },
  "loopring": { defiLlamaName: "loopring", coinGeckoId: "loopring", hasToken: true, tokenSymbol: "LRC", subcategory: "L2", categoryGroup: "Blockchains" },

  // =========================================================================
  // Consumer: NFT Marketplace
  // =========================================================================
  "blur": { defiLlamaName: "blur", coinGeckoId: "blur", hasToken: true, tokenSymbol: "BLUR", subcategory: "NFT Marketplace", categoryGroup: "Consumer" },
  "opensea": { defiLlamaName: "opensea", coinGeckoId: null, hasToken: false, tokenSymbol: null, subcategory: "NFT Marketplace", categoryGroup: "Consumer" },
  "magic-eden": { defiLlamaName: "magic-eden", coinGeckoId: "magic-eden", hasToken: true, tokenSymbol: "ME", subcategory: "NFT Marketplace", categoryGroup: "Consumer" },
  "x2y2": { defiLlamaName: "x2y2", coinGeckoId: "x2y2", hasToken: true, tokenSymbol: "X2Y2", subcategory: "NFT Marketplace", categoryGroup: "Consumer" },
  "looksrare": { defiLlamaName: "looksrare", coinGeckoId: "looksrare", hasToken: true, tokenSymbol: "LOOKS", subcategory: "NFT Marketplace", categoryGroup: "Consumer" },

  // =========================================================================
  // Consumer: Gaming
  // =========================================================================
  "immutable-x": { defiLlamaName: "immutable-x", coinGeckoId: "immutable-x", hasToken: true, tokenSymbol: "IMX", subcategory: "Gaming", categoryGroup: "Consumer" },
  "axie-infinity": { defiLlamaName: "axie-infinity", coinGeckoId: "axie-infinity", hasToken: true, tokenSymbol: "AXS", subcategory: "Gaming", categoryGroup: "Consumer" },
  "gala": { defiLlamaName: "gala", coinGeckoId: "gala", hasToken: true, tokenSymbol: "GALA", subcategory: "Gaming", categoryGroup: "Consumer" },
  "illuvium": { defiLlamaName: "illuvium", coinGeckoId: "illuvium", hasToken: true, tokenSymbol: "ILV", subcategory: "Gaming", categoryGroup: "Consumer" },

  // =========================================================================
  // Consumer: Metaverse
  // =========================================================================
  "the-sandbox": { defiLlamaName: "the-sandbox", coinGeckoId: "the-sandbox", hasToken: true, tokenSymbol: "SAND", subcategory: "Metaverse", categoryGroup: "Consumer" },
  "decentraland": { defiLlamaName: "decentraland", coinGeckoId: "decentraland", hasToken: true, tokenSymbol: "MANA", subcategory: "Metaverse", categoryGroup: "Consumer" },

  // =========================================================================
  // Consumer: Social / Other
  // =========================================================================
  "stepn": { defiLlamaName: "stepn", coinGeckoId: "stepn", hasToken: true, tokenSymbol: "GMT", subcategory: "Social", categoryGroup: "Consumer" },
  "galxe": { defiLlamaName: "galxe", coinGeckoId: "galxe", hasToken: true, tokenSymbol: "GAL", subcategory: "Social", categoryGroup: "Consumer" },
  "lens-protocol": { defiLlamaName: "lens-protocol", coinGeckoId: null, hasToken: false, tokenSymbol: null, subcategory: "Social", categoryGroup: "Consumer" },
  "farcaster": { defiLlamaName: "farcaster", coinGeckoId: null, hasToken: false, tokenSymbol: null, subcategory: "Social", categoryGroup: "Consumer" },
  "pump-fun": { defiLlamaName: "pump.fun", coinGeckoId: null, hasToken: false, tokenSymbol: null, subcategory: "Launchpad", categoryGroup: "Consumer" },
  "polymarket": { defiLlamaName: "polymarket", coinGeckoId: null, hasToken: false, tokenSymbol: null, subcategory: "Prediction", categoryGroup: "Consumer" },
  "friend-tech": { defiLlamaName: "friend.tech", coinGeckoId: null, hasToken: false, tokenSymbol: null, subcategory: "Social", categoryGroup: "Consumer" },

  // =========================================================================
  // Infrastructure: Oracles
  // =========================================================================
  "chainlink": { defiLlamaName: "chainlink", coinGeckoId: "chainlink", hasToken: true, tokenSymbol: "LINK", subcategory: "Oracle", categoryGroup: "Infrastructure" },
  "pyth": { defiLlamaName: "pyth", coinGeckoId: "pyth-network", hasToken: true, tokenSymbol: "PYTH", subcategory: "Oracle", categoryGroup: "Infrastructure" },
  "api3": { defiLlamaName: "api3", coinGeckoId: "api3", hasToken: true, tokenSymbol: "API3", subcategory: "Oracle", categoryGroup: "Infrastructure" },
  "band-protocol": { defiLlamaName: "band-protocol", coinGeckoId: "band-protocol", hasToken: true, tokenSymbol: "BAND", subcategory: "Oracle", categoryGroup: "Infrastructure" },
  "uma": { defiLlamaName: "uma", coinGeckoId: "uma", hasToken: true, tokenSymbol: "UMA", subcategory: "Oracle", categoryGroup: "Infrastructure" },

  // =========================================================================
  // Infrastructure: Data / Indexing
  // =========================================================================
  "the-graph": { defiLlamaName: "the-graph", coinGeckoId: "the-graph", hasToken: true, tokenSymbol: "GRT", subcategory: "Data", categoryGroup: "Infrastructure" },

  // =========================================================================
  // Infrastructure: Storage
  // =========================================================================
  "filecoin": { defiLlamaName: "filecoin", coinGeckoId: "filecoin", hasToken: true, tokenSymbol: "FIL", subcategory: "Storage", categoryGroup: "Infrastructure" },
  "arweave": { defiLlamaName: "arweave", coinGeckoId: "arweave", hasToken: true, tokenSymbol: "AR", subcategory: "Storage", categoryGroup: "Infrastructure" },

  // =========================================================================
  // Infrastructure: Compute
  // =========================================================================
  "render": { defiLlamaName: "render", coinGeckoId: "render-token", hasToken: true, tokenSymbol: "RNDR", subcategory: "Compute", categoryGroup: "Infrastructure" },
  "livepeer": { defiLlamaName: "livepeer", coinGeckoId: "livepeer", hasToken: true, tokenSymbol: "LPT", subcategory: "Compute", categoryGroup: "Infrastructure" },
  "akash-network": { defiLlamaName: "akash-network", coinGeckoId: "akash-network", hasToken: true, tokenSymbol: "AKT", subcategory: "Compute", categoryGroup: "Infrastructure" },

  // =========================================================================
  // DePIN
  // =========================================================================
  "helium": { defiLlamaName: "helium", coinGeckoId: "helium", hasToken: true, tokenSymbol: "HNT", subcategory: "DePIN", categoryGroup: "Infrastructure" },
  "hivemapper": { defiLlamaName: "hivemapper", coinGeckoId: "hivemapper", hasToken: true, tokenSymbol: "HONEY", subcategory: "DePIN", categoryGroup: "Infrastructure" },
  "io-net": { defiLlamaName: "io-net", coinGeckoId: null, hasToken: false, tokenSymbol: null, subcategory: "DePIN", categoryGroup: "Infrastructure" },

  // =========================================================================
  // Additional DeFi protocols for comprehensive coverage
  // =========================================================================
  "ribbon-finance": { defiLlamaName: "ribbon-finance", coinGeckoId: "ribbon-finance", hasToken: true, tokenSymbol: "RBN", subcategory: "Options", categoryGroup: "DeFi" },
  "tokemak": { defiLlamaName: "tokemak", coinGeckoId: "tokemak", hasToken: true, tokenSymbol: "TOKE", subcategory: "Yield", categoryGroup: "DeFi" },
  "angle": { defiLlamaName: "angle", coinGeckoId: "angle-protocol", hasToken: true, tokenSymbol: "ANGLE", subcategory: "CDP", categoryGroup: "DeFi" },
  "redacted-cartel": { defiLlamaName: "redacted-cartel", coinGeckoId: "redacted", hasToken: true, tokenSymbol: "BTRFLY", subcategory: "Yield", categoryGroup: "DeFi" },
  "jones-dao": { defiLlamaName: "jones-dao", coinGeckoId: "jones-dao", hasToken: true, tokenSymbol: "JONES", subcategory: "Yield", categoryGroup: "DeFi" },
  "radix": { defiLlamaName: "radix", coinGeckoId: "radix", hasToken: true, tokenSymbol: "XRD", subcategory: "L1", categoryGroup: "Blockchains" },
  "flow": { defiLlamaName: "flow", coinGeckoId: "flow", hasToken: true, tokenSymbol: "FLOW", subcategory: "L1", categoryGroup: "Blockchains" },
  "zilliqa": { defiLlamaName: "zilliqa", coinGeckoId: "zilliqa", hasToken: true, tokenSymbol: "ZIL", subcategory: "L1", categoryGroup: "Blockchains" },
  "harmony": { defiLlamaName: "harmony", coinGeckoId: "harmony", hasToken: true, tokenSymbol: "ONE", subcategory: "L1", categoryGroup: "Blockchains" },
  "ronin": { defiLlamaName: "ronin", coinGeckoId: "ronin", hasToken: true, tokenSymbol: "RON", subcategory: "L1", categoryGroup: "Blockchains" },
  "iota": { defiLlamaName: "iota", coinGeckoId: "iota", hasToken: true, tokenSymbol: "IOTA", subcategory: "L1", categoryGroup: "Blockchains" },
  "tezos": { defiLlamaName: "tezos", coinGeckoId: "tezos", hasToken: true, tokenSymbol: "XTZ", subcategory: "L1", categoryGroup: "Blockchains" },
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
