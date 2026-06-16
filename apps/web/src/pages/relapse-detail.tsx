import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  ArrowLeft,
  CalendarClock,
  MoreVertical,
  Pencil,
  Repeat,
  RotateCcw,
  Trash2,
  Trophy,
} from 'lucide-react';
import { relapseApi, relapseEventApi, relapseKeys } from '@/services/relapses';
import { relapseSummary } from '@/lib/relapse-stats';
import { getIcon } from '@/lib/relapse-icons';
import { useNow } from '@/hooks/use-now';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CounterRing } from '@/components/relapses/counter-ring';
import { Milestones } from '@/components/relapses/milestones';
import { RelapseHistory } from '@/components/relapses/relapse-history';
import { LogRelapseDialog } from '@/components/relapses/log-relapse-dialog';
import { BehaviorFormDialog } from '@/components/relapses/behavior-form-dialog';
import { DeleteBehaviorDialog } from '@/components/relapses/delete-behavior-dialog';

export function RelapseDetailPage() {
  const { id = '' } = useParams();
  const [logOpen, setLogOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const now = useNow(60_000);

  const { data: relapse, isLoading } = useQuery({
    queryKey: relapseKeys.detail(id),
    queryFn: () => relapseApi.get(id),
    enabled: Boolean(id),
  });

  const { data: events = [] } = useQuery({
    queryKey: relapseKeys.events(id),
    queryFn: () => relapseEventApi.listByRelapse(id),
    enabled: Boolean(id),
  });

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  if (!relapse) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">We couldn't find that behavior.</p>
        <Link to="/relapses" className={cn(buttonVariants({ variant: 'outline' }))}>
          <ArrowLeft />
          Back
        </Link>
      </div>
    );
  }

  const summary = relapseSummary(relapse, events, now);
  const Icon = getIcon(relapse.icon);

  const stats = [
    { label: 'Total relapses', value: String(summary.totalRelapses), Icon: Repeat },
    {
      label: 'Best streak',
      value: summary.bestStreakDays >= 1 ? `${Math.floor(summary.bestStreakDays)} days` : '—',
      Icon: Trophy,
    },
    { label: 'Most common trigger', value: summary.mostCommonTrigger ?? '—', Icon: Activity },
    {
      label: 'Average between relapses',
      value: summary.averageDaysBetweenRelapses
        ? `${summary.averageDaysBetweenRelapses.toFixed(1)} days`
        : '—',
      Icon: CalendarClock,
    },
  ];

  return (
    <div className="space-y-6">
      <Link
        to="/relapses"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Relapses
      </Link>

      {/* Hero with the large counter. */}
      <Card style={{ borderColor: `${relapse.color}55` }}>
        <CardContent className="space-y-6 p-6">
          <div className="flex items-center gap-4">
            <span
              className="grid size-14 shrink-0 place-items-center rounded-2xl text-white"
              style={{ backgroundColor: relapse.color }}
            >
              <Icon className="size-7" />
            </span>
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-bold tracking-tight">{relapse.name}</h1>
              {relapse.description && (
                <p className="text-sm text-muted-foreground">{relapse.description}</p>
              )}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="ghost" size="icon" aria-label="Behavior options">
                    <MoreVertical />
                  </Button>
                }
              />
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setEditOpen(true)}>
                  <Pencil />
                  Edit behavior
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive data-[highlighted]:bg-destructive/10 data-[highlighted]:text-destructive"
                  onClick={() => setDeleteOpen(true)}
                >
                  <Trash2 />
                  Delete behavior
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex flex-col items-center gap-4 py-2">
            <CounterRing
              since={summary.currentStreakStart}
              color={relapse.color}
              size={216}
              thickness={12}
            />
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Time without relapsing · the ring completes every 24h
            </p>
            <Button variant="outline" onClick={() => setLogOpen(true)}>
              <RotateCcw />
              I had a relapse
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats. */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="space-y-1 p-4">
              <s.Icon className="size-4 text-muted-foreground" />
              <p className="truncate text-lg font-semibold" title={s.value}>
                {s.value}
              </p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Milestones</CardTitle>
        </CardHeader>
        <CardContent>
          <Milestones currentDays={summary.currentStreak.totalDays} color={relapse.color} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>History</CardTitle>
        </CardHeader>
        <CardContent>
          <RelapseHistory relapseId={relapse.id} />
        </CardContent>
      </Card>

      <LogRelapseDialog
        relapse={relapse}
        open={logOpen}
        onOpenChange={setLogOpen}
      />
      <BehaviorFormDialog
        relapse={relapse}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
      <DeleteBehaviorDialog
        relapse={relapse}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </div>
  );
}
