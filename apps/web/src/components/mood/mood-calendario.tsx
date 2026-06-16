import { useMemo } from 'react';
import type { MoodEntry } from '@track/shared';
import { agruparPorDia, promedioDia } from '@/lib/mood-stats';
import { MOOD_META, MOOD_NIVELES, colorPorValor, valorANivel } from '@/lib/mood';
import { cn } from '@/lib/utils';

const DIAS_SEMANA = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

interface Celda {
  dia: number;
  valor: number;
  cantidad: number;
}

/**
 * Calendario del mes actual coloreado por el ánimo PROMEDIO de cada día
 * (decisión de producto: como hay varias entradas por día, el color resume la
 * jornada). Los días sin registro quedan en gris.
 */
export function MoodCalendario({ entries }: { entries: MoodEntry[] }) {
  const { celdas, etiquetaMes } = useMemo(() => {
    const porDia = agruparPorDia(entries);
    const hoy = new Date();
    const anio = hoy.getFullYear();
    const mes = hoy.getMonth();
    const primero = new Date(anio, mes, 1);
    // getDay(): domingo=0. Lo pasamos a semana que arranca el lunes.
    const offset = (primero.getDay() + 6) % 7;
    const diasEnMes = new Date(anio, mes + 1, 0).getDate();

    const lista: (Celda | null)[] = Array.from({ length: offset }, () => null);
    for (let d = 1; d <= diasEnMes; d++) {
      const key = `${anio}-${String(mes + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const arr = porDia.get(key) ?? [];
      lista.push({ dia: d, valor: arr.length ? promedioDia(arr) : 0, cantidad: arr.length });
    }

    const etiqueta = primero.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
    return { celdas: lista, etiquetaMes: etiqueta };
  }, [entries]);

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium capitalize">{etiquetaMes}</p>

      <div className="grid grid-cols-7 gap-1.5">
        {DIAS_SEMANA.map((d, i) => (
          <div key={i} className="text-center text-xs text-muted-foreground">
            {d}
          </div>
        ))}

        {celdas.map((celda, i) => {
          if (!celda) return <div key={`v-${i}`} />;
          const conDatos = celda.cantidad > 0;
          return (
            <div
              key={celda.dia}
              title={
                conDatos
                  ? `${celda.dia}: ${MOOD_META[valorANivel(celda.valor)].label} (${celda.cantidad})`
                  : `${celda.dia}: sin registros`
              }
              className={cn(
                'flex aspect-square items-center justify-center rounded-md text-xs font-medium',
                conDatos ? 'text-white' : 'bg-muted/50 text-muted-foreground',
              )}
              style={conDatos ? { backgroundColor: colorPorValor(celda.valor) } : undefined}
            >
              {celda.dia}
            </div>
          );
        })}
      </div>

      {/* Leyenda de la escala. */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1">
        {MOOD_NIVELES.map((nivel) => {
          const meta = MOOD_META[nivel];
          return (
            <span key={nivel} className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <span className="size-3 rounded-sm" style={{ backgroundColor: meta.color }} />
              {meta.label}
            </span>
          );
        })}
      </div>
    </div>
  );
}
