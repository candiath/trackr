import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, ShieldCheck } from 'lucide-react';
import { relapseApi, relapseKeys } from '@/services/relapses';
import { Button } from '@/components/ui/button';
import { SobrietyCard } from '@/components/relapses/sobriety-card';
import { BehaviorFormDialog } from '@/components/relapses/behavior-form-dialog';

export function RelapsesPage() {
  const [createOpen, setCreateOpen] = useState(false);

  const { data: relapses = [], isLoading } = useQuery({
    queryKey: relapseKeys.all,
    queryFn: relapseApi.list,
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Relapses</h1>
          <p className="text-sm text-muted-foreground">
            Track the time without relapsing and understand your triggers.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus />
          New behavior
        </Button>
      </header>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[0, 1].map((i) => (
            <div key={i} className="h-48 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : relapses.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-16 text-center">
          <ShieldCheck className="size-10 text-muted-foreground" />
          <div>
            <p className="font-medium">You're not tracking any behavior yet</p>
            <p className="text-sm text-muted-foreground">
              Create your first one to start counting your progress.
            </p>
          </div>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus />
            New behavior
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {relapses.map((r) => (
            <div key={r.id} className="flex gap-4">
              <SobrietyCard relapse={r} className="flex-1" />
            </div>
          ))}
        </div>
      )}

      <BehaviorFormDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
