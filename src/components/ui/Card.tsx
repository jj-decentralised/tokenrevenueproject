"use client";

import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export function Card({ children, className = "", hover = false }: CardProps) {
  return (
    <div
      className={`bg-white border border-[#d4d4d4] p-5 ${
        hover ? "transition-colors hover:border-[#999999]" : ""
      } ${className}`}
      style={{ borderRadius: 0, boxShadow: "none" }}
    >
      {children}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  subvalue?: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  className?: string;
}

export function StatCard({
  label,
  value,
  subvalue,
  change,
  changeType = "neutral",
  className = "",
}: StatCardProps) {
  const changeColor =
    changeType === "positive"
      ? "text-[#2e7d32]"
      : changeType === "negative"
      ? "text-[#9e2b25]"
      : "text-[#666666]";

  return (
    <Card className={`p-4 ${className}`}>
      <p
        className="font-medium uppercase text-[#999999]"
        style={{ fontSize: "11px", letterSpacing: "0.1em" }}
      >
        {label}
      </p>
      <p
        className="font-bold tracking-tight text-[#111111] mt-1.5 font-serif"
        style={{ fontSize: "24px", lineHeight: "1.2" }}
      >
        {value}
      </p>
      {subvalue && (
        <p className="text-[13px] text-[#666666] mt-1">{subvalue}</p>
      )}
      {change && (
        <p className={`text-[13px] font-medium mt-1.5 ${changeColor}`}>{change}</p>
      )}
    </Card>
  );
}

interface SectionHeaderProps {
  number: string;
  title: string;
  subtitle: string;
}

export function SectionHeader({ number, title, subtitle }: SectionHeaderProps) {
  return (
    <div className="mb-8">
      <p
        className="font-medium uppercase text-[#999999] mb-2"
        style={{ fontSize: "11px", letterSpacing: "0.12em" }}
      >
        Section {number}
      </p>
      <h2
        className="font-serif font-bold text-[#111111]"
        style={{ fontSize: "28px", lineHeight: "1.15" }}
      >
        {title}
      </h2>
      <p className="text-[14px] text-[#666666] mt-2 max-w-3xl" style={{ lineHeight: "1.5" }}>
        {subtitle}
      </p>
      <hr className="wsj-rule mt-4" />
    </div>
  );
}

interface DataSourceProps {
  sources: string[];
}

export function DataSource({ sources }: DataSourceProps) {
  return (
    <div
      className="mt-4 pt-3"
      style={{ borderTop: "1px solid #e8e8e8", color: "#999999", fontSize: "11px", letterSpacing: "0.02em" }}
    >
      Sources: {sources.join(" \u00B7 ")}
    </div>
  );
}

interface InsightBoxProps {
  title: string;
  children: React.ReactNode;
  type?: "insight" | "warning" | "highlight";
}

export function InsightBox({ title, children, type = "insight" }: InsightBoxProps) {
  const borderColor =
    type === "insight"
      ? "#0274B6"
      : type === "warning"
      ? "#c67100"
      : "#2e7d32";

  const labelColor =
    type === "insight"
      ? "#0274B6"
      : type === "warning"
      ? "#c67100"
      : "#2e7d32";

  return (
    <div
      className="p-4 bg-white"
      style={{
        borderLeft: `3px solid ${borderColor}`,
        borderTop: "1px solid #e8e8e8",
        borderRight: "1px solid #e8e8e8",
        borderBottom: "1px solid #e8e8e8",
        borderRadius: 0,
      }}
    >
      <p
        className="font-semibold mb-1"
        style={{ fontSize: "13px", color: labelColor }}
      >
        {title}
      </p>
      <div className="text-[13px] text-[#333333]" style={{ lineHeight: "1.5" }}>
        {children}
      </div>
    </div>
  );
}
