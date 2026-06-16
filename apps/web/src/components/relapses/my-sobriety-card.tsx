import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowUpRight, Flame, Plus, RotateCcw, Trophy } from 'lucide-react';
import type { Relapse } from '@track/shared';
import { relapseEventApi, relapseKeys } from '@/services/relapses';
import { relapseSummary } from '@/lib/relapse-stats';
import { getIcon } from '@/lib/relapse-icons';
import { useNow } from '@/hooks/use-now';
import { dayCountdown, formatRelativeDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { LogRelapseDialog } from './log-relapse-dialog';

/** Splits the "hh:mm:ss" countdown so it can be shown segmented. */
function countdownParts(remaining: string): [string, string, string] {
  const [h = '--', m = '--', s = '--'] = remaining.split(':');
  return [h, m, s];
}

/**
 * Visual variant of the behavior card: colored band, large counter and a
 * segmented countdown toward the next day. Like {@link SobrietyCard}, it fetches
 * its own events to derive the streak from the real history and ticks per second
 * with `useNow`, so the counter and the progress bar advance on their own.
 */
export function MySobrietyCard({
  relapse,
  className,
}: {
  relapse: Relapse;
  className?: string;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  // 1s: the countdown and the day progress bar animate every second.
  const now = useNow();

  const { data: events = [] } = useQuery({
    queryKey: relapseKeys.events(relapse.id),
    queryFn: () => relapseEventApi.listByRelapse(relapse.id),
  });

  const summary = relapseSummary(relapse, events, now);
  const Icon = getIcon(relapse.icon);
  const streak = summary.currentStreak;
  const best = Math.floor(summary.bestStreakDays);
  const last = summary.lastRelapse;
  const isRecord = streak.days >= best && streak.days > 0;
  const [hh, mm, ss] = countdownParts(dayCountdown(streak.totalMs));
  const progressPct = Math.round(((streak.totalMs % 86_400_000) / 86_400_000) * 100);

  return (
    <Card className={cn('w-full max-w-md gap-0 overflow-hidden p-0', className)}>
      {/* Top band with the behavior color */}
      <div
        className="flex items-center justify-between px-6 py-5 text-white"
        style={{ backgroundColor: relapse.color }}
      >
        <div className="flex items-center gap-3">
          <span
            className="flex size-11 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm"
            aria-hidden
          >
            <Icon className="size-6" />
          </span>
          <div className="flex flex-col">
            <span className="text-lg font-semibold leading-tight">
              {relapse.name}
            </span>
            <span className="text-xs font-medium text-white/80">
              {isRecord ? 'Setting a new record' : 'On track'}
            </span>
          </div>
        </div>
        <Tooltip>
          <TooltipTrigger
            render={
              <Link
                to={`/relapses/${relapse.id}`}
                aria-label={`View ${relapse.name} details`}
                className="flex size-9 items-center justify-center rounded-lg bg-white/15 text-white transition-colors hover:bg-white/25"
              >
                <ArrowUpRight className="size-5" />
              </Link>
            }
          />
          <TooltipContent>View details</TooltipContent>
        </Tooltip>
      </div>

      {/* Main counter */}
      <div className="flex flex-col gap-4 px-6 py-6">
        <div className="flex items-end justify-between gap-2">
          <div className="flex items-baseline gap-2">
            <span
              className="text-6xl font-bold leading-none tracking-tighter tabular-nums"
              style={{ color: relapse.color }}
            >
              {streak.days}
            </span>
            <span className="pb-1 text-sm font-medium text-muted-foreground">
              {streak.days === 1 ? 'day clean' : 'days clean'}
            </span>
          </div>
          {isRecord ? (
            <Badge
              className="border-transparent text-white"
              style={{ backgroundColor: relapse.color }}
            >
              <Flame />
              Record
            </Badge>
          ) : (
            <Badge variant="secondary">
              <Trophy />
              Best {best} {best === 1 ? 'day' : 'days'}
            </Badge>
          )}
        </div>

        {/* Segmented countdown toward the next day */}
        <div className="grid grid-cols-3 gap-2">
          {[
            [hh, 'hours'],
            [mm, 'min'],
            [ss, 'sec'],
          ].map(([value, label]) => (
            <div
              key={label}
              className="flex flex-col items-center gap-0.5 rounded-lg bg-muted py-3"
            >
              <span className="font-mono text-2xl font-semibold leading-none tabular-nums">
                {value}
              </span>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {label}
              </span>
            </div>
          ))}
        </div>

        {/* Current-day progress bar */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Day progress</span>
            <span className="font-mono tabular-nums">{progressPct}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full transition-[width] duration-700 ease-linear"
              style={{ width: `${progressPct}%`, backgroundColor: relapse.color }}
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Last relapse */}
      <div className="flex items-center justify-between gap-3 px-6 py-4">
        <div className="flex flex-col">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">
            Last relapse
          </span>
          <span className="text-sm font-medium tabular-nums">
            {last ? formatRelativeDate(last.date, now) : 'Never'}
          </span>
        </div>
        {last?.triggerName ? (
          <Badge variant="outline">{last.triggerName}</Badge>
        ) : (
          <Badge variant="secondary">
            {last ? 'No trigger' : 'No relapses'}
          </Badge>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 px-6 pb-6">
        <Button
          className="flex-1 text-white"
          style={{ backgroundColor: relapse.color }}
          onClick={() => setDialogOpen(true)}
        >
          <Plus data-icon="inline-start" />
          Log relapse
        </Button>
        <Tooltip>
          <TooltipTrigger
            render={
              <Link
                to={`/relapses/${relapse.id}`}
                aria-label={`View ${relapse.name} history`}
                className={cn(buttonVariants({ variant: 'outline', size: 'icon' }))}
              >
                <RotateCcw />
              </Link>
            }
          />
          <TooltipContent>View history</TooltipContent>
        </Tooltip>
      </div>

      <LogRelapseDialog
        relapse={relapse}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </Card>
  );
}
