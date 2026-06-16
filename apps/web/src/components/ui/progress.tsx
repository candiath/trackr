import { type CSSProperties } from 'react';
import { cn } from '@/lib/utils';

interface ProgressProps {
  /** Value 0..100. */
  value: number;
  className?: string;
  indicatorClassName?: string;
  /** Lets you paint the indicator with the behavior's color (inline style). */
  indicatorStyle?: CSSProperties;
}

// Minimal progress bar (no Base UI: it's purely visual and needs no interactive
// semantics). Used for the sobriety milestones.
export function Progress({
  value,
  className,
  indicatorClassName,
  indicatorStyle,
}: ProgressProps) {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div
      className={cn('relative h-2 w-full overflow-hidden rounded-full bg-secondary', className)}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn('h-full rounded-full bg-primary transition-all', indicatorClassName)}
        style={{ width: `${pct}%`, ...indicatorStyle }}
      />
    </div>
  );
}
