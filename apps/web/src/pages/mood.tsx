import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { moodApi, moodKeys } from '@/services/mood';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LogMoodDialog } from '@/components/mood/log-mood-dialog';
import { MoodTrend } from '@/components/mood/mood-trend';
import { MoodCalendar } from '@/components/mood/mood-calendar';
import { MoodTimeline } from '@/components/mood/mood-timeline';

export function MoodPage() {
  const [open, setOpen] = useState(false);

  const { data: entries = [] } = useQuery({
    queryKey: moodKeys.all,
    queryFn: moodApi.list,
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mood</h1>
          <p className="text-sm text-muted-foreground">
            Log how you feel and discover your patterns.
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus />
          Log mood
        </Button>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Trend (30 days)</CardTitle>
          </CardHeader>
          <CardContent>
            <MoodTrend entries={entries} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Calendar</CardTitle>
          </CardHeader>
          <CardContent>
            <MoodCalendar entries={entries} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>History</CardTitle>
        </CardHeader>
        <CardContent>
          <MoodTimeline entries={entries} />
        </CardContent>
      </Card>

      <LogMoodDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}
