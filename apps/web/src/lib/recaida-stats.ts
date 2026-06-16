import type { Recaida, RecaidaEvento } from '@track/shared';
import { calcularDuracion, type Duracion } from './format';

/**
 * Hitos de sobriedad en días. Son los típicos puntos de motivación (24h, una
 * semana, un mes, un año…). Se usan tanto para la barra de progreso como para
 * celebrar cuando se cruzan.
 */
export const HITOS_DIAS = [1, 3, 7, 14, 30, 60, 90, 180, 365];

const ETIQUETAS_HITO: Record<number, string> = {
  1: '1 día',
  3: '3 días',
  7: '1 semana',
  14: '2 semanas',
  30: '1 mes',
  60: '2 meses',
  90: '3 meses',
  180: '6 meses',
  365: '1 año',
};

export function etiquetaHito(dias: number): string {
  return ETIQUETAS_HITO[dias] ?? `${dias} días`;
}

export interface ResumenRecaida {
  /** Instante desde el que corre la racha actual (última recaída o inicio). */
  inicioRachaActual: string;
  rachaActual: Duracion;
  ultimaRecaida: RecaidaEvento | null;
  mejorRachaDias: number;
  totalRecaidas: number;
  triggerMasComun: string | null;
  promedioEntreRecaidasDias: number | null;
}

/**
 * Deriva todas las métricas de una conducta a partir de sus eventos. No
 * guardamos rachas en el modelo a propósito: calcularlas siempre desde el
 * historial evita estados inconsistentes (ej: borrar una recaída debe recalcular
 * todo solo). `ahora` se inyecta para que el contador en vivo sea coherente.
 */
export function resumenRecaida(
  recaida: Recaida,
  eventos: RecaidaEvento[],
  ahora: Date = new Date(),
): ResumenRecaida {
  const ordenados = [...eventos].sort(
    (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime(),
  );
  const ultima = ordenados.at(-1) ?? null;
  const inicioRachaActual = ultima?.fecha ?? recaida.fechaInicio;

  // Mejor racha = mayor hueco en la línea [inicio, e1, e2, …, en, ahora].
  const marcas = [
    new Date(recaida.fechaInicio).getTime(),
    ...ordenados.map((e) => new Date(e.fecha).getTime()),
    ahora.getTime(),
  ];
  let mejorMs = 0;
  for (let i = 1; i < marcas.length; i++) {
    mejorMs = Math.max(mejorMs, marcas[i] - marcas[i - 1]);
  }

  // Trigger más frecuente (moda) por nombre, para la tarjeta de estadísticas.
  const conteo = new Map<string, number>();
  for (const e of ordenados) {
    if (e.triggerNombre) {
      conteo.set(e.triggerNombre, (conteo.get(e.triggerNombre) ?? 0) + 1);
    }
  }
  let triggerMasComun: string | null = null;
  let maxConteo = 0;
  for (const [nombre, cant] of conteo) {
    if (cant > maxConteo) {
      maxConteo = cant;
      triggerMasComun = nombre;
    }
  }

  // Promedio de días entre recaídas (necesita al menos dos eventos).
  let promedioEntreRecaidasDias: number | null = null;
  if (ordenados.length >= 2) {
    const span =
      new Date(ordenados.at(-1)!.fecha).getTime() -
      new Date(ordenados[0].fecha).getTime();
    promedioEntreRecaidasDias = span / (ordenados.length - 1) / 86_400_000;
  }

  return {
    inicioRachaActual,
    rachaActual: calcularDuracion(inicioRachaActual, ahora),
    ultimaRecaida: ultima,
    mejorRachaDias: mejorMs / 86_400_000,
    totalRecaidas: ordenados.length,
    triggerMasComun,
    promedioEntreRecaidasDias,
  };
}

export interface ProgresoHito {
  objetivoDias: number;
  etiqueta: string;
  alcanzado: boolean;
  /** 0..1 para pintar la barra de progreso. */
  progreso: number;
}

export function calcularHitos(diasActuales: number): ProgresoHito[] {
  return HITOS_DIAS.map((d) => ({
    objetivoDias: d,
    etiqueta: etiquetaHito(d),
    alcanzado: diasActuales >= d,
    progreso: Math.min(1, diasActuales / d),
  }));
}

/** Próximo hito a alcanzar (o null si ya pasó el más alto). */
export function proximoHito(diasActuales: number): ProgresoHito | null {
  const objetivo = HITOS_DIAS.find((d) => diasActuales < d);
  if (objetivo === undefined) return null;
  return {
    objetivoDias: objetivo,
    etiqueta: etiquetaHito(objetivo),
    alcanzado: false,
    progreso: Math.min(1, diasActuales / objetivo),
  };
}
