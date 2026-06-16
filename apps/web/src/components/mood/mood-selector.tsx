import type { MoodNivel } from '@track/shared';
import { MOOD_META, MOOD_NIVELES } from '@/lib/mood';
import { cn } from '@/lib/utils';

interface MoodSelectorProps {
  value: MoodNivel | null;
  onChange: (nivel: MoodNivel) => void;
  className?: string;
}

/**
 * Selector de ánimo de 5 niveles (emoji + etiqueta). Componente compartido por
 * el formulario de mood y el de recaída (ahí el mood es opcional). Centralizar
 * la escala acá garantiza que se vea y se comporte igual en ambos lugares.
 */
export function MoodSelector({ value, onChange, className }: MoodSelectorProps) {
  return (
    <div className={cn('grid grid-cols-5 gap-2', className)}>
      {MOOD_NIVELES.map((nivel) => {
        const meta = MOOD_META[nivel];
        const activo = value === nivel;
        return (
          <button
            type="button"
            key={nivel}
            onClick={() => onChange(nivel)}
            aria-pressed={activo}
            className={cn(
              'flex flex-col items-center gap-1 rounded-lg border p-2 text-center transition-all',
              activo
                ? 'border-transparent text-white shadow-sm'
                : 'border-border bg-background hover:bg-accent',
            )}
            style={activo ? { backgroundColor: meta.color } : undefined}
          >
            <span className="text-2xl leading-none">{meta.emoji}</span>
            <span
              className={cn(
                'text-[11px] font-medium leading-tight',
                !activo && 'text-muted-foreground',
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
