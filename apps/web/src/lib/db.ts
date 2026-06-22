/**
 * Local-first store. IndexedDB (via Dexie) is the source of truth: every read and
 * write the UI does goes here, so the app works fully offline. The backend is only
 * a sync target (see lib/sync.ts), never the per-screen data path.
 *
 * Records mirror the shared DTOs plus two sync columns that the DTOs don't expose:
 *  - `updatedAt` (already on the DTOs): drives conflict detection on sync.
 *  - `deletedAt`: soft-delete tombstone, so a deletion can be propagated on sync.
 * Ids are generated HERE (uuid v7, time-sortable) instead of by the server, which
 * is what lets us create rows offline and reference them before any sync.
 */
import Dexie, { type Table } from 'dexie';
import { v7 as uuidv7 } from 'uuid';
import type {
  MoodEntry,
  MoodFactor,
  Relapse,
  RelapseEvent,
  Trigger,
} from '@track/shared';

/**
 * Sync bookkeeping carried by every stored row but kept out of the UI DTOs.
 * `dirty` marks a row written locally since the last successful push; the sync
 * engine pushes dirty rows and clears the flag. Pulled rows are written clean.
 */
export type Syncable = { deletedAt?: string | null; dirty?: boolean };

export type StoredRelapse = Relapse & Syncable;
/** Stored without the derived `triggerName` — it is resolved from `triggers` on read. */
export type StoredRelapseEvent = Omit<RelapseEvent, 'triggerName'> & Syncable;
/** Stored without the derived `factorNames` — resolved from `factors` on read. */
export type StoredMoodEntry = Omit<MoodEntry, 'factorNames'> & Syncable;
export type StoredTrigger = Trigger & Syncable;
export type StoredFactor = MoodFactor & Syncable;

/** Generic key/value bag (e.g. the sync cursor `lastSyncedAt`). */
export type MetaRow = { key: string; value: string };

export const nowISO = (): string => new Date().toISOString();
export const newId = (): string => uuidv7();

// Preset catalogs so the app is usable offline from the first run. These mirror the
// backend seed; on the first sync they are reconciled by name (see lib/sync.ts).
const DEFAULT_TRIGGERS = [
  'Stress', 'Anxiety', 'Boredom', 'Loneliness', 'Peer pressure', 'Sadness',
  'Tiredness', 'Anger', 'Celebration', 'Insomnia', 'Habit', 'Craving',
];
const DEFAULT_FACTORS = [
  'Sleep', 'Work', 'Exercise', 'Social', 'Diet', 'Health', 'Family',
  'Partner', 'Money', 'Leisure',
];

function catalogRow(name: string): StoredTrigger {
  const at = nowISO();
  return { id: newId(), name, isSystem: true, createdAt: at, updatedAt: at };
}

class TrackDB extends Dexie {
  relapses!: Table<StoredRelapse, string>;
  relapseEvents!: Table<StoredRelapseEvent, string>;
  moods!: Table<StoredMoodEntry, string>;
  triggers!: Table<StoredTrigger, string>;
  factors!: Table<StoredFactor, string>;
  meta!: Table<MetaRow, string>;

  constructor() {
    super('track');
    // Only index what we actually query on; everything else is a full (cheap, small
    // dataset) scan. Catalogs are looked up by name when resolving custom entries.
    this.version(1).stores({
      relapses: 'id, createdAt',
      relapseEvents: 'id, relapseId, date',
      moods: 'id, date',
      triggers: 'id, name',
      factors: 'id, name',
      meta: 'key',
    });
    // `populate` fires once, when the DB is first created.
    this.on('populate', () => {
      this.triggers.bulkAdd(DEFAULT_TRIGGERS.map(catalogRow));
      this.factors.bulkAdd(DEFAULT_FACTORS.map(catalogRow));
    });
  }
}

export const db = new TrackDB();

/** Case-insensitive find of a live catalog row by name. */
async function findCatalogByName<T extends StoredTrigger | StoredFactor>(
  table: Table<T, string>,
  name: string,
): Promise<T | undefined> {
  const clean = name.toLowerCase();
  return table.filter((row) => !row.deletedAt && row.name.toLowerCase() === clean).first();
}

/** Find (case-insensitive) or create a Trigger by free-text name. Mirrors the backend. */
export async function findOrCreateTrigger(name: string): Promise<StoredTrigger> {
  const clean = name.trim();
  const existing = await findCatalogByName(db.triggers, clean);
  if (existing) return existing;
  const at = nowISO();
  const row: StoredTrigger = { id: newId(), name: clean, isSystem: false, createdAt: at, updatedAt: at };
  await db.triggers.add(row);
  return row;
}

/** Find (case-insensitive) or create a MoodFactor by free-text name. Mirrors the backend. */
export async function findOrCreateFactor(name: string): Promise<StoredFactor> {
  const clean = name.trim();
  const existing = await findCatalogByName(db.factors, clean);
  if (existing) return existing;
  const at = nowISO();
  const row: StoredFactor = { id: newId(), name: clean, isSystem: false, createdAt: at, updatedAt: at };
  await db.factors.add(row);
  return row;
}

/** Merge selected factor ids with newly-typed custom names into a unique id list. */
export async function resolveFactorIds(
  ids: string[],
  customNames: string[] = [],
): Promise<string[]> {
  const customIds: string[] = [];
  for (const raw of customNames) {
    if (!raw.trim()) continue;
    customIds.push((await findOrCreateFactor(raw)).id);
  }
  return [...new Set([...ids, ...customIds])];
}
