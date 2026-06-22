import type { Prisma, Relapse as PrismaRelapse } from '@prisma/client';
import type {
  SyncMood,
  SyncPullResponse,
  SyncPush,
  SyncRelapse,
  SyncRelapseEvent,
} from '@track/shared';
import { prisma } from '../../lib/prisma';

type EventWithTrigger = Prisma.RelapseEventGetPayload<{ include: { trigger: true } }>;
type MoodWithFactors = Prisma.MoodEntryGetPayload<{ include: { factors: true } }>;

const iso = (d: Date) => d.toISOString();
const isoOrNull = (d: Date | null) => (d ? d.toISOString() : null);

function toSyncRelapse(r: PrismaRelapse): SyncRelapse {
  return {
    id: r.id,
    name: r.name,
    description: r.description,
    color: r.color,
    icon: r.icon,
    startDate: iso(r.startDate),
    createdAt: iso(r.createdAt),
    updatedAt: iso(r.updatedAt),
    deletedAt: isoOrNull(r.deletedAt),
  };
}

function toSyncEvent(e: EventWithTrigger): SyncRelapseEvent {
  return {
    id: e.id,
    relapseId: e.relapseId,
    date: iso(e.date),
    triggerName: e.trigger?.name ?? null,
    intensity: e.intensity,
    moodLevel: e.moodLevel,
    notes: e.notes,
    createdAt: iso(e.createdAt),
    updatedAt: iso(e.updatedAt),
    deletedAt: isoOrNull(e.deletedAt),
  };
}

function toSyncMood(m: MoodWithFactors): SyncMood {
  return {
    id: m.id,
    date: iso(m.date),
    level: m.level,
    note: m.note,
    factorNames: m.factors.map((f) => f.name),
    createdAt: iso(m.createdAt),
    updatedAt: iso(m.updatedAt),
    deletedAt: isoOrNull(m.deletedAt),
  };
}

/** Find-or-create a catalog row by exact name, returning its id. */
async function triggerIdByName(name: string): Promise<string> {
  const t = await prisma.trigger.upsert({
    where: { name: name.trim() },
    update: {},
    create: { name: name.trim() },
  });
  return t.id;
}

async function factorIdsByName(names: string[]): Promise<string[]> {
  const ids: string[] = [];
  for (const name of names) {
    const clean = name.trim();
    if (!clean) continue;
    const f = await prisma.moodFactor.upsert({
      where: { name: clean },
      update: {},
      create: { name: clean },
    });
    ids.push(f.id);
  }
  return [...new Set(ids)];
}

export const syncService = {
  /** Rows changed since `since` (server clock), tombstones included. */
  async changes(since?: string): Promise<SyncPullResponse> {
    const where = since ? { updatedAt: { gt: new Date(since) } } : {};
    const [relapses, events, moods] = await Promise.all([
      prisma.relapse.findMany({ where }),
      prisma.relapseEvent.findMany({ where, include: { trigger: true } }),
      prisma.moodEntry.findMany({ where, include: { factors: true } }),
    ]);
    return {
      serverTime: new Date().toISOString(),
      relapses: relapses.map(toSyncRelapse),
      relapseEvents: events.map(toSyncEvent),
      moods: moods.map(toSyncMood),
    };
  },

  /**
   * Upserts the rows the client pushed (its conflict winners), by id. Catalog refs
   * arrive by name and are resolved/created here. Order matters: relapses before
   * their events (FK). Soft-deletes travel as `deletedAt`; rows are never hard
   * deleted, so foreign keys stay intact.
   */
  async push(payload: SyncPush): Promise<{ serverTime: string }> {
    for (const r of payload.relapses) {
      const data = {
        name: r.name,
        description: r.description ?? null,
        color: r.color,
        icon: r.icon,
        startDate: new Date(r.startDate),
        deletedAt: r.deletedAt ? new Date(r.deletedAt) : null,
      };
      await prisma.relapse.upsert({
        where: { id: r.id },
        update: data,
        create: { id: r.id, createdAt: new Date(r.createdAt), ...data },
      });
    }

    for (const e of payload.relapseEvents) {
      const triggerId = e.triggerName ? await triggerIdByName(e.triggerName) : null;
      const data = {
        date: new Date(e.date),
        triggerId,
        intensity: e.intensity ?? null,
        moodLevel: e.moodLevel ?? null,
        notes: e.notes ?? null,
        deletedAt: e.deletedAt ? new Date(e.deletedAt) : null,
      };
      await prisma.relapseEvent.upsert({
        where: { id: e.id },
        update: data,
        create: { id: e.id, relapseId: e.relapseId, createdAt: new Date(e.createdAt), ...data },
      });
    }

    for (const m of payload.moods) {
      const factorIds = await factorIdsByName(m.factorNames);
      const connect = factorIds.map((id) => ({ id }));
      await prisma.moodEntry.upsert({
        where: { id: m.id },
        update: {
          date: new Date(m.date),
          level: m.level,
          note: m.note ?? null,
          deletedAt: m.deletedAt ? new Date(m.deletedAt) : null,
          factors: { set: connect },
        },
        create: {
          id: m.id,
          date: new Date(m.date),
          level: m.level,
          note: m.note ?? null,
          createdAt: new Date(m.createdAt),
          deletedAt: m.deletedAt ? new Date(m.deletedAt) : null,
          factors: { connect },
        },
      });
    }

    return { serverTime: new Date().toISOString() };
  },
};
