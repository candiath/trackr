import type { MoodLevel } from '@track/shared';

/**
 * Visual metadata for each mood level. We centralize label, emoji, color and a
 * numeric value in one place: the scale is qualitative in the domain, but to chart
 * and average we need a number (1..5), and the calendar/heatmap needs a consistent
 * color. A single change here is reflected in forms, timeline, calendar and charts.
 */
export interface MoodMeta {
  level: MoodLevel;
  label: string;
  emoji: string;
  /** 1 (very bad) … 5 (very good). For averages and chart axes. */
  value: number;
  /** Solid color (hex) for dots, bars and calendar cells. */
  color: string;
}

export const MOOD_META: Record<MoodLevel, MoodMeta> = {
  VERY_GOOD: { level: 'VERY_GOOD', label: 'Very good', emoji: '😄', value: 5, color: '#22c55e' },
  GOOD: { level: 'GOOD', label: 'Good', emoji: '🙂', value: 4, color: '#84cc16' },
  OKAY: { level: 'OKAY', label: 'Okay', emoji: '😐', value: 3, color: '#eab308' },
  BAD: { level: 'BAD', label: 'Bad', emoji: '🙁', value: 2, color: '#f97316' },
  VERY_BAD: { level: 'VERY_BAD', label: 'Very bad', emoji: '😣', value: 1, color: '#ef4444' },
};

/** Worst to best: the order selectors and legends are shown in. */
export const MOOD_LEVELS: MoodLevel[] = [
  'VERY_BAD',
  'BAD',
  'OKAY',
  'GOOD',
  'VERY_GOOD',
];

/** Inverse of `value`: converts a numeric average to the closest level. */
export function valueToLevel(value: number): MoodLevel {
  const rounded = Math.round(Math.min(5, Math.max(1, value)));
  const meta = Object.values(MOOD_META).find((m) => m.value === rounded);
  return meta?.level ?? 'OKAY';
}

/** Color for an average (snaps to the closest level). Useful in the calendar. */
export function colorForValue(value: number): string {
  return MOOD_META[valueToLevel(value)].color;
}
