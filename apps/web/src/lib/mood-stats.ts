import type { MoodEntry } from '@track/shared';
import { MOOD_META } from './mood';
import { dayKey } from './format';

/** Groups entries by day (YYYY-MM-DD key in local time). */
export function groupByDay(entries: MoodEntry[]): Map<string, MoodEntry[]> {
  const map = new Map<string, MoodEntry[]>();
  for (const e of entries) {
    const k = dayKey(e.date);
    const arr = map.get(k) ?? [];
    arr.push(e);
    map.set(k, arr);
  }
  return map;
}

/** Average (1..5) of a set of entries. Assumes `entries` is not empty. */
export function dayAverage(entries: MoodEntry[]): number {
  const sum = entries.reduce((acc, e) => acc + MOOD_META[e.level].value, 0);
  return sum / entries.length;
}

export interface TrendPoint {
  date: string;
  label: string;
  /** null when there were no entries that day: the chart decides whether to interpolate. */
  value: number | null;
}

function dateToKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Daily mood-average series for the last `days`. We walk day by day (not only the
 * days with data) so the X axis is continuous and gaps look like gaps.
 */
export function trendSeries(entries: MoodEntry[], days = 30): TrendPoint[] {
  const byDay = groupByDay(entries);
  const series: TrendPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const k = dateToKey(d);
    const arr = byDay.get(k);
    series.push({
      date: k,
      label: d.toLocaleDateString('en-US', { day: '2-digit', month: '2-digit' }),
      value: arr && arr.length > 0 ? dayAverage(arr) : null,
    });
  }
  return series;
}

/** Overall mood average (for the dashboard summary). null if there is no data. */
export function overallAverage(entries: MoodEntry[]): number | null {
  if (entries.length === 0) return null;
  return dayAverage(entries);
}

/** Count of each factor for "most frequent factors". */
export function factorFrequency(
  entries: MoodEntry[],
): { name: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const e of entries) {
    for (const name of e.factorNames ?? []) {
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}
