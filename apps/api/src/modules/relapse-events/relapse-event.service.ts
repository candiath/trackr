import type { Prisma } from '@prisma/client';
import type { RelapseEventFormData } from '@track/shared';
import { relapseService } from '../relapses/relapse.service';
import { relapseRepository } from '../relapses/relapse.repository';
import { triggerService } from '../triggers/trigger.service';
import { relapseEventRepository } from './relapse-event.repository';
import { toRelapseEventDTO } from './relapse-event.mapper';

export const relapseEventService = {
  async listByRelapse(relapseId: string) {
    const rows = await relapseEventRepository.findByRelapse(relapseId);
    return rows.map(toRelapseEventDTO);
  },

  async create(relapseId: string, input: RelapseEventFormData) {
    await relapseService.getById(relapseId); // throws 404 if missing

    const triggerId = await triggerService.resolveId(input);
    const data: Prisma.RelapseEventCreateInput = {
      relapse: { connect: { id: relapseId } },
      kind: input.kind ?? 'RELAPSE',
      date: new Date(input.date),
      trigger: triggerId ? { connect: { id: triggerId } } : undefined,
      intensity: input.intensity ?? null,
      moodLevel: input.moodLevel ?? null,
      notes: input.notes?.trim() ? input.notes.trim() : null,
    };
    const row = input.id
      ? await relapseEventRepository.upsert(input.id, data)
      : await relapseEventRepository.create(data);

    await relapseRepository.touch(relapseId); // keep the behavior's updatedAt fresh
    return toRelapseEventDTO(row);
  },

  async remove(id: string) {
    await relapseEventRepository.delete(id);
  },
};
