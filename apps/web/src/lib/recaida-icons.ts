import {
  Wine,
  Cigarette,
  Pill,
  Candy,
  Smartphone,
  Gamepad2,
  Coffee,
  ShoppingBag,
  HeartCrack,
  CircleDot,
  type LucideIcon,
} from 'lucide-react';

/**
 * Catálogo curado de íconos para las conductas. Por qué curado y no "cualquier
 * ícono de lucide": el usuario elige de un set acotado y reconocible, y
 * guardamos solo el NOMBRE (string) en el dato. Render = nombre → componente,
 * resuelto acá. Así el modelo no depende de objetos de React.
 */
export interface IconoOpcion {
  value: string;
  label: string;
  Icon: LucideIcon;
}

export const ICONO_OPCIONES: IconoOpcion[] = [
  { value: 'Wine', label: 'Alcohol', Icon: Wine },
  { value: 'Cigarette', label: 'Tabaco', Icon: Cigarette },
  { value: 'Pill', label: 'Sustancias', Icon: Pill },
  { value: 'Candy', label: 'Azúcar', Icon: Candy },
  { value: 'Smartphone', label: 'Pantallas', Icon: Smartphone },
  { value: 'Gamepad2', label: 'Juegos', Icon: Gamepad2 },
  { value: 'Coffee', label: 'Cafeína', Icon: Coffee },
  { value: 'ShoppingBag', label: 'Compras', Icon: ShoppingBag },
  { value: 'HeartCrack', label: 'Hábito íntimo', Icon: HeartCrack },
  { value: 'CircleDot', label: 'Otro', Icon: CircleDot },
];

const MAPA_ICONOS: Record<string, LucideIcon> = Object.fromEntries(
  ICONO_OPCIONES.map((o) => [o.value, o.Icon]),
);

/** Resuelve el nombre guardado a su componente; cae en un genérico si no existe. */
export function getIcono(value: string): LucideIcon {
  return MAPA_ICONOS[value] ?? CircleDot;
}

/** Paleta acotada para que las conductas se distingan sin abrir un color picker. */
export const COLOR_OPCIONES = [
  '#7c3aed',
  '#ef4444',
  '#ec4899',
  '#f59e0b',
  '#0ea5e9',
  '#14b8a6',
  '#84cc16',
  '#64748b',
];
