// ============================================================
// Unified token merge utility
//
// Merges CoinGecko (1000 tokens), DefiLlama (1800+ protocols),
// and TokenTerminal (100+ protocols) into a single list of
// ~1500 UnifiedTokens with consistent categorization and
// full income statement data (fees, revenue, margin, earnings).
// ============================================================

import type {
  LiveFeeOverview,
  LiveCoinGeckoData,
  LiveTVLData,
  LiveEarningsData,
} from "@/lib/DataContext";
import { PROTOCOL_TOKEN_MAP, findProtocolMapping } from "@/lib/protocolTokenMap";
import { getCategoryGroup, categorizeToken } from "@/lib/categories";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UnifiedToken {
  // Identity
  id: string;
  name: string;
  symbol: string | null;
  slug: string;
  logo: string | null;
  defillamaId: string | null;
  parentProtocol: string | null;

  // Classification
  category: string;
  categoryGroup: string;
  subcategory: string;

  // Token data (CoinGecko)
  hasToken: boolean;
  currentPrice: number | null;
  marketCap: number | null;
  fdv: number | null;
  priceChange24h: number | null;
  priceChange7d: number | null;
  priceChange30d: number | null;
  totalVolume24h: number | null;
  marketCapRank: number | null;
  circulatingSupply: number | null;

  // Fee / revenue display fields (backward-compatible — total fees)
  fees24h: number | null;
  revenue24h: number | null;        // = fees24h (backward compat for display)
  revenue7d: number | null;
  revenue30d: number | null;
  revenueAnn: number | null;        // = fees24h * 365 (backward compat)
  fees1y: number | null;
  feesAllTime: number | null;
  feesAnnualized: number | null;    // = fees24h * 365

  // Protocol revenue (DefiLlama — what protocol keeps, NOT LPs)
  protocolRevenue24h: number | null;
  protocolRevenue7d: number | null;
  protocolRevenue30d: number | null;

  // Holders revenue (buybacks, burns, staking distributions)
  holdersRevenue24h: number | null;

  // Change metrics
  change1d: number | null;
  change7d: number | null;
  change1m: number | null;
  change7dover7d: number | null;
  change30dover30d: number | null;
  chains: string[];

  // Derived valuation metrics
  psRatio: number | null;      // Market Cap / annualized revenue
  psFdv: number | null;        // FDV / annualized revenue
  revenueTvl: number | null;   // Annualized fees / TVL

  // TVL
  tvl: number | null;

  // Income statement
  margin: number | null;           // revenue / fees (take rate)
  latestEarnings: number | null;   // TokenTerminal earnings or DefiLlama revenue

  // Metadata
  doublecounted: boolean;
  methodology: Record<string, string> | null;

  // Source tracking
  sources: ("coingecko" | "defillama" | "tokenterminal")[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

const STRIP_SUFFIXES = [
  "-finance",
  "-protocol",
  "-network",
  "-exchange",
  "-swap",
  "-dao",
  "-fi",
  ".fun",
  ".tech",
];

function stripSuffix(name: string): string {
  let stripped = name;
  for (const suffix of STRIP_SUFFIXES) {
    if (stripped.endsWith(suffix)) {
      stripped = stripped.slice(0, -suffix.length);
      break;
    }
  }
  return stripped;
}

// ---------------------------------------------------------------------------
// Main merge function
// ---------------------------------------------------------------------------

export function buildUnifiedTokenList(
  fees: LiveFeeOverview | null,
  coinGecko: LiveCoinGeckoData | null,
  tvl: LiveTVLData | null,
  earnings: LiveEarningsData | null,
): UnifiedToken[] {
  const tokens = coinGecko?.tokens ?? [];
  const feeProtocols = fees?.protocols ?? [];
  // Prefer allProtocolsTVL (~2000+, has mcap) over topProtocols (20)
  const tvlProtocols = tvl?.allProtocolsTVL ?? [];
  const earningsProtocols = earnings?.protocols ?? [];

  // -----------------------------------------------------------------------
  // Build lookup indexes
  // -----------------------------------------------------------------------

  // CoinGecko token indexes
  const tokenById = new Map<string, (typeof tokens)[0]>();
  const tokenByNameLower = new Map<string, (typeof tokens)[0]>();
  const tokenBySymbolLower = new Map<string, (typeof tokens)[0]>();
  const tokenByFirstWord = new Map<string, (typeof tokens)[0]>();

  for (const t of tokens) {
    tokenById.set(t.id.toLowerCase(), t);
    tokenByNameLower.set(t.name.toLowerCase(), t);
    if (t.symbol) tokenBySymbolLower.set(t.symbol.toLowerCase(), t);
    const firstWord = t.name.split(/\s+/)[0]?.toLowerCase();
    if (firstWord && firstWord.length > 2 && !tokenByFirstWord.has(firstWord)) {
      tokenByFirstWord.set(firstWord, t);
    }
  }

  // Reverse map from PROTOCOL_TOKEN_MAP
  const tokenByCoinGeckoMapping = new Map<string, (typeof tokens)[0]>();
  for (const entry of Object.values(PROTOCOL_TOKEN_MAP)) {
    if (entry.coinGeckoId) {
      const t = tokenById.get(entry.coinGeckoId.toLowerCase());
      if (t) {
        tokenByCoinGeckoMapping.set(entry.defiLlamaName.toLowerCase(), t);
        const slug = toSlug(entry.defiLlamaName);
        tokenByCoinGeckoMapping.set(slug, t);
      }
    }
  }

  // TVL lookup (also carries mcap from DefiLlama /protocols)
  const tvlByName = new Map<string, (typeof tvlProtocols)[0]>();
  for (const t of tvlProtocols) {
    tvlByName.set(t.name.toLowerCase(), t);
  }

  // Earnings lookup (TokenTerminal)
  const earningsByName = new Map<string, (typeof earningsProtocols)[0]>();
  const earningsById = new Map<string, (typeof earningsProtocols)[0]>();
  for (const e of earningsProtocols) {
    earningsByName.set(e.name.toLowerCase(), e);
    earningsById.set(e.id.toLowerCase(), e);
    if (e.aliases) {
      for (const alias of e.aliases) {
        earningsByName.set(alias.toLowerCase(), e);
      }
    }
  }

  // -----------------------------------------------------------------------
  // 6-strategy CoinGecko token matching
  // -----------------------------------------------------------------------

  function matchToken(
    name: string,
    displayName: string,
  ): (typeof tokens)[0] | undefined {
    const nameLower = name.toLowerCase();
    const displayLower = displayName.toLowerCase();
    const mapping = findProtocolMapping(name);

    // Strategy 0: Direct mapping from PROTOCOL_TOKEN_MAP
    if (mapping?.coinGeckoId) {
      const match = tokenById.get(mapping.coinGeckoId.toLowerCase());
      if (match) return match;
    }

    // Strategy 1: Reverse map
    let match =
      tokenByCoinGeckoMapping.get(nameLower) ||
      tokenByCoinGeckoMapping.get(displayLower);
    if (match) return match;

    // Strategy 2: Direct name/id/symbol
    match =
      tokenByNameLower.get(nameLower) ||
      tokenById.get(nameLower) ||
      tokenByNameLower.get(displayLower) ||
      tokenById.get(displayLower) ||
      tokenBySymbolLower.get(nameLower);
    if (match) return match;

    // Strategy 3: Strip suffixes
    const stripped = stripSuffix(nameLower);
    const strippedDisplay = stripSuffix(displayLower);
    if (stripped !== nameLower) {
      match =
        tokenByNameLower.get(stripped) ||
        tokenById.get(stripped) ||
        tokenBySymbolLower.get(stripped);
      if (match) return match;
    }
    if (strippedDisplay !== displayLower) {
      match =
        tokenByNameLower.get(strippedDisplay) ||
        tokenById.get(strippedDisplay) ||
        tokenBySymbolLower.get(strippedDisplay);
      if (match) return match;
    }

    // Strategy 4: Symbol match
    match = tokenBySymbolLower.get(displayLower);
    if (match) return match;

    // Strategy 5: First word
    const firstWord = nameLower.split(/[\s-]+/)[0];
    if (firstWord && firstWord.length > 2) {
      match = tokenByFirstWord.get(firstWord);
      if (match) return match;
    }
    const firstWordDisplay = displayLower.split(/[\s-]+/)[0];
    if (
      firstWordDisplay &&
      firstWordDisplay.length > 2 &&
      firstWordDisplay !== firstWord
    ) {
      match = tokenByFirstWord.get(firstWordDisplay);
      if (match) return match;
    }

    return undefined;
  }

  // -----------------------------------------------------------------------
  // Phase 1: Start from DefiLlama fee protocols
  // -----------------------------------------------------------------------

  const result = new Map<string, UnifiedToken>();
  const usedCoinGeckoIds = new Set<string>();

  // Sort by fees descending
  const sortedFees = [...feeProtocols]
    .filter((p) => p.total24h > 0)
    .sort((a, b) => b.total24h - a.total24h);

  for (const p of sortedFees) {
    const tokenMatch = matchToken(p.name, p.displayName);
    const mapping = findProtocolMapping(p.name);
    const hasToken = mapping ? mapping.hasToken : tokenMatch != null;
    const nameLower = p.name.toLowerCase();
    const displayLower = p.displayName.toLowerCase();

    // TVL (also carries mcap from DefiLlama's /protocols endpoint)
    const tvlMatch =
      tvlByName.get(nameLower) || tvlByName.get(displayLower);
    const tvlVal = tvlMatch?.tvl ?? null;

    // Earnings (TokenTerminal — supplementary)
    const earningsMatch =
      earningsByName.get(nameLower) ||
      earningsById.get(nameLower) ||
      earningsByName.get(displayLower);

    // ----- Fees & Revenue (from enriched DefiLlama API) -----
    const fees24h = p.total24h;
    const feesAnnualized = fees24h * 365;
    const protocolRevenue = p.revenue24h;   // null if not available
    const holdersRev = p.holdersRevenue24h; // null if not available

    // ----- Market Cap: CoinGecko → DefiLlama TVL endpoint fallback -----
    const marketCap = tokenMatch?.marketCap ?? tvlMatch?.mcap ?? null;
    const fdv = tokenMatch?.fullyDilutedValuation ?? null;

    // ----- P/S: use protocol revenue when available, else total fees -----
    // Numerator: Market Cap → FDV fallback (maximizes coverage)
    const protoRevAnn = protocolRevenue != null && protocolRevenue > 0
      ? protocolRevenue * 365
      : null;
    const psBase = protoRevAnn ?? feesAnnualized;
    const psNumerator = marketCap ?? fdv; // fall back to FDV when mcap unavailable
    const psRatio =
      psNumerator != null && psBase > 0 ? psNumerator / psBase : null;
    const psFdv = fdv != null && psBase > 0 ? fdv / psBase : null;
    const revenueTvl =
      tvlVal != null && tvlVal > 0 ? feesAnnualized / tvlVal : null;

    // ----- Margin: TokenTerminal → DefiLlama margin (pre-computed in API) -----
    const margin = earningsMatch?.margin ?? p.margin ?? null;

    // ----- Earnings: TokenTerminal → DefiLlama protocol revenue -----
    const latestEarnings =
      earningsMatch?.latestEarnings ??
      (protocolRevenue != null && protocolRevenue > 0 ? protocolRevenue : null);

    // Category
    let categoryGroup: string;
    let subcategory: string;
    if (mapping) {
      categoryGroup = mapping.categoryGroup;
      subcategory = mapping.subcategory;
    } else {
      categoryGroup = getCategoryGroup(p.category || "Other");
      subcategory = p.category || "Other";
    }

    const id = tokenMatch?.id || toSlug(p.name);

    if (tokenMatch) usedCoinGeckoIds.add(tokenMatch.id.toLowerCase());

    result.set(id, {
      id,
      name: p.displayName || p.name,
      symbol: tokenMatch?.symbol ?? mapping?.tokenSymbol ?? null,
      slug: p.slug || toSlug(p.name),
      logo: p.logo ?? null,
      defillamaId: p.defillamaId ?? null,
      parentProtocol: p.parentProtocol ?? null,
      category: subcategory,
      categoryGroup,
      subcategory,
      hasToken,
      currentPrice: tokenMatch?.currentPrice ?? null,
      marketCap,
      fdv,
      priceChange24h: tokenMatch?.priceChange24h ?? null,
      priceChange7d: tokenMatch?.priceChange7d ?? null,
      priceChange30d: tokenMatch?.priceChange30d ?? null,
      totalVolume24h: tokenMatch?.totalVolume24h ?? null,
      marketCapRank: tokenMatch?.marketCapRank ?? null,
      circulatingSupply: tokenMatch?.circulatingSupply ?? null,
      // Fee / revenue display (backward-compatible)
      fees24h,
      revenue24h: fees24h,
      revenue7d: p.total7d || null,
      revenue30d: p.total30d || null,
      revenueAnn: feesAnnualized,
      fees1y: p.total1y ?? null,
      feesAllTime: p.totalAllTime || null,
      feesAnnualized,
      // Protocol revenue (what protocol keeps — separate from total fees)
      protocolRevenue24h: protocolRevenue,
      protocolRevenue7d: p.revenue7d ?? null,
      protocolRevenue30d: p.revenue30d ?? null,
      // Holders revenue
      holdersRevenue24h: holdersRev,
      // Changes
      change1d: p.change_1d,
      change7d: p.change_7d,
      change1m: p.change_1m ?? null,
      change7dover7d: p.change_7dover7d ?? null,
      change30dover30d: p.change_30dover30d ?? null,
      chains: p.chains || [],
      // Valuation
      psRatio,
      psFdv,
      revenueTvl,
      tvl: tvlVal,
      // Income statement
      margin,
      latestEarnings,
      // Metadata
      doublecounted: p.doublecounted ?? false,
      methodology: p.methodology ?? null,
      sources: [
        "defillama" as const,
        ...(tokenMatch ? (["coingecko"] as const) : []),
        ...(earningsMatch ? (["tokenterminal"] as const) : []),
      ],
    });
  }

  // -----------------------------------------------------------------------
  // Phase 2: Add CoinGecko-only tokens (no DefiLlama fee data)
  // -----------------------------------------------------------------------

  for (const t of tokens) {
    if (usedCoinGeckoIds.has(t.id.toLowerCase())) continue;

    const mapping = findProtocolMapping(t.id) || findProtocolMapping(t.name);
    const slug = toSlug(t.name);

    // Earnings match
    const earningsMatch =
      earningsByName.get(t.name.toLowerCase()) ||
      earningsById.get(t.id.toLowerCase());

    // Category
    let categoryGroup: string;
    let subcategory: string;
    if (mapping) {
      categoryGroup = mapping.categoryGroup;
      subcategory = mapping.subcategory;
    } else {
      const cat = categorizeToken(null, null, t.name);
      categoryGroup = cat.categoryGroup;
      subcategory = cat.subcategory;
    }

    result.set(t.id.toLowerCase(), {
      id: t.id,
      name: t.name,
      symbol: t.symbol,
      slug,
      logo: null,
      defillamaId: null,
      parentProtocol: null,
      category: subcategory,
      categoryGroup,
      subcategory,
      hasToken: true,
      currentPrice: t.currentPrice,
      marketCap: t.marketCap,
      fdv: t.fullyDilutedValuation,
      priceChange24h: t.priceChange24h,
      priceChange7d: t.priceChange7d,
      priceChange30d: t.priceChange30d,
      totalVolume24h: t.totalVolume24h,
      marketCapRank: t.marketCapRank,
      circulatingSupply: t.circulatingSupply,
      fees24h: null,
      revenue24h: null,
      revenue7d: null,
      revenue30d: null,
      revenueAnn: null,
      fees1y: null,
      feesAllTime: null,
      feesAnnualized: null,
      protocolRevenue24h: null,
      protocolRevenue7d: null,
      protocolRevenue30d: null,
      holdersRevenue24h: null,
      change1d: null,
      change7d: null,
      change1m: null,
      change7dover7d: null,
      change30dover30d: null,
      chains: [],
      psRatio: null,
      psFdv: null,
      revenueTvl: null,
      tvl: null,
      margin: earningsMatch?.margin ?? null,
      latestEarnings: earningsMatch?.latestEarnings ?? null,
      doublecounted: false,
      methodology: null,
      sources: [
        "coingecko" as const,
        ...(earningsMatch ? (["tokenterminal"] as const) : []),
      ],
    });
  }

  // -----------------------------------------------------------------------
  // Sort: revenue-generating first (by fees desc), then market-cap desc
  // -----------------------------------------------------------------------

  return Array.from(result.values()).sort((a, b) => {
    // Fee-generating protocols first
    const aFees = a.feesAnnualized ?? 0;
    const bFees = b.feesAnnualized ?? 0;
    if (aFees > 0 && bFees > 0) return bFees - aFees;
    if (aFees > 0) return -1;
    if (bFees > 0) return 1;
    // Then by market cap
    return (b.marketCap ?? 0) - (a.marketCap ?? 0);
  });
}
