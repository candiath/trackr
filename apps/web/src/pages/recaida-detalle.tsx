import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  ArrowLeft,
  CalendarClock,
  Repeat,
  RotateCcw,
  Trophy,
} from 'lucide-react';
import { recaidaApi, recaidaEventoApi, recaidaKeys } from '@/services/recaidas';
import { resumenRecaida } from '@/lib/recaida-stats';
import { getIcono } from '@/lib/recaida-icons';
import { useNow } from '@/hooks/use-now';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { ContadorAnillo } from '@/components/recaidas/contador-anillo';
import { Hitos } from '@/components/recaidas/hitos';
import { HistorialEventos } from '@/components/recaidas/historial-eventos';
import { RegistrarRecaidaDialog } from '@/components/recaidas/registrar-recaida-dialog';

export function RecaidaDetallePage() {
  const { id = '' } = useParams();
  const [dialogAbierto, setDialogAbierto] = useState(false);
  const now = useNow(60_000);

  const { data: recaida, isLoading } = useQuery({
    queryKey: recaidaKeys.detail(id),
    queryFn: () => recaidaApi.get(id),
    enabled: Boolean(id),
  });

  const { data: eventos = [] } = useQuery({
    queryKey: recaidaKeys.eventos(id),
    queryFn: () => recaidaEventoApi.listByRecaida(id),
    enabled: Boolean(id),
  });

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Cargando…</p>;
  }

  if (!recaida) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">No encontramos esa conducta.</p>
        <Link to="/recaidas" className={cn(buttonVariants({ variant: 'outline' }))}>
          <ArrowLeft />
          Volver
        </Link>
      </div>
    );
  }

  const resumen = resumenRecaida(recaida, eventos, now);
  const Icono = getIcono(recaida.icono);

  const stats = [
    { label: 'Recaídas totales', valor: String(resumen.totalRecaidas), Icon: Repeat },
    {
      label: 'Mejor racha',
      valor: resumen.mejorRachaDias >= 1 ? `${Math.floor(resumen.mejorRachaDias)} días` : '—',
      Icon: Trophy,
    },
    { label: 'Disparador más común', valor: resumen.triggerMasComun ?? '—', Icon: Activity },
    {
      label: 'Promedio entre recaídas',
      valor: resumen.promedioEntreRecaidasDias
        ? `${resumen.promedioEntreRecaidasDias.toFixed(1)} días`
        : '—',
      Icon: CalendarClock,
    },
  ];

  return (
    <div className="space-y-6">
      <Link
        to="/recaidas"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Recaídas
      </Link>

      {/* Hero con el contador grande. */}
      <Card style={{ borderColor: `${recaida.color}55` }}>
        <CardContent className="space-y-6 p-6">
          <div className="flex items-center gap-4">
            <span
              className="grid size-14 shrink-0 place-items-center rounded-2xl text-white"
              style={{ backgroundColor: recaida.color }}
            >
              <Icono className="size-7" />
            </span>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{recaida.nombre}</h1>
              {recaida.descripcion && (
                <p className="text-sm text-muted-foreground">{recaida.descripcion}</p>
              )}
            </div>
          </div>

          <div className="flex flex-col items-center gap-4 py-2">
            <ContadorAnillo
              desde={resumen.inicioRachaActual}
              color={recaida.color}
              size={216}
              grosor={12}
            />
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Tiempo sin recaídas · el anillo se completa cada 24 h
            </p>
            <Button variant="outline" onClick={() => setDialogAbierto(true)}>
              <RotateCcw />
              Registré una recaída
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Estadísticas. */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="space-y-1 p-4">
              <s.Icon className="size-4 text-muted-foreground" />
              <p className="truncate text-lg font-semibold" title={s.valor}>
                {s.valor}
              </p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Hitos</CardTitle>
        </CardHeader>
        <CardContent>
          <Hitos diasActuales={resumen.rachaActual.totalDias} color={recaida.color} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Historial</CardTitle>
        </CardHeader>
        <CardContent>
          <HistorialEventos recaidaId={recaida.id} />
        </CardContent>
      </Card>

      <RegistrarRecaidaDialog
        recaida={recaida}
        open={dialogAbierto}
        onOpenChange={setDialogAbierto}
      />
    </div>
  );
}
