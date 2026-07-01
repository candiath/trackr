import { z } from 'zod';

/**
 * Qualitative mood scale.
 *
 * Why a string enum and not a number: the user's domain is qualitative ("very
 * good"…"very bad"). We store the category and map it to a numeric value ONLY in
 * the frontend for charting; that way the database does not impose an arbitrary
 * scale and the semantics stay explicit on every read.
 */
export const moodLevelSchema = z.enum([
  'VERY_GOOD',
  'GOOD',
  'OKAY',
  'BAD',
  'VERY_BAD',
]);
export type MoodLevel = z.infer<typeof moodLevelSchema>;

/**
 * A factor that influences mood (sleep, work, exercise…).
 *
 * It is a catalog: it lives once and is referenced from many entries. `isSystem`
 * distinguishes the predefined ones (not editable/deletable) from the ones the
 * user creates, so we can offer a useful base without blocking customization.
 */
export interface MoodFactor {
  id: string;
  name: string;
  isSystem: boolean;
  createdAt: string;
  /** Last write, ISO. Drives the sync conflict detection (changed since lastSync). */
  updatedAt: string;
}

/**
 * A mood entry. Several per day are allowed (a product decision), which is why
 * `date` is a full datetime and not just a day.
 */
export interface MoodEntry {
  id: string;
  date: string; // ISO datetime of the entry
  level: MoodLevel;
  note?: string | null;
  /** Ids of associated MoodFactor. */
  factors: string[];
  /** Already-resolved names, to list without fetching the catalog separately. */
  factorNames?: string[];
  createdAt: string;
  /** Last write, ISO. Drives the sync conflict detection (changed since lastSync). */
  updatedAt: string;
}

/**
 * Form data to create a mood entry. Shared with the api (end-to-end validation
 * with the same schema). `customFactors` lets the user type new factors not yet
 * in the catalog; the backend creates them on the fly.
 */
export const moodEntryCreateSchema = z.object({
  // Client-generated id (uuid v7). Optional; when present the API upserts by it so an
  // optimistic entry and the stored row share an id (idempotent on cold-start retries).
  id: z.string().uuid().optional(),
  date: z.string().min(1, 'Date is required'),
  level: moodLevelSchema,
  note: z.string().max(500, 'Max 500 characters').optional(),
  factors: z.array(z.string()),
  customFactors: z.array(z.string()).optional(),
});
export type MoodEntryFormData = z.infer<typeof moodEntryCreateSchema>;

/** Update = all fields optional (project pattern). */
export const moodEntryUpdateSchema = moodEntryCreateSchema.partial();
export type MoodEntryUpdateData = z.infer<typeof moodEntryUpdateSchema>;

/** Create a mood factor in the catalog (free text typed by the user). */
export const factorCreateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(60),
});
export type FactorFormData = z.infer<typeof factorCreateSchema>;
