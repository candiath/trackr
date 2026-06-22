import { db, findOrCreateFactor } from '@/lib/db';
import type { MoodFactor, Trigger } from '@track/shared';

/**
 * Global catalogs (triggers and mood factors). Read straight from Dexie; live (non
 * soft-deleted) rows only, sorted by name. New entries are created on the fly when
 * the user types a custom trigger/factor (see the relapse/mood services).
 */
export const catalogKeys = {
  triggers: ['catalog', 'triggers'] as const,
  factors: ['catalog', 'factors'] as const,
};

export const triggerApi = {
  list: (): Promise<Trigger[]> =>
    db.triggers.filter((t) => !t.deletedAt).sortBy('name'),
};

export const factorApi = {
  list: (): Promise<MoodFactor[]> =>
    db.factors.filter((f) => !f.deletedAt).sortBy('name'),
  create: (name: string): Promise<MoodFactor> => findOrCreateFactor(name),
};
