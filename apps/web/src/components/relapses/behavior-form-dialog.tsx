import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Check } from 'lucide-react';
import {
  relapseCreateSchema,
  type Relapse,
  type RelapseFormData,
} from '@track/shared';
import { relapseApi, relapseKeys } from '@/services/relapses';
import { COLOR_OPTIONS, ICON_OPTIONS } from '@/lib/relapse-icons';
import { newId, nowISO } from '@/lib/ids';
import { applyOptimistic } from '@/lib/optimistic';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface BehaviorFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When provided, the dialog runs in edit mode pre-populated with this data. */
  relapse?: Relapse;
}

/** Local YYYY-MM-DDTHH:mm for the `datetime-local` input. */
function todayInput(): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

function isoToDateInput(iso: string): string {
  const d = new Date(iso);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

/** The persistable behavior fields derived from the form (shared by create + edit). */
function formToFields(data: RelapseFormData) {
  return {
    name: data.name,
    description: data.description?.trim() ? data.description.trim() : null,
    color: data.color,
    icon: data.icon,
    startDate: new Date(data.startDate).toISOString(),
  };
}

/** Build the form defaults from an existing behavior (edit) or blank (create). */
function buildDefaults(relapse?: Relapse): RelapseFormData {
  return {
    name: relapse?.name ?? '',
    description: relapse?.description ?? '',
    color: relapse?.color ?? COLOR_OPTIONS[0],
    icon: relapse?.icon ?? ICON_OPTIONS[0].value,
    startDate: relapse ? isoToDateInput(relapse.startDate) : todayInput(),
  };
}

/**
 * Create/edit a behavior. A single dialog with two modes: with no `relapse` it
 * creates; with a `relapse` it pre-populates the same form and updates. This
 * reuses one form for both flows (DRY).
 */
export function BehaviorFormDialog({
  open,
  onOpenChange,
  relapse,
}: BehaviorFormDialogProps) {
  const qc = useQueryClient();
  const isEdit = Boolean(relapse);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<RelapseFormData>({
    resolver: zodResolver(relapseCreateSchema),
    defaultValues: buildDefaults(relapse),
  });

  // Repopulate whenever the dialog opens or the target behavior changes.
  useEffect(() => {
    if (open) reset(buildDefaults(relapse));
  }, [open, relapse, reset]);

  const mutation = useMutation({
    mutationFn: (data: RelapseFormData) =>
      isEdit ? relapseApi.update(relapse!.id, data) : relapseApi.create(data),
    // Optimistic: patch (edit) or insert (create) the cached behavior and close the
    // dialog immediately, so the UI doesn't wait on a cold backend. onError rolls back.
    onMutate: async (data) => {
      const rollbacks: Array<() => void> = [];
      if (isEdit) {
        const patch = (r: Relapse): Relapse => ({ ...r, ...formToFields(data), updatedAt: nowISO() });
        rollbacks.push(
          await applyOptimistic<Relapse[]>(qc, relapseKeys.all, (old = []) =>
            old.map((r) => (r.id === relapse!.id ? patch(r) : r)),
          ),
        );
        rollbacks.push(
          await applyOptimistic<Relapse>(qc, relapseKeys.detail(relapse!.id), (old) =>
            old ? patch(old) : old,
          ),
        );
      } else {
        const at = nowISO();
        const optimistic: Relapse = { id: data.id!, ...formToFields(data), createdAt: at, updatedAt: at };
        rollbacks.push(
          await applyOptimistic<Relapse[]>(qc, relapseKeys.all, (old = []) => [...old, optimistic]),
        );
      }
      onOpenChange(false);
      if (!isEdit) reset(buildDefaults());
      return { rollbacks };
    },
    onError: (_err, _data, ctx) => ctx?.rollbacks.forEach((r) => r()),
    onSuccess: () => {
      toast.success(isEdit ? 'Behavior updated' : 'Behavior created', {
        description: isEdit
          ? 'Your changes were saved.'
          : 'You can start tracking your progress.',
      });
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: relapseKeys.all });
      if (isEdit) qc.invalidateQueries({ queryKey: relapseKeys.detail(relapse!.id) });
    },
  });

  // A client id on create so the optimistic row and the stored row share it.
  const onSubmit = handleSubmit((values) =>
    mutation.mutate(isEdit ? values : { ...values, id: newId() }),
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit behavior' : 'New behavior to track'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update the details of this behavior.'
              : "Something you want to quit. We'll count the time since the start date."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Name</Label>
            <Input id="name" placeholder="e.g. Alcohol, Tobacco…" {...register('name')} />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              placeholder="A note for your future self…"
              {...register('description')}
            />
          </div>

          <div className="space-y-2">
            <Label>Icon</Label>
            <Controller
              control={control}
              name="icon"
              render={({ field }) => (
                <div className="flex flex-wrap gap-2">
                  {ICON_OPTIONS.map((op) => {
                    const Icon = op.Icon;
                    const active = field.value === op.value;
                    return (
                      <button
                        type="button"
                        key={op.value}
                        title={op.label}
                        onClick={() => field.onChange(op.value)}
                        className={cn(
                          'grid size-10 place-items-center rounded-lg border transition-colors',
                          active
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border bg-background text-muted-foreground hover:bg-accent',
                        )}
                      >
                        <Icon className="size-5" />
                      </button>
                    );
                  })}
                </div>
              )}
            />
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <Controller
              control={control}
              name="color"
              render={({ field }) => (
                <div className="flex flex-wrap gap-2">
                  {COLOR_OPTIONS.map((color) => {
                    const active = field.value === color;
                    return (
                      <button
                        type="button"
                        key={color}
                        aria-label={`Color ${color}`}
                        onClick={() => field.onChange(color)}
                        className="grid size-8 place-items-center rounded-full ring-offset-2 ring-offset-background transition-shadow"
                        style={{
                          backgroundColor: color,
                          boxShadow: active ? `0 0 0 2px ${color}` : undefined,
                        }}
                      >
                        {active && <Check className="size-4 text-white" />}
                      </button>
                    );
                  })}
                </div>
              )}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="startDate">Clean since…</Label>
            <Input id="startDate" type="datetime-local" {...register('startDate')} />
            {errors.startDate && (
              <p className="text-xs text-destructive">{errors.startDate.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending
                ? 'Saving…'
                : isEdit
                  ? 'Save changes'
                  : 'Create behavior'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
