import { useMemo } from 'react';
import type { MoodEntry } from '@track/shared';
import { groupByDay, dayAverage } from '@/lib/mood-stats';
import { MOOD_META, MOOD_LEVELS, colorForValue, valueToLevel } from '@/lib/mood';
import { cn } from '@/lib/utils';

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

interface Cell {
  day: number;
  value: number;
  count: number;
}

/**
 * Current-month calendar colored by each day's AVERAGE mood (a product decision:
 * since there can be several entries per day, the color summarizes the day). Days
 * with no entries stay gray.
 */
export function MoodCalendar({ entries }: { entries: MoodEntry[] }) {
  const { cells, monthLabel } = useMemo(() => {
    const byDay = groupByDay(entries);
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const first = new Date(year, month, 1);
    // getDay(): Sunday=0. Convert to a week that starts on Monday.
    const offset = (first.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const list: (Cell | null)[] = Array.from({ length: offset }, () => null);
    for (let d = 1; d <= daysInMonth; d++) {
      const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const arr = byDay.get(key) ?? [];
      list.push({ day: d, value: arr.length ? dayAverage(arr) : 0, count: arr.length });
    }

    const label = first.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    return { cells: list, monthLabel: label };
  }, [entries]);

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium capitalize">{monthLabel}</p>

      <div className="grid grid-cols-7 gap-1.5">
        {WEEKDAYS.map((d, i) => (
          <div key={i} className="text-center text-xs text-muted-foreground">
            {d}
          </div>
        ))}

        {cells.map((cell, i) => {
          if (!cell) return <div key={`v-${i}`} />;
          const hasData = cell.count > 0;
          return (
            <div
              key={cell.day}
              title={
                hasData
                  ? `${cell.day}: ${MOOD_META[valueToLevel(cell.value)].label} (${cell.count})`
                  : `${cell.day}: no entries`
              }
              className={cn(
                'flex aspect-square items-center justify-center rounded-md text-xs font-medium',
                hasData ? 'text-white' : 'bg-muted/50 text-muted-foreground',
              )}
              style={hasData ? { backgroundColor: colorForValue(cell.value) } : undefined}
            >
              {cell.day}
            </div>
          );
        })}
      </div>

      {/* Scale legend. */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1">
        {MOOD_LEVELS.map((level) => {
          const meta = MOOD_META[level];
          return (
            <span key={level} className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <span className="size-3 rounded-sm" style={{ backgroundColor: meta.color }} />
              {meta.label}
            </span>
          );
        })}
      </div>
    </div>
  );
}
