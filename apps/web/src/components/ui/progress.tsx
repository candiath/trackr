import { type CSSProperties } from 'react';
import { cn } from '@/lib/utils';

interface ProgressProps {
  /** Valor 0..100. */
  value: number;
  className?: string;
  indicatorClassName?: string;
  /** Permite pintar el indicador con el color de la conducta (estilo inline). */
  indicatorStyle?: CSSProperties;
}

// Barra de progreso mínima (sin Base UI: es puramente visual y no necesita
// semántica interactiva). Se usa para los hitos de sobriedad.
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
