import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, Plus, Trophy, Zap } from 'lucide-react';
import type { Relapse } from '@track/shared';
import { relapseEventApi, relapseKeys } from '@/services/relapses';
import { relapseSummary } from '@/lib/relapse-stats';
import { getIcon } from '@/lib/relapse-icons';
import { useNow } from '@/hooks/use-now';
import { formatRelativeDate } from '@/lib/format';
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
import { CounterRing } from './counter-ring';
import { LogRelapseDialog } from './log-relapse-dialog';

/**
 * Card for a behavior. Each card fetches its own events: that way the streak is
 * always derived from the real history and, when a relapse is logged, it
 * recomputes on its own as the query is invalidated. The ring ticks per second.
 */
export function SobrietyCard({
  relapse,
  className,
}: {
  relapse: Relapse;
  className?: string;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  // 60s is enough for "best streak" and the "… ago"; the seconds are animated by the ring.
  const now = useNow(60_000);

  const { data: events = [] } = useQuery({
    queryKey: relapseKeys.events(relapse.id),
    queryFn: () => relapseEventApi.listByRelapse(relapse.id),
  });

  const summary = relapseSummary(relapse, events, now);
  const Icon = getIcon(relapse.icon);
  const best = Math.floor(summary.bestStreakDays);
  const last = summary.lastRelapse;

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <span
          className="flex size-9 items-center justify-center rounded-md"
          style={{ backgroundColor: `${relapse.color}1a`, color: relapse.color }}
          aria-hidden
        >
          <Icon className="size-5" />
        </span>
        <CardTitle className="text-base">{relapse.name}</CardTitle>
        <CardAction>
          <Tooltip>
            <TooltipTrigger
              render={
                <Link
                  to={`/relapses/${relapse.id}`}
                  aria-label={`View ${relapse.name} details`}
                  className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }))}
                >
                  <ChevronRight />
                </Link>
              }
            />
            <TooltipContent>View details</TooltipContent>
          </Tooltip>
        </CardAction>
      </CardHeader>

      <CardContent className="flex flex-col items-center gap-4">
        <CounterRing since={summary.currentStreakStart} color={relapse.color} />

        <div className="flex w-full items-center justify-center gap-2">
          <Badge variant="secondary">
            <Zap />
            Current streak
          </Badge>
          <Badge variant="outline">
            <Trophy />
            Best: {best} {best === 1 ? 'day' : 'days'}
          </Badge>
        </div>

        <Separator />

        <div className="flex w-full items-start justify-between gap-3">
          <span className="text-sm text-muted-foreground">Last relapse</span>
          {last ? (
            <div className="flex flex-col items-end gap-1 text-right">
              <span className="text-sm font-medium">
                {formatRelativeDate(last.date, now)}
              </span>
              {last.triggerName ? (
                <Badge variant="outline">Trigger: {last.triggerName}</Badge>
              ) : (
                <span className="text-xs text-muted-foreground">No trigger</span>
              )}
            </div>
          ) : (
            <Badge variant="secondary">No relapses</Badge>
          )}
        </div>
      </CardContent>

      <CardFooter>
        <Button
          variant="outline"
          className="w-full"
          onClick={() => setDialogOpen(true)}
        >
          <Plus />
          Log relapse
        </Button>
      </CardFooter>

      <LogRelapseDialog
        relapse={relapse}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </Card>
  );
}
