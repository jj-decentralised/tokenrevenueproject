export interface RevenueDataPoint {
  year: number;
  quarter?: string;
  totalRevenue: number;
  revenueExStablecoins: number;
  onChainRevenue: number;
  offChainRevenue: number;
  cryptoMarketCap: number;
  impliedPE?: number;
  impliedPS?: number;
}

export interface PEComparison {
  name: string;
  pe: number;
  category: "crypto" | "developed" | "emerging" | "tech";
  year?: number;
}

export interface SentimentDataPoint {
  date: string;
  fearGreedIndex: number;
  revenue: number;
  revenuePercentile: number;
  sentimentPercentileFromATH: number;
}

export interface SectorRevenue {
  year: number;
  quarter?: string;
  defi: number;
  exchanges: number;
  stablecoins: number;
  blockchains: number;
  consumer: number;
  wallets: number;
  depin: number;
  middleware: number;
}

export interface ProtocolRevenue {
  name: string;
  sector: string;
  revenue: number;
  revenueGrowthYoY: number;
  marketCap?: number;
  priceToFee?: number;
  moat?: string;
}

export interface MoatAnalysis {
  protocol: string;
  moatType: string;
  moatStrength: "strong" | "moderate" | "weak";
  description: string;
  revenue: number;
  marketShare: number;
}

export interface TradFiParallel {
  sector: string;
  period: string;
  revenueGrowth: string;
  multipleCompression: string;
  outcome: string;
}

export interface NextLeader {
  sector: string;
  protocols: string[];
  currentRevenue: number;
  projectedRevenue: number;
  catalyst: string;
  risk: string;
}

export interface ChartColors {
  primary: string;
  secondary: string;
  tertiary: string;
  quaternary: string;
  accent: string;
}
