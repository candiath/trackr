import { prisma } from '../../lib/prisma';

/** Adapter over Prisma for the MoodFactor catalog. */
export const factorRepository = {
  findMany: () => prisma.moodFactor.findMany({ orderBy: { name: 'asc' } }),

  findByName: (name: string) =>
    prisma.moodFactor.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } },
    }),

  create: (name: string, isSystem = false) =>
    prisma.moodFactor.create({ data: { name, isSystem } }),
};
