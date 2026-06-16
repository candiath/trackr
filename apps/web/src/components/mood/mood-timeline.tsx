import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { MoodEntry } from '@track/shared';
import { moodApi, moodKeys } from '@/services/mood';
import { MOOD_META } from '@/lib/mood';
import { agruparPorDia } from '@/lib/mood-stats';
import { formatFecha } from '@/lib/format';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

function hora(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
}

/**
 * Línea de tiempo de moods agrupada por día. Recibe las entradas ya ordenadas
 * (desc) del service; mantenemos ese orden al agrupar para mostrar lo más
 * reciente arriba.
 */
export function MoodTimeline({ entries }: { entries: MoodEntry[] }) {
  const qc = useQueryClient();

  const eliminar = useMutation({
    mutationFn: (id: string) => moodApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: moodKeys.all });
      toast.success('Registro eliminado');
    },
  });

  if (entries.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        Todavía no registraste tu ánimo. Empezá con el botón de arriba.
      </p>
    );
  }

  const porDia = [...agruparPorDia(entries).entries()];

  return (
    <div className="space-y-5">
      {porDia.map(([dia, items]) => (
        <div key={dia} className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {formatFecha(items[0].fecha)}
          </p>
          <ul className="space-y-2">
            {items.map((e) => {
              const meta = MOOD_META[e.nivel];
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
                      <span className="text-xs text-muted-foreground">{hora(e.fecha)}</span>
                    </div>
                    {e.nota && <p className="text-sm text-muted-foreground">{e.nota}</p>}
                    {e.factoresNombres && e.factoresNombres.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-0.5">
                        {e.factoresNombres.map((f) => (
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
                    aria-label="Eliminar registro"
                    disabled={eliminar.isPending}
                    onClick={() => eliminar.mutate(e.id)}
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
