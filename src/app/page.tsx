"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Section1Revenue from "@/components/sections/Section1Revenue";
import Section2Sentiment from "@/components/sections/Section2Sentiment";
import Section3Quality from "@/components/sections/Section3Quality";
import Section4Moats from "@/components/sections/Section4Moats";
import Section5NextLeaders from "@/components/sections/Section5NextLeaders";
import { useRevenueData } from "@/lib/useData";
import { DataStatus } from "@/components/ui/DataStatus";

const NAV_ITEMS = [
  { id: "revenue", label: "Revenue & P/E" },
  { id: "sentiment", label: "Sentiment" },
  { id: "quality", label: "Revenue Quality" },
  { id: "moats", label: "Moats" },
  { id: "next-leaders", label: "Next Leaders" },
] as const;

type SectionId = (typeof NAV_ITEMS)[number]["id"];

export default function HomePage() {
  // Live data fetching layer — sections still import static data directly,
  // but `liveData` is available for future integration when individual
  // sections are wired up to accept it as a prop.
  const { data: liveData, isLive, isLoading, lastUpdated, errors } = useRevenueData();

  // Log API errors in dev for debugging (not shown to user)
  useEffect(() => {
    if (errors.length > 0 && process.env.NODE_ENV === "development") {
      console.warn("[useRevenueData] API errors:", errors);
    }
  }, [errors]);

  const [activeSection, setActiveSection] = useState<SectionId>("revenue");
  const sectionRefs = useRef<Record<SectionId, HTMLDivElement | null>>({
    revenue: null,
    sentiment: null,
    quality: null,
    moats: null,
    "next-leaders": null,
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
      <header className="pt-16 pb-12">
        <div className="flex items-start justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-medium text-slate-400 uppercase tracking-widest mb-4">
              February 2026
            </p>
          <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.1]">
            Crypto Revenue{" "}
            <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
              Analysis
            </span>
          </h1>
          <p className="mt-6 text-xl text-slate-500 leading-relaxed max-w-2xl">
            Revenue is at historic highs while sentiment is at historic lows.{" "}
            <span className="text-slate-700 font-medium">Here&apos;s the data.</span>
          </p>
          <div className="mt-6 flex items-center gap-3">
            <div className="h-px flex-1 max-w-[60px] bg-slate-200" />
            <p className="text-sm text-slate-400">
              By <span className="font-medium text-slate-500">Saurabh &amp; Team</span>
            </p>
          </div>
          </div>
          {/* Data status indicator — top-right of header */}
          <div className="flex-shrink-0 pt-1">
            <DataStatus isLive={isLive} isLoading={isLoading} lastUpdated={lastUpdated} />
          </div>
        </div>
      </header>

      {/* ===== STICKY NAVIGATION ===== */}
      <nav className="sticky top-0 z-50 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3 bg-white/80 backdrop-blur-xl border-b border-slate-200/60">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
          {NAV_ITEMS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => scrollToSection(id)}
              className={`whitespace-nowrap px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                activeSection === id
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
              }`}
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
          <Section1Revenue />
        </div>

        <div
          id="sentiment"
          data-section-id="sentiment"
          ref={setSectionRef("sentiment")}
        >
          <Section2Sentiment />
        </div>

        <div
          id="quality"
          data-section-id="quality"
          ref={setSectionRef("quality")}
        >
          <Section3Quality />
        </div>

        <div
          id="moats"
          data-section-id="moats"
          ref={setSectionRef("moats")}
        >
          <Section4Moats />
        </div>

        <div
          id="next-leaders"
          data-section-id="next-leaders"
          ref={setSectionRef("next-leaders")}
        >
          <Section5NextLeaders />
        </div>
      </main>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-slate-200 py-12 mt-12">
        <div className="max-w-3xl">
          <p className="text-sm font-medium text-slate-900 mb-3">Data Sources</p>
          <p className="text-sm text-slate-500 leading-relaxed">
            1kx Revenue Report &middot; DefiLlama &middot; TokenTerminal &middot;
            CoinGecko &middot; WorldPERatio &middot; Alternative.me
          </p>
          <div className="mt-6 flex items-center gap-4">
            <a
              href="https://github.com/1kx-network/revenue-report"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
            >
              View References &rarr;
            </a>
          </div>
          <div className="mt-8 pt-6 border-t border-slate-100">
            <p className="text-xs text-slate-400">
              &copy; 2026 Saurabh &amp; Team. Data as of February 2026. Revenue figures are
              annualized estimates based on most recent available data.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
