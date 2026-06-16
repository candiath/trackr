import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  relapseEventCreateSchema,
  type Relapse,
  type RelapseEventFormData,
} from '@track/shared';
import { nowForInput } from '@/lib/format';
import { relapseEventApi, relapseKeys } from '@/services/relapses';
import { catalogKeys, triggerApi } from '@/services/catalogs';
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
import { Select, type SelectOption } from '@/components/ui/select';
import { MoodSelector } from '@/components/mood/mood-selector';
import { IntensitySelector } from './intensity-selector';

interface LogRelapseDialogProps {
  relapse: Relapse;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const INITIAL_VALUES: RelapseEventFormData = {
  date: '',
  triggerId: 'none',
  triggerCustom: '',
  intensity: null,
  moodLevel: null,
  notes: '',
};

/** Select sentinel for "type a new reason". */
const TRIGGER_CUSTOM = '__custom__';

export function LogRelapseDialog({
  relapse,
  open,
  onOpenChange,
}: LogRelapseDialogProps) {
  const qc = useQueryClient();

  // The trigger catalog feeds the Select; it comes from the catalogs service.
  const { data: triggers = [] } = useQuery({
    queryKey: catalogKeys.triggers,
    queryFn: triggerApi.list,
  });

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors },
  } = useForm<RelapseEventFormData>({
    resolver: zodResolver(relapseEventCreateSchema),
    // The default date is "now" (recomputed every time the form opens).
    defaultValues: { ...INITIAL_VALUES, date: nowForInput() },
  });

  const triggerOptions: SelectOption[] = [
    { value: 'none', label: 'Unspecified' },
    ...triggers.map((t) => ({ value: t.id, label: t.name })),
    { value: TRIGGER_CUSTOM, label: 'Other…' },
  ];

  const selectedTrigger = watch('triggerId');

  const mutation = useMutation({
    mutationFn: (data: RelapseEventFormData) =>
      relapseEventApi.create(relapse.id, data),
    onSuccess: () => {
      // Invalidate what depends on events: the streak lives in them.
      qc.invalidateQueries({ queryKey: relapseKeys.events(relapse.id) });
      qc.invalidateQueries({ queryKey: relapseKeys.all });
      qc.invalidateQueries({ queryKey: catalogKeys.triggers });
      toast.success('Relapse logged', {
        description: 'The counter reset from the time you entered.',
      });
      onOpenChange(false);
      reset({ ...INITIAL_VALUES, date: nowForInput() });
    },
  });

  const onSubmit = handleSubmit((values) => {
    const isCustom = values.triggerId === TRIGGER_CUSTOM;
    const noTrigger = values.triggerId === 'none' || !values.triggerId;
    // Translate the UI values to the schema contract before persisting.
    mutation.mutate({
      date: values.date,
      triggerId: isCustom || noTrigger ? null : values.triggerId,
      triggerCustom: isCustom ? values.triggerCustom?.trim() || undefined : undefined,
      intensity: values.intensity ?? null,
      moodLevel: values.moodLevel ?? null,
      notes: values.notes?.trim() || undefined,
    });
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log relapse — {relapse.name}</DialogTitle>
          <DialogDescription>
            Note what happened. No guilt: logging helps you understand the patterns.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="date">When was it?</Label>
            <Input id="date" type="datetime-local" {...register('date')} />
            {errors.date && (
              <p className="text-xs text-destructive">{errors.date.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="trigger">Trigger (reason)</Label>
            <Controller
              control={control}
              name="triggerId"
              render={({ field }) => (
                <Select
                  id="trigger"
                  options={triggerOptions}
                  value={field.value ?? 'none'}
                  onValueChange={field.onChange}
                />
              )}
            />
            {selectedTrigger === TRIGGER_CUSTOM && (
              <Input
                className="mt-2"
                placeholder="Type the reason…"
                {...register('triggerCustom')}
              />
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Intensity</Label>
            <Controller
              control={control}
              name="intensity"
              render={({ field }) => (
                <IntensitySelector value={field.value ?? null} onChange={field.onChange} />
              )}
            />
          </div>

          <div className="space-y-1.5">
            <Label>How did you feel? (optional)</Label>
            <Controller
              control={control}
              name="moodLevel"
              render={({ field }) => (
                <MoodSelector value={field.value ?? null} onChange={field.onChange} />
              )}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="What triggered it? What could you do differently?"
              {...register('notes')}
            />
            {errors.notes && (
              <p className="text-xs text-destructive">{errors.notes.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving…' : 'Log relapse'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
