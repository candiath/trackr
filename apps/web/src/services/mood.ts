import { mockDb } from '@/mock/db';
import type { MoodEntryFormData } from '@track/shared';

export const moodKeys = {
  all: ['moods'] as const,
};

export const moodApi = {
  // Fase 2: api.get<MoodEntry[]>('/api/moods')
  list: () => mockDb.listMoods(),
  // Fase 2: api.post<MoodEntry>('/api/moods', data)
  create: (data: MoodEntryFormData) => mockDb.crearMood(data),
  // Fase 2: api.delete(`/api/moods/${id}`)
  remove: (id: string) => mockDb.eliminarMood(id),
};
