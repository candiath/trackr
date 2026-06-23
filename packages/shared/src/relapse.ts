import { z } from 'zod';
import { moodLevelSchema } from './mood';

/**
 * Intensity of a relapse. Deliberately qualitative: asking the user for an exact
 * "amount" (ml, mg, etc.) in a bad moment is friction; three levels are enough to
 * spot trends without discouraging logging.
 */
export const intensitySchema = z.enum(['MILD', 'MODERATE', 'INTENSE']);
export type Intensity = z.infer<typeof intensitySchema>;

/**
 * What a logged event represents:
 *  - `RELAPSE`: the user actually did the behavior — resets the streak.
 *  - `URGE`: a temptation the user logged (and ideally resisted) — does NOT reset
 *    the streak; recorded for awareness and to show a motivational message.
 */
export const eventKindSchema = z.enum(['RELAPSE', 'URGE']);
export type EventKind = z.infer<typeof eventKindSchema>;

/**
 * Trigger (reason) for a relapse. It is a global catalog shared across every
 * behavior, because "stress" or "boredom" apply to any of them and that way the
 * stats aggregate well. `isSystem` separates predefined ones from user-created.
 */
export interface Trigger {
  id: string;
  name: string;
  isSystem: boolean;
  createdAt: string;
  /** Last write, ISO. Drives the sync conflict detection (changed since lastSync). */
  updatedAt: string;
}

/**
 * A behavior the user wants to abstain from (alcohol, tobacco, etc.). Each one is
 * an independent counter. It does not store the streak: it is derived from its
 * events (last event, or `startDate` if there were no relapses), so it never
 * drifts out of sync with the real history.
 */
export interface Relapse {
  id: string;
  name: string;
  description?: string | null;
  /** Hex color for the UI (card, chart). */
  color: string;
  /** lucide-react icon name. */
  icon: string;
  /** When tracking started (streak start if there were no relapses). */
  startDate: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * A concrete relapse (an event on a behavior's timeline). We store `triggerId`
 * (a reference to the catalog) plus a denormalized `triggerName` so the history
 * can be listed without resolving the catalog on the client. The associated mood
 * is optional: capturing how the user felt helps cross-reference data, but must
 * not be required so it never blocks logging.
 */
export interface RelapseEvent {
  id: string;
  relapseId: string;
  /** Whether this is an actual relapse or a resisted urge. */
  kind: EventKind;
  date: string; // ISO datetime of the relapse
  triggerId?: string | null;
  triggerName?: string | null;
  intensity?: Intensity | null;
  moodLevel?: z.infer<typeof moodLevelSchema> | null;
  notes?: string | null;
  createdAt: string;
  /** Last write, ISO. Drives the sync conflict detection (changed since lastSync). */
  updatedAt: string;
}

/* ----------------------------- Form schemas ----------------------------- */

/** Create/edit a behavior to track. */
export const relapseCreateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(60),
  description: z.string().max(280).optional(),
  color: z.string().min(1, 'Pick a color'),
  icon: z.string().min(1, 'Pick an icon'),
  startDate: z.string().min(1, 'Start date is required'),
});
export const relapseUpdateSchema = relapseCreateSchema.partial();
export type RelapseFormData = z.infer<typeof relapseCreateSchema>;
export type RelapseUpdateData = z.infer<typeof relapseUpdateSchema>;

/**
 * Log a relapse. `triggerId` references the catalog and `triggerCustom` lets the
 * user type a new reason; on the backend one of the two ends up creating or
 * linking the Trigger. Keeping them separate avoids ambiguity in the form.
 */
export const relapseEventCreateSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  triggerId: z.string().optional().nullable(),
  triggerCustom: z.string().max(60).optional(),
  intensity: intensitySchema.optional().nullable(),
  moodLevel: moodLevelSchema.optional().nullable(),
  notes: z.string().max(500, 'Max 500 characters').optional(),
});
export const relapseEventUpdateSchema = relapseEventCreateSchema.partial();
export type RelapseEventFormData = z.infer<typeof relapseEventCreateSchema>;
export type RelapseEventUpdateData = z.infer<typeof relapseEventUpdateSchema>;
