import type { Relapse } from '@track/shared';
import type { Relapse as PrismaRelapse } from '@prisma/client';

/** Adapts a Prisma Relapse row to the shared DTO (Date → ISO string). */
export function toRelapseDTO(r: PrismaRelapse): Relapse {
  return {
    id: r.id,
    name: r.name,
    description: r.description,
    color: r.color,
    icon: r.icon,
    startDate: r.startDate.toISOString(),
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}
