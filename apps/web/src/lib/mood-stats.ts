import type { MoodEntry } from '@track/shared';
import { MOOD_META } from './mood';
import { claveDia } from './format';

/** Agrupa entradas por día (clave YYYY-MM-DD en horario local). */
export function agruparPorDia(entries: MoodEntry[]): Map<string, MoodEntry[]> {
  const mapa = new Map<string, MoodEntry[]>();
  for (const e of entries) {
    const k = claveDia(e.fecha);
    const arr = mapa.get(k) ?? [];
    arr.push(e);
    mapa.set(k, arr);
  }
  return mapa;
}

/** Promedio (1..5) de un conjunto de entradas. Asume que `entries` no es vacío. */
export function promedioDia(entries: MoodEntry[]): number {
  const suma = entries.reduce((acc, e) => acc + MOOD_META[e.nivel].valor, 0);
  return suma / entries.length;
}

export interface PuntoTendencia {
  fecha: string;
  etiqueta: string;
  /** null cuando no hubo registros ese día: el gráfico decide si interpola. */
  valor: number | null;
}

function claveDeFecha(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Serie diaria del promedio de ánimo para los últimos `dias`. Recorremos día a
 * día (no solo los días con datos) para que el eje X sea continuo y los huecos
 * se vean como tales.
 */
export function serieTendencia(entries: MoodEntry[], dias = 30): PuntoTendencia[] {
  const porDia = agruparPorDia(entries);
  const serie: PuntoTendencia[] = [];
  for (let i = dias - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const k = claveDeFecha(d);
    const arr = porDia.get(k);
    serie.push({
      fecha: k,
      etiqueta: d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' }),
      valor: arr && arr.length > 0 ? promedioDia(arr) : null,
    });
  }
  return serie;
}

/** Promedio global de ánimo (para el resumen del dashboard). null si no hay datos. */
export function promedioGeneral(entries: MoodEntry[]): number | null {
  if (entries.length === 0) return null;
  return promedioDia(entries);
}

/** Conteo de cada factor para "factores más frecuentes". */
export function frecuenciaFactores(
  entries: MoodEntry[],
): { nombre: string; cantidad: number }[] {
  const conteo = new Map<string, number>();
  for (const e of entries) {
    for (const nombre of e.factoresNombres ?? []) {
      conteo.set(nombre, (conteo.get(nombre) ?? 0) + 1);
    }
  }
  return [...conteo.entries()]
    .map(([nombre, cantidad]) => ({ nombre, cantidad }))
    .sort((a, b) => b.cantidad - a.cantidad);
}
