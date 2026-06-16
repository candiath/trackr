import { api } from '@/lib/api';
import type { MoodFactor, Trigger } from '@track/shared';

/**
 * Global catalogs (triggers and mood factors). They are lists shared by every
 * entry, which is why they have their own service and their own keys.
 */
export const catalogKeys = {
  triggers: ['catalog', 'triggers'] as const,
  factors: ['catalog', 'factors'] as const,
};

export const triggerApi = {
  list: () => api.get<Trigger[]>('/api/triggers'),
};

export const factorApi = {
  list: () => api.get<MoodFactor[]>('/api/factors'),
  create: (name: string) => api.post<MoodFactor>('/api/factors', { name }),
};
