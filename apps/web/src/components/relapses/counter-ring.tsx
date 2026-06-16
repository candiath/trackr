import { useNow } from '@/hooks/use-now';
import { computeDuration, dayCountdown } from '@/lib/format';
import { cn } from '@/lib/utils';
import { ProgressRing } from '@/components/ui/progress-ring';

interface CounterRingProps {
  /** Streak start instant (ISO). */
  since: string;
  /** Behavior color for the arc and the day number. */
  color?: string;
  size?: number;
  thickness?: number;
  className?: string;
}

/**
 * Sobriety counter wrapped in a ring that represents the progress WITHIN the
 * current day (fraction of the ongoing 24h). When it completes, `days` goes up and
 * the arc resets. In the center: the days clean and the hh:mm:ss countdown to the
 * next day. Numbers in `font-mono` (Geist Mono).
 */
export function CounterRing({
  since,
  color,
  size = 168,
  thickness = 10,
  className,
}: CounterRingProps) {
  const now = useNow();
  const d = computeDuration(since, now);
  // Fraction of the ongoing day (arc progress) and countdown to the next one.
  const progress = (d.totalMs % 86_400_000) / 86_400_000;
  const remaining = dayCountdown(d.totalMs);
  const large = size >= 190;

  return (
    <ProgressRing
      progress={progress}
      size={size}
      thickness={thickness}
      color={color}
      className={className}
    >
      <div className="flex flex-col items-center justify-center gap-0.5">
        <span
          className={cn(
            'font-mono font-semibold leading-none tabular-nums tracking-tight',
            large ? 'text-5xl' : 'text-4xl',
          )}
          style={color ? { color } : undefined}
        >
          {d.days}
        </span>
        <span className="text-xs text-muted-foreground">
          {d.days === 1 ? 'day clean' : 'days clean'}
        </span>
        <span className="mt-1 font-mono text-sm tabular-nums text-muted-foreground">
          {remaining}
        </span>
      </div>
    </ProgressRing>
  );
}
