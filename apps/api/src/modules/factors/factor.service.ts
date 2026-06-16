import { factorRepository } from './factor.repository';
import { toFactorDTO } from './factor.mapper';

export const factorService = {
  async list() {
    const rows = await factorRepository.findMany();
    return rows.map(toFactorDTO);
  },

  async create(name: string) {
    const clean = name.trim();
    const existing = await factorRepository.findByName(clean);
    if (existing) return toFactorDTO(existing);
    return toFactorDTO(await factorRepository.create(clean, false));
  },

  /**
   * Resolves provided factor ids + custom names to a unique list of ids. Custom
   * names are created (or reused, case-insensitive) on the fly. Mirrors the mock.
   */
  async resolveIds(
    factorIds: string[],
    customNames: string[] = [],
  ): Promise<string[]> {
    const customIds: string[] = [];
    for (const raw of customNames) {
      const name = raw.trim();
      if (!name) continue;
      const existing = await factorRepository.findByName(name);
      customIds.push(existing ? existing.id : (await factorRepository.create(name)).id);
    }
    return [...new Set([...factorIds, ...customIds])];
  },
};
