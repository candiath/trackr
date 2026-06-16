import type { Intensity } from '@track/shared';
import { cn } from '@/lib/utils';

interface IntensitySelectorProps {
  value: Intensity | null;
  /** Accepts null to allow "deselecting" (the field is optional). */
  onChange: (value: Intensity | null) => void;
  className?: string;
}

const OPTIONS: { value: Intensity; label: string; color: string }[] = [
  { value: 'MILD', label: 'Mild', color: '#84cc16' },
  { value: 'MODERATE', label: 'Moderate', color: '#f59e0b' },
  { value: 'INTENSE', label: 'Intense', color: '#ef4444' },
];

export function IntensitySelector({ value, onChange, className }: IntensitySelectorProps) {
  return (
    <div className={cn('grid grid-cols-3 gap-2', className)}>
      {OPTIONS.map((op) => {
        const active = value === op.value;
        return (
          <button
            type="button"
            key={op.value}
            // Clicking the active option clears it: this is an optional field.
            onClick={() => onChange(active ? null : op.value)}
            aria-pressed={active}
            className={cn(
              'rounded-lg border px-3 py-2 text-sm font-medium transition-all',
              active
                ? 'border-transparent text-white shadow-sm'
                : 'border-border bg-background hover:bg-accent',
            )}
            style={active ? { backgroundColor: op.color } : undefined}
          >
            {op.label}
          </button>
        );
      })}
    </div>
  );
}
