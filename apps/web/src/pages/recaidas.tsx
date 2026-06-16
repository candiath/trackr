import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, ShieldCheck } from 'lucide-react';
import { recaidaApi, recaidaKeys } from '@/services/recaidas';
import { Button } from '@/components/ui/button';
import { SobriedadCard } from '@/components/recaidas/sobriedad-card';
import { NuevaConductaDialog } from '@/components/recaidas/nueva-conducta-dialog';

export function RecaidasPage() {
  const [nuevaAbierto, setNuevaAbierto] = useState(false);

  const { data: recaidas = [], isLoading } = useQuery({
    queryKey: recaidaKeys.all,
    queryFn: recaidaApi.list,
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Recaídas</h1>
          <p className="text-sm text-muted-foreground">
            Seguí el tiempo sin recaer y entendé tus triggers.
          </p>
        </div>
        <Button onClick={() => setNuevaAbierto(true)}>
          <Plus />
          Nueva conducta
        </Button>
      </header>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[0, 1].map((i) => (
            <div key={i} className="h-48 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : recaidas.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-16 text-center">
          <ShieldCheck className="size-10 text-muted-foreground" />
          <div>
            <p className="font-medium">Todavía no seguís ninguna conducta</p>
            <p className="text-sm text-muted-foreground">
              Creá la primera para empezar a contar tu progreso.
            </p>
          </div>
          <Button onClick={() => setNuevaAbierto(true)}>
            <Plus />
            Nueva conducta
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {recaidas.map((r) => (
            <div key={r.id} className="flex gap-4">
              <SobriedadCard recaida={r} className="flex-1" />
              {/* <SobriedadCard recaida={r} className="flex-1" /> */}
            </div>
          ))}
        </div>
      )}

      <NuevaConductaDialog open={nuevaAbierto} onOpenChange={setNuevaAbierto} />
    </div>
  );
}
