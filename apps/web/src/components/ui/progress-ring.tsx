import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ProgressRingProps {
  /** Progress 0..1. */
  progress: number;
  /** Diameter in px. */
  size?: number;
  /** Stroke thickness in px. */
  thickness?: number;
  /** Progress arc color (default: theme primary). */
  color?: string;
  className?: string;
  /** Centered content inside the ring. */
  children?: ReactNode;
}

/**
 * Circular progress ring (SVG). Purely visual: it receives an already-computed
 * `progress` and draws the arc. Kept generic so it can be reused for any
 * "complete X" (here: progress within the 24h day).
 *
 * Tricks: we rotate -90° so the arc starts at the top, and animate
 * stroke-dashoffset so the fill looks fluid as the counter ticks.
 */
export function ProgressRing({
  progress,
  size = 128,
  thickness = 8,
  color = 'var(--color-primary)',
  className,
  children,
}: ProgressRingProps) {
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamp = Math.min(1, Math.max(0, progress));
  const offset = circumference * (1 - clamp);

  return (
    <div
      className={cn('relative inline-grid place-items-center', className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={thickness}
          className="stroke-muted"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={thickness}
          stroke={color}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.5s linear' }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        {children}
      </div>
    </div>
  );
}
