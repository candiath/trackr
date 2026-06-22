import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  getLastSyncedAt,
  runSync,
  type ConflictResolution,
  type SyncConflict,
} from '@/lib/sync';
import { ConflictDialog } from './conflict-dialog';

/** A conflict round pending the user's decision (resolves the sync's promise). */
interface Pending {
  conflicts: SyncConflict[];
  resolve: (r: ConflictResolution) => void;
}

/**
 * Manual "Sync now" control: pushes local changes to the laptop server and pulls
 * its changes, showing when the last sync happened. Conflicts (a record changed on
 * both sides) open the per-item dialog; the engine awaits the user's choice.
 */
export function SyncButton() {
  const qc = useQueryClient();
  const [syncing, setSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<string | undefined>(undefined);
  const [pending, setPending] = useState<Pending | null>(null);

  useEffect(() => {
    void getLastSyncedAt().then(setLastSynced);
  }, []);

  async function handleSync() {
    setSyncing(true);
    try {
      const res = await runSync(
        (conflicts) =>
          new Promise<ConflictResolution>((resolve) => setPending({ conflicts, resolve })),
      );
      await qc.invalidateQueries(); // refresh every screen from the updated store
      setLastSynced(await getLastSyncedAt());
      toast.success('Sync complete', {
        description:
          `↓ ${res.pulled} pulled · ↑ ${res.pushed} pushed` +
          (res.conflicts ? ` · ${res.conflicts} conflict(s) resolved` : ''),
      });
    } catch (err) {
      toast.error('Sync failed', {
        description: err instanceof Error ? err.message : 'Please try again.',
      });
    } finally {
      setPending(null);
      setSyncing(false);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <Button
        variant="outline"
        size="sm"
        onClick={handleSync}
        disabled={syncing}
        className="gap-2"
      >
        <RefreshCw className={cn('size-4', syncing && 'animate-spin')} />
        {syncing ? 'Syncing…' : 'Sync now'}
      </Button>
      <span className="px-1 text-[11px] text-muted-foreground">
        {lastSynced ? `Last synced ${new Date(lastSynced).toLocaleString()}` : 'Not synced yet'}
      </span>

      <ConflictDialog
        conflicts={pending?.conflicts ?? null}
        onResolve={(resolution) => {
          pending?.resolve(resolution);
          setPending(null);
        }}
      />
    </div>
  );
}
