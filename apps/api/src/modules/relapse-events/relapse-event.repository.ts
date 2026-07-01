import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';

const include = { trigger: true } satisfies Prisma.RelapseEventInclude;

/** Adapter over Prisma for RelapseEvent. Always includes the trigger relation. */
export const relapseEventRepository = {
  findByRelapse: (relapseId: string) =>
    prisma.relapseEvent.findMany({
      where: { relapseId },
      include,
      orderBy: { date: 'desc' },
    }),

  create: (data: Prisma.RelapseEventCreateInput) =>
    prisma.relapseEvent.create({ data, include }),

  /** Create-or-update by a client-supplied id (idempotent on cold-start retries). */
  upsert: (id: string, data: Prisma.RelapseEventCreateInput) =>
    prisma.relapseEvent.upsert({ where: { id }, update: data, create: { ...data, id }, include }),

  delete: (id: string) => prisma.relapseEvent.delete({ where: { id } }),
};
