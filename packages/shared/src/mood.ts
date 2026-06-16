import { z } from 'zod';

/**
 * Escala cualitativa del estado de ánimo.
 *
 * Por qué un enum de strings y no un número: el dominio del usuario es
 * cualitativo ("muy bueno"…"muy malo"). Guardamos la categoría y mapeamos a un
 * valor numérico SOLO en el front para graficar; así la base no impone una
 * escala arbitraria y la semántica queda explícita en cada lectura.
 */
export const moodNivelSchema = z.enum([
  'MUY_BUENO',
  'BUENO',
  'REGULAR',
  'MALO',
  'MUY_MALO',
]);
export type MoodNivel = z.infer<typeof moodNivelSchema>;

/**
 * Factor que influye en el ánimo (sueño, trabajo, ejercicio…).
 *
 * Es catálogo: vive una sola vez y se referencia desde muchas entradas.
 * `esSistema` distingue los predefinidos (no editables/borrables) de los que
 * crea el usuario, para poder ofrecer una base útil sin bloquear la
 * personalización.
 */
export interface MoodFactor {
  id: string;
  nombre: string;
  esSistema: boolean;
  createdAt: string;
}

/**
 * Una entrada de estado de ánimo. Se permiten varias por día (decisión de
 * producto), por eso `fecha` es un datetime completo y no solo un día.
 */
export interface MoodEntry {
  id: string;
  fecha: string; // ISO datetime del registro
  nivel: MoodNivel;
  nota?: string | null;
  /** Ids de MoodFactor asociados. */
  factores: string[];
  /** Nombres ya resueltos, para listar sin pedir el catálogo aparte. */
  factoresNombres?: string[];
  createdAt: string;
}

/**
 * Datos del formulario para crear una entrada de ánimo. Se comparte con la api
 * (validación end-to-end con el mismo schema). `factoresCustom` permite tipear
 * factores nuevos que aún no están en el catálogo; el back los crearía al vuelo.
 */
export const moodEntryCreateSchema = z.object({
  fecha: z.string().min(1, 'La fecha es obligatoria'),
  nivel: moodNivelSchema,
  nota: z.string().max(500, 'Máximo 500 caracteres').optional(),
  factores: z.array(z.string()),
  factoresCustom: z.array(z.string()).optional(),
});
export type MoodEntryFormData = z.infer<typeof moodEntryCreateSchema>;

/** Update = todos los campos opcionales (patrón del proyecto). */
export const moodEntryUpdateSchema = moodEntryCreateSchema.partial();
export type MoodEntryUpdateData = z.infer<typeof moodEntryUpdateSchema>;
