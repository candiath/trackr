import type { MoodFactor } from '@track/shared';
import type { MoodFactor as PrismaMoodFactor } from '@prisma/client';

export function toFactorDTO(f: PrismaMoodFactor): MoodFactor {
  return {
    id: f.id,
    name: f.name,
    isSystem: f.isSystem,
    createdAt: f.createdAt.toISOString(),
  };
}
