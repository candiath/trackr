import { mockDb } from '@/mock/db';
import type { RecaidaEventoFormData, RecaidaFormData } from '@track/shared';

/**
 * Service de Recaídas (conductas) y sus eventos.
 *
 * Patrón del proyecto: cada entidad expone un objeto `<entidad>Api` con las
 * rutas y un `<entidad>Keys` con las query keys de TanStack Query. En Fase 1 el
 * cuerpo resuelve contra la mock-DB; en Fase 2 se reemplaza por llamadas a
 * `api.get/post/...` SIN cambiar estas firmas ni las keys.
 */
export const recaidaKeys = {
  all: ['recaidas'] as const,
  detail: (id: string) => ['recaidas', id] as const,
  eventos: (recaidaId: string) => ['recaidas', recaidaId, 'eventos'] as const,
};

export const recaidaApi = {
  // Fase 2: api.get<Recaida[]>('/api/recaidas')
  list: () => mockDb.listRecaidas(),
  // Fase 2: api.get<Recaida>(`/api/recaidas/${id}`)
  get: (id: string) => mockDb.getRecaida(id),
  // Fase 2: api.post<Recaida>('/api/recaidas', data)
  create: (data: RecaidaFormData) => mockDb.crearRecaida(data),
  // Fase 2: api.delete(`/api/recaidas/${id}`)
  remove: (id: string) => mockDb.eliminarRecaida(id),
};

export const recaidaEventoApi = {
  // Fase 2: api.get<RecaidaEvento[]>(`/api/recaidas/${recaidaId}/eventos`)
  listByRecaida: (recaidaId: string) => mockDb.listEventos(recaidaId),
  // Fase 2: api.post(`/api/recaidas/${recaidaId}/eventos`, data)
  create: (recaidaId: string, data: RecaidaEventoFormData) =>
    mockDb.crearEvento(recaidaId, data),
  // Fase 2: api.delete(`/api/recaidas/eventos/${id}`)
  remove: (id: string) => mockDb.eliminarEvento(id),
};
