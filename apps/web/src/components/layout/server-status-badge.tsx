import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { dismissUnreachable, notifyUnreachable } from '@/lib/unreachable-toast';

type ServerStatus = 'connecting' | 'online' | 'offline';

// The free-tier backend spins down after ~15 min idle; a cold start can take up to
// ~60s. Give the probe headroom before declaring the server unreachable.
const HEALTH_TIMEOUT_MS = 90_000;

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
  const [status, setStatus] = useState<ServerStatus>('connecting');
  // Guards against overlapping probes (e.g. a focus event landing mid-cold-start).
  const probingRef = useRef(false);

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
        },
        () => {
          setStatus('offline');
          notifyUnreachable();
        },
      )
      .finally(() => {
        clearTimeout(timer);
        probingRef.current = false;
      });
  }, []);

  useEffect(() => {
    check();
    const onFocus = () => check();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [check]);

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
