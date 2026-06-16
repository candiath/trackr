import type { Intensidad } from '@track/shared';
import { cn } from '@/lib/utils';

interface IntensidadSelectorProps {
  value: Intensidad | null;
  /** Acepta null para permitir "deseleccionar" (el campo es opcional). */
  onChange: (valor: Intensidad | null) => void;
  className?: string;
}

const OPCIONES: { valor: Intensidad; label: string; color: string }[] = [
  { valor: 'LEVE', label: 'Leve', color: '#84cc16' },
  { valor: 'MODERADA', label: 'Moderada', color: '#f59e0b' },
  { valor: 'INTENSA', label: 'Intensa', color: '#ef4444' },
];

export function IntensidadSelector({ value, onChange, className }: IntensidadSelectorProps) {
  return (
    <div className={cn('grid grid-cols-3 gap-2', className)}>
      {OPCIONES.map((op) => {
        const activo = value === op.valor;
        return (
          <button
            type="button"
            key={op.valor}
            // Click sobre la opción activa la limpia: es un campo opcional.
            onClick={() => onChange(activo ? null : op.valor)}
            aria-pressed={activo}
            className={cn(
              'rounded-lg border px-3 py-2 text-sm font-medium transition-all',
              activo
                ? 'border-transparent text-white shadow-sm'
                : 'border-border bg-background hover:bg-accent',
            )}
            style={activo ? { backgroundColor: op.color } : undefined}
          >
            {op.label}
          </button>
        );
      })}
    </div>
  );
}
