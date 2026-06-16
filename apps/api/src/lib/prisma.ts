import { PrismaClient } from '@prisma/client';

/**
 * Single PrismaClient instance for the whole process. Cached on globalThis so
 * `tsx watch` reloads in dev don't open a new pool on every restart.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
