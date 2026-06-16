import { mockDb } from '@/mock/db';

/**
 * Catálogos globales (triggers y factores de ánimo). Son listas compartidas por
 * todas las entradas, por eso tienen su propio service y sus propias keys.
 */
export const catalogoKeys = {
  triggers: ['catalogo', 'triggers'] as const,
  factores: ['catalogo', 'factores'] as const,
};

export const triggerApi = {
  // Fase 2: api.get<Trigger[]>('/api/triggers')
  list: () => mockDb.listTriggers(),
};

export const factorApi = {
  // Fase 2: api.get<MoodFactor[]>('/api/factores')
  list: () => mockDb.listFactores(),
  // Fase 2: api.post<MoodFactor>('/api/factores', { nombre })
  create: (nombre: string) => mockDb.crearFactor(nombre),
};
