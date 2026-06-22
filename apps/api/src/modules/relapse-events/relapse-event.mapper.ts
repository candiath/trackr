import type { RelapseEvent } from '@track/shared';
import type { Prisma } from '@prisma/client';

type EventWithTrigger = Prisma.RelapseEventGetPayload<{ include: { trigger: true } }>;

/** Adapts a Prisma RelapseEvent (+ trigger) to the shared DTO. */
export function toRelapseEventDTO(e: EventWithTrigger): RelapseEvent {
  return {
    id: e.id,
    relapseId: e.relapseId,
    date: e.date.toISOString(),
    triggerId: e.triggerId,
    triggerName: e.trigger?.name ?? null,
    intensity: e.intensity,
    moodLevel: e.moodLevel,
    notes: e.notes,
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
  };
}
