import { describe, expect, it } from 'vitest';
import type { EventKind, Relapse, RelapseEvent } from '@track/shared';
import {
  computeMilestones,
  nextMilestone,
  relapseSummary,
} from './relapse-stats';

const DAY = 86_400_000;

// A behavior that started 100 days before the fixed "now" used in the tests.
const NOW = new Date('2026-06-17T00:00:00.000Z');
const behavior: Relapse = {
  id: 'b1',
  name: 'Alcohol',
  color: '#fff',
  icon: 'wine',
  startDate: new Date(NOW.getTime() - 100 * DAY).toISOString(),
  createdAt: NOW.toISOString(),
  updatedAt: NOW.toISOString(),
};

function event(
  daysAgo: number,
  triggerName?: string,
  kind: EventKind = 'RELAPSE',
): RelapseEvent {
  return {
    id: `${kind === 'URGE' ? 'u' : 'e'}-${daysAgo}`,
    relapseId: 'b1',
    kind,
    date: new Date(NOW.getTime() - daysAgo * DAY).toISOString(),
    triggerName: triggerName ?? null,
    createdAt: NOW.toISOString(),
    updatedAt: NOW.toISOString(),
  };
}

describe('relapseSummary', () => {
  it('with no events the streak runs from startDate and totals are empty', () => {
    const s = relapseSummary(behavior, [], NOW);

    expect(s.currentStreakStart).toBe(behavior.startDate);
    expect(s.currentStreak.days).toBe(100);
    expect(s.lastRelapse).toBeNull();
    expect(s.totalRelapses).toBe(0);
    expect(s.mostCommonTrigger).toBeNull();
    expect(s.averageDaysBetweenRelapses).toBeNull();
    // Best streak with no relapses spans the whole tracked period.
    expect(s.bestStreakDays).toBeCloseTo(100, 5);
  });

  it('derives the current streak from the most recent event', () => {
    const last = event(10);
    const s = relapseSummary(behavior, [event(40), last], NOW);

    expect(s.currentStreakStart).toBe(last.date);
    expect(s.currentStreak.days).toBe(10);
    expect(s.lastRelapse?.id).toBe(last.id);
    expect(s.totalRelapses).toBe(2);
  });

  it('best streak is the largest gap across start, events and now', () => {
    // start(-100), e(-60), e(-58), now(0): gaps are 40, 2, 58 -> best 58.
    const s = relapseSummary(behavior, [event(60), event(58)], NOW);
    expect(s.bestStreakDays).toBeCloseTo(58, 5);
  });

  it('most common trigger is the mode by name', () => {
    const s = relapseSummary(
      behavior,
      [event(30, 'Stress'), event(20, 'Boredom'), event(10, 'Stress')],
      NOW,
    );
    expect(s.mostCommonTrigger).toBe('Stress');
  });

  it('average days between relapses needs at least two events', () => {
    expect(relapseSummary(behavior, [event(10)], NOW).averageDaysBetweenRelapses).toBeNull();

    // events 30 and 10 days ago -> span 20 days over (2-1) gaps = 20.
    const s = relapseSummary(behavior, [event(30), event(10)], NOW);
    expect(s.averageDaysBetweenRelapses).toBeCloseTo(20, 5);
  });

  it('does not mutate the input events array', () => {
    const events = [event(10), event(40)];
    const snapshot = events.map((e) => e.id);
    relapseSummary(behavior, events, NOW);
    expect(events.map((e) => e.id)).toEqual(snapshot);
  });

  it('urges do not reset the streak and are counted separately', () => {
    // Last relapse 40 days ago + a resisted urge 2 days ago. The streak must run
    // from the relapse (40d), ignoring the urge, which is only counted.
    const s = relapseSummary(behavior, [event(40), event(2, 'Craving', 'URGE')], NOW);

    expect(s.currentStreak.days).toBe(40);
    expect(s.lastRelapse?.id).toBe('e-40');
    expect(s.totalRelapses).toBe(1);
    expect(s.urgesResisted).toBe(1);
  });

  it('with only urges the streak runs from startDate', () => {
    const s = relapseSummary(behavior, [event(5, undefined, 'URGE')], NOW);

    expect(s.currentStreakStart).toBe(behavior.startDate);
    expect(s.totalRelapses).toBe(0);
    expect(s.urgesResisted).toBe(1);
  });
});

describe('milestones', () => {
  it('marks reached milestones and reports partial progress for the rest', () => {
    const ms = computeMilestones(8);
    const week = ms.find((m) => m.targetDays === 7)!;
    const twoWeeks = ms.find((m) => m.targetDays === 14)!;

    expect(week.reached).toBe(true);
    expect(week.progress).toBe(1);
    expect(twoWeeks.reached).toBe(false);
    expect(twoWeeks.progress).toBeCloseTo(8 / 14, 5);
  });

  it('nextMilestone returns the first target above the current day count', () => {
    expect(nextMilestone(8)?.targetDays).toBe(14);
  });

  it('nextMilestone is null once the highest milestone is passed', () => {
    expect(nextMilestone(400)).toBeNull();
  });
});
