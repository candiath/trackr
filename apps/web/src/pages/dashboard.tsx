import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plus, SmilePlus } from 'lucide-react';
import { recaidaApi, recaidaKeys } from '@/services/recaidas';
import { moodApi, moodKeys } from '@/services/mood';
import { MOOD_META, valorANivel } from '@/lib/mood';
import { promedioGeneral } from '@/lib/mood-stats';
import { formatFechaRelativa } from '@/lib/format';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { SobriedadCard } from '@/components/recaidas/sobriedad-card';
import { NuevaConductaDialog } from '@/components/recaidas/nueva-conducta-dialog';
import { RegistrarMoodDialog } from '@/components/mood/registrar-mood-dialog';
import { MoodTendencia } from '@/components/mood/mood-tendencia';
import { MiSobriedadCard } from '@/components/recaidas/mi-sobriedad-card';

function saludo(): string {
  const h = new Date().getHours();
  if (h < 6) return 'Buenas noches';
  if (h < 13) return 'Buen día';
  if (h < 20) return 'Buenas tardes';
  return 'Buenas noches';
}

export function DashboardPage() {
  const [moodAbierto, setMoodAbierto] = useState(false);
  const [conductaAbierto, setConductaAbierto] = useState(false);

  const { data: recaidas = [] } = useQuery({
    queryKey: recaidaKeys.all,
    queryFn: recaidaApi.list,
  });
  const { data: moods = [] } = useQuery({
    queryKey: moodKeys.all,
    queryFn: moodApi.list,
  });

  const ultimoMood = moods[0] ?? null;
  const promedio = promedioGeneral(moods);
  const metaPromedio = promedio != null ? MOOD_META[valorANivel(promedio)] : null;

  const hoy = new Date().toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">{saludo()} 👋</h1>
        <p className="text-sm capitalize text-muted-foreground">{hoy}</p>
      </header>

      <div className="flex flex-wrap gap-2">
        <Button onClick={() => setMoodAbierto(true)}>
          <SmilePlus />
          Registrar ánimo
        </Button>
        <Button variant="outline" onClick={() => setConductaAbierto(true)}>
          <Plus />
          Nueva conducta
        </Button>
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Tu sobriedad</h2>
          <Link
            to="/recaidas"
            className={cn(buttonVariants({ variant: 'link', size: 'sm' }), 'h-auto p-0')}
          >
            Ver todo
          </Link>
        </div>
        {recaidas.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Todavía no seguís ninguna conducta.
          </p>
        ) : (
          // <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-4 sm:grid-cols-2">
            {recaidas.map((r) => (
              <div key={r.id} className="grid gap-4">
                <MiSobriedadCard recaida={r} className="flex-1" />
                {/* <SobriedadCard recaida={r} className="flex-1" /> */}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Tu ánimo</h2>
          <Link
            to="/mood"
            className={cn(buttonVariants({ variant: 'link', size: 'sm' }), 'h-auto p-0')}
          >
            Ver todo
          </Link>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Ahora mismo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {ultimoMood ? (
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{MOOD_META[ultimoMood.nivel].emoji}</span>
                  <div>
                    <p className="font-medium">{MOOD_META[ultimoMood.nivel].label}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFechaRelativa(ultimoMood.fecha)}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Sin registros aún.</p>
              )}
              {metaPromedio && (
                <div className="rounded-lg bg-muted/50 p-3 text-sm">
                  <span className="text-muted-foreground">Promedio reciente: </span>
                  <span className="font-medium">
                    {metaPromedio.emoji} {metaPromedio.label}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Tendencia</CardTitle>
            </CardHeader>
            <CardContent>
              <MoodTendencia entries={moods} />
            </CardContent>
          </Card>
        </div>
      </section>

      <NuevaConductaDialog open={conductaAbierto} onOpenChange={setConductaAbierto} />
      <RegistrarMoodDialog open={moodAbierto} onOpenChange={setMoodAbierto} />
    </div>
  );
}
