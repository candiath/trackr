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
 * Curated icon catalog for behaviors. Why curated and not "any lucide icon": the
 * user picks from a small, recognizable set, and we store only the NAME (string)
 * in the data. Render = name → component, resolved here. That way the model does
 * not depend on React objects.
 */
export interface IconOption {
  value: string;
  label: string;
  Icon: LucideIcon;
}

export const ICON_OPTIONS: IconOption[] = [
  { value: 'Wine', label: 'Alcohol', Icon: Wine },
  { value: 'Cigarette', label: 'Tobacco', Icon: Cigarette },
  { value: 'Pill', label: 'Substances', Icon: Pill },
  { value: 'Candy', label: 'Sugar', Icon: Candy },
  { value: 'Smartphone', label: 'Screens', Icon: Smartphone },
  { value: 'Gamepad2', label: 'Gaming', Icon: Gamepad2 },
  { value: 'Coffee', label: 'Caffeine', Icon: Coffee },
  { value: 'ShoppingBag', label: 'Shopping', Icon: ShoppingBag },
  { value: 'HeartCrack', label: 'Intimate habit', Icon: HeartCrack },
  { value: 'CircleDot', label: 'Other', Icon: CircleDot },
];

const ICON_MAP: Record<string, LucideIcon> = Object.fromEntries(
  ICON_OPTIONS.map((o) => [o.value, o.Icon]),
);

/** Resolves the stored name to its component; falls back to a generic one. */
export function getIcon(value: string): LucideIcon {
  return ICON_MAP[value] ?? CircleDot;
}

/** Small palette so behaviors stand out without opening a color picker. */
export const COLOR_OPTIONS = [
  '#7c3aed',
  '#ef4444',
  '#ec4899',
  '#f59e0b',
  '#0ea5e9',
  '#14b8a6',
  '#84cc16',
  '#64748b',
];
