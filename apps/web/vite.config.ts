import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

// Tailwind v4 se integra como plugin de Vite (no hay tailwind.config.js: la
// config vive en el CSS con @theme). React con su plugin para Fast Refresh.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
  },
  resolve: {
    alias: {
      // "@/" → src para imports cortos y estables ante refactors de carpetas.
      '@': path.resolve(import.meta.dirname, './src'),
      // Importamos shared directamente del source: en dev hay HMR inmediato y
      // no dependemos de compilar el paquete antes de levantar el front.
      '@track/shared': path.resolve(
        import.meta.dirname,
        '../../packages/shared/src/index.ts',
      ),
    },
  },
});
