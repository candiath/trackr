import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import type { Relapse } from '@track/shared';
import { relapseApi, relapseKeys } from '@/services/relapses';
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

interface DeleteBehaviorDialogProps {
  relapse: Relapse;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Confirmation before deleting a behavior. Built on the Dialog primitive (there's
 * no AlertDialog). On confirm it removes the behavior, invalidates the list and
 * navigates back to /relapses.
 */
export function DeleteBehaviorDialog({
  relapse,
  open,
  onOpenChange,
}: DeleteBehaviorDialogProps) {
  const qc = useQueryClient();
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: () => relapseApi.remove(relapse.id),
    // Optimistic: drop it from the list and leave the detail page immediately.
    onMutate: async () => {
      const rollback = await applyOptimistic<Relapse[]>(qc, relapseKeys.all, (old = []) =>
        old.filter((r) => r.id !== relapse.id),
      );
      onOpenChange(false);
      navigate('/relapses');
      return { rollback };
    },
    onError: (_err, _data, ctx) => ctx?.rollback?.(),
    onSuccess: () => toast.success('Behavior deleted'),
    onSettled: () => qc.invalidateQueries({ queryKey: relapseKeys.all }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Delete behavior</DialogTitle>
          <DialogDescription>
            This permanently deletes “{relapse.name}” and all its logged relapses.
            This can't be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
