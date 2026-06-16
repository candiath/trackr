"use client"

import { useEffect, useState } from "react"
import * as LucideIcons from "lucide-react"
import {
  ArrowUpRight,
  CircleHelp,
  Flame,
  Plus,
  RotateCcw,
  Trophy,
  type LucideIcon,
} from "lucide-react"

import {
  calcularRachaEnVivo,
  hace,
  inicioRachaActual,
  mejorRacha,
  ultimoEvento,
  type EventoRecaida,
  type Recaida,
} from "@/lib/recaida"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

function resolverIcono(nombre: string): LucideIcon {
  const iconos = LucideIcons as unknown as Record<string, LucideIcon>
  return iconos[nombre] ?? CircleHelp
}

/** Separa el contador "hh:mm:ss" en sus partes para mostrarlas con etiquetas. */
function partesRestante(restante: string): [string, string, string] {
  const [h = "--", m = "--", s = "--"] = restante.split(":")
  return [h, m, s]
}

export interface RecaidaCardAltProps {
  recaida: Recaida
  eventos: EventoRecaida[]
  onVerDetalle?: (recaida: Recaida) => void
  onRegistrarRecaida?: (recaida: Recaida) => void
  className?: string
}

export function RecaidaCardAlt({
  recaida,
  eventos,
  onVerDetalle,
  onRegistrarRecaida,
  className,
}: RecaidaCardAltProps) {
  const [ahora, setAhora] = useState<Date | null>(null)

  useEffect(() => {
    setAhora(new Date())
    const id = setInterval(() => setAhora(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const Icono = resolverIcono(recaida.icono)
  const inicio = inicioRachaActual(recaida, eventos)
  const referencia = ahora ?? inicio
  const racha = calcularRachaEnVivo(inicio, referencia)
  const mejor = mejorRacha(recaida, eventos, referencia)
  const ultimo = ultimoEvento(eventos)
  const esRecord = racha.dias >= mejor && racha.dias > 0
  const [hh, mm, ss] = partesRestante(ahora ? racha.restante : "--:--:--")
  const progresoPct = Math.round((ahora ? racha.progreso : 0) * 100)

  return (
    <Card
      className={cn(
        "w-full max-w-md overflow-hidden p-0 gap-0",
        className,
      )}
    >
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
              {esRecord ? "Marcando un nuevo récord" : "En seguimiento"}
            </span>
          </div>
        </div>
        <Tooltip>
          <TooltipTrigger
            render={
              <button
                type="button"
                aria-label={`Ver detalle de ${recaida.nombre}`}
                onClick={() => onVerDetalle?.(recaida)}
                className="flex size-9 items-center justify-center rounded-lg bg-white/15 text-white transition-colors hover:bg-white/25"
              >
                <ArrowUpRight className="size-5" />
              </button>
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
              className="text-6xl font-bold tabular-nums leading-none tracking-tighter"
              style={{ color: recaida.color }}
            >
              {racha.dias}
            </span>
            <span className="pb-1 text-sm font-medium text-muted-foreground">
              {racha.dias === 1 ? "día limpio" : "días limpios"}
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
              Mejor {mejor} {mejor === 1 ? "día" : "días"}
            </Badge>
          )}
        </div>

        {/* Contador regresivo segmentado */}
        <div className="grid grid-cols-3 gap-2">
          {[
            [hh, "horas"],
            [mm, "min"],
            [ss, "seg"],
          ].map(([valor, etiqueta]) => (
            <div
              key={etiqueta}
              className="flex flex-col items-center gap-0.5 rounded-lg bg-muted py-3"
            >
              <span className="font-mono text-2xl font-semibold tabular-nums leading-none">
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
              style={{
                width: `${progresoPct}%`,
                backgroundColor: recaida.color,
              }}
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
            {ultimo ? hace(new Date(ultimo.fecha), referencia) : "Nunca"}
          </span>
        </div>
        {ultimo?.triggerNombre ? (
          <Badge variant="outline">{ultimo.triggerNombre}</Badge>
        ) : (
          <Badge variant="secondary">
            {ultimo ? "Sin disparador" : "Sin recaídas"}
          </Badge>
        )}
      </div>

      {/* Acción */}
      <div className="flex gap-2 px-6 pb-6">
        <Button
          className="flex-1 text-white"
          style={{ backgroundColor: recaida.color }}
          onClick={() => onRegistrarRecaida?.(recaida)}
        >
          <Plus data-icon="inline-start" />
          Registrar recaída
        </Button>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="outline"
                size="icon"
                aria-label={`Reiniciar contador de ${recaida.nombre}`}
                onClick={() => onVerDetalle?.(recaida)}
              >
                <RotateCcw />
              </Button>
            }
          />
          <TooltipContent>Ver historial</TooltipContent>
        </Tooltip>
      </div>
    </Card>
  )
}
