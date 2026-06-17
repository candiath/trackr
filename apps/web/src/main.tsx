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

/** Toast for the "API/DB unreachable" case, deduplicated by a fixed id. */
function toastUnreachable(): void {
  toast.error("Can't reach the database", {
    id: 'db-unreachable',
    description: 'Check that the API and the database are running.',
  });
}

/**
 * Queries (reads): only surface the unreachable case. Ordinary read failures are
 * shown inline by the pages, so we don't toast every failed background refetch.
 */
function onQueryError(error: unknown): void {
  if (error instanceof ApiError && error.isUnreachable) toastUnreachable();
}

/**
 * Mutations (writes): surface EVERY failure. A user action (create/delete/…) that
 * fails silently is the worst outcome, so any error gets a toast — the specific
 * unreachable message, or the backend's error message for the rest.
 */
function onMutationError(error: unknown): void {
  if (error instanceof ApiError && error.isUnreachable) {
    toastUnreachable();
    return;
  }
  toast.error('Something went wrong', {
    description: error instanceof Error ? error.message : 'Please try again.',
  });
}

const queryClient = new QueryClient({
  queryCache: new QueryCache({ onError: onQueryError }),
  mutationCache: new MutationCache({ onError: onMutationError }),
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
