"use client";

import React, { useRef, useCallback } from "react";
import { Download } from "lucide-react";

interface ChartExportProps {
  children: React.ReactNode;
  /** Data array to export as CSV */
  data: Record<string, unknown>[];
  /** Filename without extension */
  filename: string;
  /** Optional title shown above the chart */
  title?: string;
  className?: string;
}

export function ChartExport({
  children,
  data,
  filename,
  title,
  className = "",
}: ChartExportProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  const exportPNG = useCallback(async () => {
    if (!chartRef.current) return;
    try {
      const html2canvas = (await import("html2canvas-pro")).default;
      const canvas = await html2canvas(chartRef.current, {
        backgroundColor: "#ffffff",
        scale: 2,
        logging: false,
        useCORS: true,
      });
      const link = document.createElement("a");
      link.download = `${filename}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (err) {
      console.error("PNG export failed:", err);
    }
  }, [filename]);

  const exportJPEG = useCallback(async () => {
    if (!chartRef.current) return;
    try {
      const html2canvas = (await import("html2canvas-pro")).default;
      const canvas = await html2canvas(chartRef.current, {
        backgroundColor: "#ffffff",
        scale: 2,
        logging: false,
        useCORS: true,
      });
      const link = document.createElement("a");
      link.download = `${filename}.jpeg`;
      link.href = canvas.toDataURL("image/jpeg", 0.95);
      link.click();
    } catch (err) {
      console.error("JPEG export failed:", err);
    }
  }, [filename]);

  const exportCSV = useCallback(() => {
    if (!data || data.length === 0) return;
    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(","),
      ...data.map((row) =>
        headers
          .map((h) => {
            const val = row[h];
            if (typeof val === "string" && val.includes(",")) {
              return `"${val}"`;
            }
            return val ?? "";
          })
          .join(",")
      ),
    ];
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const link = document.createElement("a");
    link.download = `${filename}.csv`;
    link.href = URL.createObjectURL(blob);
    link.click();
    URL.revokeObjectURL(link.href);
  }, [data, filename]);

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-3">
        {title && (
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        )}
        <div className="flex items-center gap-1 ml-auto">
          <button
            onClick={exportPNG}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
            title="Export as PNG"
          >
            <Download className="w-3 h-3" />
            PNG
          </button>
          <button
            onClick={exportJPEG}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
            title="Export as JPEG"
          >
            <Download className="w-3 h-3" />
            JPEG
          </button>
          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
            title="Export as CSV"
          >
            <Download className="w-3 h-3" />
            CSV
          </button>
        </div>
      </div>
      <div ref={chartRef} className="bg-white p-4 rounded-xl">
        {children}
      </div>
    </div>
  );
}
