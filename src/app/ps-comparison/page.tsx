"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import SectionPSComparison from "@/components/sections/SectionPSComparison";
import { useDataContext } from "@/lib/DataContext";

export default function PSComparisonPage() {
  const { unifiedTokens } = useDataContext();

  // Build live P/S map from unified token data (for 2025-2026 crypto values)
  const livePSMap = useMemo(() => {
    const map = new Map<string, number>();
    if (!unifiedTokens?.length) return map;
    for (const token of unifiedTokens) {
      if (token.id && token.psRatio != null && isFinite(token.psRatio) && token.psRatio > 0) {
        map.set(token.id, token.psRatio);
      }
    }
    return map;
  }, [unifiedTokens]);

  return (
    <div className="py-8 sm:py-12">
      {/* Navigation back */}
      <nav className="mb-8 flex items-center gap-4">
        <Link
          href="/"
          className="text-[13px] text-[#666666] hover:text-[#111111] transition-colors"
          style={{ textDecoration: "none" }}
        >
          &larr; Back to Dashboard
        </Link>
        <span className="text-[#d4d4d4]">|</span>
        <Link
          href="/tokens"
          className="text-[13px] text-[#666666] hover:text-[#111111] transition-colors"
          style={{ textDecoration: "none" }}
        >
          Token Explorer
        </Link>
      </nav>

      {/* Page title */}
      <header className="mb-12">
        <p
          className="font-medium uppercase text-[#999999] mb-2"
          style={{ fontSize: "11px", letterSpacing: "0.12em" }}
        >
          Special Report
        </p>
        <h1
          className="font-serif font-bold text-[#111111]"
          style={{ fontSize: "36px", lineHeight: "1.1" }}
        >
          Dot-Com Boom vs Crypto Era
        </h1>
        <p className="text-[15px] text-[#666666] mt-3 max-w-3xl" style={{ lineHeight: "1.6" }}>
          A side-by-side comparison of Price-to-Sales ratios across two speculative eras.
          50 top market-cap tech firms (1999-2004) mapped against 50 top market-cap token
          projects (2021-2026). Same pattern, different decade.
        </p>
        <hr className="wsj-rule mt-6" />
      </header>

      {/* Main content */}
      <SectionPSComparison livePSMap={livePSMap} />
    </div>
  );
}
