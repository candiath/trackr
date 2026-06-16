import type { MoodEntryFormData } from '@track/shared';
import { factorService } from '../factors/factor.service';
import { moodRepository } from './mood.repository';
import { toMoodEntryDTO } from './mood.mapper';

export const moodService = {
  async list() {
    const rows = await moodRepository.findMany();
    return rows.map(toMoodEntryDTO);
  },

  async create(input: MoodEntryFormData) {
    const factorIds = await factorService.resolveIds(
      input.factors,
      input.customFactors ?? [],
    );
    const row = await moodRepository.create({
      date: new Date(input.date),
      level: input.level,
      note: input.note?.trim() ? input.note.trim() : null,
      factors: { connect: factorIds.map((id) => ({ id })) },
    });
    return toMoodEntryDTO(row);
  },

  async remove(id: string) {
    await moodRepository.delete(id);
  },
};
