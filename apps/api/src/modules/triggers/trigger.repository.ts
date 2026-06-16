import { prisma } from '../../lib/prisma';

/** Adapter over Prisma for the Trigger catalog. Only DB touchpoint for triggers. */
export const triggerRepository = {
  findMany: () => prisma.trigger.findMany({ orderBy: { name: 'asc' } }),

  findById: (id: string) => prisma.trigger.findUnique({ where: { id } }),

  findByName: (name: string) =>
    prisma.trigger.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } },
    }),

  create: (name: string, isSystem = false) =>
    prisma.trigger.create({ data: { name, isSystem } }),
};
