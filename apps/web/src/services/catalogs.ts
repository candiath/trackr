import { api } from '@/lib/api';
import { db, findOrCreateFactor } from '@/lib/db';
import type { MoodFactor, Trigger } from '@track/shared';

/**
 * Global catalogs (triggers and mood factors).
 *
 * Triggers are read from the REST API (they belong to the relapses domain, already
 * migrated). Factors still come from Dexie until the mood domain is migrated. Custom
 * entries are created on the fly server-side when the user types one while logging a
 * relapse/mood (see the relapse/mood services).
 */
export const catalogKeys = {
  triggers: ['catalog', 'triggers'] as const,
  factors: ['catalog', 'factors'] as const,
};

export const triggerApi = {
  list: (): Promise<Trigger[]> => api.get<Trigger[]>('/api/triggers'),
};

export const factorApi = {
  list: (): Promise<MoodFactor[]> =>
    db.factors.filter((f) => !f.deletedAt).sortBy('name'),
  create: (name: string): Promise<MoodFactor> => findOrCreateFactor(name),
};
