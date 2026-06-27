import { v7 as uuidv7 } from 'uuid';

/**
 * Id and timestamp helpers, kept free of any storage dependency. Ids are generated on
 * the CLIENT (uuid v7, time-sortable) and sent to the API, which upserts by them — so a
 * row created while the backend is cold keeps the same id, and child rows can reference
 * it immediately without waiting for a server-assigned id.
 */
export const newId = (): string => uuidv7();

export const nowISO = (): string => new Date().toISOString();
