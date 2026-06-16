import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { moodApi, moodKeys } from '@/services/mood';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RegistrarMoodDialog } from '@/components/mood/registrar-mood-dialog';
import { MoodTendencia } from '@/components/mood/mood-tendencia';
import { MoodCalendario } from '@/components/mood/mood-calendario';
import { MoodTimeline } from '@/components/mood/mood-timeline';

export function MoodPage() {
  const [abierto, setAbierto] = useState(false);

  const { data: entries = [] } = useQuery({
    queryKey: moodKeys.all,
    queryFn: moodApi.list,
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Estado de ánimo</h1>
          <p className="text-sm text-muted-foreground">
            Registrá cómo te sentís y descubrí tus patrones.
          </p>
        </div>
        <Button onClick={() => setAbierto(true)}>
          <Plus />
          Registrar ánimo
        </Button>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Tendencia (30 días)</CardTitle>
          </CardHeader>
          <CardContent>
            <MoodTendencia entries={entries} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Calendario</CardTitle>
          </CardHeader>
          <CardContent>
            <MoodCalendario entries={entries} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Historial</CardTitle>
        </CardHeader>
        <CardContent>
          <MoodTimeline entries={entries} />
        </CardContent>
      </Card>

      <RegistrarMoodDialog open={abierto} onOpenChange={setAbierto} />
    </div>
  );
}
