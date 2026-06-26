import { api } from '@/lib/api';
import { newId } from '@/lib/ids';
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
 * Talks to the REST API (Postgres is the source of truth). Ids are generated on the
 * client (uuid v7) and sent in the body so the API upserts by them — that keeps an
 * optimistic row and the stored row on the same id, and lets an event reference a
 * just-created behavior without waiting for a server id. The `<entity>Api` /
 * `<entity>Keys` shape is unchanged, so pages and components don't move.
 */
export const relapseKeys = {
  all: ['relapses'] as const,
  detail: (id: string) => ['relapses', id] as const,
  events: (relapseId: string) => ['relapses', relapseId, 'events'] as const,
};

export const relapseApi = {
  list: (): Promise<Relapse[]> => api.get<Relapse[]>('/api/relapses'),

  get: (id: string): Promise<Relapse> => api.get<Relapse>(`/api/relapses/${id}`),

  create: (data: RelapseFormData): Promise<Relapse> =>
    // Spread first, then set id, so an undefined `data.id` can't clobber the fallback.
    api.post<Relapse>('/api/relapses', { ...data, id: data.id ?? newId() }),

  update: (id: string, data: RelapseFormData): Promise<Relapse> =>
    api.put<Relapse>(`/api/relapses/${id}`, data),

  remove: (id: string): Promise<void> => api.delete(`/api/relapses/${id}`),
};

export const relapseEventApi = {
  listByRelapse: (relapseId: string): Promise<RelapseEvent[]> =>
    api.get<RelapseEvent[]>(`/api/relapses/${relapseId}/events`),

  create: (
    relapseId: string,
    data: RelapseEventFormData,
    kind: EventKind = 'RELAPSE',
  ): Promise<RelapseEvent> =>
    api.post<RelapseEvent>(`/api/relapses/${relapseId}/events`, {
      ...data,
      id: data.id ?? newId(),
      kind: data.kind ?? kind,
    }),

  remove: (id: string): Promise<void> => api.delete(`/api/relapses/events/${id}`),
};
