import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import {
  MutationCache,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import { toast, Toaster } from 'sonner';
import { ApiError } from '@/lib/api';
import { notifyUnreachable } from '@/lib/unreachable-toast';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from '@/components/auth/auth-provider';
import { App } from '@/App';
// Geist (variable) fonts. In Vite we load them via Fontsource; the CSS maps the
// --font-sans / --font-mono tokens to these families (see index.css).
import '@fontsource-variable/geist';
import '@fontsource-variable/geist-mono';
import '@/index.css';

// A single QueryClient for the whole app. Moderate staleTime to avoid over-
// fetching; no refetch on window focus because in a personal-use app it bothers
// more than it helps.

/**
 * Mutations (writes): surface EVERY failure. A user action (create/delete/…) that
 * fails silently is the worst outcome, so any error gets a toast — the shared
 * unreachable notice (same id the ServerStatusBadge uses, so they collapse into
 * one), or the backend's error message for the rest.
 *
 * Reads are NOT toasted here: the ServerStatusBadge's /health probe is the single
 * source of truth for reachability and owns that toast, so a failed read no longer
 * fires a second, retry-delayed toast that lagged behind the badge.
 */
function onMutationError(error: unknown): void {
  if (error instanceof ApiError && error.isUnreachable) {
    notifyUnreachable();
    return;
  }
  toast.error('Something went wrong', {
    description: error instanceof Error ? error.message : 'Please try again.',
  });
}

const queryClient = new QueryClient({
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
          <AuthProvider>
            <App />
          </AuthProvider>
        </BrowserRouter>
        {/* theme="system" so toasts follow the active theme. */}
        <Toaster theme="system" richColors position="top-right" closeButton />
      </QueryClientProvider>
    </ThemeProvider>
  </StrictMode>,
);
