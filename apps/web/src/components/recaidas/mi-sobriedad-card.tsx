import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowUpRight, Flame, Plus, RotateCcw, Trophy } from 'lucide-react';
import type { Recaida } from '@track/shared';
import { recaidaEventoApi, recaidaKeys } from '@/services/recaidas';
import { resumenRecaida } from '@/lib/recaida-stats';
import { getIcono } from '@/lib/recaida-icons';
import { useNow } from '@/hooks/use-now';
import { cuentaRegresivaDia, formatFechaRelativa } from '@/lib/format';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { RegistrarRecaidaDialog } from './registrar-recaida-dialog';

/** Separa el "hh:mm:ss" de la cuenta regresiva para mostrarlo segmentado. */
function partesRestante(restante: string): [string, string, string] {
  const [h = '--', m = '--', s = '--'] = restante.split(':');
  return [h, m, s];
}

/**
 * Variante visual de la tarjeta de conducta: banda de color, cronómetro grande y
 * cuenta regresiva segmentada hacia el próximo día. Igual que {@link SobriedadCard},
 * pide sus propios eventos para derivar la racha del historial real y tickea por
 * segundo con `useNow`, de modo que el contador y la barra de progreso avancen solos.
 */
export function MiSobriedadCard({
  recaida,
  className,
}: {
  recaida: Recaida;
  className?: string;
}) {
  const [dialogAbierto, setDialogAbierto] = useState(false);
  // 1s: la cuenta regresiva y la barra de progreso del día se animan al segundo.
  const now = useNow();

  const { data: eventos = [] } = useQuery({
    queryKey: recaidaKeys.eventos(recaida.id),
    queryFn: () => recaidaEventoApi.listByRecaida(recaida.id),
  });

  const resumen = resumenRecaida(recaida, eventos, now);
  const Icono = getIcono(recaida.icono);
  const racha = resumen.rachaActual;
  const mejor = Math.floor(resumen.mejorRachaDias);
  const ultimo = resumen.ultimaRecaida;
  const esRecord = racha.dias >= mejor && racha.dias > 0;
  const [hh, mm, ss] = partesRestante(cuentaRegresivaDia(racha.totalMs));
  const progresoPct = Math.round(((racha.totalMs % 86_400_000) / 86_400_000) * 100);

  return (
    <Card className={cn('w-full max-w-md gap-0 overflow-hidden p-0', className)}>
      {/* Banda superior con el color de la conducta */}
      <div
        className="flex items-center justify-between px-6 py-5 text-white"
        style={{ backgroundColor: recaida.color }}
      >
        <div className="flex items-center gap-3">
          <span
            className="flex size-11 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm"
            aria-hidden
          >
            <Icono className="size-6" />
          </span>
          <div className="flex flex-col">
            <span className="text-lg font-semibold leading-tight">
              {recaida.nombre}
            </span>
            <span className="text-xs font-medium text-white/80">
              {esRecord ? 'Marcando un nuevo récord' : 'En seguimiento'}
            </span>
          </div>
        </div>
        <Tooltip>
          <TooltipTrigger
            render={
              <Link
                to={`/recaidas/${recaida.id}`}
                aria-label={`Ver detalle de ${recaida.nombre}`}
                className="flex size-9 items-center justify-center rounded-lg bg-white/15 text-white transition-colors hover:bg-white/25"
              >
                <ArrowUpRight className="size-5" />
              </Link>
            }
          />
          <TooltipContent>Ver detalle</TooltipContent>
        </Tooltip>
      </div>

      {/* Cronómetro principal */}
      <div className="flex flex-col gap-4 px-6 py-6">
        <div className="flex items-end justify-between gap-2">
          <div className="flex items-baseline gap-2">
            <span
              className="text-6xl font-bold leading-none tracking-tighter tabular-nums"
              style={{ color: recaida.color }}
            >
              {racha.dias}
            </span>
            <span className="pb-1 text-sm font-medium text-muted-foreground">
              {racha.dias === 1 ? 'día limpio' : 'días limpios'}
            </span>
          </div>
          {esRecord ? (
            <Badge
              className="border-transparent text-white"
              style={{ backgroundColor: recaida.color }}
            >
              <Flame />
              Récord
            </Badge>
          ) : (
            <Badge variant="secondary">
              <Trophy />
              Mejor {mejor} {mejor === 1 ? 'día' : 'días'}
            </Badge>
          )}
        </div>

        {/* Cuenta regresiva segmentada hacia el próximo día */}
        <div className="grid grid-cols-3 gap-2">
          {[
            [hh, 'horas'],
            [mm, 'min'],
            [ss, 'seg'],
          ].map(([valor, etiqueta]) => (
            <div
              key={etiqueta}
              className="flex flex-col items-center gap-0.5 rounded-lg bg-muted py-3"
            >
              <span className="font-mono text-2xl font-semibold leading-none tabular-nums">
                {valor}
              </span>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {etiqueta}
              </span>
            </div>
          ))}
        </div>

        {/* Barra de progreso del día en curso */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Progreso del día</span>
            <span className="font-mono tabular-nums">{progresoPct}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full transition-[width] duration-700 ease-linear"
              style={{ width: `${progresoPct}%`, backgroundColor: recaida.color }}
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Última recaída */}
      <div className="flex items-center justify-between gap-3 px-6 py-4">
        <div className="flex flex-col">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">
            Última recaída
          </span>
          <span className="text-sm font-medium tabular-nums">
            {ultimo ? formatFechaRelativa(ultimo.fecha, now) : 'Nunca'}
          </span>
        </div>
        {ultimo?.triggerNombre ? (
          <Badge variant="outline">{ultimo.triggerNombre}</Badge>
        ) : (
          <Badge variant="secondary">
            {ultimo ? 'Sin disparador' : 'Sin recaídas'}
          </Badge>
        )}
      </div>

      {/* Acciones */}
      <div className="flex gap-2 px-6 pb-6">
        <Button
          className="flex-1 text-white"
          style={{ backgroundColor: recaida.color }}
          onClick={() => setDialogAbierto(true)}
        >
          <Plus data-icon="inline-start" />
          Registrar recaída
        </Button>
        <Tooltip>
          <TooltipTrigger
            render={
              <Link
                to={`/recaidas/${recaida.id}`}
                aria-label={`Ver historial de ${recaida.nombre}`}
                className={cn(buttonVariants({ variant: 'outline', size: 'icon' }))}
              >
                <RotateCcw />
              </Link>
            }
          />
          <TooltipContent>Ver historial</TooltipContent>
        </Tooltip>
      </div>

      <RegistrarRecaidaDialog
        recaida={recaida}
        open={dialogAbierto}
        onOpenChange={setDialogAbierto}
      />
    </Card>
  );
}
