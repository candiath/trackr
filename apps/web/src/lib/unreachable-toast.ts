import { toast } from 'sonner';

/**
 * Single "server/database unreachable" toast, shared so the app speaks with one
 * voice. The /health probe (ServerStatusBadge) owns its lifecycle — it raises the
 * toast when a probe fails and dismisses it when one succeeds — so it stays in sync
 * with the badge instead of being a second, independently-timed detector. A failed
 * write reuses the SAME id, so a mutation error and the badge collapse into one
 * toast rather than stacking.
 */
const UNREACHABLE_TOAST_ID = 'db-unreachable';

export function notifyUnreachable(): void {
  toast.error("Can't reach the server", {
    id: UNREACHABLE_TOAST_ID,
    description: 'Check that the API and the database are running.',
    // Persist until a successful probe dismisses it (the closeButton still lets the
    // user hide it manually); a fixed timeout would desync it from the badge.
    duration: Infinity,
  });
}

export function dismissUnreachable(): void {
  toast.dismiss(UNREACHABLE_TOAST_ID);
}
