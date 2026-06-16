import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, Plus, Trophy, Zap } from 'lucide-react';
import type { Recaida } from '@track/shared';
import { recaidaEventoApi, recaidaKeys } from '@/services/recaidas';
import { resumenRecaida } from '@/lib/recaida-stats';
import { getIcono } from '@/lib/recaida-icons';
import { useNow } from '@/hooks/use-now';
import { formatFechaRelativa } from '@/lib/format';
import { cn } from '@/lib/utils';
import {
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ContadorAnillo } from './contador-anillo';
import { RegistrarRecaidaDialog } from './registrar-recaida-dialog';

/**
 * Tarjeta de una conducta. Cada tarjeta pide sus propios eventos: así la racha
 * se deriva siempre del historial real y, al registrar una recaída, se
 * recalcula sola al invalidarse la query. El anillo tickea por segundo aparte.
 */
export function SobriedadCard({
  recaida,
  className,
}: {
  recaida: Recaida;
  className?: string;
}) {
  const [dialogAbierto, setDialogAbierto] = useState(false);
  // 60s alcanza para "mejor racha" y el "hace…"; los segundos los anima el anillo.
  const now = useNow(60_000);

  const { data: eventos = [] } = useQuery({
    queryKey: recaidaKeys.eventos(recaida.id),
    queryFn: () => recaidaEventoApi.listByRecaida(recaida.id),
  });

  const resumen = resumenRecaida(recaida, eventos, now);
  const Icono = getIcono(recaida.icono);
  const mejor = Math.floor(resumen.mejorRachaDias);
  const ultimo = resumen.ultimaRecaida;

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <span
          className="flex size-9 items-center justify-center rounded-md"
          style={{ backgroundColor: `${recaida.color}1a`, color: recaida.color }}
          aria-hidden
        >
          <Icono className="size-5" />
        </span>
        <CardTitle className="text-base">{recaida.nombre}</CardTitle>
        <CardAction>
          <Tooltip>
            <TooltipTrigger
              render={
                <Link
                  to={`/recaidas/${recaida.id}`}
                  aria-label={`Ver detalle de ${recaida.nombre}`}
                  className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }))}
                >
                  <ChevronRight />
                </Link>
              }
            />
            <TooltipContent>Ver detalle</TooltipContent>
          </Tooltip>
        </CardAction>
      </CardHeader>

      <CardContent className="flex flex-col items-center gap-4">
        <ContadorAnillo desde={resumen.inicioRachaActual} color={recaida.color} />

        <div className="flex w-full items-center justify-center gap-2">
          <Badge variant="secondary">
            <Zap />
            Racha actual
          </Badge>
          <Badge variant="outline">
            <Trophy />
            Mejor: {mejor} {mejor === 1 ? 'día' : 'días'}
          </Badge>
        </div>

        <Separator />

        <div className="flex w-full items-start justify-between gap-3">
          <span className="text-sm text-muted-foreground">Última recaída</span>
          {ultimo ? (
            <div className="flex flex-col items-end gap-1 text-right">
              <span className="text-sm font-medium">
                {formatFechaRelativa(ultimo.fecha, now)}
              </span>
              {ultimo.triggerNombre ? (
                <Badge variant="outline">Disparador: {ultimo.triggerNombre}</Badge>
              ) : (
                <span className="text-xs text-muted-foreground">Sin disparador</span>
              )}
            </div>
          ) : (
            <Badge variant="secondary">Sin recaídas</Badge>
          )}
        </div>
      </CardContent>

      <CardFooter>
        <Button
          variant="outline"
          className="w-full"
          onClick={() => setDialogAbierto(true)}
        >
          <Plus />
          Registrar recaída
        </Button>
      </CardFooter>

      <RegistrarRecaidaDialog
        recaida={recaida}
        open={dialogAbierto}
        onOpenChange={setDialogAbierto}
      />
    </Card>
  );
}
