import { api } from '@/lib/api';
import type { MoodFactor, Trigger } from '@track/shared';

/**
 * Global catalogs (triggers and mood factors). Both read from the REST API. Custom
 * entries are created on the fly server-side when the user types one while logging a
 * relapse/mood (see the relapse/mood services), so the only operations the UI needs
 * here are listing them (and a direct factor create, kept for completeness).
 */
export const catalogKeys = {
  triggers: ['catalog', 'triggers'] as const,
  factors: ['catalog', 'factors'] as const,
};

export const triggerApi = {
  list: (): Promise<Trigger[]> => api.get<Trigger[]>('/api/triggers'),
};

export const factorApi = {
  list: (): Promise<MoodFactor[]> => api.get<MoodFactor[]>('/api/factors'),
  create: (name: string): Promise<MoodFactor> =>
    api.post<MoodFactor>('/api/factors', { name }),
};
