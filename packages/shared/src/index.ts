/**
 * Single export entry point for the shared package.
 *
 * Project rule: ONLY plain types and Zod schemas that the API exposes/validates
 * live here. No Prisma and no backend/frontend runtime dependencies, so web and
 * api share a contract without coupling to the implementation.
 */
export * from './common';
export * from './mood';
export * from './password';
export * from './relapse';
