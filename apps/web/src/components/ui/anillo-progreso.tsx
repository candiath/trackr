import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface AnilloProgresoProps {
  /** Progreso 0..1. */
  progreso: number;
  /** Diámetro en px. */
  size?: number;
  /** Grosor del trazo en px. */
  grosor?: number;
  /** Color del arco de progreso (default: primario del tema). */
  color?: string;
  className?: string;
  /** Contenido centrado dentro del anillo. */
  children?: ReactNode;
}

/**
 * Anillo de progreso circular (SVG). Puramente visual: recibe `progreso` ya
 * calculado y dibuja el arco. Lo dejamos genérico para reusarlo en cualquier
 * "completar X" (acá: avance dentro del día de 24 h).
 *
 * Trucos: rotamos -90° para que el arco arranque arriba, y animamos
 * stroke-dashoffset para que el llenado se vea fluido al tickear el contador.
 */
export function AnilloProgreso({
  progreso,
  size = 128,
  grosor = 8,
  color = 'var(--color-primary)',
  className,
  children,
}: AnilloProgresoProps) {
  const radio = (size - grosor) / 2;
  const circunferencia = 2 * Math.PI * radio;
  const clamp = Math.min(1, Math.max(0, progreso));
  const offset = circunferencia * (1 - clamp);

  return (
    <div
      className={cn('relative inline-grid place-items-center', className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radio}
          fill="none"
          strokeWidth={grosor}
          className="stroke-muted"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radio}
          fill="none"
          strokeWidth={grosor}
          stroke={color}
          strokeLinecap="round"
          strokeDasharray={circunferencia}
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
