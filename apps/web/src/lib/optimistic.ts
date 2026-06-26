import type { QueryClient, QueryKey } from '@tanstack/react-query';

/**
 * Optimistic cache edit for one query. Cancels in-flight refetches (so a slow
 * response can't clobber the optimistic value), snapshots the current data, applies
 * `update`, and returns a rollback that restores the snapshot — call it from the
 * mutation's `onError`. Keeps the cancel/snapshot/restore dance out of every dialog.
 *
 * Returning `undefined` from `update` is a no-op (TanStack leaves the cache as-is),
 * which lets callers skip a query that isn't populated.
 */
export async function applyOptimistic<T>(
  qc: QueryClient,
  key: QueryKey,
  update: (current: T | undefined) => T | undefined,
): Promise<() => void> {
  await qc.cancelQueries({ queryKey: key });
  const previous = qc.getQueryData<T>(key);
  qc.setQueryData<T>(key, (old) => update(old));
  return () => qc.setQueryData(key, previous);
}
