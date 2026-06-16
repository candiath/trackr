import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Intensidad } from '@track/shared';
import { recaidaEventoApi, recaidaKeys } from '@/services/recaidas';
import { formatFechaHora } from '@/lib/format';
import { MOOD_META } from '@/lib/mood';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const INTENSIDAD_LABEL: Record<Intensidad, string> = {
  LEVE: 'Leve',
  MODERADA: 'Moderada',
  INTENSA: 'Intensa',
};

/**
 * Línea de tiempo de recaídas de una conducta. Permite borrar un evento (con
 * recálculo automático de la racha al invalidar las queries dependientes).
 */
export function HistorialEventos({ recaidaId }: { recaidaId: string }) {
  const qc = useQueryClient();

  const { data: eventos = [], isLoading } = useQuery({
    queryKey: recaidaKeys.eventos(recaidaId),
    queryFn: () => recaidaEventoApi.listByRecaida(recaidaId),
  });

  const eliminar = useMutation({
    mutationFn: (id: string) => recaidaEventoApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: recaidaKeys.eventos(recaidaId) });
      qc.invalidateQueries({ queryKey: recaidaKeys.all });
      toast.success('Registro eliminado');
    },
  });

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Cargando historial…</p>;
  }

  if (eventos.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        Todavía no registraste recaídas. ¡Que siga así! 🎉
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {eventos.map((e) => {
        const mood = e.moodNivel ? MOOD_META[e.moodNivel] : null;
        return (
          <li
            key={e.id}
            className="flex items-start justify-between gap-3 rounded-lg border border-border bg-card p-4"
          >
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium">{formatFechaHora(e.fecha)}</span>
                {e.triggerNombre && <Badge variant="secondary">{e.triggerNombre}</Badge>}
                {e.intensidad && (
                  <Badge variant="outline">{INTENSIDAD_LABEL[e.intensidad]}</Badge>
                )}
                {mood && (
                  <span className="text-sm" title={`Ánimo: ${mood.label}`}>
                    {mood.emoji}
                  </span>
                )}
              </div>
              {e.notas && <p className="text-sm text-muted-foreground">{e.notas}</p>}
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
  );
}
