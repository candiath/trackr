import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

// Tailwind v4 integrates as a Vite plugin (no tailwind.config.js: the config
// lives in the CSS via @theme). React with its plugin for Fast Refresh.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
  },
  resolve: {
    alias: {
      // "@/" → src for short imports that survive folder refactors.
      '@': path.resolve(import.meta.dirname, './src'),
      // Import shared straight from source: dev gets instant HMR and we don't
      // depend on compiling the package before starting the frontend.
      '@track/shared': path.resolve(
        import.meta.dirname,
        '../../packages/shared/src/index.ts',
      ),
    },
  },
});
