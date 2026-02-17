// ============================================================
// P/S RATIO COMPARISON DATA — Dot-Com Boom vs Crypto Era
//
// Sources (Dot-Com): SEC 10-K filings, MacroTrends, Jay Ritter
//   (U of Florida) IPO data, Multpl.com, CFA Institute archives,
//   Bloomberg terminal snapshots, Barron's / WSJ archives
//
// Sources (Crypto): DefiLlama, TokenTerminal, CoinGecko,
//   Messari, The Block Research, Dune Analytics
//
// Methodology: P/S = Market Cap / Trailing 12-Month Revenue
//   For dot-com companies: fiscal year revenue from 10-K filings
//   For crypto: annualized protocol revenue (fees × take rate)
//   null = company not yet public, delisted, or data unavailable
// ============================================================

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PSTimePoint {
  year: number;
  ps: number | null;
}

export interface DotComCompany {
  name: string;
  ticker: string;
  sector: "Internet" | "Software" | "Hardware" | "Networking" | "Semiconductors" | "Telecom";
  peakYear: number;
  peakPS: number;
  survived: boolean; // still exists as public entity or major acquisition (not bankrupt)
  psTimeSeries: PSTimePoint[]; // 1999-2004
  peakMarketCapB: number;
  peakRevenueB: number;
}

export interface CryptoProject {
  name: string;
  coinGeckoId: string;
  sector: "DeFi" | "Exchanges" | "Blockchains" | "Stablecoins" | "Consumer" | "Infrastructure" | "DePIN" | "Other";
  peakYear: number;
  peakPS: number;
  peakMarketCapB: number;
  peakRevenueB: number;
  stillActive: boolean;
  psTimeSeries: PSTimePoint[]; // 2021-2026 (2025-2026 null — filled live)
}

export interface MedianPSPoint {
  year: number;
  yearsFromPeak: number; // 0 = peak year (2000 for dot-com, 2021 for crypto)
  median: number;
  p10: number; // 10th percentile
  p25: number;
  p75: number;
  p90: number; // 90th percentile
  mean: number;
  count: number; // companies with data
}

// ---------------------------------------------------------------------------
// Dot-Com Companies (Top 50 by market cap at peak, 1999-2004)
// ---------------------------------------------------------------------------

export const dotComCompanies: DotComCompany[] = [
  // ---- INTERNET ----
  {
    name: "Yahoo",
    ticker: "YHOO",
    sector: "Internet",
    peakYear: 2000,
    peakPS: 88,
    survived: false, // Acquired by Verizon 2017, effectively dead
    psTimeSeries: [
      { year: 1999, ps: 215 },
      { year: 2000, ps: 88 },
      { year: 2001, ps: 14 },
      { year: 2002, ps: 8.5 },
      { year: 2003, ps: 12 },
      { year: 2004, ps: 11 },
    ],
    peakMarketCapB: 125,
    peakRevenueB: 1.4,
  },
  {
    name: "Amazon",
    ticker: "AMZN",
    sector: "Internet",
    peakYear: 1999,
    peakPS: 22,
    survived: true,
    psTimeSeries: [
      { year: 1999, ps: 22 },
      { year: 2000, ps: 5.3 },
      { year: 2001, ps: 3.2 },
      { year: 2002, ps: 2.5 },
      { year: 2003, ps: 2.8 },
      { year: 2004, ps: 2.7 },
    ],
    peakMarketCapB: 36,
    peakRevenueB: 1.6,
  },
  {
    name: "eBay",
    ticker: "EBAY",
    sector: "Internet",
    peakYear: 2000,
    peakPS: 102,
    survived: true,
    psTimeSeries: [
      { year: 1999, ps: 175 },
      { year: 2000, ps: 102 },
      { year: 2001, ps: 55 },
      { year: 2002, ps: 28 },
      { year: 2003, ps: 21 },
      { year: 2004, ps: 16 },
    ],
    peakMarketCapB: 30,
    peakRevenueB: 0.43,
  },
  {
    name: "AOL",
    ticker: "AOL",
    sector: "Internet",
    peakYear: 1999,
    peakPS: 22,
    survived: false, // Merged with Time Warner, eventually dissolved
    psTimeSeries: [
      { year: 1999, ps: 22 },
      { year: 2000, ps: 14 },
      { year: 2001, ps: 4.2 },
      { year: 2002, ps: 1.5 },
      { year: 2003, ps: 1.2 },
      { year: 2004, ps: 1.0 },
    ],
    peakMarketCapB: 165,
    peakRevenueB: 7.5,
  },
  {
    name: "Priceline",
    ticker: "PCLN",
    sector: "Internet",
    peakYear: 1999,
    peakPS: 55,
    survived: true, // Now Booking Holdings
    psTimeSeries: [
      { year: 1999, ps: 55 },
      { year: 2000, ps: 2.4 },
      { year: 2001, ps: 1.2 },
      { year: 2002, ps: 1.0 },
      { year: 2003, ps: 2.5 },
      { year: 2004, ps: 4.2 },
    ],
    peakMarketCapB: 22,
    peakRevenueB: 0.4,
  },
  {
    name: "RealNetworks",
    ticker: "RNWK",
    sector: "Internet",
    peakYear: 2000,
    peakPS: 45,
    survived: false,
    psTimeSeries: [
      { year: 1999, ps: 60 },
      { year: 2000, ps: 45 },
      { year: 2001, ps: 8.5 },
      { year: 2002, ps: 5.2 },
      { year: 2003, ps: 4.8 },
      { year: 2004, ps: 3.5 },
    ],
    peakMarketCapB: 13,
    peakRevenueB: 0.29,
  },
  {
    name: "DoubleClick",
    ticker: "DCLK",
    sector: "Internet",
    peakYear: 2000,
    peakPS: 32,
    survived: false, // Acquired by Google 2007
    psTimeSeries: [
      { year: 1999, ps: 50 },
      { year: 2000, ps: 32 },
      { year: 2001, ps: 4.5 },
      { year: 2002, ps: 3.2 },
      { year: 2003, ps: 3.5 },
      { year: 2004, ps: 4.0 },
    ],
    peakMarketCapB: 12,
    peakRevenueB: 0.38,
  },
  {
    name: "Lycos",
    ticker: "LCOS",
    sector: "Internet",
    peakYear: 2000,
    peakPS: 85,
    survived: false,
    psTimeSeries: [
      { year: 1999, ps: 110 },
      { year: 2000, ps: 85 },
      { year: 2001, ps: 6.2 },
      { year: 2002, ps: null },
      { year: 2003, ps: null },
      { year: 2004, ps: null },
    ],
    peakMarketCapB: 5.5,
    peakRevenueB: 0.065,
  },
  {
    name: "Excite@Home",
    ticker: "ATHM",
    sector: "Internet",
    peakYear: 2000,
    peakPS: 40,
    survived: false, // Bankrupt 2001
    psTimeSeries: [
      { year: 1999, ps: 55 },
      { year: 2000, ps: 40 },
      { year: 2001, ps: null },
      { year: 2002, ps: null },
      { year: 2003, ps: null },
      { year: 2004, ps: null },
    ],
    peakMarketCapB: 30,
    peakRevenueB: 0.75,
  },
  {
    name: "Ask Jeeves",
    ticker: "ASKJ",
    sector: "Internet",
    peakYear: 2000,
    peakPS: 160,
    survived: false, // Acquired by IAC 2005
    psTimeSeries: [
      { year: 1999, ps: 200 },
      { year: 2000, ps: 160 },
      { year: 2001, ps: 12 },
      { year: 2002, ps: 8.5 },
      { year: 2003, ps: 10 },
      { year: 2004, ps: 12 },
    ],
    peakMarketCapB: 4.8,
    peakRevenueB: 0.03,
  },
  {
    name: "Homestore",
    ticker: "HOMS",
    sector: "Internet",
    peakYear: 2000,
    peakPS: 75,
    survived: false, // Became Move Inc, acquired by News Corp
    psTimeSeries: [
      { year: 1999, ps: 95 },
      { year: 2000, ps: 75 },
      { year: 2001, ps: 4.5 },
      { year: 2002, ps: 2.8 },
      { year: 2003, ps: 3.2 },
      { year: 2004, ps: 3.5 },
    ],
    peakMarketCapB: 11,
    peakRevenueB: 0.15,
  },
  {
    name: "TheGlobe.com",
    ticker: "TGLO",
    sector: "Internet",
    peakYear: 1999,
    peakPS: 350,
    survived: false, // Bankrupt
    psTimeSeries: [
      { year: 1999, ps: 350 },
      { year: 2000, ps: 45 },
      { year: 2001, ps: null },
      { year: 2002, ps: null },
      { year: 2003, ps: null },
      { year: 2004, ps: null },
    ],
    peakMarketCapB: 0.84,
    peakRevenueB: 0.0024,
  },
  {
    name: "Pets.com",
    ticker: "IPET",
    sector: "Internet",
    peakYear: 2000,
    peakPS: 15,
    survived: false, // Bankrupt Nov 2000
    psTimeSeries: [
      { year: 1999, ps: null },
      { year: 2000, ps: 15 },
      { year: 2001, ps: null },
      { year: 2002, ps: null },
      { year: 2003, ps: null },
      { year: 2004, ps: null },
    ],
    peakMarketCapB: 0.3,
    peakRevenueB: 0.02,
  },
  {
    name: "Webvan",
    ticker: "WBVN",
    sector: "Internet",
    peakYear: 1999,
    peakPS: 38,
    survived: false, // Bankrupt 2001
    psTimeSeries: [
      { year: 1999, ps: 38 },
      { year: 2000, ps: 2.5 },
      { year: 2001, ps: null },
      { year: 2002, ps: null },
      { year: 2003, ps: null },
      { year: 2004, ps: null },
    ],
    peakMarketCapB: 7.5,
    peakRevenueB: 0.2,
  },
  {
    name: "eToys",
    ticker: "ETYS",
    sector: "Internet",
    peakYear: 1999,
    peakPS: 248,
    survived: false, // Bankrupt 2001
    psTimeSeries: [
      { year: 1999, ps: 248 },
      { year: 2000, ps: 8 },
      { year: 2001, ps: null },
      { year: 2002, ps: null },
      { year: 2003, ps: null },
      { year: 2004, ps: null },
    ],
    peakMarketCapB: 8,
    peakRevenueB: 0.032,
  },
  {
    name: "Drugstore.com",
    ticker: "DSCM",
    sector: "Internet",
    peakYear: 2000,
    peakPS: 28,
    survived: false, // Acquired by Walgreens 2011
    psTimeSeries: [
      { year: 1999, ps: 45 },
      { year: 2000, ps: 28 },
      { year: 2001, ps: 2.8 },
      { year: 2002, ps: 1.5 },
      { year: 2003, ps: 1.2 },
      { year: 2004, ps: 1.0 },
    ],
    peakMarketCapB: 3.5,
    peakRevenueB: 0.12,
  },

  // ---- NETWORKING ----
  {
    name: "Cisco Systems",
    ticker: "CSCO",
    sector: "Networking",
    peakYear: 2000,
    peakPS: 38,
    survived: true,
    psTimeSeries: [
      { year: 1999, ps: 30 },
      { year: 2000, ps: 38 },
      { year: 2001, ps: 8.5 },
      { year: 2002, ps: 6.5 },
      { year: 2003, ps: 6.0 },
      { year: 2004, ps: 5.5 },
    ],
    peakMarketCapB: 555,
    peakRevenueB: 14.6,
  },
  {
    name: "Juniper Networks",
    ticker: "JNPR",
    sector: "Networking",
    peakYear: 2000,
    peakPS: 210,
    survived: true,
    psTimeSeries: [
      { year: 1999, ps: 290 },
      { year: 2000, ps: 210 },
      { year: 2001, ps: 18 },
      { year: 2002, ps: 12 },
      { year: 2003, ps: 10 },
      { year: 2004, ps: 7.5 },
    ],
    peakMarketCapB: 75,
    peakRevenueB: 0.36,
  },
  {
    name: "JDS Uniphase",
    ticker: "JDSU",
    sector: "Networking",
    peakYear: 2000,
    peakPS: 175,
    survived: false, // Split into Viavi Solutions, effectively restructured
    psTimeSeries: [
      { year: 1999, ps: 250 },
      { year: 2000, ps: 175 },
      { year: 2001, ps: 5.5 },
      { year: 2002, ps: 3.2 },
      { year: 2003, ps: 4.5 },
      { year: 2004, ps: 4.0 },
    ],
    peakMarketCapB: 80,
    peakRevenueB: 0.46,
  },
  {
    name: "Nortel Networks",
    ticker: "NT",
    sector: "Networking",
    peakYear: 2000,
    peakPS: 12,
    survived: false, // Bankrupt 2009
    psTimeSeries: [
      { year: 1999, ps: 8.5 },
      { year: 2000, ps: 12 },
      { year: 2001, ps: 2.2 },
      { year: 2002, ps: 1.0 },
      { year: 2003, ps: 1.5 },
      { year: 2004, ps: 1.2 },
    ],
    peakMarketCapB: 250,
    peakRevenueB: 21,
  },
  {
    name: "Corning",
    ticker: "GLW",
    sector: "Networking",
    peakYear: 2000,
    peakPS: 22,
    survived: true,
    psTimeSeries: [
      { year: 1999, ps: 10 },
      { year: 2000, ps: 22 },
      { year: 2001, ps: 5.5 },
      { year: 2002, ps: 3.0 },
      { year: 2003, ps: 3.5 },
      { year: 2004, ps: 3.2 },
    ],
    peakMarketCapB: 100,
    peakRevenueB: 4.5,
  },
  {
    name: "Ciena",
    ticker: "CIEN",
    sector: "Networking",
    peakYear: 2000,
    peakPS: 135,
    survived: true,
    psTimeSeries: [
      { year: 1999, ps: 85 },
      { year: 2000, ps: 135 },
      { year: 2001, ps: 10 },
      { year: 2002, ps: 4.5 },
      { year: 2003, ps: 6.0 },
      { year: 2004, ps: 5.0 },
    ],
    peakMarketCapB: 42,
    peakRevenueB: 0.31,
  },
  {
    name: "Sycamore Networks",
    ticker: "SCMR",
    sector: "Networking",
    peakYear: 2000,
    peakPS: 1100,
    survived: false,
    psTimeSeries: [
      { year: 1999, ps: null },
      { year: 2000, ps: 1100 },
      { year: 2001, ps: 45 },
      { year: 2002, ps: 25 },
      { year: 2003, ps: 55 },
      { year: 2004, ps: 30 },
    ],
    peakMarketCapB: 45,
    peakRevenueB: 0.041,
  },
  {
    name: "Redback Networks",
    ticker: "RBAK",
    sector: "Networking",
    peakYear: 2000,
    peakPS: 190,
    survived: false, // Acquired by Ericsson 2007
    psTimeSeries: [
      { year: 1999, ps: 250 },
      { year: 2000, ps: 190 },
      { year: 2001, ps: 6.5 },
      { year: 2002, ps: 3.0 },
      { year: 2003, ps: 4.5 },
      { year: 2004, ps: 3.5 },
    ],
    peakMarketCapB: 25,
    peakRevenueB: 0.13,
  },
  {
    name: "Foundry Networks",
    ticker: "FDRY",
    sector: "Networking",
    peakYear: 2000,
    peakPS: 48,
    survived: false, // Acquired by Brocade 2008
    psTimeSeries: [
      { year: 1999, ps: 65 },
      { year: 2000, ps: 48 },
      { year: 2001, ps: 8 },
      { year: 2002, ps: 5.5 },
      { year: 2003, ps: 4.5 },
      { year: 2004, ps: 4.0 },
    ],
    peakMarketCapB: 15,
    peakRevenueB: 0.31,
  },

  // ---- SOFTWARE ----
  {
    name: "Microsoft",
    ticker: "MSFT",
    sector: "Software",
    peakYear: 2000,
    peakPS: 30,
    survived: true,
    psTimeSeries: [
      { year: 1999, ps: 24 },
      { year: 2000, ps: 30 },
      { year: 2001, ps: 12 },
      { year: 2002, ps: 9.5 },
      { year: 2003, ps: 8.5 },
      { year: 2004, ps: 7.5 },
    ],
    peakMarketCapB: 600,
    peakRevenueB: 20,
  },
  {
    name: "Oracle",
    ticker: "ORCL",
    sector: "Software",
    peakYear: 2000,
    peakPS: 25,
    survived: true,
    psTimeSeries: [
      { year: 1999, ps: 18 },
      { year: 2000, ps: 25 },
      { year: 2001, ps: 8 },
      { year: 2002, ps: 6.5 },
      { year: 2003, ps: 6.0 },
      { year: 2004, ps: 5.5 },
    ],
    peakMarketCapB: 220,
    peakRevenueB: 8.8,
  },
  {
    name: "Siebel Systems",
    ticker: "SEBL",
    sector: "Software",
    peakYear: 2000,
    peakPS: 42,
    survived: false, // Acquired by Oracle 2006
    psTimeSeries: [
      { year: 1999, ps: 35 },
      { year: 2000, ps: 42 },
      { year: 2001, ps: 8.5 },
      { year: 2002, ps: 5.2 },
      { year: 2003, ps: 4.5 },
      { year: 2004, ps: 3.8 },
    ],
    peakMarketCapB: 48,
    peakRevenueB: 1.15,
  },
  {
    name: "BEA Systems",
    ticker: "BEAS",
    sector: "Software",
    peakYear: 2000,
    peakPS: 52,
    survived: false, // Acquired by Oracle 2008
    psTimeSeries: [
      { year: 1999, ps: 38 },
      { year: 2000, ps: 52 },
      { year: 2001, ps: 8 },
      { year: 2002, ps: 4.5 },
      { year: 2003, ps: 4.0 },
      { year: 2004, ps: 3.5 },
    ],
    peakMarketCapB: 28,
    peakRevenueB: 0.54,
  },
  {
    name: "Ariba",
    ticker: "ARBA",
    sector: "Software",
    peakYear: 2000,
    peakPS: 550,
    survived: false, // Acquired by SAP 2012
    psTimeSeries: [
      { year: 1999, ps: 300 },
      { year: 2000, ps: 550 },
      { year: 2001, ps: 12 },
      { year: 2002, ps: 5.5 },
      { year: 2003, ps: 4.5 },
      { year: 2004, ps: 4.0 },
    ],
    peakMarketCapB: 35,
    peakRevenueB: 0.064,
  },
  {
    name: "Commerce One",
    ticker: "CMRC",
    sector: "Software",
    peakYear: 2000,
    peakPS: 400,
    survived: false, // Bankrupt 2004
    psTimeSeries: [
      { year: 1999, ps: 480 },
      { year: 2000, ps: 400 },
      { year: 2001, ps: 8 },
      { year: 2002, ps: 2.5 },
      { year: 2003, ps: 1.5 },
      { year: 2004, ps: null },
    ],
    peakMarketCapB: 22,
    peakRevenueB: 0.055,
  },
  {
    name: "i2 Technologies",
    ticker: "ITWO",
    sector: "Software",
    peakYear: 2000,
    peakPS: 95,
    survived: false, // Acquired by JDA Software 2010
    psTimeSeries: [
      { year: 1999, ps: 68 },
      { year: 2000, ps: 95 },
      { year: 2001, ps: 5.5 },
      { year: 2002, ps: 2.8 },
      { year: 2003, ps: 2.5 },
      { year: 2004, ps: 2.2 },
    ],
    peakMarketCapB: 28,
    peakRevenueB: 0.29,
  },
  {
    name: "Vignette",
    ticker: "VIGN",
    sector: "Software",
    peakYear: 2000,
    peakPS: 180,
    survived: false, // Acquired by OpenText 2009
    psTimeSeries: [
      { year: 1999, ps: 250 },
      { year: 2000, ps: 180 },
      { year: 2001, ps: 6 },
      { year: 2002, ps: 3.5 },
      { year: 2003, ps: 3.0 },
      { year: 2004, ps: 2.8 },
    ],
    peakMarketCapB: 15,
    peakRevenueB: 0.083,
  },
  {
    name: "BroadVision",
    ticker: "BVSN",
    sector: "Software",
    peakYear: 2000,
    peakPS: 220,
    survived: false,
    psTimeSeries: [
      { year: 1999, ps: 310 },
      { year: 2000, ps: 220 },
      { year: 2001, ps: 4 },
      { year: 2002, ps: 2.0 },
      { year: 2003, ps: 2.5 },
      { year: 2004, ps: 2.0 },
    ],
    peakMarketCapB: 12,
    peakRevenueB: 0.055,
  },

  // ---- HARDWARE ----
  {
    name: "Dell",
    ticker: "DELL",
    sector: "Hardware",
    peakYear: 2000,
    peakPS: 4.5,
    survived: true,
    psTimeSeries: [
      { year: 1999, ps: 3.5 },
      { year: 2000, ps: 4.5 },
      { year: 2001, ps: 2.2 },
      { year: 2002, ps: 2.0 },
      { year: 2003, ps: 1.8 },
      { year: 2004, ps: 1.5 },
    ],
    peakMarketCapB: 140,
    peakRevenueB: 31.2,
  },
  {
    name: "Sun Microsystems",
    ticker: "SUNW",
    sector: "Hardware",
    peakYear: 2000,
    peakPS: 12,
    survived: false, // Acquired by Oracle 2010
    psTimeSeries: [
      { year: 1999, ps: 8 },
      { year: 2000, ps: 12 },
      { year: 2001, ps: 2.5 },
      { year: 2002, ps: 1.5 },
      { year: 2003, ps: 1.2 },
      { year: 2004, ps: 1.0 },
    ],
    peakMarketCapB: 200,
    peakRevenueB: 16.5,
  },
  {
    name: "EMC Corporation",
    ticker: "EMC",
    sector: "Hardware",
    peakYear: 2000,
    peakPS: 30,
    survived: false, // Acquired by Dell 2016
    psTimeSeries: [
      { year: 1999, ps: 18 },
      { year: 2000, ps: 30 },
      { year: 2001, ps: 6 },
      { year: 2002, ps: 4.5 },
      { year: 2003, ps: 4.0 },
      { year: 2004, ps: 3.5 },
    ],
    peakMarketCapB: 215,
    peakRevenueB: 7.1,
  },
  {
    name: "Palm",
    ticker: "PALM",
    sector: "Hardware",
    peakYear: 2000,
    peakPS: 38,
    survived: false, // Acquired by HP 2010
    psTimeSeries: [
      { year: 1999, ps: null },
      { year: 2000, ps: 38 },
      { year: 2001, ps: 3.5 },
      { year: 2002, ps: 1.8 },
      { year: 2003, ps: 1.2 },
      { year: 2004, ps: 1.0 },
    ],
    peakMarketCapB: 53,
    peakRevenueB: 1.4,
  },
  {
    name: "Gateway",
    ticker: "GTW",
    sector: "Hardware",
    peakYear: 2000,
    peakPS: 1.2,
    survived: false, // Acquired by Acer 2007
    psTimeSeries: [
      { year: 1999, ps: 1.0 },
      { year: 2000, ps: 1.2 },
      { year: 2001, ps: 0.3 },
      { year: 2002, ps: 0.25 },
      { year: 2003, ps: 0.3 },
      { year: 2004, ps: 0.35 },
    ],
    peakMarketCapB: 10,
    peakRevenueB: 8.6,
  },
  {
    name: "Compaq",
    ticker: "CPQ",
    sector: "Hardware",
    peakYear: 2000,
    peakPS: 1.5,
    survived: false, // Acquired by HP 2002
    psTimeSeries: [
      { year: 1999, ps: 1.2 },
      { year: 2000, ps: 1.5 },
      { year: 2001, ps: 0.5 },
      { year: 2002, ps: null },
      { year: 2003, ps: null },
      { year: 2004, ps: null },
    ],
    peakMarketCapB: 50,
    peakRevenueB: 33,
  },

  // ---- SEMICONDUCTORS ----
  {
    name: "Intel",
    ticker: "INTC",
    sector: "Semiconductors",
    peakYear: 2000,
    peakPS: 15,
    survived: true,
    psTimeSeries: [
      { year: 1999, ps: 11 },
      { year: 2000, ps: 15 },
      { year: 2001, ps: 6.5 },
      { year: 2002, ps: 5.0 },
      { year: 2003, ps: 5.5 },
      { year: 2004, ps: 5.0 },
    ],
    peakMarketCapB: 509,
    peakRevenueB: 33.7,
  },
  {
    name: "Qualcomm",
    ticker: "QCOM",
    sector: "Semiconductors",
    peakYear: 2000,
    peakPS: 52,
    survived: true,
    psTimeSeries: [
      { year: 1999, ps: 85 },
      { year: 2000, ps: 52 },
      { year: 2001, ps: 18 },
      { year: 2002, ps: 12 },
      { year: 2003, ps: 10 },
      { year: 2004, ps: 8.5 },
    ],
    peakMarketCapB: 165,
    peakRevenueB: 3.2,
  },
  {
    name: "Broadcom",
    ticker: "BRCM",
    sector: "Semiconductors",
    peakYear: 2000,
    peakPS: 85,
    survived: true,
    psTimeSeries: [
      { year: 1999, ps: 120 },
      { year: 2000, ps: 85 },
      { year: 2001, ps: 12 },
      { year: 2002, ps: 8.5 },
      { year: 2003, ps: 8.0 },
      { year: 2004, ps: 6.5 },
    ],
    peakMarketCapB: 60,
    peakRevenueB: 0.71,
  },
  {
    name: "Applied Micro",
    ticker: "AMCC",
    sector: "Semiconductors",
    peakYear: 2000,
    peakPS: 660,
    survived: false, // Acquired by MACOM 2017
    psTimeSeries: [
      { year: 1999, ps: 400 },
      { year: 2000, ps: 660 },
      { year: 2001, ps: 30 },
      { year: 2002, ps: 15 },
      { year: 2003, ps: 12 },
      { year: 2004, ps: 10 },
    ],
    peakMarketCapB: 20,
    peakRevenueB: 0.03,
  },
  {
    name: "PMC-Sierra",
    ticker: "PMCS",
    sector: "Semiconductors",
    peakYear: 2000,
    peakPS: 140,
    survived: false, // Acquired by Microsemi 2016
    psTimeSeries: [
      { year: 1999, ps: 95 },
      { year: 2000, ps: 140 },
      { year: 2001, ps: 15 },
      { year: 2002, ps: 8 },
      { year: 2003, ps: 7 },
      { year: 2004, ps: 6 },
    ],
    peakMarketCapB: 28,
    peakRevenueB: 0.2,
  },
  {
    name: "Vitesse Semiconductor",
    ticker: "VTSS",
    sector: "Semiconductors",
    peakYear: 2000,
    peakPS: 310,
    survived: false, // Acquired by Microsemi 2015
    psTimeSeries: [
      { year: 1999, ps: 200 },
      { year: 2000, ps: 310 },
      { year: 2001, ps: 18 },
      { year: 2002, ps: 8 },
      { year: 2003, ps: 6 },
      { year: 2004, ps: 5 },
    ],
    peakMarketCapB: 12,
    peakRevenueB: 0.039,
  },

  // ---- TELECOM ----
  {
    name: "WorldCom",
    ticker: "WCOM",
    sector: "Telecom",
    peakYear: 1999,
    peakPS: 5.5,
    survived: false, // Bankrupt 2002 (fraud)
    psTimeSeries: [
      { year: 1999, ps: 5.5 },
      { year: 2000, ps: 2.8 },
      { year: 2001, ps: 1.0 },
      { year: 2002, ps: null },
      { year: 2003, ps: null },
      { year: 2004, ps: null },
    ],
    peakMarketCapB: 190,
    peakRevenueB: 35,
  },
  {
    name: "Global Crossing",
    ticker: "GLBC",
    sector: "Telecom",
    peakYear: 2000,
    peakPS: 18,
    survived: false, // Bankrupt 2002
    psTimeSeries: [
      { year: 1999, ps: 28 },
      { year: 2000, ps: 18 },
      { year: 2001, ps: 1.2 },
      { year: 2002, ps: null },
      { year: 2003, ps: null },
      { year: 2004, ps: null },
    ],
    peakMarketCapB: 48,
    peakRevenueB: 2.7,
  },
  {
    name: "Winstar Communications",
    ticker: "WCII",
    sector: "Telecom",
    peakYear: 2000,
    peakPS: 35,
    survived: false, // Bankrupt 2001
    psTimeSeries: [
      { year: 1999, ps: 55 },
      { year: 2000, ps: 35 },
      { year: 2001, ps: null },
      { year: 2002, ps: null },
      { year: 2003, ps: null },
      { year: 2004, ps: null },
    ],
    peakMarketCapB: 12,
    peakRevenueB: 0.34,
  },
  {
    name: "ITC DeltaCom",
    ticker: "ITCD",
    sector: "Telecom",
    peakYear: 2000,
    peakPS: 12,
    survived: false, // Bankrupt 2009
    psTimeSeries: [
      { year: 1999, ps: 15 },
      { year: 2000, ps: 12 },
      { year: 2001, ps: 2.0 },
      { year: 2002, ps: 0.8 },
      { year: 2003, ps: 0.7 },
      { year: 2004, ps: 0.6 },
    ],
    peakMarketCapB: 5.2,
    peakRevenueB: 0.43,
  },
];

// ---------------------------------------------------------------------------
// Crypto Projects (Top 50 by market cap, 2021-2026)
// P/S = FDV or Market Cap / Annualized Protocol Revenue
// 2025-2026 values are null — filled from live API data
// ---------------------------------------------------------------------------

export const cryptoProjects: CryptoProject[] = [
  // ---- BLOCKCHAINS ----
  {
    name: "Ethereum",
    coinGeckoId: "ethereum",
    sector: "Blockchains",
    peakYear: 2021,
    peakPS: 95,
    peakMarketCapB: 560,
    peakRevenueB: 5.9,
    stillActive: true,
    psTimeSeries: [
      { year: 2021, ps: 95 },
      { year: 2022, ps: 180 },
      { year: 2023, ps: 125 },
      { year: 2024, ps: 150 },
      { year: 2025, ps: null },
      { year: 2026, ps: null },
    ],
  },
  {
    name: "Solana",
    coinGeckoId: "solana",
    sector: "Blockchains",
    peakYear: 2021,
    peakPS: 1200,
    peakMarketCapB: 77,
    peakRevenueB: 0.064,
    stillActive: true,
    psTimeSeries: [
      { year: 2021, ps: 1200 },
      { year: 2022, ps: 450 },
      { year: 2023, ps: 280 },
      { year: 2024, ps: 85 },
      { year: 2025, ps: null },
      { year: 2026, ps: null },
    ],
  },
  {
    name: "BNB Chain",
    coinGeckoId: "binancecoin",
    sector: "Blockchains",
    peakYear: 2021,
    peakPS: 45,
    peakMarketCapB: 105,
    peakRevenueB: 2.3,
    stillActive: true,
    psTimeSeries: [
      { year: 2021, ps: 45 },
      { year: 2022, ps: 65 },
      { year: 2023, ps: 55 },
      { year: 2024, ps: 40 },
      { year: 2025, ps: null },
      { year: 2026, ps: null },
    ],
  },
  {
    name: "Avalanche",
    coinGeckoId: "avalanche-2",
    sector: "Blockchains",
    peakYear: 2021,
    peakPS: 850,
    peakMarketCapB: 30,
    peakRevenueB: 0.035,
    stillActive: true,
    psTimeSeries: [
      { year: 2021, ps: 850 },
      { year: 2022, ps: 320 },
      { year: 2023, ps: 200 },
      { year: 2024, ps: 150 },
      { year: 2025, ps: null },
      { year: 2026, ps: null },
    ],
  },
  {
    name: "Polygon",
    coinGeckoId: "matic-network",
    sector: "Blockchains",
    peakYear: 2021,
    peakPS: 420,
    peakMarketCapB: 20,
    peakRevenueB: 0.048,
    stillActive: true,
    psTimeSeries: [
      { year: 2021, ps: 420 },
      { year: 2022, ps: 180 },
      { year: 2023, ps: 140 },
      { year: 2024, ps: 100 },
      { year: 2025, ps: null },
      { year: 2026, ps: null },
    ],
  },
  {
    name: "Cardano",
    coinGeckoId: "cardano",
    sector: "Blockchains",
    peakYear: 2021,
    peakPS: 9500,
    peakMarketCapB: 94,
    peakRevenueB: 0.01,
    stillActive: true,
    psTimeSeries: [
      { year: 2021, ps: 9500 },
      { year: 2022, ps: 5200 },
      { year: 2023, ps: 3800 },
      { year: 2024, ps: 2500 },
      { year: 2025, ps: null },
      { year: 2026, ps: null },
    ],
  },
  {
    name: "Polkadot",
    coinGeckoId: "polkadot",
    sector: "Blockchains",
    peakYear: 2021,
    peakPS: 6800,
    peakMarketCapB: 55,
    peakRevenueB: 0.008,
    stillActive: true,
    psTimeSeries: [
      { year: 2021, ps: 6800 },
      { year: 2022, ps: 3200 },
      { year: 2023, ps: 2200 },
      { year: 2024, ps: 1500 },
      { year: 2025, ps: null },
      { year: 2026, ps: null },
    ],
  },
  {
    name: "Cosmos",
    coinGeckoId: "cosmos",
    sector: "Blockchains",
    peakYear: 2022,
    peakPS: 2200,
    peakMarketCapB: 12,
    peakRevenueB: 0.005,
    stillActive: true,
    psTimeSeries: [
      { year: 2021, ps: 1800 },
      { year: 2022, ps: 2200 },
      { year: 2023, ps: 1500 },
      { year: 2024, ps: 900 },
      { year: 2025, ps: null },
      { year: 2026, ps: null },
    ],
  },
  {
    name: "Near Protocol",
    coinGeckoId: "near",
    sector: "Blockchains",
    peakYear: 2022,
    peakPS: 2800,
    peakMarketCapB: 13,
    peakRevenueB: 0.0047,
    stillActive: true,
    psTimeSeries: [
      { year: 2021, ps: 2000 },
      { year: 2022, ps: 2800 },
      { year: 2023, ps: 1200 },
      { year: 2024, ps: 500 },
      { year: 2025, ps: null },
      { year: 2026, ps: null },
    ],
  },
  {
    name: "Fantom",
    coinGeckoId: "fantom",
    sector: "Blockchains",
    peakYear: 2022,
    peakPS: 500,
    peakMarketCapB: 7,
    peakRevenueB: 0.014,
    stillActive: true,
    psTimeSeries: [
      { year: 2021, ps: 350 },
      { year: 2022, ps: 500 },
      { year: 2023, ps: 280 },
      { year: 2024, ps: 150 },
      { year: 2025, ps: null },
      { year: 2026, ps: null },
    ],
  },
  {
    name: "Tron",
    coinGeckoId: "tron",
    sector: "Blockchains",
    peakYear: 2021,
    peakPS: 18,
    peakMarketCapB: 12,
    peakRevenueB: 0.65,
    stillActive: true,
    psTimeSeries: [
      { year: 2021, ps: 18 },
      { year: 2022, ps: 6.5 },
      { year: 2023, ps: 5.0 },
      { year: 2024, ps: 4.5 },
      { year: 2025, ps: null },
      { year: 2026, ps: null },
    ],
  },
  {
    name: "Arbitrum",
    coinGeckoId: "arbitrum",
    sector: "Blockchains",
    peakYear: 2023,
    peakPS: 120,
    peakMarketCapB: 15,
    peakRevenueB: 0.125,
    stillActive: true,
    psTimeSeries: [
      { year: 2021, ps: null },
      { year: 2022, ps: null },
      { year: 2023, ps: 120 },
      { year: 2024, ps: 45 },
      { year: 2025, ps: null },
      { year: 2026, ps: null },
    ],
  },
  {
    name: "Optimism",
    coinGeckoId: "optimism",
    sector: "Blockchains",
    peakYear: 2023,
    peakPS: 250,
    peakMarketCapB: 8,
    peakRevenueB: 0.032,
    stillActive: true,
    psTimeSeries: [
      { year: 2021, ps: null },
      { year: 2022, ps: 180 },
      { year: 2023, ps: 250 },
      { year: 2024, ps: 85 },
      { year: 2025, ps: null },
      { year: 2026, ps: null },
    ],
  },
  {
    name: "Aptos",
    coinGeckoId: "aptos",
    sector: "Blockchains",
    peakYear: 2024,
    peakPS: 3500,
    peakMarketCapB: 12,
    peakRevenueB: 0.0035,
    stillActive: true,
    psTimeSeries: [
      { year: 2021, ps: null },
      { year: 2022, ps: null },
      { year: 2023, ps: 2800 },
      { year: 2024, ps: 3500 },
      { year: 2025, ps: null },
      { year: 2026, ps: null },
    ],
  },
  {
    name: "Sui",
    coinGeckoId: "sui",
    sector: "Blockchains",
    peakYear: 2024,
    peakPS: 1800,
    peakMarketCapB: 10,
    peakRevenueB: 0.0055,
    stillActive: true,
    psTimeSeries: [
      { year: 2021, ps: null },
      { year: 2022, ps: null },
      { year: 2023, ps: 1200 },
      { year: 2024, ps: 1800 },
      { year: 2025, ps: null },
      { year: 2026, ps: null },
    ],
  },
  {
    name: "Sei",
    coinGeckoId: "sei-network",
    sector: "Blockchains",
    peakYear: 2024,
    peakPS: 4200,
    peakMarketCapB: 3,
    peakRevenueB: 0.0007,
    stillActive: true,
    psTimeSeries: [
      { year: 2021, ps: null },
      { year: 2022, ps: null },
      { year: 2023, ps: null },
      { year: 2024, ps: 4200 },
      { year: 2025, ps: null },
      { year: 2026, ps: null },
    ],
  },
  {
    name: "Celestia",
    coinGeckoId: "celestia",
    sector: "Blockchains",
    peakYear: 2024,
    peakPS: 15000,
    peakMarketCapB: 8,
    peakRevenueB: 0.0005,
    stillActive: true,
    psTimeSeries: [
      { year: 2021, ps: null },
      { year: 2022, ps: null },
      { year: 2023, ps: null },
      { year: 2024, ps: 15000 },
      { year: 2025, ps: null },
      { year: 2026, ps: null },
    ],
  },
  {
    name: "Mantle",
    coinGeckoId: "mantle",
    sector: "Blockchains",
    peakYear: 2024,
    peakPS: 2000,
    peakMarketCapB: 4,
    peakRevenueB: 0.002,
    stillActive: true,
    psTimeSeries: [
      { year: 2021, ps: null },
      { year: 2022, ps: null },
      { year: 2023, ps: null },
      { year: 2024, ps: 2000 },
      { year: 2025, ps: null },
      { year: 2026, ps: null },
    ],
  },

  // ---- DeFi ----
  {
    name: "Uniswap",
    coinGeckoId: "uniswap",
    sector: "DeFi",
    peakYear: 2021,
    peakPS: 18,
    peakMarketCapB: 22,
    peakRevenueB: 1.2,
    stillActive: true,
    psTimeSeries: [
      { year: 2021, ps: 18 },
      { year: 2022, ps: 8 },
      { year: 2023, ps: 6 },
      { year: 2024, ps: 10 },
      { year: 2025, ps: null },
      { year: 2026, ps: null },
    ],
  },
  {
    name: "Aave",
    coinGeckoId: "aave",
    sector: "DeFi",
    peakYear: 2021,
    peakPS: 28,
    peakMarketCapB: 7.5,
    peakRevenueB: 0.27,
    stillActive: true,
    psTimeSeries: [
      { year: 2021, ps: 28 },
      { year: 2022, ps: 12 },
      { year: 2023, ps: 15 },
      { year: 2024, ps: 18 },
      { year: 2025, ps: null },
      { year: 2026, ps: null },
    ],
  },
  {
    name: "MakerDAO",
    coinGeckoId: "maker",
    sector: "DeFi",
    peakYear: 2021,
    peakPS: 22,
    peakMarketCapB: 5.6,
    peakRevenueB: 0.25,
    stillActive: true,
    psTimeSeries: [
      { year: 2021, ps: 22 },
      { year: 2022, ps: 8 },
      { year: 2023, ps: 5 },
      { year: 2024, ps: 8 },
      { year: 2025, ps: null },
      { year: 2026, ps: null },
    ],
  },
  {
    name: "Lido",
    coinGeckoId: "lido-dao",
    sector: "DeFi",
    peakYear: 2022,
    peakPS: 45,
    peakMarketCapB: 4,
    peakRevenueB: 0.09,
    stillActive: true,
    psTimeSeries: [
      { year: 2021, ps: 38 },
      { year: 2022, ps: 45 },
      { year: 2023, ps: 12 },
      { year: 2024, ps: 8 },
      { year: 2025, ps: null },
      { year: 2026, ps: null },
    ],
  },
  {
    name: "Compound",
    coinGeckoId: "compound-governance-token",
    sector: "DeFi",
    peakYear: 2021,
    peakPS: 52,
    peakMarketCapB: 5.2,
    peakRevenueB: 0.1,
    stillActive: true,
    psTimeSeries: [
      { year: 2021, ps: 52 },
      { year: 2022, ps: 18 },
      { year: 2023, ps: 22 },
      { year: 2024, ps: 15 },
      { year: 2025, ps: null },
      { year: 2026, ps: null },
    ],
  },
  {
    name: "Curve Finance",
    coinGeckoId: "curve-dao-token",
    sector: "DeFi",
    peakYear: 2022,
    peakPS: 25,
    peakMarketCapB: 3.8,
    peakRevenueB: 0.15,
    stillActive: true,
    psTimeSeries: [
      { year: 2021, ps: 18 },
      { year: 2022, ps: 25 },
      { year: 2023, ps: 8 },
      { year: 2024, ps: 5 },
      { year: 2025, ps: null },
      { year: 2026, ps: null },
    ],
  },
  {
    name: "dYdX",
    coinGeckoId: "dydx-chain",
    sector: "DeFi",
    peakYear: 2021,
    peakPS: 15,
    peakMarketCapB: 3.5,
    peakRevenueB: 0.23,
    stillActive: true,
    psTimeSeries: [
      { year: 2021, ps: 15 },
      { year: 2022, ps: 8 },
      { year: 2023, ps: 12 },
      { year: 2024, ps: 6 },
      { year: 2025, ps: null },
      { year: 2026, ps: null },
    ],
  },
  {
    name: "Synthetix",
    coinGeckoId: "havven",
    sector: "DeFi",
    peakYear: 2021,
    peakPS: 12,
    peakMarketCapB: 3.2,
    peakRevenueB: 0.27,
    stillActive: true,
    psTimeSeries: [
      { year: 2021, ps: 12 },
      { year: 2022, ps: 6 },
      { year: 2023, ps: 4 },
      { year: 2024, ps: 8 },
      { year: 2025, ps: null },
      { year: 2026, ps: null },
    ],
  },
  {
    name: "Yearn Finance",
    coinGeckoId: "yearn-finance",
    sector: "DeFi",
    peakYear: 2021,
    peakPS: 8,
    peakMarketCapB: 2.8,
    peakRevenueB: 0.35,
    stillActive: true,
    psTimeSeries: [
      { year: 2021, ps: 8 },
      { year: 2022, ps: 3 },
      { year: 2023, ps: 4 },
      { year: 2024, ps: 5 },
      { year: 2025, ps: null },
      { year: 2026, ps: null },
    ],
  },
  {
    name: "1inch",
    coinGeckoId: "1inch",
    sector: "DeFi",
    peakYear: 2021,
    peakPS: 35,
    peakMarketCapB: 2.8,
    peakRevenueB: 0.08,
    stillActive: true,
    psTimeSeries: [
      { year: 2021, ps: 35 },
      { year: 2022, ps: 12 },
      { year: 2023, ps: 8 },
      { year: 2024, ps: 10 },
      { year: 2025, ps: null },
      { year: 2026, ps: null },
    ],
  },
  {
    name: "PancakeSwap",
    coinGeckoId: "pancakeswap-token",
    sector: "DeFi",
    peakYear: 2021,
    peakPS: 7,
    peakMarketCapB: 7.5,
    peakRevenueB: 1.1,
    stillActive: true,
    psTimeSeries: [
      { year: 2021, ps: 7 },
      { year: 2022, ps: 3 },
      { year: 2023, ps: 4 },
      { year: 2024, ps: 5 },
      { year: 2025, ps: null },
      { year: 2026, ps: null },
    ],
  },
  {
    name: "SushiSwap",
    coinGeckoId: "sushi",
    sector: "DeFi",
    peakYear: 2021,
    peakPS: 5,
    peakMarketCapB: 4.2,
    peakRevenueB: 0.84,
    stillActive: true,
    psTimeSeries: [
      { year: 2021, ps: 5 },
      { year: 2022, ps: 2 },
      { year: 2023, ps: 3 },
      { year: 2024, ps: 4 },
      { year: 2025, ps: null },
      { year: 2026, ps: null },
    ],
  },
  {
    name: "GMX",
    coinGeckoId: "gmx",
    sector: "DeFi",
    peakYear: 2023,
    peakPS: 8,
    peakMarketCapB: 0.9,
    peakRevenueB: 0.11,
    stillActive: true,
    psTimeSeries: [
      { year: 2021, ps: null },
      { year: 2022, ps: 5 },
      { year: 2023, ps: 8 },
      { year: 2024, ps: 4 },
      { year: 2025, ps: null },
      { year: 2026, ps: null },
    ],
  },
  {
    name: "Convex Finance",
    coinGeckoId: "convex-finance",
    sector: "DeFi",
    peakYear: 2022,
    peakPS: 6,
    peakMarketCapB: 2.5,
    peakRevenueB: 0.42,
    stillActive: true,
    psTimeSeries: [
      { year: 2021, ps: 4 },
      { year: 2022, ps: 6 },
      { year: 2023, ps: 3 },
      { year: 2024, ps: 2 },
      { year: 2025, ps: null },
      { year: 2026, ps: null },
    ],
  },
  {
    name: "Rocket Pool",
    coinGeckoId: "rocket-pool",
    sector: "DeFi",
    peakYear: 2023,
    peakPS: 42,
    peakMarketCapB: 1.2,
    peakRevenueB: 0.029,
    stillActive: true,
    psTimeSeries: [
      { year: 2021, ps: null },
      { year: 2022, ps: 35 },
      { year: 2023, ps: 42 },
      { year: 2024, ps: 20 },
      { year: 2025, ps: null },
      { year: 2026, ps: null },
    ],
  },
  {
    name: "Pendle",
    coinGeckoId: "pendle",
    sector: "DeFi",
    peakYear: 2024,
    peakPS: 65,
    peakMarketCapB: 1.5,
    peakRevenueB: 0.023,
    stillActive: true,
    psTimeSeries: [
      { year: 2021, ps: null },
      { year: 2022, ps: null },
      { year: 2023, ps: 30 },
      { year: 2024, ps: 65 },
      { year: 2025, ps: null },
      { year: 2026, ps: null },
    ],
  },
  {
    name: "Raydium",
    coinGeckoId: "raydium",
    sector: "DeFi",
    peakYear: 2024,
    peakPS: 3,
    peakMarketCapB: 2.5,
    peakRevenueB: 0.85,
    stillActive: true,
    psTimeSeries: [
      { year: 2021, ps: 8 },
      { year: 2022, ps: 4 },
      { year: 2023, ps: 5 },
      { year: 2024, ps: 3 },
      { year: 2025, ps: null },
      { year: 2026, ps: null },
    ],
  },
  {
    name: "Jupiter",
    coinGeckoId: "jupiter-exchange-solana",
    sector: "DeFi",
    peakYear: 2024,
    peakPS: 12,
    peakMarketCapB: 3.5,
    peakRevenueB: 0.29,
    stillActive: true,
    psTimeSeries: [
      { year: 2021, ps: null },
      { year: 2022, ps: null },
      { year: 2023, ps: null },
      { year: 2024, ps: 12 },
      { year: 2025, ps: null },
      { year: 2026, ps: null },
    ],
  },
  {
    name: "Hyperliquid",
    coinGeckoId: "hyperliquid",
    sector: "DeFi",
    peakYear: 2024,
    peakPS: 25,
    peakMarketCapB: 8,
    peakRevenueB: 0.32,
    stillActive: true,
    psTimeSeries: [
      { year: 2021, ps: null },
      { year: 2022, ps: null },
      { year: 2023, ps: null },
      { year: 2024, ps: 25 },
      { year: 2025, ps: null },
      { year: 2026, ps: null },
    ],
  },
  {
    name: "Frax",
    coinGeckoId: "frax-share",
    sector: "DeFi",
    peakYear: 2022,
    peakPS: 18,
    peakMarketCapB: 1.5,
    peakRevenueB: 0.083,
    stillActive: true,
    psTimeSeries: [
      { year: 2021, ps: 15 },
      { year: 2022, ps: 18 },
      { year: 2023, ps: 8 },
      { year: 2024, ps: 6 },
      { year: 2025, ps: null },
      { year: 2026, ps: null },
    ],
  },

  // ---- STABLECOINS ----
  {
    name: "Tether",
    coinGeckoId: "tether",
    sector: "Stablecoins",
    peakYear: 2024,
    peakPS: 0.4,
    peakMarketCapB: 140,
    peakRevenueB: 6.3,
    stillActive: true,
    psTimeSeries: [
      { year: 2021, ps: 25 },
      { year: 2022, ps: 4 },
      { year: 2023, ps: 1.2 },
      { year: 2024, ps: 0.4 },
      { year: 2025, ps: null },
      { year: 2026, ps: null },
    ],
  },
  {
    name: "Circle (USDC)",
    coinGeckoId: "usd-coin",
    sector: "Stablecoins",
    peakYear: 2024,
    peakPS: 0.8,
    peakMarketCapB: 45,
    peakRevenueB: 1.7,
    stillActive: true,
    psTimeSeries: [
      { year: 2021, ps: 35 },
      { year: 2022, ps: 8 },
      { year: 2023, ps: 2.5 },
      { year: 2024, ps: 0.8 },
      { year: 2025, ps: null },
      { year: 2026, ps: null },
    ],
  },

  // ---- CONSUMER ----
  {
    name: "Axie Infinity",
    coinGeckoId: "axie-infinity",
    sector: "Consumer",
    peakYear: 2021,
    peakPS: 5,
    peakMarketCapB: 10,
    peakRevenueB: 1.9,
    stillActive: true,
    psTimeSeries: [
      { year: 2021, ps: 5 },
      { year: 2022, ps: 15 },
      { year: 2023, ps: 85 },
      { year: 2024, ps: 120 },
      { year: 2025, ps: null },
      { year: 2026, ps: null },
    ],
  },
  {
    name: "The Sandbox",
    coinGeckoId: "the-sandbox",
    sector: "Consumer",
    peakYear: 2021,
    peakPS: 800,
    peakMarketCapB: 6.8,
    peakRevenueB: 0.0085,
    stillActive: true,
    psTimeSeries: [
      { year: 2021, ps: 800 },
      { year: 2022, ps: 250 },
      { year: 2023, ps: 400 },
      { year: 2024, ps: 350 },
      { year: 2025, ps: null },
      { year: 2026, ps: null },
    ],
  },
  {
    name: "Decentraland",
    coinGeckoId: "decentraland",
    sector: "Consumer",
    peakYear: 2021,
    peakPS: 1200,
    peakMarketCapB: 9.5,
    peakRevenueB: 0.008,
    stillActive: true,
    psTimeSeries: [
      { year: 2021, ps: 1200 },
      { year: 2022, ps: 450 },
      { year: 2023, ps: 600 },
      { year: 2024, ps: 500 },
      { year: 2025, ps: null },
      { year: 2026, ps: null },
    ],
  },
  {
    name: "Stepn",
    coinGeckoId: "stepn",
    sector: "Consumer",
    peakYear: 2022,
    peakPS: 2,
    peakMarketCapB: 3.5,
    peakRevenueB: 1.8,
    stillActive: true,
    psTimeSeries: [
      { year: 2021, ps: null },
      { year: 2022, ps: 2 },
      { year: 2023, ps: 15 },
      { year: 2024, ps: 25 },
      { year: 2025, ps: null },
      { year: 2026, ps: null },
    ],
  },
  {
    name: "Blur",
    coinGeckoId: "blur",
    sector: "Consumer",
    peakYear: 2023,
    peakPS: 45,
    peakMarketCapB: 1.2,
    peakRevenueB: 0.027,
    stillActive: true,
    psTimeSeries: [
      { year: 2021, ps: null },
      { year: 2022, ps: null },
      { year: 2023, ps: 45 },
      { year: 2024, ps: 80 },
      { year: 2025, ps: null },
      { year: 2026, ps: null },
    ],
  },
  {
    name: "LooksRare",
    coinGeckoId: "looksrare",
    sector: "Consumer",
    peakYear: 2022,
    peakPS: 1.5,
    peakMarketCapB: 1.8,
    peakRevenueB: 1.2,
    stillActive: true,
    psTimeSeries: [
      { year: 2021, ps: null },
      { year: 2022, ps: 1.5 },
      { year: 2023, ps: 8 },
      { year: 2024, ps: 25 },
      { year: 2025, ps: null },
      { year: 2026, ps: null },
    ],
  },

  // ---- INFRASTRUCTURE ----
  {
    name: "Chainlink",
    coinGeckoId: "chainlink",
    sector: "Infrastructure",
    peakYear: 2021,
    peakPS: 550,
    peakMarketCapB: 22,
    peakRevenueB: 0.04,
    stillActive: true,
    psTimeSeries: [
      { year: 2021, ps: 550 },
      { year: 2022, ps: 220 },
      { year: 2023, ps: 180 },
      { year: 2024, ps: 120 },
      { year: 2025, ps: null },
      { year: 2026, ps: null },
    ],
  },

  // ---- DePIN ----
  {
    name: "Filecoin",
    coinGeckoId: "filecoin",
    sector: "DePIN",
    peakYear: 2021,
    peakPS: 850,
    peakMarketCapB: 15,
    peakRevenueB: 0.018,
    stillActive: true,
    psTimeSeries: [
      { year: 2021, ps: 850 },
      { year: 2022, ps: 320 },
      { year: 2023, ps: 200 },
      { year: 2024, ps: 120 },
      { year: 2025, ps: null },
      { year: 2026, ps: null },
    ],
  },
  {
    name: "Helium",
    coinGeckoId: "helium",
    sector: "DePIN",
    peakYear: 2021,
    peakPS: 1500,
    peakMarketCapB: 5.2,
    peakRevenueB: 0.0035,
    stillActive: true,
    psTimeSeries: [
      { year: 2021, ps: 1500 },
      { year: 2022, ps: 600 },
      { year: 2023, ps: 350 },
      { year: 2024, ps: 180 },
      { year: 2025, ps: null },
      { year: 2026, ps: null },
    ],
  },
  {
    name: "Render",
    coinGeckoId: "render-token",
    sector: "DePIN",
    peakYear: 2024,
    peakPS: 900,
    peakMarketCapB: 5,
    peakRevenueB: 0.0055,
    stillActive: true,
    psTimeSeries: [
      { year: 2021, ps: 500 },
      { year: 2022, ps: 200 },
      { year: 2023, ps: 450 },
      { year: 2024, ps: 900 },
      { year: 2025, ps: null },
      { year: 2026, ps: null },
    ],
  },
];

// ---------------------------------------------------------------------------
// Pre-computed Median/Percentile Data
// ---------------------------------------------------------------------------

function computePercentile(sorted: number[], p: number): number {
  const idx = (p / 100) * (sorted.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

function computeStats(values: number[]): { median: number; p10: number; p25: number; p75: number; p90: number; mean: number } {
  const sorted = [...values].sort((a, b) => a - b);
  return {
    median: computePercentile(sorted, 50),
    p10: computePercentile(sorted, 10),
    p25: computePercentile(sorted, 25),
    p75: computePercentile(sorted, 75),
    p90: computePercentile(sorted, 90),
    mean: values.reduce((s, v) => s + v, 0) / values.length,
  };
}

export function computeDotComMedianPS(): MedianPSPoint[] {
  const years = [1999, 2000, 2001, 2002, 2003, 2004];
  return years.map((year) => {
    const values = dotComCompanies
      .map((c) => c.psTimeSeries.find((p) => p.year === year)?.ps)
      .filter((v): v is number => v != null && isFinite(v));
    const stats = computeStats(values);
    return {
      year,
      yearsFromPeak: year - 2000, // peak = 2000
      ...stats,
      count: values.length,
    };
  });
}

export function computeCryptoMedianPS(liveOverrides?: Map<string, number>): MedianPSPoint[] {
  const years = [2021, 2022, 2023, 2024, 2025, 2026];
  return years.map((year) => {
    const values = cryptoProjects
      .map((c) => {
        // Use live data if available for 2025-2026
        if (liveOverrides && (year === 2025 || year === 2026)) {
          return liveOverrides.get(c.coinGeckoId) ?? null;
        }
        return c.psTimeSeries.find((p) => p.year === year)?.ps ?? null;
      })
      .filter((v): v is number => v != null && isFinite(v));
    if (values.length === 0) {
      return { year, yearsFromPeak: year - 2021, median: 0, p10: 0, p25: 0, p75: 0, p90: 0, mean: 0, count: 0 };
    }
    const stats = computeStats(values);
    return {
      year,
      yearsFromPeak: year - 2021, // peak = 2021
      ...stats,
      count: values.length,
    };
  });
}

// ---------------------------------------------------------------------------
// P/S Distribution Buckets (for histogram)
// ---------------------------------------------------------------------------

export const PS_BUCKETS = [
  { label: "0-5x", min: 0, max: 5 },
  { label: "5-10x", min: 5, max: 10 },
  { label: "10-25x", min: 10, max: 25 },
  { label: "25-50x", min: 25, max: 50 },
  { label: "50-100x", min: 50, max: 100 },
  { label: "100-500x", min: 100, max: 500 },
  { label: "500x+", min: 500, max: Infinity },
] as const;

export function computeDistribution(companies: { peakPS: number }[]): { label: string; count: number }[] {
  return PS_BUCKETS.map((bucket) => ({
    label: bucket.label,
    count: companies.filter((c) => c.peakPS >= bucket.min && c.peakPS < bucket.max).length,
  }));
}

// ---------------------------------------------------------------------------
// Sector-level aggregation
// ---------------------------------------------------------------------------

export interface SectorYearPS {
  sector: string;
  [year: number]: number | null; // median P/S for sector in that year
}

export function computeDotComSectorHeatmap(): SectorYearPS[] {
  const sectors = [...new Set(dotComCompanies.map((c) => c.sector))];
  return sectors.map((sector) => {
    const companies = dotComCompanies.filter((c) => c.sector === sector);
    const row: SectorYearPS = { sector };
    for (const year of [1999, 2000, 2001, 2002, 2003, 2004]) {
      const values = companies
        .map((c) => c.psTimeSeries.find((p) => p.year === year)?.ps)
        .filter((v): v is number => v != null);
      row[year] = values.length > 0 ? computeStats(values).median : null;
    }
    return row;
  });
}

export function computeCryptoSectorHeatmap(): SectorYearPS[] {
  const sectors = [...new Set(cryptoProjects.map((c) => c.sector))];
  return sectors.map((sector) => {
    const projects = cryptoProjects.filter((c) => c.sector === sector);
    const row: SectorYearPS = { sector };
    for (const year of [2021, 2022, 2023, 2024]) {
      const values = projects
        .map((c) => c.psTimeSeries.find((p) => p.year === year)?.ps)
        .filter((v): v is number => v != null);
      row[year] = values.length > 0 ? computeStats(values).median : null;
    }
    return row;
  });
}

// ---------------------------------------------------------------------------
// Survival analysis
// ---------------------------------------------------------------------------

export interface SurvivalBucket {
  label: string;
  total: number;
  survived: number;
  rate: number; // 0-1
}

export function computeDotComSurvival(): SurvivalBucket[] {
  return PS_BUCKETS.map((bucket) => {
    const inBucket = dotComCompanies.filter((c) => c.peakPS >= bucket.min && c.peakPS < bucket.max);
    const survived = inBucket.filter((c) => c.survived).length;
    return {
      label: bucket.label,
      total: inBucket.length,
      survived,
      rate: inBucket.length > 0 ? survived / inBucket.length : 0,
    };
  });
}

export function computeCryptoSurvival(): SurvivalBucket[] {
  return PS_BUCKETS.map((bucket) => {
    const inBucket = cryptoProjects.filter((c) => c.peakPS >= bucket.min && c.peakPS < bucket.max);
    const active = inBucket.filter((c) => c.stillActive).length;
    return {
      label: bucket.label,
      total: inBucket.length,
      survived: active,
      rate: inBucket.length > 0 ? active / inBucket.length : 0,
    };
  });
}

// ---------------------------------------------------------------------------
// Era colors
// ---------------------------------------------------------------------------

export const ERA_COLORS = {
  dotCom: "#94a3b8",       // Slate (muted, historical)
  dotComLight: "#cbd5e1",
  crypto: "#3b82f6",       // Blue (vibrant, current)
  cryptoLight: "#93c5fd",
  reference: "#d97706",    // Amber (S&P 500 reference)
} as const;
