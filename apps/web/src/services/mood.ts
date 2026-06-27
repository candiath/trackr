import { api } from '@/lib/api';
import { newId } from '@/lib/ids';
import type { MoodEntry, MoodEntryFormData } from '@track/shared';

/**
 * Service for mood entries. Talks to the REST API (Postgres is the source of truth);
 * the client supplies the id (uuid v7) so an optimistic entry and the stored row
 * share it. Custom factors travel as names in `customFactors` and are created
 * server-side. Same `<entity>Api` / `<entity>Keys` shape as before.
 */
export const moodKeys = {
  all: ['moods'] as const,
};

export const moodApi = {
  list: (): Promise<MoodEntry[]> => api.get<MoodEntry[]>('/api/moods'),

  create: (data: MoodEntryFormData): Promise<MoodEntry> =>
    // Spread first, then set id, so an undefined `data.id` can't clobber the fallback.
    api.post<MoodEntry>('/api/moods', { ...data, id: data.id ?? newId() }),

  remove: (id: string): Promise<void> => api.delete(`/api/moods/${id}`),
};
