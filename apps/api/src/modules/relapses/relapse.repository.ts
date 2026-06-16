import type { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';

/** Adapter over Prisma for Relapse. Only DB touchpoint for the entity. */
export const relapseRepository = {
  findMany: () => prisma.relapse.findMany({ orderBy: { createdAt: 'asc' } }),

  findById: (id: string) => prisma.relapse.findUnique({ where: { id } }),

  create: (data: Prisma.RelapseCreateInput) => prisma.relapse.create({ data }),

  update: (id: string, data: Prisma.RelapseUpdateInput) =>
    prisma.relapse.update({ where: { id }, data }),

  /** Bumps updatedAt (e.g. after logging an event). */
  touch: (id: string) => prisma.relapse.update({ where: { id }, data: {} }),

  delete: (id: string) => prisma.relapse.delete({ where: { id } }),
};
