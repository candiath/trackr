/**
 * Punto único de exportación del paquete compartido.
 *
 * Regla del proyecto: acá viven SOLO tipos planos y schemas Zod que la API
 * expone/valida. Nada de Prisma ni dependencias de runtime del back o del front,
 * para que web y api compartan contrato sin acoplarse a la implementación.
 */
export * from './common';
export * from './mood';
export * from './recaida';
