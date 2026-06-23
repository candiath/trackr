/**
 * Sync engine. Reconciles the local IndexedDB store with the backend on demand
 * (the laptop server is only up occasionally). Single user, so resolution is
 * last-write-wins PER RECORD with a twist: rows that changed on BOTH sides since
 * the last sync are surfaced as conflicts for the user to resolve; everything else
 * merges automatically in both directions.
 *
 * Flow: pull the server's changes since the cursor → classify each id as pull /
 * push / conflict → resolve conflicts → apply pulls, then push the local winners →
 * advance the cursor. Catalog references travel by NAME (see @track/shared/sync),
 * so trigger/factor ids never need to agree across devices.
 */
import { api } from '@/lib/api';
import {
  db,
  findOrCreateFactor,
  findOrCreateTrigger,
  type StoredMoodEntry,
  type StoredRelapse,
  type StoredRelapseEvent,
} from '@/lib/db';
import type {
  SyncMood,
  SyncPullResponse,
  SyncPush,
  SyncPushResponse,
  SyncRelapse,
  SyncRelapseEvent,
} from '@track/shared';

const CURSOR_KEY = 'lastSyncAt';

export type ConflictEntity = 'relapse' | 'relapseEvent' | 'mood';

/** A row changed on BOTH sides since the last sync; the user must pick a winner. */
export interface SyncConflict {
  entity: ConflictEntity;
  id: string;
  label: string;
}

/** Per conflict id: keep this device ('local') or take the backend ('server'). */
export type ConflictResolution = Record<string, 'local' | 'server'>;

export interface SyncResult {
  pulled: number;
  pushed: number;
  conflicts: number;
}

/** The UI supplies this; it returns a choice for every conflict id. */
export type ConflictResolver = (conflicts: SyncConflict[]) => Promise<ConflictResolution>;

const shortDate = (iso: string): string => new Date(iso).toLocaleDateString();

export async function getLastSyncedAt(): Promise<string | undefined> {
  return (await db.meta.get(CURSOR_KEY))?.value;
}

export async function runSync(resolve: ConflictResolver): Promise<SyncResult> {
  const cursor = await getLastSyncedAt();
  const remote = await api.get<SyncPullResponse>(
    `/api/sync/changes${cursor ? `?since=${encodeURIComponent(cursor)}` : ''}`,
  );

  // Local rows written since the last successful push.
  const [dirtyRelapses, dirtyEvents, dirtyMoods] = await Promise.all([
    db.relapses.filter((r) => !!r.dirty).toArray(),
    db.relapseEvents.filter((e) => !!e.dirty).toArray(),
    db.moods.filter((m) => !!m.dirty).toArray(),
  ]);
  const dirtyIds = new Set<string>([
    ...dirtyRelapses.map((r) => r.id),
    ...dirtyEvents.map((e) => e.id),
    ...dirtyMoods.map((m) => m.id),
  ]);
  const remoteIds = new Set<string>([
    ...remote.relapses.map((r) => r.id),
    ...remote.relapseEvents.map((e) => e.id),
    ...remote.moods.map((m) => m.id),
  ]);

  // A remote row that is also dirty locally is a true conflict; otherwise it is a
  // clean pull. A dirty row absent from the remote changes is a clean push.
  const conflicts: SyncConflict[] = [
    ...remote.relapses
      .filter((r) => dirtyIds.has(r.id))
      .map((r) => ({ entity: 'relapse' as const, id: r.id, label: `Behavior “${r.name}”` })),
    ...remote.relapseEvents
      .filter((e) => dirtyIds.has(e.id))
      .map((e) => ({ entity: 'relapseEvent' as const, id: e.id, label: `Relapse on ${shortDate(e.date)}` })),
    ...remote.moods
      .filter((m) => dirtyIds.has(m.id))
      .map((m) => ({ entity: 'mood' as const, id: m.id, label: `Mood on ${shortDate(m.date)}` })),
  ];

  const resolution = conflicts.length ? await resolve(conflicts) : {};
  // Unresolved conflicts default to 'server' (safe: the local copy is discarded but
  // a copy still exists on the backend).
  const keepLocal = (id: string) => resolution[id] === 'local';

  // ---- Apply pulls (server wins), skipping conflicts kept locally ----------
  let pulled = 0;
  for (const r of remote.relapses) {
    if (dirtyIds.has(r.id) && keepLocal(r.id)) continue;
    await applyPulledRelapse(r);
    pulled++;
  }
  for (const e of remote.relapseEvents) {
    if (dirtyIds.has(e.id) && keepLocal(e.id)) continue;
    await applyPulledEvent(e);
    pulled++;
  }
  for (const m of remote.moods) {
    if (dirtyIds.has(m.id) && keepLocal(m.id)) continue;
    await applyPulledMood(m);
    pulled++;
  }

  // ---- Push local winners: clean-dirty rows + conflicts kept locally --------
  const pushRelapses = dirtyRelapses.filter((r) => !remoteIds.has(r.id) || keepLocal(r.id));
  const pushEvents = dirtyEvents.filter((e) => !remoteIds.has(e.id) || keepLocal(e.id));
  const pushMoods = dirtyMoods.filter((m) => !remoteIds.has(m.id) || keepLocal(m.id));
  const pushed = pushRelapses.length + pushEvents.length + pushMoods.length;

  let nextCursor = remote.serverTime;
  if (pushed > 0) {
    const payload: SyncPush = {
      relapses: pushRelapses.map(toSyncRelapse),
      relapseEvents: await Promise.all(pushEvents.map(toSyncEvent)),
      moods: await Promise.all(pushMoods.map(toSyncMood)),
    };
    const res = await api.post<SyncPushResponse>('/api/sync', payload);
    nextCursor = res.serverTime;
    await Promise.all([
      ...pushRelapses.map((r) => db.relapses.update(r.id, { dirty: false })),
      ...pushEvents.map((e) => db.relapseEvents.update(e.id, { dirty: false })),
      ...pushMoods.map((m) => db.moods.update(m.id, { dirty: false })),
    ]);
  }

  await db.meta.put({ key: CURSOR_KEY, value: nextCursor });
  return { pulled, pushed, conflicts: conflicts.length };
}

// --- Apply pulled rows (name → local catalog id), written clean (dirty: false) ---

async function applyPulledRelapse(r: SyncRelapse): Promise<void> {
  const row: StoredRelapse = {
    id: r.id,
    name: r.name,
    description: r.description ?? null,
    color: r.color,
    icon: r.icon,
    startDate: r.startDate,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    deletedAt: r.deletedAt ?? null,
    dirty: false,
  };
  await db.relapses.put(row);
}

async function applyPulledEvent(e: SyncRelapseEvent): Promise<void> {
  const triggerId = e.triggerName ? (await findOrCreateTrigger(e.triggerName)).id : null;
  const row: StoredRelapseEvent = {
    id: e.id,
    relapseId: e.relapseId,
    kind: e.kind,
    date: e.date,
    triggerId,
    intensity: e.intensity ?? null,
    moodLevel: e.moodLevel ?? null,
    notes: e.notes ?? null,
    createdAt: e.createdAt,
    updatedAt: e.updatedAt,
    deletedAt: e.deletedAt ?? null,
    dirty: false,
  };
  await db.relapseEvents.put(row);
}

async function applyPulledMood(m: SyncMood): Promise<void> {
  const factorIds: string[] = [];
  for (const name of m.factorNames) factorIds.push((await findOrCreateFactor(name)).id);
  const row: StoredMoodEntry = {
    id: m.id,
    date: m.date,
    level: m.level,
    note: m.note ?? null,
    factors: factorIds,
    createdAt: m.createdAt,
    updatedAt: m.updatedAt,
    deletedAt: m.deletedAt ?? null,
    dirty: false,
  };
  await db.moods.put(row);
}

// --- Denormalize local rows for push (local catalog id → name) -------------------

function toSyncRelapse(r: StoredRelapse): SyncRelapse {
  return {
    id: r.id,
    name: r.name,
    description: r.description ?? null,
    color: r.color,
    icon: r.icon,
    startDate: r.startDate,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    deletedAt: r.deletedAt ?? null,
  };
}

async function toSyncEvent(e: StoredRelapseEvent): Promise<SyncRelapseEvent> {
  const trigger = e.triggerId ? await db.triggers.get(e.triggerId) : undefined;
  return {
    id: e.id,
    relapseId: e.relapseId,
    kind: e.kind,
    date: e.date,
    triggerName: trigger?.name ?? null,
    intensity: e.intensity ?? null,
    moodLevel: e.moodLevel ?? null,
    notes: e.notes ?? null,
    createdAt: e.createdAt,
    updatedAt: e.updatedAt,
    deletedAt: e.deletedAt ?? null,
  };
}

async function toSyncMood(m: StoredMoodEntry): Promise<SyncMood> {
  const factors = await db.factors.bulkGet(m.factors);
  return {
    id: m.id,
    date: m.date,
    level: m.level,
    note: m.note ?? null,
    factorNames: factors.flatMap((f) => (f ? [f.name] : [])),
    createdAt: m.createdAt,
    updatedAt: m.updatedAt,
    deletedAt: m.deletedAt ?? null,
  };
}
