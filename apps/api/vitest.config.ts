import { defineConfig } from 'vitest/config';
import path from 'node:path';

/**
 * Vitest for the API. We import `@track/shared` straight from its source (same as
 * the web Vite alias) so tests don't depend on the package being built first.
 */
export default defineConfig({
  resolve: {
    alias: {
      '@track/shared': path.resolve(
        import.meta.dirname,
        '../../packages/shared/src/index.ts',
      ),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
