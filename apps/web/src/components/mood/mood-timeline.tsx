import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { MoodEntry } from '@track/shared';
import { moodApi, moodKeys } from '@/services/mood';
import { MOOD_META } from '@/lib/mood';
import { groupByDay } from '@/lib/mood-stats';
import { formatDate } from '@/lib/format';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

function time(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

/**
 * Mood timeline grouped by day. Receives the entries already sorted (desc) from
 * the service; we keep that order when grouping to show the most recent on top.
 */
export function MoodTimeline({ entries }: { entries: MoodEntry[] }) {
  const qc = useQueryClient();

  const remove = useMutation({
    mutationFn: (id: string) => moodApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: moodKeys.all });
      toast.success('Entry deleted');
    },
  });

  if (entries.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        You haven't logged your mood yet. Start with the button above.
      </p>
    );
  }

  const byDay = [...groupByDay(entries).entries()];

  return (
    <div className="space-y-5">
      {byDay.map(([day, items]) => (
        <div key={day} className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {formatDate(items[0].date)}
          </p>
          <ul className="space-y-2">
            {items.map((e) => {
              const meta = MOOD_META[e.level];
              return (
                <li
                  key={e.id}
                  className="flex items-start gap-3 rounded-lg border border-border bg-card p-3"
                >
                  <span
                    className="grid size-9 shrink-0 place-items-center rounded-lg text-lg"
                    style={{ backgroundColor: `${meta.color}22` }}
                    title={meta.label}
                  >
                    {meta.emoji}
                  </span>
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{meta.label}</span>
                      <span className="text-xs text-muted-foreground">{time(e.date)}</span>
                    </div>
                    {e.note && <p className="text-sm text-muted-foreground">{e.note}</p>}
                    {e.factorNames && e.factorNames.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-0.5">
                        {e.factorNames.map((f) => (
                          <Badge key={f} variant="secondary">
                            {f}
                          </Badge>
                        ))}
                      </div>
                    )}
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
        </div>
      ))}
    </div>
  );
}
