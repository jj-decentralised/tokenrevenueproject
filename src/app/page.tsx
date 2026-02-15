"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Section1Revenue from "@/components/sections/Section1Revenue";
import Section2Sentiment from "@/components/sections/Section2Sentiment";
import Section3Quality from "@/components/sections/Section3Quality";
import Section4Moats from "@/components/sections/Section4Moats";
import Section5NextLeaders from "@/components/sections/Section5NextLeaders";
import Section6Protocols from "@/components/sections/Section6Protocols";
import Section7Analytics from "@/components/sections/Section7Analytics";
import { useDataContext } from "@/lib/DataContext";
import { DataStatus } from "@/components/ui/DataStatus";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";

const NAV_ITEMS = [
  { id: "revenue", label: "Revenue & P/E" },
  { id: "sentiment", label: "Sentiment" },
  { id: "quality", label: "Revenue Quality" },
  { id: "moats", label: "Moats" },
  { id: "next-leaders", label: "Next Leaders" },
  { id: "protocols", label: "Protocol Explorer" },
  { id: "analytics", label: "Analytics" },
] as const;

type SectionId = (typeof NAV_ITEMS)[number]["id"];

export default function HomePage() {
  const { isLive, isLoading, lastUpdated, errors } = useDataContext();

  // Log API errors in dev for debugging (not shown to user)
  useEffect(() => {
    if (errors.length > 0 && process.env.NODE_ENV === "development") {
      console.warn("[DataContext] API errors:", errors);
    }
  }, [errors]);

  const [activeSection, setActiveSection] = useState<SectionId>("revenue");
  const sectionRefs = useRef<Record<SectionId, HTMLDivElement | null>>({
    revenue: null,
    sentiment: null,
    quality: null,
    moats: null,
    "next-leaders": null,
    protocols: null,
    analytics: null,
  });
  const isScrollingToSection = useRef(false);

  // Intersection Observer to track which section is in view
  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    const handleIntersect = (entries: IntersectionObserverEntry[]) => {
      if (isScrollingToSection.current) return;

      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute("data-section-id") as SectionId;
          if (id) {
            setActiveSection(id);
          }
        }
      });
    };

    const observerOptions: IntersectionObserverInit = {
      root: null,
      rootMargin: "-20% 0px -60% 0px",
      threshold: 0,
    };

    NAV_ITEMS.forEach(({ id }) => {
      const el = sectionRefs.current[id];
      if (el) {
        const observer = new IntersectionObserver(handleIntersect, observerOptions);
        observer.observe(el);
        observers.push(observer);
      }
    });

    return () => {
      observers.forEach((obs) => obs.disconnect());
    };
  }, []);

  const scrollToSection = useCallback((id: SectionId) => {
    const el = sectionRefs.current[id];
    if (!el) return;

    isScrollingToSection.current = true;
    setActiveSection(id);

    const navHeight = 72;
    const elementTop = el.getBoundingClientRect().top + window.scrollY - navHeight - 24;

    window.scrollTo({
      top: elementTop,
      behavior: "smooth",
    });

    // Re-enable intersection observer after scroll completes
    setTimeout(() => {
      isScrollingToSection.current = false;
    }, 1000);
  }, []);

  const setSectionRef = useCallback(
    (id: SectionId) => (el: HTMLDivElement | null) => {
      sectionRefs.current[id] = el;
    },
    []
  );

  return (
    <div className="min-h-screen">
      {/* ===== HEADER ===== */}
      <header className="pt-12 pb-8">
        <div className="flex items-start justify-between">
          <div className="max-w-3xl">
            <p
              className="font-medium uppercase text-[#999999] mb-3"
              style={{ fontSize: "11px", letterSpacing: "0.14em" }}
            >
              February 2026
            </p>
            <h1
              className="font-serif font-bold text-[#111111]"
              style={{ fontSize: "42px", lineHeight: "1.1", letterSpacing: "-0.01em" }}
            >
              Crypto Revenue Analysis
            </h1>
            <p className="mt-4 text-[#666666] max-w-2xl" style={{ fontSize: "16px", lineHeight: "1.55" }}>
              Revenue is at historic highs while sentiment is at historic lows.{" "}
              <span className="text-[#111111] font-medium">Here&apos;s the data.</span>
            </p>
            <p className="mt-4 text-[#999999]" style={{ fontSize: "13px" }}>
              By <span className="text-[#333333] font-medium">Saurabh &amp; Team</span>
            </p>
          </div>
          {/* Data status indicator -- top-right of header */}
          <div className="flex-shrink-0 pt-1">
            <DataStatus isLive={isLive} isLoading={isLoading} lastUpdated={lastUpdated} />
          </div>
        </div>
        <hr className="wsj-rule-heavy mt-6" />
      </header>

      {/* ===== STICKY NAVIGATION ===== */}
      <nav className="sticky top-0 z-50 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-0 bg-white border-b border-[#d4d4d4]">
        <div className="flex items-center gap-0 overflow-x-auto scrollbar-hide">
          {NAV_ITEMS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => scrollToSection(id)}
              className="whitespace-nowrap px-4 py-3 transition-colors duration-150"
              style={{
                fontSize: "12px",
                fontWeight: 500,
                letterSpacing: "0.06em",
                textTransform: "uppercase" as const,
                color: activeSection === id ? "#111111" : "#999999",
                borderBottom: activeSection === id ? "2px solid #111111" : "2px solid transparent",
                borderRadius: 0,
                background: "transparent",
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </nav>

      {/* ===== SECTIONS ===== */}
      <main className="mt-12 space-y-24 pb-24">
        <div
          id="revenue"
          data-section-id="revenue"
          ref={setSectionRef("revenue")}
        >
          <ErrorBoundary>
            <Section1Revenue />
          </ErrorBoundary>
        </div>

        <div
          id="sentiment"
          data-section-id="sentiment"
          ref={setSectionRef("sentiment")}
        >
          <ErrorBoundary>
            <Section2Sentiment />
          </ErrorBoundary>
        </div>

        <div
          id="quality"
          data-section-id="quality"
          ref={setSectionRef("quality")}
        >
          <ErrorBoundary>
            <Section3Quality />
          </ErrorBoundary>
        </div>

        <div
          id="moats"
          data-section-id="moats"
          ref={setSectionRef("moats")}
        >
          <ErrorBoundary>
            <Section4Moats />
          </ErrorBoundary>
        </div>

        <div
          id="next-leaders"
          data-section-id="next-leaders"
          ref={setSectionRef("next-leaders")}
        >
          <ErrorBoundary>
            <Section5NextLeaders />
          </ErrorBoundary>
        </div>

        <div
          id="protocols"
          data-section-id="protocols"
          ref={setSectionRef("protocols")}
        >
          <ErrorBoundary>
            <Section6Protocols />
          </ErrorBoundary>
        </div>

        <div
          id="analytics"
          data-section-id="analytics"
          ref={setSectionRef("analytics")}
        >
          <ErrorBoundary>
            <Section7Analytics />
          </ErrorBoundary>
        </div>
      </main>

      {/* ===== FOOTER ===== */}
      <footer className="mt-16 pb-12">
        <hr className="wsj-rule-heavy mb-6" />
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
          <div>
            <p
              className="font-medium uppercase text-[#999999] mb-2"
              style={{ fontSize: "11px", letterSpacing: "0.1em" }}
            >
              Data Sources
            </p>
            <p className="text-[13px] text-[#666666]" style={{ lineHeight: "1.6" }}>
              DefiLlama (live) &middot; TokenTerminal (live) &middot;
              CoinGecko (live) &middot; Alternative.me (live)
            </p>
            <a
              href="https://defillama.com/fees"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-3 text-[13px] text-[#0274B6] hover:text-[#014d7a] font-medium transition-colors"
            >
              View Data Sources &rarr;
            </a>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-[#999999]" style={{ lineHeight: "1.6" }}>
              &copy; 2026 Saurabh &amp; Team
              <br />
              Data as of February 2026
              <br />
              Revenue figures are annualized estimates
              <br />
              based on most recent available data.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
