import type { RelapseFormData } from '@track/shared';
import { notFound } from '../../lib/http-error';
import { relapseRepository } from './relapse.repository';
import { toRelapseDTO } from './relapse.mapper';

export const relapseService = {
  async list() {
    const rows = await relapseRepository.findMany();
    return rows.map(toRelapseDTO);
  },

  async getById(id: string) {
    const row = await relapseRepository.findById(id);
    if (!row) throw notFound('Behavior not found');
    return toRelapseDTO(row);
  },

  async create(input: RelapseFormData) {
    const row = await relapseRepository.create({
      name: input.name,
      description: input.description ?? null,
      color: input.color,
      icon: input.icon,
      startDate: new Date(input.startDate),
    });
    return toRelapseDTO(row);
  },

  async update(id: string, input: RelapseFormData) {
    await relapseService.getById(id); // throws 404 if missing
    const row = await relapseRepository.update(id, {
      name: input.name,
      description: input.description ?? null,
      color: input.color,
      icon: input.icon,
      startDate: input.startDate ? new Date(input.startDate) : undefined,
    });
    return toRelapseDTO(row);
  },

  async remove(id: string) {
    await relapseService.getById(id); // throws 404 if missing
    await relapseRepository.delete(id); // events cascade via the schema
  },
};
