/**
 * Centralized HTTP client: the ONLY place where the frontend talks to the API.
 *
 * Why centralize: the base URL comes from a single env variable, unwrapping
 * { data } / { error } happens in one place and, once auth exists, the
 * Authorization header is added HERE and nowhere else. Per-entity services only
 * declare routes; they don't repeat fetch logic.
 */
// Strip any trailing slash from the configured base URL: every `path` below
// already starts with "/", so a base like "https://host/" would otherwise produce
// a double slash ("https://host//api/…") that the server 404s on.
const BASE_URL = ((import.meta.env.VITE_API_URL as string | undefined) ?? '').replace(
  /\/+$/,
  '',
);

// Shared secret that gates the API (reached over the private tailnet). Sent on
// every request; the only consumer of this client now is the sync layer.
const SYNC_SECRET = import.meta.env.VITE_SYNC_SECRET as string | undefined;

/**
 * Error thrown by the HTTP client. Carries the HTTP `status` (0 when the request
 * never reached the server, e.g. the API is down or offline) so callers — notably
 * the global query error handler — can tell a "database/server unreachable"
 * situation apart from an ordinary 4xx/5xx and react accordingly.
 */
export class ApiError extends Error {
  constructor(
    message: string,
    /** HTTP status, or 0 if the request failed before getting a response. */
    public status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  /** True when the API is unreachable (network failure) or the DB is down (503). */
  get isUnreachable(): boolean {
    return this.status === 0 || this.status === 503;
  }
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(SYNC_SECRET ? { 'X-Sync-Secret': SYNC_SECRET } : {}),
      },
      // Only serialize when there is a body: a GET/DELETE shouldn't send one.
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    // fetch only rejects on a network-level failure (API down, DNS, offline):
    // status 0 marks "never reached the server".
    throw new ApiError("Can't reach the server", 0);
  }

  // 204 No Content: nothing to parse (typical of a DELETE).
  if (res.status === 204) return undefined as T;

  const payload = (await res.json().catch(() => ({}))) as {
    data?: T;
    error?: string;
  };

  // If the response isn't ok, throw with the backend message so TanStack Query
  // catches it and the UI can show something actionable.
  if (!res.ok) {
    throw new ApiError(payload.error ?? `Error ${res.status}`, res.status);
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
