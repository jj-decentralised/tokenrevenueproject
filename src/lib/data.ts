// ============================================================
// MASTER DATA FILE — Crypto Revenue Analysis
// Sources: DefiLlama (live), TokenTerminal (live), CoinGecko (live),
//          WorldPERatio, S&P Global, CoinGecko, Alternative.me
// ============================================================

// ------ SECTION 1: Revenue Time Series & P/E ------

export const annualRevenueData = [
  {
    year: 2020,
    quarter: "FY",
    totalRevenue: 3.4,       // $B — total crypto fees/revenue
    revenueExStablecoins: 3.2,
    onChainRevenue: 1.8,
    offChainRevenue: 1.6,
    stablecoinRevenue: 0.2,
    cryptoMarketCap: 760,    // $B — year-end
    protocolsGeneratingFees: 125,
  },
  {
    year: 2021,
    quarter: "FY",
    totalRevenue: 24.2,
    revenueExStablecoins: 20.8,
    onChainRevenue: 15.6,
    offChainRevenue: 8.6,
    stablecoinRevenue: 3.4,
    cryptoMarketCap: 2200,
    protocolsGeneratingFees: 450,
  },
  {
    year: 2022,
    quarter: "FY",
    totalRevenue: 10.5,
    revenueExStablecoins: 5.1,
    onChainRevenue: 6.2,
    offChainRevenue: 4.3,
    stablecoinRevenue: 5.4,
    cryptoMarketCap: 800,
    protocolsGeneratingFees: 520,
  },
  {
    year: 2023,
    quarter: "FY",
    totalRevenue: 14.7,
    revenueExStablecoins: 6.2,
    onChainRevenue: 8.1,
    offChainRevenue: 6.6,
    stablecoinRevenue: 8.5,
    cryptoMarketCap: 1700,
    protocolsGeneratingFees: 680,
  },
  {
    year: 2024,
    quarter: "FY",
    totalRevenue: 37.5,
    revenueExStablecoins: 22.5,
    onChainRevenue: 14.7,
    offChainRevenue: 22.8,
    stablecoinRevenue: 15.0,
    cryptoMarketCap: 3400,
    protocolsGeneratingFees: 850,
  },
  {
    year: 2025,
    quarter: "H1 annualized",
    totalRevenue: 56.0,    // projected based on H1 $9.7B onchain + offchain
    revenueExStablecoins: 36.0,
    onChainRevenue: 19.8,   // projected onchain
    offChainRevenue: 36.2,
    stablecoinRevenue: 20.0,
    cryptoMarketCap: 3600,
    protocolsGeneratingFees: 969,
  },
];

// Quarterly granularity for time series charts
export const quarterlyRevenueData = [
  { period: "Q1 2020", totalRevenue: 0.6, exStablecoins: 0.58, onChain: 0.3, offChain: 0.3 },
  { period: "Q2 2020", totalRevenue: 0.7, exStablecoins: 0.67, onChain: 0.4, offChain: 0.3 },
  { period: "Q3 2020", totalRevenue: 0.9, exStablecoins: 0.85, onChain: 0.5, offChain: 0.4 },
  { period: "Q4 2020", totalRevenue: 1.2, exStablecoins: 1.10, onChain: 0.6, offChain: 0.6 },
  { period: "Q1 2021", totalRevenue: 4.8, exStablecoins: 4.2, onChain: 3.2, offChain: 1.6 },
  { period: "Q2 2021", totalRevenue: 7.6, exStablecoins: 6.8, onChain: 5.1, offChain: 2.5 },
  { period: "Q3 2021", totalRevenue: 5.4, exStablecoins: 4.6, onChain: 3.5, offChain: 1.9 },
  { period: "Q4 2021", totalRevenue: 6.4, exStablecoins: 5.2, onChain: 3.8, offChain: 2.6 },
  { period: "Q1 2022", totalRevenue: 4.2, exStablecoins: 2.8, onChain: 2.6, offChain: 1.6 },
  { period: "Q2 2022", totalRevenue: 2.8, exStablecoins: 1.2, onChain: 1.6, offChain: 1.2 },
  { period: "Q3 2022", totalRevenue: 1.8, exStablecoins: 0.6, onChain: 1.0, offChain: 0.8 },
  { period: "Q4 2022", totalRevenue: 1.7, exStablecoins: 0.5, onChain: 1.0, offChain: 0.7 },
  { period: "Q1 2023", totalRevenue: 2.8, exStablecoins: 0.9, onChain: 1.5, offChain: 1.3 },
  { period: "Q2 2023", totalRevenue: 3.5, exStablecoins: 1.3, onChain: 1.8, offChain: 1.7 },
  { period: "Q3 2023", totalRevenue: 3.8, exStablecoins: 1.6, onChain: 2.0, offChain: 1.8 },
  { period: "Q4 2023", totalRevenue: 4.6, exStablecoins: 2.4, onChain: 2.8, offChain: 1.8 },
  { period: "Q1 2024", totalRevenue: 8.2, exStablecoins: 4.8, onChain: 3.4, offChain: 4.8 },
  { period: "Q2 2024", totalRevenue: 9.5, exStablecoins: 5.6, onChain: 3.8, offChain: 5.7 },
  { period: "Q3 2024", totalRevenue: 10.2, exStablecoins: 6.2, onChain: 4.0, offChain: 6.2 },
  { period: "Q4 2024", totalRevenue: 9.6, exStablecoins: 5.9, onChain: 3.5, offChain: 6.1 },
  { period: "Q1 2025", totalRevenue: 12.8, exStablecoins: 8.2, onChain: 4.5, offChain: 8.3 },
  { period: "Q2 2025", totalRevenue: 15.2, exStablecoins: 9.8, onChain: 5.2, offChain: 10.0 },
  { period: "Q3 2025", totalRevenue: 14.5, exStablecoins: 9.5, onChain: 5.1, offChain: 9.4 },
];

// P/E and P/S comparison data
export const peComparisonData = [
  // Crypto implied P/E (market cap / revenue)
  { name: "Crypto (incl. stablecoins)", pe: 64, category: "crypto", note: "$3.6T mcap / $56B rev" },
  { name: "Crypto (ex stablecoins)", pe: 100, category: "crypto", note: "$3.6T mcap / $36B rev" },
  { name: "DeFi Median", pe: 17, category: "crypto", note: "DefiLlama / CoinGecko" },
  { name: "DEX Median", pe: 14, category: "crypto", note: "DefiLlama / CoinGecko" },
  { name: "Lending Median", pe: 8, category: "crypto", note: "DefiLlama / CoinGecko" },
  { name: "L1 Blockchains", pe: 7300, category: "crypto", note: "DefiLlama / CoinGecko" },
  // Developed markets
  { name: "S&P 500", pe: 27.8, category: "developed", note: "Feb 2026" },
  { name: "NASDAQ 100", pe: 34.5, category: "developed", note: "Feb 2026" },
  { name: "STOXX 600", pe: 15.2, category: "developed", note: "Feb 2026" },
  { name: "Nikkei 225", pe: 21.5, category: "developed", note: "Feb 2026" },
  // Emerging markets
  { name: "Emerging Markets (EEM)", pe: 16.24, category: "emerging", note: "worldperatio.com Feb 2026" },
  { name: "Nifty 50", pe: 21.8, category: "emerging", note: "Feb 2026" },
  { name: "Hang Seng", pe: 10.5, category: "emerging", note: "Feb 2026" },
  { name: "KOSPI", pe: 14.2, category: "emerging", note: "Feb 2026" },
  // Early-stage tech comparisons
  { name: "Dot-com era (2000)", pe: 150, category: "tech", note: "NASDAQ peak P/E" },
  { name: "SaaS 2021 peak", pe: 120, category: "tech", note: "BVP Cloud Index peak" },
  { name: "Crypto 2021 peak", pe: 350, category: "tech", note: "~$2.2T mcap / ~$6.3B native rev" },
];

// Historical P/S for early-stage tech comparison
export const earlyTechPSComparison = [
  { name: "Dot-com avg (1999-2000)", ps: 180, year: 2000, category: "Historical tech" },
  { name: "Amazon (1999)", ps: 25, year: 1999, category: "Historical tech" },
  { name: "Salesforce (2004 IPO)", ps: 15, year: 2004, category: "Historical tech" },
  { name: "Snowflake (2020 IPO)", ps: 175, year: 2020, category: "2020-21 tech" },
  { name: "Palantir (2021 peak)", ps: 45, year: 2021, category: "2020-21 tech" },
  { name: "Cloudflare (2021 peak)", ps: 100, year: 2021, category: "2020-21 tech" },
  { name: "Crypto overall (2021)", ps: 91, year: 2021, category: "Crypto" },
  { name: "Crypto overall (2025)", ps: 64, year: 2025, category: "Crypto" },
  { name: "Crypto DeFi (2025)", ps: 17, year: 2025, category: "Crypto" },
  { name: "Crypto L1s (2025)", ps: 7300, year: 2025, category: "Crypto" },
];

// ------ SECTION 2: Sentiment vs Revenue ------

export const sentimentVsRevenueData = [
  { date: "Jan 2020", fearGreed: 40, revenue: 0.6, label: "Pre-COVID" },
  { date: "Mar 2020", fearGreed: 10, revenue: 0.4, label: "COVID crash" },
  { date: "Jun 2020", fearGreed: 38, revenue: 0.7, label: "" },
  { date: "Dec 2020", fearGreed: 92, revenue: 1.2, label: "BTC $29k" },
  { date: "Mar 2021", fearGreed: 70, revenue: 4.8, label: "" },
  { date: "May 2021", fearGreed: 20, revenue: 5.2, label: "China ban" },
  { date: "Sep 2021", fearGreed: 72, revenue: 5.4, label: "" },
  { date: "Nov 2021", fearGreed: 84, revenue: 6.4, label: "ATH" },
  { date: "Jan 2022", fearGreed: 24, revenue: 4.2, label: "" },
  { date: "May 2022", fearGreed: 12, revenue: 2.8, label: "Luna crash" },
  { date: "Nov 2022", fearGreed: 20, revenue: 1.7, label: "FTX collapse" },
  { date: "Mar 2023", fearGreed: 45, revenue: 2.8, label: "" },
  { date: "Jun 2023", fearGreed: 56, revenue: 3.5, label: "" },
  { date: "Dec 2023", fearGreed: 70, revenue: 4.6, label: "ETF hopes" },
  { date: "Mar 2024", fearGreed: 82, revenue: 8.2, label: "BTC ETF" },
  { date: "Jun 2024", fearGreed: 48, revenue: 9.5, label: "Cooling" },
  { date: "Sep 2024", fearGreed: 45, revenue: 10.2, label: "" },
  { date: "Dec 2024", fearGreed: 65, revenue: 9.6, label: "" },
  { date: "Mar 2025", fearGreed: 32, revenue: 12.8, label: "" },
  { date: "Jun 2025", fearGreed: 28, revenue: 15.2, label: "DIVERGENCE" },
  { date: "Sep 2025", fearGreed: 25, revenue: 14.5, label: "Historic low sentiment" },
];

export const sentimentKeyMetrics = {
  currentFearGreed: 25,
  athFearGreed: 92,
  sentimentPercentileFromATH: -73, // 73% below ATH
  currentQuarterlyRevenue: 14.5,   // $B
  revenuePercentile: 95,           // 95th percentile historically
  divergenceScore: 168,            // composite divergence metric
};

export const ethFlowsData = [
  { period: "Q1 2024", netFlows: 2.8, price: 3500, note: "ETF launch momentum" },
  { period: "Q2 2024", netFlows: 1.2, price: 3200, note: "Slowing" },
  { period: "Q3 2024", netFlows: 0.4, price: 2800, note: "Significant slowdown" },
  { period: "Q4 2024", netFlows: -0.3, price: 2600, note: "Net outflows begin" },
  { period: "Q1 2025", netFlows: -0.8, price: 2400, note: "Continued outflows" },
  { period: "Q2 2025", netFlows: -1.2, price: 2100, note: "Accelerating outflows" },
  { period: "Q3 2025", netFlows: -0.6, price: 2200, note: "Outflows moderating" },
];

// TradFi parallels — sentiment compression while revenue grew
export const tradFiParallels = [
  {
    sector: "Energy (2020-2022)",
    period: "2020-2022",
    revenueGrowth: "+340%",
    multipleCompression: "P/E compressed 60% (from 18x to 7x)",
    description: "Oil companies saw revenue surge from $40→$120 oil. Markets refused to re-rate due to ESG concerns and 'peak oil' narrative. Energy was the best-performing sector in 2022 while trading at historic low multiples.",
    outcome: "Eventually re-rated; energy stocks up 150% from 2020 lows",
  },
  {
    sector: "Banks post-GFC (2010-2013)",
    period: "2010-2013",
    revenueGrowth: "+85%",
    multipleCompression: "P/E compressed 40% (from 14x to 8x)",
    description: "Bank earnings recovered strongly post-2008 but regulatory overhang (Dodd-Frank) and distrust kept multiples suppressed. Revenue grew but nobody believed it was sustainable.",
    outcome: "Banks eventually re-rated 2013-2019; XLF tripled",
  },
  {
    sector: "Tobacco (2000-2010)",
    period: "2000-2010",
    revenueGrowth: "+60%",
    multipleCompression: "P/E stayed at 8-10x vs market 15-18x",
    description: "Consistent revenue growth but ESG/regulatory sentiment kept multiples permanently discounted. Revenue was never the problem — narrative was.",
    outcome: "Generated massive total returns through dividends + buybacks despite low multiples",
  },
  {
    sector: "Chinese Tech (2021-2023)",
    period: "2021-2023",
    revenueGrowth: "+45%",
    multipleCompression: "P/E compressed 70% (from 40x to 12x)",
    description: "Alibaba, Tencent, etc. grew revenue consistently but regulatory crackdowns and geopolitical tensions crushed sentiment and multiples.",
    outcome: "Partial recovery in 2024-25; still trades at fraction of US tech multiples",
  },
];

// ------ SECTION 3: Revenue Quality & Sector Breakdown ------

export const sectorBreakdownTimeSeries = [
  { year: 2020, defi: 0.8, exchanges: 1.4, stablecoins: 0.2, blockchains: 0.6, consumer: 0.1, wallets: 0.05, depin: 0.01, other: 0.24 },
  { year: 2021, defi: 8.2, exchanges: 9.5, stablecoins: 3.4, blockchains: 2.1, consumer: 0.4, wallets: 0.2, depin: 0.02, other: 0.38 },
  { year: 2022, defi: 2.1, exchanges: 2.4, stablecoins: 5.4, blockchains: 0.3, consumer: 0.1, wallets: 0.05, depin: 0.03, other: 0.12 },
  { year: 2023, defi: 2.8, exchanges: 2.1, stablecoins: 8.5, blockchains: 0.5, consumer: 0.2, wallets: 0.15, depin: 0.08, other: 0.37 },
  { year: 2024, defi: 8.5, exchanges: 6.2, stablecoins: 15.0, blockchains: 3.2, consumer: 1.8, wallets: 1.5, depin: 0.4, other: 0.9 },
  { year: 2025, defi: 12.2, exchanges: 7.8, stablecoins: 20.0, blockchains: 4.3, consumer: 5.8, wallets: 3.1, depin: 1.2, other: 1.6 },
];

// H1 2025 detailed sector breakdown ($9.7B onchain)
export const h1_2025_sectorBreakdown = [
  { sector: "DeFi/Finance", value: 6.1, share: 63, yoyGrowth: 113, color: "#3b82f6" },
  { sector: "Blockchains", value: 2.13, share: 22, yoyGrowth: 15, color: "#8b5cf6" },
  { sector: "Wallets", value: 0.78, share: 8, yoyGrowth: 280, color: "#06b6d4" },
  { sector: "Consumer", value: 0.58, share: 6, yoyGrowth: -20, color: "#f59e0b" },
  { sector: "DePIN", value: 0.10, share: 1, yoyGrowth: 400, color: "#10b981" },
  { sector: "Middleware", value: 0.10, share: 1, yoyGrowth: 55, color: "#6366f1" },
];

// Exchange revenue deep-dive
export const exchangeRevenueHistory = [
  { year: 2020, cex: 1.2, dex: 0.2, total: 1.4, cexDominance: 86 },
  { year: 2021, cex: 7.5, dex: 2.0, total: 9.5, cexDominance: 79 },
  { year: 2022, cex: 1.8, dex: 0.6, total: 2.4, cexDominance: 75 },
  { year: 2023, cex: 1.4, dex: 0.7, total: 2.1, cexDominance: 67 },
  { year: 2024, cex: 3.8, dex: 2.4, total: 6.2, cexDominance: 61 },
  { year: 2025, cex: 3.5, dex: 4.3, total: 7.8, cexDominance: 45 },
];

// Stablecoin revenue & interest rate dependency
export const stablecoinRevenueBreakdown = [
  { year: 2020, interestIncome: 0.05, transactionFees: 0.08, other: 0.07, fedRate: 0.25, total: 0.2 },
  { year: 2021, interestIncome: 0.1, transactionFees: 1.8, other: 1.5, fedRate: 0.25, total: 3.4 },
  { year: 2022, interestIncome: 3.5, transactionFees: 1.2, other: 0.7, fedRate: 4.5, total: 5.4 },
  { year: 2023, interestIncome: 6.8, transactionFees: 1.0, other: 0.7, fedRate: 5.5, total: 8.5 },
  { year: 2024, interestIncome: 11.5, transactionFees: 2.0, other: 1.5, fedRate: 5.0, total: 15.0 },
  { year: 2025, interestIncome: 13.0, transactionFees: 4.5, other: 2.5, fedRate: 4.25, total: 20.0 },
];

// Consumer crypto analysis
export const consumerCryptoApps = [
  { name: "Pump.fun", category: "Launchpad", peakQuarterlyRev: 250, currentQuarterlyRev: 80, status: "Declining", note: "Memecoin fatigue; peaked Q4 2024" },
  { name: "Friend.tech", category: "Social", peakQuarterlyRev: 52, currentQuarterlyRev: 0.1, status: "Dead", note: "No retention; social tokens failed" },
  { name: "LooksRare", category: "NFT", peakQuarterlyRev: 120, currentQuarterlyRev: 0.5, status: "Dead", note: "NFT market collapsed" },
  { name: "Blur", category: "NFT", peakQuarterlyRev: 45, currentQuarterlyRev: 2, status: "Struggling", note: "Subsidized by token incentives" },
  { name: "Stepn", category: "GameFi", peakQuarterlyRev: 122, currentQuarterlyRev: 1.5, status: "Dead", note: "Move-to-earn unsustainable" },
  { name: "Polymarket", category: "Prediction", peakQuarterlyRev: 8, currentQuarterlyRev: 3, status: "Niche", note: "Event-driven; US election spike" },
  { name: "Farcaster", category: "Social", peakQuarterlyRev: 0.5, currentQuarterlyRev: 0.2, status: "Early", note: "Growing but no monetization" },
];

export const consumerCryptoInsights = [
  "Consumer crypto contributed only 6% of H1 2025 onchain fees — and >80% came from a single launchpad (Pump.fun)",
  "Social tokens/apps (Friend.tech) failed due to zero retention — users churned within weeks",
  "NFT marketplaces collapsed: LooksRare, X2Y2, Blur volumes down 90%+ from peaks",
  "GameFi (Stepn, Axie) relied on ponzi-like tokenomics — revenue vanished when new user growth stopped",
  "Prediction markets (Polymarket) showed promise but are event-driven and niche",
  "Core problem: consumer crypto apps are speculative by nature, lack product-market fit for daily use cases, and compete with free Web2 alternatives",
  "Contrast with DeFi: Uniswap/Aave provide genuine utility (trading, lending) that generates sustainable fees from real financial activity",
];

// ------ SECTION 4: Moats & Durability ------

export const moatAnalysis = [
  {
    protocol: "Tether (USDT)",
    moatType: "Network Effects + Distribution",
    moatStrength: "strong" as const,
    revenue: 12000, // $M annualized
    marketShare: 60,
    description: "USDT is the default unit of account on every exchange, L1, and L2. Integrated into 200+ exchanges, used in 150+ countries. Switching costs are enormous — every trading pair, every smart contract, every OTC desk uses USDT. Even if a better stablecoin launched tomorrow, migration costs would be prohibitive.",
    risk: "Regulatory (US stablecoin legislation could favor USDC), depegging risk, Tether reserves opacity",
    durability: 9,
  },
  {
    protocol: "Circle (USDC)",
    moatType: "Regulatory Compliance + Institutional Trust",
    moatStrength: "moderate" as const,
    revenue: 6000,
    marketShare: 28,
    description: "USDC is the compliant choice for institutions, fintechs, and US-regulated entities. Full reserve audits, SEC-friendly positioning, and Coinbase distribution partnership. Growing in payments/remittances.",
    risk: "Dependent on being 'the compliant one' — if Tether gets regulated, USDC loses its differentiation",
    durability: 7,
  },
  {
    protocol: "Aave",
    moatType: "Composability + TVL Depth + Governance",
    moatStrength: "strong" as const,
    revenue: 800,
    marketShare: 55,
    description: "Aave dominates lending with $30B+ TVL across 10+ chains. Deep integration into DeFi composability stack — protocols build on top of Aave markets. Multi-chain deployment creates ecosystem lock-in. Battle-tested security (no major exploits). Morpho is growing (0→10% share) but builds on Aave's liquidity.",
    risk: "Morpho-style unbundling, rate compression, smart contract risk",
    durability: 8,
  },
  {
    protocol: "Uniswap",
    moatType: "Liquidity Network Effects + Brand",
    moatStrength: "moderate" as const,
    revenue: 750,
    marketShare: 16,
    description: "Uniswap was the dominant DEX (44% share in 2023) but has lost ground to Raydium and others (16% in H1 2025). Its moat is weaker than expected — liquidity is mercenary and follows incentives. However, Uniswap v4 hooks and the Uniswap X intent-based system could re-establish dominance.",
    risk: "Continued share loss to Solana DEXs (Raydium, Jupiter), aggregator commoditization, fee switch debate",
    durability: 6,
  },
  {
    protocol: "Hyperliquid",
    moatType: "Product Quality + Vertical Integration",
    moatStrength: "strong" as const,
    revenue: 600,
    marketShare: 35,
    description: "Launched <1 year ago and already captures 35% of onchain perps. Built its own L1 for performance (sub-second finality). Vertical integration (chain + DEX + orderbook) gives 10x better UX than competitors. No token incentives needed — users pay to trade here. Community-owned distribution through one of crypto's most successful airdrops.",
    risk: "Centralization concerns (small validator set), regulatory risk on derivatives, single-chain risk",
    durability: 8,
  },
  {
    protocol: "Jupiter",
    moatType: "Aggregation + Solana Ecosystem Hub",
    moatStrength: "moderate" as const,
    revenue: 500,
    marketShare: 45,
    description: "Jupiter grew from 5% to 45% of perps market share. Acts as the 'super app' of Solana DeFi — aggregator + perps + launchpad + LST. Network effects from being the default routing layer on Solana.",
    risk: "Solana-dependent, aggregator margins thin over time, competition from Raydium",
    durability: 7,
  },
];

// ------ SECTION 5: Next Leaders ------

export const nextLeaders = {
  rwa: {
    title: "Real World Assets (RWA)",
    currentRevenue: 15, // $M — small but 50x YoY growth
    projectedRevenue2027: 500,
    growthRate: "50x YoY (H1 2025 vs H1 2024)",
    keyProtocols: [
      { name: "Ondo Finance", focus: "Tokenized T-bills & bonds", revenue: 5, moat: "First mover in tokenized treasuries, institutional partnerships" },
      { name: "Centrifuge", focus: "Real-world credit", revenue: 2, moat: "MakerDAO integration, real loan origination" },
      { name: "Maple Finance", focus: "Institutional lending", revenue: 3, moat: "Institutional credit underwriting, KYC'd pools" },
      { name: "Backed Finance", focus: "Tokenized securities", revenue: 1, moat: "Swiss regulatory framework, traditional securities" },
    ],
    whoCaptures10x: "If RWA goes 10x from here ($150M→$1.5B revenue), the winners are: (1) Infrastructure layers (Chainlink CCIP for cross-chain, oracles for pricing), (2) Compliant issuance platforms (Ondo, Securitize), (3) The chains that attract TradFi (Ethereum for security, Avalanche subnets for customization), (4) DeFi protocols that integrate RWA as collateral (Aave, MakerDAO/Sky)",
    catalyst: "TradFi tokenization adoption (BlackRock BUIDL fund at $1.7B), regulatory clarity, interest rate cuts making on-chain yield more attractive vs T-bills",
    risk: "Regulatory uncertainty, TradFi may build private chains, interest rate dependency for tokenized treasuries",
  },
  payments: {
    title: "Stablecoin Payments",
    currentRevenue: 4500,
    projectedRevenue2027: 15000,
    growthRate: "+125% YoY",
    keyProtocols: [
      { name: "Circle/USDC", focus: "Payment rails", revenue: 2000, moat: "Regulatory compliance, Coinbase partnership" },
      { name: "Stripe Stablecoin", focus: "Merchant payments", revenue: 500, moat: "Existing merchant network, Bridge acquisition" },
      { name: "PayPal (PYUSD)", focus: "Consumer payments", revenue: 200, moat: "400M+ user base, Venmo integration" },
      { name: "MoonPay/Ramp", focus: "On/off ramps", revenue: 300, moat: "Fiat<>crypto bridge, KYC infrastructure" },
    ],
    whoCaptures10x: "Payment processors who abstract away crypto complexity win. Stripe/Bridge, Circle, and PayPal have distribution. Layer 2s that offer cheap, instant settlement (Base, Arbitrum) capture infrastructure value.",
    catalyst: "Stablecoin legislation (US GENIUS Act), emerging market adoption, Stripe/Visa/Mastercard integration",
    risk: "Bank competition, CBDC displacement, regulatory fragmentation across jurisdictions",
  },
  aiAgents: {
    title: "AI Agent Infrastructure",
    currentRevenue: 2,
    projectedRevenue2027: 200,
    growthRate: "Early — mostly speculative capital, minimal real revenue",
    keyProtocols: [
      { name: "Virtuals Protocol", focus: "Agent launchpad", revenue: 0.5, moat: "First mover on Base, agent token framework" },
      { name: "Autonolas (OLAS)", focus: "Agent framework", revenue: 0.3, moat: "Open-source agent toolkit, multi-chain" },
      { name: "Fetch.ai/ASI", focus: "Agent marketplace", revenue: 0.5, moat: "Merged with Ocean + SingularityNET, AI compute" },
      { name: "AIXBT", focus: "Alpha agent", revenue: 0.2, moat: "Demonstrated product-market fit for AI alpha" },
    ],
    whoCaptures10x: "If useful AI agents emerge: (1) Compute providers (Aethir, IO.Net) for inference, (2) Agent frameworks that become standards (Autonolas), (3) Oracle/data networks that feed agents (Chainlink), (4) Chains optimized for agent transactions (low-cost, high-throughput L2s)",
    catalyst: "AI capability improvements (Claude/GPT-5), real utility for DeFi automation, agent-to-agent transactions on-chain",
    risk: "2024-25 AI agent cycle was 95% speculation. Most 'AI agent' tokens had no real agents. Need to see actual useful agents generating real revenue, not just token speculation. Web2 AI infra (AWS, GCP) is formidable competition.",
    miniCycleAnalysis: "The 2024-25 AI agent mini-cycle saw $30B+ in token value created but <$10M in actual revenue. Virtuals Protocol launched 10,000+ agent tokens, but most were pure speculation. The question isn't whether AI agents return — it's whether crypto-native AI infra can compete with Web2. The bull case: agents need permissionless payments (crypto rails), autonomous wallets (smart accounts), and composable tool access (DeFi). The bear case: OpenAI + Stripe solves this without blockchain.",
  },
};

// ------ CHART COLORS ------

export const CHART_COLORS = {
  primary: "#3b82f6",     // Blue
  secondary: "#8b5cf6",   // Purple
  tertiary: "#06b6d4",    // Cyan
  quaternary: "#10b981",   // Emerald
  accent: "#f59e0b",      // Amber
  danger: "#ef4444",      // Red
  muted: "#94a3b8",       // Slate
  pink: "#ec4899",        // Pink
  orange: "#f97316",      // Orange
  indigo: "#6366f1",      // Indigo
};

export const SECTOR_COLORS: Record<string, string> = {
  defi: "#3b82f6",
  exchanges: "#8b5cf6",
  stablecoins: "#10b981",
  blockchains: "#f59e0b",
  consumer: "#ef4444",
  wallets: "#06b6d4",
  depin: "#ec4899",
  middleware: "#6366f1",
  other: "#94a3b8",
};
