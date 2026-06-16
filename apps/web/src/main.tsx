import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { ThemeProvider } from '@/components/theme-provider';
import { App } from '@/App';
// Fuentes Geist (variables). En Vite las cargamos vía Fontsource; el CSS mapea
// los tokens --font-sans / --font-mono a estas familias (ver index.css).
import '@fontsource-variable/geist';
import '@fontsource-variable/geist-mono';
import '@/index.css';

// Una sola instancia de QueryClient para toda la app. staleTime moderado para
// no refetchear de más; sin refetch al enfocar la ventana porque en una app de
// uso personal molesta más de lo que ayuda.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, refetchOnWindowFocus: false },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
        {/* theme="system" para que los toasts sigan el tema activo. */}
        <Toaster theme="system" richColors position="top-right" closeButton />
      </QueryClientProvider>
    </ThemeProvider>
  </StrictMode>,
);
