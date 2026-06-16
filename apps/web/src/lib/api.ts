/**
 * Centralized HTTP client: the ONLY place where the frontend talks to the API.
 *
 * Why centralize: the base URL comes from a single env variable, unwrapping
 * { data } / { error } happens in one place and, once auth exists, the
 * Authorization header is added HERE and nowhere else. Per-entity services only
 * declare routes; they don't repeat fetch logic.
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
    // Only serialize when there is a body: a GET/DELETE shouldn't send one.
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  // 204 No Content: nothing to parse (typical of a DELETE).
  if (res.status === 204) return undefined as T;

  const payload = (await res.json().catch(() => ({}))) as {
    data?: T;
    error?: string;
  };

  // If the response isn't ok, throw with the backend message so TanStack Query
  // catches it and the UI can show something actionable.
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
