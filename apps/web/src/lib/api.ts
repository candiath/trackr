/**
 * Cliente HTTP centralizado: ÚNICO punto donde el front habla con la API.
 *
 * Por qué centralizar: la base sale de una sola variable de entorno, el
 * desempaquetado de { data } / { error } se hace en un solo lugar y, cuando
 * exista auth, el header Authorization se agrega ACÁ y nada más. Los services
 * por entidad solo declaran rutas; no repiten lógica de fetch.
 *
 * Nota Fase 1: en el prototipo con mockdata este cliente no se usa todavía (los
 * services resuelven contra datos en memoria), pero queda listo para enchufar
 * el backend en Fase 2 sin tocar la firma de los services.
 */
const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? '';

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    // Solo serializamos si hay body: un GET/DELETE no debería mandar cuerpo.
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  // 204 No Content: no hay JSON que parsear (típico de un DELETE).
  if (res.status === 204) return undefined as T;

  const payload = (await res.json().catch(() => ({}))) as {
    data?: T;
    error?: string;
  };

  // Si la respuesta no es ok, lanzamos con el mensaje del back para que
  // TanStack Query lo capture y la UI muestre algo accionable.
  if (!res.ok) {
    throw new Error(payload.error ?? `Error ${res.status}`);
  }

  return payload.data as T;
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, body),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body),
  delete: <T = void>(path: string) => request<T>('DELETE', path),
};
