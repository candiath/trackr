import { useCallback, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { dismissUnreachable, notifyUnreachable } from '@/lib/unreachable-toast';

type ServerStatus = 'connecting' | 'online' | 'offline';

// The free-tier backend spins down after ~15 min idle; a cold start can take up to
// ~60s. Give the probe headroom before declaring the server unreachable.
const HEALTH_TIMEOUT_MS = 90_000;

// While offline, re-probe on this cadence so recovery is automatic (no refocus /
// click needed). Gentle enough not to hammer a server that's genuinely down.
const RECOVERY_POLL_MS = 10_000;

const CONFIG: Record<
  ServerStatus,
  { variant: BadgeProps['variant']; label: string; spinner: boolean }
> = {
  connecting: { variant: 'secondary', label: 'Connecting…', spinner: true },
  online: { variant: 'success', label: 'Online', spinner: false },
  offline: { variant: 'destructive', label: 'Offline', spinner: false },
};

/**
 * Probes the public /health endpoint. One request is enough: the host queues it
 * while the container wakes, so the single fetch stays pending for the whole cold
 * start and resolves when the server is up — no polling needed. The AbortController
 * bounds the wait so a server that never wakes eventually flips to "offline".
 *
 * `check` only mutates state AFTER the await (never synchronously inside the
 * effect), and it never shows "Connecting…" itself: the initial render already
 * starts there, and the manual retry owns that transition in its click handler.
 * So the focus re-check (the server may have spun down while the user was away)
 * runs silently, without flickering the badge back to "Connecting…".
 */
function useServerStatus() {
  const qc = useQueryClient();
  const [status, setStatus] = useState<ServerStatus>('connecting');
  // Guards against overlapping probes (e.g. a focus event landing mid-cold-start).
  const probingRef = useRef(false);
  // Set when a probe fails, consumed on the next success: it marks a recovery so we
  // invalidate the caches exactly once (not on every successful probe, which would
  // resurrect the refetch-on-focus behavior that's intentionally disabled).
  const wasOfflineRef = useRef(false);

  const check = useCallback(() => {
    if (probingRef.current) return;
    probingRef.current = true;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS);
    // setState lives in the promise continuations (never synchronously in the
    // effect) — a network failure or abort surfaces as ApiError(status 0). This
    // probe is the single source of truth: it also raises/dismisses the shared
    // "unreachable" toast so the badge and the toast can never disagree.
    api
      .get('/health', { signal: controller.signal })
      .then(
        () => {
          setStatus('online');
          dismissUnreachable();
          // Recovered from an outage: reads that failed/emptied while down won't
          // refetch on their own (refetchOnWindowFocus is off), so reload them.
          if (wasOfflineRef.current) {
            wasOfflineRef.current = false;
            void qc.invalidateQueries();
          }
        },
        () => {
          setStatus('offline');
          wasOfflineRef.current = true;
          notifyUnreachable();
        },
      )
      .finally(() => {
        clearTimeout(timer);
        probingRef.current = false;
      });
  }, [qc]);

  useEffect(() => {
    check();
    const onFocus = () => check();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [check]);

  // While offline, poll gently so recovery is automatic: the badge flips to online,
  // the toast clears, and the caches invalidate — without a refocus or manual retry.
  useEffect(() => {
    if (status !== 'offline') return;
    const id = setInterval(check, RECOVERY_POLL_MS);
    return () => clearInterval(id);
  }, [status, check]);

  const recheck = useCallback(() => {
    setStatus('connecting');
    void check();
  }, [check]);

  return { status, recheck };
}

export function ServerStatusBadge() {
  const { status, recheck } = useServerStatus();
  const { variant, label, spinner } = CONFIG[status];
  const isOffline = status === 'offline';

  return (
    <Badge
      variant={variant}
      aria-live="polite"
      title={isOffline ? 'Server unreachable — click to retry' : undefined}
      onClick={isOffline ? recheck : undefined}
      className={isOffline ? 'cursor-pointer' : undefined}
    >
      {spinner && <Loader2 className="animate-spin" />}
      {label}
    </Badge>
  );
}
