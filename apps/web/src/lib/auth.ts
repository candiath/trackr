import { api } from '@/lib/api';

/**
 * Client-side auth for the single-user login.
 *
 * The real session lives in an httpOnly cookie (set by the API and unreadable from
 * JS). To stay fast on a cold backend we ALSO keep a non-sensitive "logged in until"
 * hint in localStorage: the app trusts the hint to render immediately at boot — it
 * never blocks on a /me round-trip — and only drops to /login when an actual request
 * comes back 401 (handled in api.ts via the unauthorized event).
 */
const HINT_KEY = 'track_auth_expires';

interface SessionResponse {
  expiresAt: number;
}

/** Stores the session expiry (epoch ms) as the optimistic auth hint. */
function setHint(expiresAt: number): void {
  localStorage.setItem(HINT_KEY, String(expiresAt));
}

/** Clears the optimistic auth hint (on logout or a 401). */
export function clearHint(): void {
  localStorage.removeItem(HINT_KEY);
}

/** True when a non-expired hint exists — the optimistic, no-network auth signal. */
export function isAuthedOptimistic(): boolean {
  const raw = localStorage.getItem(HINT_KEY);
  if (!raw) return false;
  const expiresAt = Number(raw);
  return Number.isFinite(expiresAt) && expiresAt > Date.now();
}

/** Logs in with the single password; throws ApiError(401) on a wrong password. */
export async function login(password: string): Promise<void> {
  const { expiresAt } = await api.post<SessionResponse>('/api/auth/login', { password });
  setHint(expiresAt);
}

/** Logs out. Clears the local hint even if the network call fails. */
export async function logout(): Promise<void> {
  try {
    await api.post('/api/auth/logout');
  } finally {
    clearHint();
  }
}

/**
 * Best-effort background confirmation: refreshes the hint when the server confirms
 * the session. Safe to fire-and-forget on boot — a 401 is already broadcast by
 * api.ts (which clears auth), and an unreachable/cold backend is intentionally
 * ignored so we never log the user out just because the server is asleep.
 */
export async function confirmSession(): Promise<void> {
  try {
    const { expiresAt } = await api.get<SessionResponse>('/api/auth/me');
    setHint(expiresAt);
  } catch {
    // Ignore: 401 handled via the unauthorized event; offline/cold is a no-op.
  }
}
