"use client";

import React from "react";

interface DataStatusProps {
  isLive: boolean;
  isLoading: boolean;
  lastUpdated: Date | null;
}

/**
 * Small indicator showing whether the dashboard is displaying live API
 * data (green dot) or static fallback data (grey dot). When live, shows
 * the last-updated timestamp.
 */
export function DataStatus({ isLive, isLoading, lastUpdated }: DataStatusProps) {
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-300 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-400" />
        </span>
        <span>Loading data&hellip;</span>
      </div>
    );
  }

  const formattedTime = lastUpdated
    ? lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <div className="flex items-center gap-2 text-xs">
      {isLive ? (
        <>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-emerald-600 font-medium">Live Data</span>
          {formattedTime && (
            <span className="text-slate-400">
              &middot; Updated {formattedTime}
            </span>
          )}
        </>
      ) : (
        <>
          <span className="relative flex h-2 w-2">
            <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-300" />
          </span>
          <span className="text-slate-400 font-medium">Static Data</span>
        </>
      )}
    </div>
  );
}
