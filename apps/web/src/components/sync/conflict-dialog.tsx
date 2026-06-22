import { type ReactNode, useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ConflictResolution, SyncConflict } from '@/lib/sync';

interface ConflictDialogProps {
  /** Open when non-null; the items that changed on both sides. */
  conflicts: SyncConflict[] | null;
  /** Called with the chosen winner per id (also on any dismiss path). */
  onResolve: (resolution: ConflictResolution) => void;
}

type Choice = 'local' | 'server';

/**
 * Per-item conflict resolution. Each item changed on BOTH the phone and the
 * backend since the last sync, so the user picks which version wins. Closing the
 * dialog by any means still resolves (with the current selections) so the sync
 * promise never hangs.
 */
export function ConflictDialog({ conflicts, onResolve }: ConflictDialogProps) {
  const [choices, setChoices] = useState<Record<string, Choice>>({});

  useEffect(() => {
    // Default each conflict to keeping this device's version.
    if (conflicts) {
      setChoices(Object.fromEntries(conflicts.map((c) => [c.id, 'local' as Choice])));
    }
  }, [conflicts]);

  if (!conflicts) return null;

  const setAll = (choice: Choice) =>
    setChoices(Object.fromEntries(conflicts.map((c) => [c.id, choice])));

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onResolve(choices);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Resolve sync conflicts</DialogTitle>
          <DialogDescription>
            These items changed on both this device and the backend since the last sync.
            Choose which version to keep.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => setAll('local')}>
            Keep all from this device
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => setAll('server')}>
            Keep all from backend
          </Button>
        </div>

        <ul className="flex flex-col gap-2">
          {conflicts.map((c) => (
            <li
              key={c.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-border p-3"
            >
              <span className="text-sm">{c.label}</span>
              <div className="flex shrink-0 overflow-hidden rounded-md border border-border">
                <ChoiceTab
                  active={choices[c.id] === 'local'}
                  onClick={() => setChoices((p) => ({ ...p, [c.id]: 'local' }))}
                >
                  This device
                </ChoiceTab>
                <ChoiceTab
                  active={choices[c.id] === 'server'}
                  onClick={() => setChoices((p) => ({ ...p, [c.id]: 'server' }))}
                >
                  Backend
                </ChoiceTab>
              </div>
            </li>
          ))}
        </ul>

        <DialogFooter>
          <Button type="button" onClick={() => onResolve(choices)}>
            Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ChoiceTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'px-3 py-1.5 text-xs font-medium transition-colors',
        active
          ? 'bg-primary text-primary-foreground'
          : 'bg-transparent text-muted-foreground hover:bg-accent',
      )}
    >
      {children}
    </button>
  );
}
