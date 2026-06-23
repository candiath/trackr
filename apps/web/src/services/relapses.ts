import {
  db,
  findOrCreateTrigger,
  newId,
  nowISO,
  type StoredRelapse,
  type StoredRelapseEvent,
} from '@/lib/db';
import type {
  EventKind,
  Relapse,
  RelapseEvent,
  RelapseEventFormData,
  RelapseFormData,
} from '@track/shared';

/**
 * Service for relapses (behaviors) and their events.
 *
 * Local-first: reads and writes hit IndexedDB (Dexie) directly, so everything works
 * offline. The same `<entity>Api` / `<entity>Keys` shape as before is kept so the
 * pages and components don't change; only the data source moved from HTTP to Dexie.
 */
export const relapseKeys = {
  all: ['relapses'] as const,
  detail: (id: string) => ['relapses', id] as const,
  events: (relapseId: string) => ['relapses', relapseId, 'events'] as const,
};

/** Resolves the stored event to its DTO, joining the trigger name from the catalog. */
async function toEventDTO(e: StoredRelapseEvent): Promise<RelapseEvent> {
  const trigger = e.triggerId ? await db.triggers.get(e.triggerId) : undefined;
  return { ...e, triggerName: trigger?.name ?? null };
}

export const relapseApi = {
  list: (): Promise<Relapse[]> =>
    db.relapses.filter((r) => !r.deletedAt).sortBy('createdAt'),

  async get(id: string): Promise<Relapse> {
    const r = await db.relapses.get(id);
    if (!r || r.deletedAt) throw new Error('Behavior not found');
    return r;
  },

  async create(data: RelapseFormData): Promise<Relapse> {
    const at = nowISO();
    const row: StoredRelapse = {
      id: newId(),
      name: data.name,
      description: data.description?.trim() ? data.description.trim() : null,
      color: data.color,
      icon: data.icon,
      startDate: new Date(data.startDate).toISOString(),
      createdAt: at,
      updatedAt: at,
      dirty: true,
    };
    await db.relapses.add(row);
    return row;
  },

  async update(id: string, data: RelapseFormData): Promise<Relapse> {
    const r = await db.relapses.get(id);
    if (!r || r.deletedAt) throw new Error('Behavior not found');
    const updated: StoredRelapse = {
      ...r,
      name: data.name ?? r.name,
      description:
        data.description !== undefined
          ? data.description?.trim()
            ? data.description.trim()
            : null
          : r.description,
      color: data.color ?? r.color,
      icon: data.icon ?? r.icon,
      startDate: data.startDate ? new Date(data.startDate).toISOString() : r.startDate,
      updatedAt: nowISO(),
      dirty: true,
    };
    await db.relapses.put(updated);
    return updated;
  },

  // Soft-delete: tombstone the behavior AND its events so the deletion syncs.
  async remove(id: string): Promise<void> {
    const at = nowISO();
    await db.transaction('rw', db.relapses, db.relapseEvents, async () => {
      await db.relapses.update(id, { deletedAt: at, updatedAt: at, dirty: true });
      const events = await db.relapseEvents.where('relapseId').equals(id).toArray();
      await Promise.all(
        events.map((e) =>
          db.relapseEvents.update(e.id, { deletedAt: at, updatedAt: at, dirty: true }),
        ),
      );
    });
  },
};

export const relapseEventApi = {
  async listByRelapse(relapseId: string): Promise<RelapseEvent[]> {
    const rows = await db.relapseEvents
      .where('relapseId')
      .equals(relapseId)
      .filter((e) => !e.deletedAt)
      .toArray();
    rows.sort((a, b) => b.date.localeCompare(a.date)); // newest first
    return Promise.all(rows.map(toEventDTO));
  },

  async create(
    relapseId: string,
    data: RelapseEventFormData,
    kind: EventKind = 'RELAPSE',
  ): Promise<RelapseEvent> {
    const parent = await db.relapses.get(relapseId);
    if (!parent || parent.deletedAt) throw new Error('Behavior not found');

    // Free text wins (created/reused), otherwise use the picked catalog id. Mirrors
    // the backend's trigger resolution.
    let triggerId: string | null = null;
    const custom = data.triggerCustom?.trim();
    if (custom) {
      triggerId = (await findOrCreateTrigger(custom)).id;
    } else if (data.triggerId) {
      const t = await db.triggers.get(data.triggerId);
      triggerId = t && !t.deletedAt ? t.id : null;
    }

    const at = nowISO();
    const row: StoredRelapseEvent = {
      id: newId(),
      relapseId,
      kind,
      date: new Date(data.date).toISOString(),
      triggerId,
      intensity: data.intensity ?? null,
      moodLevel: data.moodLevel ?? null,
      notes: data.notes?.trim() ? data.notes.trim() : null,
      createdAt: at,
      updatedAt: at,
      dirty: true,
    };
    await db.relapseEvents.add(row);
    // Keep the behavior fresh and mark it for push too.
    await db.relapses.update(relapseId, { updatedAt: at, dirty: true });
    return toEventDTO(row);
  },

  async remove(id: string): Promise<void> {
    const at = nowISO();
    await db.relapseEvents.update(id, { deletedAt: at, updatedAt: at, dirty: true });
  },
};
