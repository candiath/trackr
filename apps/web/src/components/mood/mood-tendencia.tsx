import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { MoodEntry } from '@track/shared';
import { serieTendencia } from '@/lib/mood-stats';
import { MOOD_META, valorANivel } from '@/lib/mood';

/**
 * Tooltip a medida: muestra el día y el ánimo promedio (emoji + etiqueta) en
 * vez del número crudo, que para el usuario no significa nada.
 */
interface TooltipProps {
  active?: boolean;
  payload?: Array<{ value?: number | null }>;
  label?: string;
}
function MoodTooltip({ active, payload, label }: TooltipProps) {
  const valor = payload?.[0]?.value;
  if (!active || valor == null) return null;
  const meta = MOOD_META[valorANivel(valor)];
  return (
    <div className="rounded-md border border-border bg-popover px-3 py-2 text-sm shadow-md">
      <p className="font-medium">{label}</p>
      <p className="text-muted-foreground">
        {meta.emoji} {meta.label}
      </p>
    </div>
  );
}

/** Tendencia del ánimo promedio por día en los últimos 30 días. */
export function MoodTendencia({ entries }: { entries: MoodEntry[] }) {
  const data = serieTendencia(entries, 30);

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
          <XAxis
            dataKey="etiqueta"
            tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }}
            stroke="var(--color-border)"
            interval="preserveStartEnd"
            minTickGap={28}
          />
          <YAxis
            domain={[1, 5]}
            ticks={[1, 2, 3, 4, 5]}
            tickFormatter={(v) => MOOD_META[valorANivel(Number(v))].emoji}
            width={34}
            tick={{ fontSize: 14 }}
            stroke="var(--color-border)"
          />
          <Tooltip content={<MoodTooltip />} />
          <Line
            type="monotone"
            dataKey="valor"
            stroke="var(--color-primary)"
            strokeWidth={2}
            dot={{ r: 2 }}
            activeDot={{ r: 4 }}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
