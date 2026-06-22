import type { MoodEntry } from '@track/shared';
import type { Prisma } from '@prisma/client';

type MoodWithFactors = Prisma.MoodEntryGetPayload<{ include: { factors: true } }>;

/** Adapts a Prisma MoodEntry (+ factors) to the shared DTO. */
export function toMoodEntryDTO(m: MoodWithFactors): MoodEntry {
  return {
    id: m.id,
    date: m.date.toISOString(),
    level: m.level,
    note: m.note,
    factors: m.factors.map((f) => f.id),
    factorNames: m.factors.map((f) => f.name),
    createdAt: m.createdAt.toISOString(),
    updatedAt: m.updatedAt.toISOString(),
  };
}
