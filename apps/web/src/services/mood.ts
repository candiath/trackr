import { api } from '@/lib/api';
import type { MoodEntry, MoodEntryFormData } from '@track/shared';

export const moodKeys = {
  all: ['moods'] as const,
};

export const moodApi = {
  list: () => api.get<MoodEntry[]>('/api/moods'),
  create: (data: MoodEntryFormData) => api.post<MoodEntry>('/api/moods', data),
  remove: (id: string) => api.delete(`/api/moods/${id}`),
};
