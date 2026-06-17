import type { Prisma } from '@prisma/client';
import type { RelapseFormData, RelapseUpdateData } from '@track/shared';
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

  async update(id: string, input: RelapseUpdateData) {
    await relapseService.getById(id); // throws 404 if missing

    // Partial update: only touch the fields actually present in the request, so
    // omitting `description` keeps the stored value instead of wiping it to null.
    // (The native client may send any subset of the form.)
    const data: Prisma.RelapseUpdateInput = {};
    if (input.name !== undefined) data.name = input.name;
    if (input.description !== undefined) data.description = input.description ?? null;
    if (input.color !== undefined) data.color = input.color;
    if (input.icon !== undefined) data.icon = input.icon;
    if (input.startDate !== undefined) data.startDate = new Date(input.startDate);

    const row = await relapseRepository.update(id, data);
    return toRelapseDTO(row);
  },

  async remove(id: string) {
    await relapseService.getById(id); // throws 404 if missing
    await relapseRepository.delete(id); // events cascade via the schema
  },
};
