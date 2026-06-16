/**
 * Wrapper genérico de respuesta de la API.
 *
 * Por qué: toda respuesta exitosa viaja como { data } y los errores como
 * { error }. Tener un único tipo evita que cada endpoint invente su forma y
 * permite que el cliente HTTP del front desempaquete siempre igual.
 */
export interface ApiResponse<T> {
  data: T;
  error?: string;
}
