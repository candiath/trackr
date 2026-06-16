import { Check } from 'lucide-react';
import { calcularHitos, proximoHito } from '@/lib/recaida-stats';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

interface HitosProps {
  /** Días (con decimales) de la racha actual. */
  diasActuales: number;
  color: string;
}

/**
 * Muestra el próximo hito con barra de progreso y un repaso de todos los hitos
 * (alcanzados vs pendientes). Refuerza la motivación: "te faltan X días para…".
 */
export function Hitos({ diasActuales, color }: HitosProps) {
  const proximo = proximoHito(diasActuales);
  const todos = calcularHitos(diasActuales);

  return (
    <div className="space-y-4">
      {proximo ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Próximo hito: <span className="font-medium text-foreground">{proximo.etiqueta}</span>
            </span>
            <span className="text-muted-foreground">
              faltan {Math.max(0, Math.ceil(proximo.objetivoDias - diasActuales))} días
            </span>
          </div>
          <Progress
            value={proximo.progreso * 100}
            indicatorStyle={{ backgroundColor: color }}
          />
        </div>
      ) : (
        <p className="text-sm font-medium text-foreground">
          🏅 ¡Superaste todos los hitos! Sos imparable.
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {todos.map((h) => (
          <span
            key={h.objetivoDias}
            className={cn(
              'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
              h.alcanzado
                ? 'border-transparent text-white'
                : 'border-border bg-background text-muted-foreground',
            )}
            style={h.alcanzado ? { backgroundColor: color } : undefined}
          >
            {h.alcanzado && <Check className="size-3" />}
            {h.etiqueta}
          </span>
        ))}
      </div>
    </div>
  );
}
