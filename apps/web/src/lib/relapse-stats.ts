import type { Relapse, RelapseEvent } from '@track/shared';
import { computeDuration, type Duration } from './format';

/**
 * Sobriety milestones in days. These are the usual motivation points (24h, a
 * week, a month, a year…). Used both for the progress bar and to celebrate when
 * they are crossed.
 */
export const MILESTONE_DAYS = [1, 3, 7, 14, 30, 60, 90, 180, 365];

const MILESTONE_LABELS: Record<number, string> = {
  1: '1 day',
  3: '3 days',
  7: '1 week',
  14: '2 weeks',
  30: '1 month',
  60: '2 months',
  90: '3 months',
  180: '6 months',
  365: '1 year',
};

export function milestoneLabel(days: number): string {
  return MILESTONE_LABELS[days] ?? `${days} days`;
}

export interface RelapseSummary {
  /** Instant the current streak runs from (last relapse or start). */
  currentStreakStart: string;
  currentStreak: Duration;
  lastRelapse: RelapseEvent | null;
  bestStreakDays: number;
  totalRelapses: number;
  mostCommonTrigger: string | null;
  averageDaysBetweenRelapses: number | null;
}

/**
 * Derives every metric for a behavior from its events. We deliberately don't
 * store streaks in the model: always computing them from history avoids
 * inconsistent states (e.g. deleting a relapse should recompute everything on its
 * own). `now` is injected so the live counter stays coherent.
 */
export function relapseSummary(
  relapse: Relapse,
  events: RelapseEvent[],
  now: Date = new Date(),
): RelapseSummary {
  const sorted = [...events].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
  const last = sorted.at(-1) ?? null;
  const currentStreakStart = last?.date ?? relapse.startDate;

  // Best streak = largest gap in the line [start, e1, e2, …, en, now].
  const marks = [
    new Date(relapse.startDate).getTime(),
    ...sorted.map((e) => new Date(e.date).getTime()),
    now.getTime(),
  ];
  let bestMs = 0;
  for (let i = 1; i < marks.length; i++) {
    bestMs = Math.max(bestMs, marks[i] - marks[i - 1]);
  }

  // Most frequent trigger (mode) by name, for the stats card.
  const counts = new Map<string, number>();
  for (const e of sorted) {
    if (e.triggerName) {
      counts.set(e.triggerName, (counts.get(e.triggerName) ?? 0) + 1);
    }
  }
  let mostCommonTrigger: string | null = null;
  let maxCount = 0;
  for (const [name, count] of counts) {
    if (count > maxCount) {
      maxCount = count;
      mostCommonTrigger = name;
    }
  }

  // Average days between relapses (needs at least two events).
  let averageDaysBetweenRelapses: number | null = null;
  if (sorted.length >= 2) {
    const span =
      new Date(sorted.at(-1)!.date).getTime() -
      new Date(sorted[0].date).getTime();
    averageDaysBetweenRelapses = span / (sorted.length - 1) / 86_400_000;
  }

  return {
    currentStreakStart,
    currentStreak: computeDuration(currentStreakStart, now),
    lastRelapse: last,
    bestStreakDays: bestMs / 86_400_000,
    totalRelapses: sorted.length,
    mostCommonTrigger,
    averageDaysBetweenRelapses,
  };
}

export interface MilestoneProgress {
  targetDays: number;
  label: string;
  reached: boolean;
  /** 0..1 to paint the progress bar. */
  progress: number;
}

export function computeMilestones(currentDays: number): MilestoneProgress[] {
  return MILESTONE_DAYS.map((d) => ({
    targetDays: d,
    label: milestoneLabel(d),
    reached: currentDays >= d,
    progress: Math.min(1, currentDays / d),
  }));
}

/** Next milestone to reach (or null if the highest one is already past). */
export function nextMilestone(currentDays: number): MilestoneProgress | null {
  const target = MILESTONE_DAYS.find((d) => currentDays < d);
  if (target === undefined) return null;
  return {
    targetDays: target,
    label: milestoneLabel(target),
    reached: false,
    progress: Math.min(1, currentDays / target),
  };
}
