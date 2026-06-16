import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combina clases condicionales (clsx) y resuelve conflictos de Tailwind
 * (tailwind-merge). Por qué las dos: clsx arma la lista según props/estado, y
 * twMerge garantiza que la última utilidad gane (ej: "p-2 p-4" → "p-4"), que es
 * justo lo que rompe si solo concatenás strings.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
