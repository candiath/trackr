import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';

const include = { factors: true } satisfies Prisma.MoodEntryInclude;

/** Adapter over Prisma for MoodEntry. Always includes the factors relation. */
export const moodRepository = {
  findMany: () => prisma.moodEntry.findMany({ include, orderBy: { date: 'desc' } }),

  create: (data: Prisma.MoodEntryCreateInput) =>
    prisma.moodEntry.create({ data, include }),

  /** Create-or-update by a client-supplied id (idempotent on cold-start retries). */
  upsert: (id: string, data: Prisma.MoodEntryCreateInput) =>
    prisma.moodEntry.upsert({ where: { id }, update: data, create: { ...data, id }, include }),

  delete: (id: string) => prisma.moodEntry.delete({ where: { id } }),
};
