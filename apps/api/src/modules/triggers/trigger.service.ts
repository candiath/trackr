import { triggerRepository } from './trigger.repository';
import { toTriggerDTO } from './trigger.mapper';

export const triggerService = {
  async list() {
    const rows = await triggerRepository.findMany();
    return rows.map(toTriggerDTO);
  },

  /**
   * Resolves a relapse event's trigger to a Trigger id. Free text wins: a new
   * `triggerCustom` is created (or reused, case-insensitive) and linked;
   * otherwise the provided `triggerId` is used. Mirrors the old mock behavior.
   */
  async resolveId(input: {
    triggerId?: string | null;
    triggerCustom?: string;
  }): Promise<string | null> {
    const custom = input.triggerCustom?.trim();
    if (custom) {
      const existing = await triggerRepository.findByName(custom);
      if (existing) return existing.id;
      const created = await triggerRepository.create(custom, false);
      return created.id;
    }
    if (input.triggerId) {
      const found = await triggerRepository.findById(input.triggerId);
      if (found) return found.id;
    }
    return null;
  },
};
