import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import { toast, Toaster } from 'sonner';
import { ApiError } from '@/lib/api';
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
//
// One toast when the API/DB is unreachable (network failure or a 503 from the
// backend), wired into both caches so reads (queries) and writes (mutations)
// trigger it. A fixed toast id deduplicates it, so several requests failing at
// once don't stack identical toasts.
function notifyIfUnreachable(error: unknown): void {
  if (error instanceof ApiError && error.isUnreachable) {
    toast.error("Can't reach the database", {
      id: 'db-unreachable',
      description: 'Check that the API and the database are running.',
    });
  }
}

const queryClient = new QueryClient({
  queryCache: new QueryCache({ onError: notifyIfUnreachable }),
  mutationCache: new MutationCache({ onError: notifyIfUnreachable }),
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
