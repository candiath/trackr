/// <reference types="vitest/config" />
import { defineConfig, type PluginOption } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'node:path';

// Tailwind v4 integrates as a Vite plugin (no tailwind.config.js: the config
// lives in the CSS via @theme). React with its plugin for Fast Refresh.
const plugins: PluginOption[] = [react(), tailwindcss()];

// PWA: precache the app shell so Track installs to the home screen and runs fully
// offline (data lives in IndexedDB; the API/sync calls are cross-origin and stay on
// the network, so they're never cached). Skipped under Vitest to keep tests fast.
if (!process.env.VITEST) {
  plugins.push(
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      // Generates favicon, apple-touch-icon and the maskable PWA icons from logo.svg
      // and injects them into the manifest + <head>.
      pwaAssets: { preset: 'minimal-2023', image: 'public/logo.svg' },
      manifest: {
        name: 'Track',
        short_name: 'Track',
        description: 'Personal relapse and mood tracker — offline first.',
        theme_color: '#7c3aed',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        scope: '/',
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,woff2}'],
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true,
        clientsClaim: true,
      },
    }),
  );
}

export default defineConfig({
  plugins,
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
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
