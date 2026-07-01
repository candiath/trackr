import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import type { Relapse, RelapseEvent, RelapseEventFormData } from '@track/shared';
import { relapseEventApi, relapseKeys } from '@/services/relapses';
import { catalogKeys, triggerApi } from '@/services/catalogs';
import { randomUrgeMessage } from '@/lib/urge-messages';
import { newId, nowISO } from '@/lib/ids';
import { applyOptimistic } from '@/lib/optimistic';
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

interface ResistUrgeDialogProps {
  relapse: Relapse;
  /** Current streak in whole days, shown to reinforce what's at stake. */
  streakDays: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TRIGGER_CUSTOM = '__custom__';

/**
 * "I'm tempted" flow: shows a motivational message and the current streak to
 * dissuade the user, and logs the temptation as an URGE event (which never resets
 * the streak) so it stays on record. Capturing the trigger is optional — the point
 * is to make the moment easy to log and to encourage resisting.
 */
export function ResistUrgeDialog({
  relapse,
  streakDays,
  open,
  onOpenChange,
}: ResistUrgeDialogProps) {
  const qc = useQueryClient();
  const [message, setMessage] = useState(randomUrgeMessage);
  const [trigger, setTrigger] = useState('none');
  const [triggerCustom, setTriggerCustom] = useState('');
  const [note, setNote] = useState('');

  // Re-roll the message and clear the form each time the dialog opens.
  useEffect(() => {
    if (open) {
      setMessage(randomUrgeMessage());
      setTrigger('none');
      setTriggerCustom('');
      setNote('');
    }
  }, [open]);

  const { data: triggers = [] } = useQuery({
    queryKey: catalogKeys.triggers,
    queryFn: triggerApi.list,
  });

  const triggerOptions: SelectOption[] = [
    { value: 'none', label: 'Unspecified' },
    ...triggers.map((t) => ({ value: t.id, label: t.name })),
    { value: TRIGGER_CUSTOM, label: 'Other…' },
  ];

  const mutation = useMutation({
    mutationFn: (data: RelapseEventFormData) =>
      relapseEventApi.create(relapse.id, data, 'URGE'),
    // Optimistic: log the URGE (which never resets the streak) and close immediately.
    onMutate: async (data) => {
      const at = nowISO();
      const triggerName = data.triggerCustom?.trim()
        ? data.triggerCustom.trim()
        : data.triggerId
          ? triggers.find((t) => t.id === data.triggerId)?.name ?? null
          : null;
      const optimistic: RelapseEvent = {
        id: data.id!,
        relapseId: relapse.id,
        kind: 'URGE',
        date: new Date(data.date).toISOString(),
        triggerId: data.triggerId ?? null,
        triggerName,
        intensity: null,
        moodLevel: null,
        notes: data.notes?.trim() ? data.notes.trim() : null,
        createdAt: at,
        updatedAt: at,
      };
      const rollback = await applyOptimistic<RelapseEvent[]>(
        qc,
        relapseKeys.events(relapse.id),
        (old = []) => [optimistic, ...old],
      );
      onOpenChange(false);
      return { rollback };
    },
    onError: (_err, _data, ctx) => ctx?.rollback?.(),
    onSuccess: () => {
      toast.success('Urge resisted 💪', {
        description: 'Logged — your streak stays intact.',
      });
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: relapseKeys.events(relapse.id) });
      qc.invalidateQueries({ queryKey: relapseKeys.all });
      qc.invalidateQueries({ queryKey: catalogKeys.triggers });
    },
  });

  function handleResist() {
    const isCustom = trigger === TRIGGER_CUSTOM;
    const noTrigger = trigger === 'none';
    mutation.mutate({
      id: newId(),
      date: new Date().toISOString(),
      triggerId: isCustom || noTrigger ? null : trigger,
      triggerCustom: isCustom ? triggerCustom.trim() || undefined : undefined,
      intensity: null,
      moodLevel: null,
      notes: note.trim() || undefined,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-emerald-500" />
            Hold on — you've got this
          </DialogTitle>
          <DialogDescription>{message}</DialogDescription>
        </DialogHeader>

        <div
          className="rounded-lg border p-4 text-sm"
          style={{ borderColor: `${relapse.color}55`, backgroundColor: `${relapse.color}11` }}
        >
          You're <span className="font-semibold">{streakDays}</span>{' '}
          {streakDays === 1 ? 'day' : 'days'} into {relapse.name}. An urge passes in
          minutes — don't trade your progress for it.
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="urgeTrigger">What tempted you? (optional)</Label>
          <Select
            id="urgeTrigger"
            options={triggerOptions}
            value={trigger}
            onValueChange={setTrigger}
          />
          {trigger === TRIGGER_CUSTOM && (
            <Input
              className="mt-2"
              placeholder="Type the temptation…"
              value={triggerCustom}
              onChange={(e) => setTriggerCustom(e.target.value)}
            />
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="urgeNote">Note (optional)</Label>
          <Textarea
            id="urgeNote"
            placeholder="What helped you resist?"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button type="button" disabled={mutation.isPending} onClick={handleResist}>
            {mutation.isPending ? 'Saving…' : 'I resisted 💪'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
