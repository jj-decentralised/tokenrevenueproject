// ============================================================
// Time-series aggregation: daily → weekly / monthly
// ============================================================

export type Granularity = "daily" | "weekly" | "monthly";

export interface TimeSeriesPoint {
  date: number; // unix timestamp (seconds)
  [key: string]: number;
}

/**
 * Aggregate daily time-series data into weekly or monthly buckets.
 * Weekly: group by ISO week (Mon-Sun), sum numeric values, use Monday ts.
 * Monthly: group by calendar month, sum values, use 1st-of-month ts.
 */
export function aggregateTimeSeries<T extends TimeSeriesPoint>(
  daily: T[],
  granularity: Granularity,
): T[] {
  if (granularity === "daily" || daily.length === 0) return daily;

  const buckets = new Map<string, { points: T[]; ts: number }>();

  for (const point of daily) {
    const d = new Date(point.date * 1000);
    let key: string;
    let bucketTs: number;

    if (granularity === "weekly") {
      // ISO week: Monday-based
      const day = d.getUTCDay();
      const diff = (day === 0 ? -6 : 1) - day;
      const monday = new Date(d);
      monday.setUTCDate(d.getUTCDate() + diff);
      monday.setUTCHours(0, 0, 0, 0);
      key = monday.toISOString().slice(0, 10);
      bucketTs = Math.floor(monday.getTime() / 1000);
    } else {
      // Monthly: 1st of month
      key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
      bucketTs = Math.floor(
        Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1) / 1000,
      );
    }

    if (!buckets.has(key)) {
      buckets.set(key, { points: [], ts: bucketTs });
    }
    buckets.get(key)!.points.push(point);
  }

  const result: T[] = [];
  for (const { points, ts } of buckets.values()) {
    // Sum all numeric keys, take the bucket timestamp for date
    const aggregated = { ...points[0], date: ts } as T;
    const numericKeys = Object.keys(points[0]).filter(
      (k) => k !== "date" && typeof points[0][k] === "number",
    );
    for (const k of numericKeys) {
      (aggregated as Record<string, number>)[k] = points.reduce(
        (sum, p) => sum + ((p[k] as number) || 0),
        0,
      );
    }
    result.push(aggregated);
  }

  return result.sort((a, b) => a.date - b.date);
}
