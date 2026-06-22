import { z } from 'zod';
import { intensitySchema } from './relapse';
import { moodLevelSchema } from './mood';

/**
 * Wire format for synchronization between the offline client (IndexedDB) and the
 * backend. Two design choices keep it simple for a single user:
 *
 *  - Every row is identified by its CLIENT-generated id (uuid v7), so the same row
 *    has the same id everywhere and upserts are unambiguous.
 *  - Catalog references travel by NAME, not id (`triggerName`, `factorNames`). That
 *    way trigger/factor ids never have to agree across devices: each side resolves
 *    a name to its own local catalog id. Catalogs are therefore never synced as
 *    first-class rows — they are reconstructed from these names on each side.
 *
 * `updatedAt` drives conflict detection; `deletedAt` is the soft-delete tombstone.
 */
export const syncRelapseSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  color: z.string(),
  icon: z.string(),
  startDate: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  deletedAt: z.string().nullable().optional(),
});

export const syncRelapseEventSchema = z.object({
  id: z.string(),
  relapseId: z.string(),
  date: z.string(),
  triggerName: z.string().nullable().optional(),
  intensity: intensitySchema.nullable().optional(),
  moodLevel: moodLevelSchema.nullable().optional(),
  notes: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  deletedAt: z.string().nullable().optional(),
});

export const syncMoodSchema = z.object({
  id: z.string(),
  date: z.string(),
  level: moodLevelSchema,
  note: z.string().nullable().optional(),
  factorNames: z.array(z.string()),
  createdAt: z.string(),
  updatedAt: z.string(),
  deletedAt: z.string().nullable().optional(),
});

export type SyncRelapse = z.infer<typeof syncRelapseSchema>;
export type SyncRelapseEvent = z.infer<typeof syncRelapseEventSchema>;
export type SyncMood = z.infer<typeof syncMoodSchema>;

/** Body the client POSTs to `/api/sync`: the rows it wants to push (its winners). */
export const syncPushSchema = z.object({
  relapses: z.array(syncRelapseSchema),
  relapseEvents: z.array(syncRelapseEventSchema),
  moods: z.array(syncMoodSchema),
});
export type SyncPush = z.infer<typeof syncPushSchema>;

/** Response of `GET /api/sync/changes`: server rows changed since the cursor. */
export interface SyncPullResponse {
  /** Server clock at read time; becomes the client's next `since` cursor. */
  serverTime: string;
  relapses: SyncRelapse[];
  relapseEvents: SyncRelapseEvent[];
  moods: SyncMood[];
}

/** Response of `POST /api/sync`: the server clock after applying the push. */
export interface SyncPushResponse {
  serverTime: string;
}
