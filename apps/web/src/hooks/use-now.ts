import { useEffect, useState } from 'react';

/**
 * Returns "now" and updates it every `intervalMs`. Used by the live sobriety
 * counters: a single interval per component re-renders and every duration
 * calculation uses that same instant (coherence across cards).
 */
export function useNow(intervalMs = 1000): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return now;
}
