import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { ThemeProvider } from '@/components/theme-provider';
import { App } from '@/App';
// Geist (variable) fonts. In Vite we load them via Fontsource; the CSS maps the
// --font-sans / --font-mono tokens to these families (see index.css).
import '@fontsource-variable/geist';
import '@fontsource-variable/geist-mono';
import '@/index.css';

// A single QueryClient for the whole app. Moderate staleTime to avoid over-
// fetching; no refetch on window focus because in a personal-use app it bothers
// more than it helps.
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
        {/* theme="system" so toasts follow the active theme. */}
        <Toaster theme="system" richColors position="top-right" closeButton />
      </QueryClientProvider>
    </ThemeProvider>
  </StrictMode>,
);
