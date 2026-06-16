import type { Trigger } from '@track/shared';
import type { Trigger as PrismaTrigger } from '@prisma/client';

export function toTriggerDTO(t: PrismaTrigger): Trigger {
  return {
    id: t.id,
    name: t.name,
    isSystem: t.isSystem,
    createdAt: t.createdAt.toISOString(),
  };
}
