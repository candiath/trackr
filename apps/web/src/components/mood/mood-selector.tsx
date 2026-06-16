import type { MoodLevel } from '@track/shared';
import { MOOD_META, MOOD_LEVELS } from '@/lib/mood';
import { cn } from '@/lib/utils';

interface MoodSelectorProps {
  value: MoodLevel | null;
  onChange: (level: MoodLevel) => void;
  className?: string;
}

/**
 * 5-level mood selector (emoji + label). Shared by the mood form and the relapse
 * form (where the mood is optional). Centralizing the scale here guarantees it
 * looks and behaves the same in both places.
 */
export function MoodSelector({ value, onChange, className }: MoodSelectorProps) {
  return (
    <div className={cn('grid grid-cols-5 gap-2', className)}>
      {MOOD_LEVELS.map((level) => {
        const meta = MOOD_META[level];
        const active = value === level;
        return (
          <button
            type="button"
            key={level}
            onClick={() => onChange(level)}
            aria-pressed={active}
            className={cn(
              'flex flex-col items-center gap-1 rounded-lg border p-2 text-center transition-all',
              active
                ? 'border-transparent text-white shadow-sm'
                : 'border-border bg-background hover:bg-accent',
            )}
            style={active ? { backgroundColor: meta.color } : undefined}
          >
            <span className="text-2xl leading-none">{meta.emoji}</span>
            <span
              className={cn(
                'text-[11px] font-medium leading-tight',
                !active && 'text-muted-foreground',
              )}
            >
              {meta.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
