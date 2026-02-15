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
      className={`bg-white rounded-2xl border border-slate-100 p-6 shadow-sm ${
        hover ? "transition-shadow hover:shadow-md" : ""
      } ${className}`}
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
      ? "text-emerald-600"
      : changeType === "negative"
      ? "text-red-500"
      : "text-slate-500";

  return (
    <Card className={className}>
      <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">
        {label}
      </p>
      <p className="text-3xl font-bold tracking-tight text-slate-900 mt-2">
        {value}
      </p>
      {subvalue && (
        <p className="text-sm text-slate-500 mt-1">{subvalue}</p>
      )}
      {change && (
        <p className={`text-sm font-medium mt-2 ${changeColor}`}>{change}</p>
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
      <div className="flex items-center gap-3 mb-2">
        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-900 text-white text-sm font-bold">
          {number}
        </span>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
          {title}
        </h2>
      </div>
      <p className="text-base text-slate-500 ml-11 max-w-3xl">{subtitle}</p>
    </div>
  );
}

interface DataSourceProps {
  sources: string[];
}

export function DataSource({ sources }: DataSourceProps) {
  return (
    <div className="text-xs text-slate-400 mt-4 pt-3 border-t border-slate-100">
      Sources: {sources.join(" · ")}
    </div>
  );
}

interface InsightBoxProps {
  title: string;
  children: React.ReactNode;
  type?: "insight" | "warning" | "highlight";
}

export function InsightBox({ title, children, type = "insight" }: InsightBoxProps) {
  const styles = {
    insight: "bg-blue-50 border-blue-200 text-blue-900",
    warning: "bg-amber-50 border-amber-200 text-amber-900",
    highlight: "bg-emerald-50 border-emerald-200 text-emerald-900",
  };

  return (
    <div className={`rounded-xl border p-4 ${styles[type]}`}>
      <p className="font-semibold text-sm mb-1">{title}</p>
      <div className="text-sm opacity-90">{children}</div>
    </div>
  );
}
