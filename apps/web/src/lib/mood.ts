import type { MoodNivel } from '@track/shared';

/**
 * Metadatos visuales de cada nivel de ánimo. Centralizamos label, emoji, color
 * y valor numérico en un solo lugar: la escala es cualitativa en el dominio,
 * pero para graficar y promediar necesitamos un número (1..5), y para el
 * calendario/heatmap necesitamos un color consistente. Así un solo cambio acá
 * se refleja en formularios, timeline, calendario y gráficos.
 */
export interface MoodMeta {
  nivel: MoodNivel;
  label: string;
  emoji: string;
  /** 1 (muy malo) … 5 (muy bueno). Para promedios y ejes de gráficos. */
  valor: number;
  /** Color sólido (hex) para puntos, barras y celdas del calendario. */
  color: string;
}

export const MOOD_META: Record<MoodNivel, MoodMeta> = {
  MUY_BUENO: { nivel: 'MUY_BUENO', label: 'Muy bueno', emoji: '😄', valor: 5, color: '#22c55e' },
  BUENO: { nivel: 'BUENO', label: 'Bueno', emoji: '🙂', valor: 4, color: '#84cc16' },
  REGULAR: { nivel: 'REGULAR', label: 'Regular', emoji: '😐', valor: 3, color: '#eab308' },
  MALO: { nivel: 'MALO', label: 'Malo', emoji: '🙁', valor: 2, color: '#f97316' },
  MUY_MALO: { nivel: 'MUY_MALO', label: 'Muy malo', emoji: '😣', valor: 1, color: '#ef4444' },
};

/** De peor a mejor: el orden con el que se muestran los selectores y leyendas. */
export const MOOD_NIVELES: MoodNivel[] = [
  'MUY_MALO',
  'MALO',
  'REGULAR',
  'BUENO',
  'MUY_BUENO',
];

/** Inverso de `valor`: convierte un promedio numérico al nivel más cercano. */
export function valorANivel(valor: number): MoodNivel {
  const redondeado = Math.round(Math.min(5, Math.max(1, valor)));
  const meta = Object.values(MOOD_META).find((m) => m.valor === redondeado);
  return meta?.nivel ?? 'REGULAR';
}

/** Color para un promedio (interpola al nivel más cercano). Útil en el calendario. */
export function colorPorValor(valor: number): string {
  return MOOD_META[valorANivel(valor)].color;
}
