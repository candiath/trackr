import { db, newId, nowISO, resolveFactorIds, type StoredMoodEntry } from '@/lib/db';
import type { MoodEntry, MoodEntryFormData } from '@track/shared';

export const moodKeys = {
  all: ['moods'] as const,
};

/** Resolves the stored entry to its DTO, joining factor names from the catalog. */
async function toMoodDTO(m: StoredMoodEntry): Promise<MoodEntry> {
  const factors = await db.factors.bulkGet(m.factors);
  return { ...m, factorNames: factors.flatMap((f) => (f ? [f.name] : [])) };
}

export const moodApi = {
  async list(): Promise<MoodEntry[]> {
    const rows = await db.moods.filter((m) => !m.deletedAt).toArray();
    rows.sort((a, b) => b.date.localeCompare(a.date)); // newest first
    return Promise.all(rows.map(toMoodDTO));
  },

  async create(data: MoodEntryFormData): Promise<MoodEntry> {
    const factors = await resolveFactorIds(data.factors, data.customFactors ?? []);
    const at = nowISO();
    const row: StoredMoodEntry = {
      id: newId(),
      date: new Date(data.date).toISOString(),
      level: data.level,
      note: data.note?.trim() ? data.note.trim() : null,
      factors,
      createdAt: at,
      updatedAt: at,
      dirty: true,
    };
    await db.moods.add(row);
    return toMoodDTO(row);
  },

  async remove(id: string): Promise<void> {
    const at = nowISO();
    await db.moods.update(id, { deletedAt: at, updatedAt: at, dirty: true });
  },
};
