import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines conditional classes (clsx) and resolves Tailwind conflicts
 * (tailwind-merge). Why both: clsx builds the list from props/state, and twMerge
 * guarantees the last utility wins (e.g. "p-2 p-4" → "p-4"), which is exactly
 * what breaks if you only concatenate strings.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
