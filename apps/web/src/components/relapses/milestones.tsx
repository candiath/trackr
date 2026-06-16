import { Check } from 'lucide-react';
import { computeMilestones, nextMilestone } from '@/lib/relapse-stats';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

interface MilestonesProps {
  /** Days (with decimals) of the current streak. */
  currentDays: number;
  color: string;
}

/**
 * Shows the next milestone with a progress bar plus a recap of every milestone
 * (reached vs pending). Reinforces motivation: "X days left until…".
 */
export function Milestones({ currentDays, color }: MilestonesProps) {
  const next = nextMilestone(currentDays);
  const all = computeMilestones(currentDays);

  return (
    <div className="space-y-4">
      {next ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Next milestone: <span className="font-medium text-foreground">{next.label}</span>
            </span>
            <span className="text-muted-foreground">
              {Math.max(0, Math.ceil(next.targetDays - currentDays))} days left
            </span>
          </div>
          <Progress
            value={next.progress * 100}
            indicatorStyle={{ backgroundColor: color }}
          />
        </div>
      ) : (
        <p className="text-sm font-medium text-foreground">
          🏅 You passed every milestone! Unstoppable.
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {all.map((m) => (
          <span
            key={m.targetDays}
            className={cn(
              'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
              m.reached
                ? 'border-transparent text-white'
                : 'border-border bg-background text-muted-foreground',
            )}
            style={m.reached ? { backgroundColor: color } : undefined}
          >
            {m.reached && <Check className="size-3" />}
            {m.label}
          </span>
        ))}
      </div>
    </div>
  );
}
