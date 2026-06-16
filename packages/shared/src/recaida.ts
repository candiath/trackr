import { z } from 'zod';
import { moodNivelSchema } from './mood';

/**
 * Intensidad de una recaída. Cualitativa a propósito: pedirle al usuario una
 * "cantidad" exacta (ml, mg, etc.) en un mal momento es fricción; tres niveles
 * alcanzan para detectar tendencias sin desanimar el registro.
 */
export const intensidadSchema = z.enum(['LEVE', 'MODERADA', 'INTENSA']);
export type Intensidad = z.infer<typeof intensidadSchema>;

/**
 * Trigger (motivo) de una recaída. Es catálogo global compartido entre todas
 * las conductas, porque "estrés" o "aburrimiento" sirven para cualquiera y así
 * las estadísticas agregan bien. `esSistema` separa predefinidos de propios.
 */
export interface Trigger {
  id: string;
  nombre: string;
  esSistema: boolean;
  createdAt: string;
}

/**
 * Conducta de la que el usuario quiere abstenerse (alcohol, tabaco, etc.).
 * Cada una es un contador independiente. No guarda la racha: se deriva de sus
 * eventos (último evento o `fechaInicio` si no hubo recaídas), así nunca queda
 * desincronizada respecto del historial real.
 */
export interface Recaida {
  id: string;
  nombre: string;
  descripcion?: string | null;
  /** Color hex para la UI (card, gráfico). */
  color: string;
  /** Nombre de ícono de lucide-react. */
  icono: string;
  /** Desde cuándo se hace el seguimiento (inicio de la racha si no hubo recaídas). */
  fechaInicio: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Una recaída concreta (un evento en la línea de tiempo de una conducta).
 * Guardamos `triggerId` (referencia al catálogo) y además `triggerNombre`
 * desnormalizado para poder listar el historial sin resolver el catálogo en el
 * cliente. El mood asociado es opcional: capturar cómo se sentía ayuda a cruzar
 * datos, pero no debe ser obligatorio para no trabar el registro.
 */
export interface RecaidaEvento {
  id: string;
  recaidaId: string;
  fecha: string; // ISO datetime de la recaída
  triggerId?: string | null;
  triggerNombre?: string | null;
  intensidad?: Intensidad | null;
  moodNivel?: z.infer<typeof moodNivelSchema> | null;
  notas?: string | null;
  createdAt: string;
}

/* ----------------------------- Form schemas ----------------------------- */

/** Crear/editar una conducta a seguir. */
export const recaidaCreateSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio').max(60),
  descripcion: z.string().max(280).optional(),
  color: z.string().min(1, 'Elegí un color'),
  icono: z.string().min(1, 'Elegí un ícono'),
  fechaInicio: z.string().min(1, 'La fecha de inicio es obligatoria'),
});
export const recaidaUpdateSchema = recaidaCreateSchema.partial();
export type RecaidaFormData = z.infer<typeof recaidaCreateSchema>;
export type RecaidaUpdateData = z.infer<typeof recaidaUpdateSchema>;

/**
 * Registrar una recaída. `triggerId` referencia el catálogo y `triggerCustom`
 * permite escribir un motivo nuevo; en el back uno de los dos termina creando o
 * enlazando el Trigger. Mantenerlos separados evita ambigüedad en el form.
 */
export const recaidaEventoCreateSchema = z.object({
  fecha: z.string().min(1, 'La fecha es obligatoria'),
  triggerId: z.string().optional().nullable(),
  triggerCustom: z.string().max(60).optional(),
  intensidad: intensidadSchema.optional().nullable(),
  moodNivel: moodNivelSchema.optional().nullable(),
  notas: z.string().max(500, 'Máximo 500 caracteres').optional(),
});
export const recaidaEventoUpdateSchema = recaidaEventoCreateSchema.partial();
export type RecaidaEventoFormData = z.infer<typeof recaidaEventoCreateSchema>;
export type RecaidaEventoUpdateData = z.infer<typeof recaidaEventoUpdateSchema>;
