/**
 * Date and duration helpers. Centralized so the whole app formats dates with the
 * same locale (en-US) and the same rounding rules.
 */

const LOCALE = 'en-US';

export interface Duration {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
  /** Days with decimals, handy to compare against milestones. */
  totalDays: number;
}

/**
 * Breaks down the time elapsed between two instants. `until` is injected (instead
 * of using Date.now() inside) so the live counter can pass the "now" that ticks
 * every second and the calculation stays pure/testable.
 */
export function computeDuration(fromIso: string, until: Date = new Date()): Duration {
  const from = new Date(fromIso).getTime();
  const totalMs = Math.max(0, until.getTime() - from);
  const totalSec = Math.floor(totalMs / 1000);

  return {
    days: Math.floor(totalSec / 86400),
    hours: Math.floor((totalSec % 86400) / 3600),
    minutes: Math.floor((totalSec % 3600) / 60),
    seconds: totalSec % 60,
    totalMs,
    totalDays: totalMs / 86_400_000,
  };
}

/** "12d 04h 03m 20s" — compact format for the live counter. */
export function formatDurationCounter(d: Duration): string {
  const dd = String(d.days);
  const hh = String(d.hours).padStart(2, '0');
  const mm = String(d.minutes).padStart(2, '0');
  const ss = String(d.seconds).padStart(2, '0');
  return `${dd}d ${hh}h ${mm}m ${ss}s`;
}

/**
 * Countdown toward the next full day: "hh:mm:ss" left for the 24h ring to
 * complete. Receives the total elapsed time in ms.
 */
export function dayCountdown(totalMs: number): string {
  const remainingMs = 86_400_000 - (totalMs % 86_400_000);
  const totalSec = Math.floor(remainingMs / 1000) % 86_400; // 24:00:00 → 00:00:00
  const hh = String(Math.floor(totalSec / 3600)).padStart(2, '0');
  const mm = String(Math.floor((totalSec % 3600) / 60)).padStart(2, '0');
  const ss = String(totalSec % 60).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

/** "12 days" / "1 day" / "5 hours" — short, human text. */
export function formatHumanDuration(d: Duration): string {
  if (d.days >= 1) return `${d.days} ${d.days === 1 ? 'day' : 'days'}`;
  if (d.hours >= 1) return `${d.hours} ${d.hours === 1 ? 'hour' : 'hours'}`;
  if (d.minutes >= 1) return `${d.minutes} ${d.minutes === 1 ? 'minute' : 'minutes'}`;
  return 'just now';
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(LOCALE, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(LOCALE, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** "2 hours ago", "3 days ago"… using Intl.RelativeTimeFormat. */
export function formatRelativeDate(iso: string, now: Date = new Date()): string {
  const rtf = new Intl.RelativeTimeFormat(LOCALE, { numeric: 'auto' });
  const diffMs = new Date(iso).getTime() - now.getTime();
  const diffSec = Math.round(diffMs / 1000);
  const abs = Math.abs(diffSec);

  if (abs < 60) return rtf.format(Math.round(diffSec), 'second');
  if (abs < 3600) return rtf.format(Math.round(diffSec / 60), 'minute');
  if (abs < 86400) return rtf.format(Math.round(diffSec / 3600), 'hour');
  if (abs < 2_592_000) return rtf.format(Math.round(diffSec / 86400), 'day');
  return rtf.format(Math.round(diffSec / 2_592_000), 'month');
}

/** Returns YYYY-MM-DD (day key) in local time, to group by day. */
export function dayKey(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Default value for datetime-local inputs (now, in local time). */
export function nowForInput(now: Date = new Date()): string {
  const d = new Date(now);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

/**
 * Resolves a `datetime-local` value (minute precision, local time) to the ISO
 * instant to persist. A datetime-local input has no seconds, so the elapsed-time
 * counter would otherwise start at a random second offset. We stamp the chosen
 * minute with the *current* seconds/millis: logging "now" lands on the real
 * instant, and any past minute the user picks still makes (now − event) land on
 * whole seconds, so the live counter starts ticking from :00 (latency aside).
 */
export function resolveInputInstant(value: string, now: Date = new Date()): string {
  const d = new Date(value);
  d.setSeconds(now.getSeconds(), now.getMilliseconds());
  return d.toISOString();
}
