import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Intensity } from '@track/shared';
import { relapseEventApi, relapseKeys } from '@/services/relapses';
import { formatDateTime } from '@/lib/format';
import { MOOD_META } from '@/lib/mood';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const INTENSITY_LABEL: Record<Intensity, string> = {
  MILD: 'Mild',
  MODERATE: 'Moderate',
  INTENSE: 'Intense',
};

/**
 * Relapse timeline for a behavior. Lets you delete an event (with automatic
 * streak recompute when the dependent queries are invalidated).
 */
export function RelapseHistory({ relapseId }: { relapseId: string }) {
  const qc = useQueryClient();

  const { data: events = [], isLoading } = useQuery({
    queryKey: relapseKeys.events(relapseId),
    queryFn: () => relapseEventApi.listByRelapse(relapseId),
  });

  const remove = useMutation({
    mutationFn: (id: string) => relapseEventApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: relapseKeys.events(relapseId) });
      qc.invalidateQueries({ queryKey: relapseKeys.all });
      toast.success('Entry deleted');
    },
  });

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading history…</p>;
  }

  if (events.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        Nothing logged yet. Keep it up! 🎉
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {events.map((e) => {
        const mood = e.moodLevel ? MOOD_META[e.moodLevel] : null;
        return (
          <li
            key={e.id}
            className="flex items-start justify-between gap-3 rounded-lg border border-border bg-card p-4"
          >
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium">{formatDateTime(e.date)}</span>
                {e.kind === 'URGE' && (
                  <Badge className="border-transparent bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                    Urge resisted
                  </Badge>
                )}
                {e.triggerName && <Badge variant="secondary">{e.triggerName}</Badge>}
                {e.intensity && (
                  <Badge variant="outline">{INTENSITY_LABEL[e.intensity]}</Badge>
                )}
                {mood && (
                  <span className="text-sm" title={`Mood: ${mood.label}`}>
                    {mood.emoji}
                  </span>
                )}
              </div>
              {e.notes && <p className="text-sm text-muted-foreground">{e.notes}</p>}
            </div>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Delete entry"
              disabled={remove.isPending}
              onClick={() => remove.mutate(e.id)}
            >
              <Trash2 className="text-muted-foreground" />
            </Button>
          </li>
        );
      })}
    </ul>
  );
}
