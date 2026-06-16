import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { moodEntryCreateSchema, type MoodEntryFormData } from '@track/shared';
import { nowForInput } from '@/lib/format';
import { moodApi, moodKeys } from '@/services/mood';
import { catalogKeys, factorApi } from '@/services/catalogs';
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
import { MoodSelector } from './mood-selector';
import { FactorSelector } from './factor-selector';

interface LogMoodDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const INITIAL_VALUES: Omit<MoodEntryFormData, 'level'> = {
  date: '',
  note: '',
  factors: [],
  customFactors: [],
};

export function LogMoodDialog({ open, onOpenChange }: LogMoodDialogProps) {
  const qc = useQueryClient();

  const { data: factorCatalog = [] } = useQuery({
    queryKey: catalogKeys.factors,
    queryFn: factorApi.list,
  });

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<MoodEntryFormData>({
    resolver: zodResolver(moodEntryCreateSchema),
    // `level` is intentionally omitted: it's required and we want the user to
    // pick it (otherwise Zod flags the error on submit).
    defaultValues: { ...INITIAL_VALUES, date: nowForInput() },
  });

  const factorIds = watch('factors') ?? [];
  const customFactors = watch('customFactors') ?? [];

  const mutation = useMutation({
    mutationFn: (data: MoodEntryFormData) => moodApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: moodKeys.all });
      // New factors may have been created: refresh the catalog.
      qc.invalidateQueries({ queryKey: catalogKeys.factors });
      toast.success('Mood logged');
      onOpenChange(false);
      reset({ ...INITIAL_VALUES, date: nowForInput() });
    },
  });

  const onSubmit = handleSubmit((values) => mutation.mutate(values));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>How are you feeling?</DialogTitle>
          <DialogDescription>
            Log your mood. You can record several moments throughout the day.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Mood</Label>
            <Controller
              control={control}
              name="level"
              render={({ field }) => (
                <MoodSelector value={field.value ?? null} onChange={field.onChange} />
              )}
            />
            {errors.level && (
              <p className="text-xs text-destructive">Pick how you feel.</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="moodDate">When?</Label>
            <Input id="moodDate" type="datetime-local" {...register('date')} />
            {errors.date && (
              <p className="text-xs text-destructive">{errors.date.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Factors (optional)</Label>
            <FactorSelector
              catalog={factorCatalog}
              value={{ ids: factorIds, customs: customFactors }}
              onChange={(v) => {
                setValue('factors', v.ids);
                setValue('customFactors', v.customs);
              }}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="moodNote">Note (optional)</Label>
            <Textarea
              id="moodNote"
              placeholder="What's on your mind?"
              {...register('note')}
            />
            {errors.note && (
              <p className="text-xs text-destructive">{errors.note.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
