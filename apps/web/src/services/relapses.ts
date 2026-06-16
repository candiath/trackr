import { api } from '@/lib/api';
import type {
  Relapse,
  RelapseEvent,
  RelapseEventFormData,
  RelapseFormData,
} from '@track/shared';

/**
 * Service for relapses (behaviors) and their events.
 *
 * Project pattern: each entity exposes a `<entity>Api` object with the routes and
 * a `<entity>Keys` object with the TanStack Query keys. The HTTP client unwraps
 * the { data } / { error } envelope, so these functions return the payload directly.
 */
export const relapseKeys = {
  all: ['relapses'] as const,
  detail: (id: string) => ['relapses', id] as const,
  events: (relapseId: string) => ['relapses', relapseId, 'events'] as const,
};

export const relapseApi = {
  list: () => api.get<Relapse[]>('/api/relapses'),
  get: (id: string) => api.get<Relapse>(`/api/relapses/${id}`),
  create: (data: RelapseFormData) => api.post<Relapse>('/api/relapses', data),
  update: (id: string, data: RelapseFormData) =>
    api.put<Relapse>(`/api/relapses/${id}`, data),
  remove: (id: string) => api.delete(`/api/relapses/${id}`),
};

export const relapseEventApi = {
  listByRelapse: (relapseId: string) =>
    api.get<RelapseEvent[]>(`/api/relapses/${relapseId}/events`),
  create: (relapseId: string, data: RelapseEventFormData) =>
    api.post<RelapseEvent>(`/api/relapses/${relapseId}/events`, data),
  remove: (id: string) => api.delete(`/api/relapses/events/${id}`),
};
