import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plus, SmilePlus } from 'lucide-react';
import { relapseApi, relapseKeys } from '@/services/relapses';
import { moodApi, moodKeys } from '@/services/mood';
import { MOOD_META, valueToLevel } from '@/lib/mood';
import { overallAverage } from '@/lib/mood-stats';
import { formatRelativeDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { BehaviorFormDialog } from '@/components/relapses/behavior-form-dialog';
import { MySobrietyCard } from '@/components/relapses/my-sobriety-card';
import { LogMoodDialog } from '@/components/mood/log-mood-dialog';
import { MoodTrend } from '@/components/mood/mood-trend';

function greeting(): string {
  const h = new Date().getHours();
  if (h < 6) return 'Good night';
  if (h < 13) return 'Good morning';
  if (h < 20) return 'Good afternoon';
  return 'Good evening';
}

export function DashboardPage() {
  const [moodOpen, setMoodOpen] = useState(false);
  const [behaviorOpen, setBehaviorOpen] = useState(false);

  const { data: relapses = [] } = useQuery({
    queryKey: relapseKeys.all,
    queryFn: relapseApi.list,
  });
  const { data: moods = [] } = useQuery({
    queryKey: moodKeys.all,
    queryFn: moodApi.list,
  });

  const lastMood = moods[0] ?? null;
  const average = overallAverage(moods);
  const averageMeta = average != null ? MOOD_META[valueToLevel(average)] : null;

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">{greeting()} 👋</h1>
        <p className="text-sm text-muted-foreground">{today}</p>
      </header>

      <div className="flex flex-wrap gap-2">
        <Button onClick={() => setMoodOpen(true)}>
          <SmilePlus />
          Log mood
        </Button>
        <Button variant="outline" onClick={() => setBehaviorOpen(true)}>
          <Plus />
          New behavior
        </Button>
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Your sobriety</h2>
          <Link
            to="/relapses"
            className={cn(buttonVariants({ variant: 'link', size: 'sm' }), 'h-auto p-0')}
          >
            See all
          </Link>
        </div>
        {relapses.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            You're not tracking any behavior yet.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {relapses.map((r) => (
              <div key={r.id} className="grid gap-4">
                <MySobrietyCard relapse={r} className="flex-1" />
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Your mood</h2>
          <Link
            to="/mood"
            className={cn(buttonVariants({ variant: 'link', size: 'sm' }), 'h-auto p-0')}
          >
            See all
          </Link>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Right now</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {lastMood ? (
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{MOOD_META[lastMood.level].emoji}</span>
                  <div>
                    <p className="font-medium">{MOOD_META[lastMood.level].label}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatRelativeDate(lastMood.date)}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No entries yet.</p>
              )}
              {averageMeta && (
                <div className="rounded-lg bg-muted/50 p-3 text-sm">
                  <span className="text-muted-foreground">Recent average: </span>
                  <span className="font-medium">
                    {averageMeta.emoji} {averageMeta.label}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <MoodTrend entries={moods} />
            </CardContent>
          </Card>
        </div>
      </section>

      <BehaviorFormDialog open={behaviorOpen} onOpenChange={setBehaviorOpen} />
      <LogMoodDialog open={moodOpen} onOpenChange={setMoodOpen} />
    </div>
  );
}
