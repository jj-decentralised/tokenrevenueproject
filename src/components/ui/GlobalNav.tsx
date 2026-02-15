"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/tokens", label: "Tokens" },
] as const;

export function GlobalNav() {
  const pathname = usePathname();

  return (
    <nav
      style={{
        borderBottom: "2px solid #111111",
        padding: "12px 0 10px",
        marginBottom: 0,
      }}
    >
      <div className="flex items-center justify-between">
        <Link
          href="/"
          style={{
            fontFamily: "Georgia, serif",
            fontSize: "18px",
            fontWeight: 700,
            color: "#111111",
            textDecoration: "none",
            letterSpacing: "-0.01em",
          }}
        >
          Crypto Revenue Analysis
        </Link>
        <div className="flex items-center gap-1">
          {NAV_LINKS.map(({ href, label }) => {
            const isActive =
              href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  padding: "6px 12px",
                  color: isActive ? "#111111" : "#999999",
                  borderBottom: isActive
                    ? "2px solid #111111"
                    : "2px solid transparent",
                  textDecoration: "none",
                  transition: "color 150ms",
                }}
              >
                {label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
