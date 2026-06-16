import { useNow } from '@/hooks/use-now';
import { calcularDuracion, cuentaRegresivaDia } from '@/lib/format';
import { cn } from '@/lib/utils';
import { AnilloProgreso } from '@/components/ui/anillo-progreso';

interface ContadorAnilloProps {
  /** Instante de inicio (ISO) de la racha. */
  desde: string;
  /** Color de la conducta para el arco y el número de días. */
  color?: string;
  size?: number;
  grosor?: number;
  className?: string;
}

/**
 * Contador de sobriedad envuelto en un anillo que representa el avance DENTRO
 * del día actual (fracción de las 24 h en curso). Al completarse, `dias` sube y
 * el arco se reinicia. En el centro: los días limpios y la cuenta regresiva
 * hh:mm:ss hacia el próximo día. Números en `font-mono` (Geist Mono).
 */
export function ContadorAnillo({
  desde,
  color,
  size = 168,
  grosor = 10,
  className,
}: ContadorAnilloProps) {
  const now = useNow();
  const d = calcularDuracion(desde, now);
  // Fracción del día en curso (avance del anillo) y cuenta regresiva al próximo.
  const progreso = (d.totalMs % 86_400_000) / 86_400_000;
  const restante = cuentaRegresivaDia(d.totalMs);
  const grande = size >= 190;

  return (
    <AnilloProgreso
      progreso={progreso}
      size={size}
      grosor={grosor}
      color={color}
      className={className}
    >
      <div className="flex flex-col items-center justify-center gap-0.5">
        <span
          className={cn(
            'font-mono font-semibold leading-none tabular-nums tracking-tight',
            grande ? 'text-5xl' : 'text-4xl',
          )}
          style={color ? { color } : undefined}
        >
          {d.dias}
        </span>
        <span className="text-xs text-muted-foreground">
          {d.dias === 1 ? 'día limpio' : 'días limpios'}
        </span>
        <span className="mt-1 font-mono text-sm tabular-nums text-muted-foreground">
          {restante}
        </span>
      </div>
    </AnilloProgreso>
  );
}
