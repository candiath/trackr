import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { UNAUTHORIZED_EVENT } from '@/lib/api';
import {
  clearHint,
  confirmSession,
  isAuthedOptimistic,
  login as apiLogin,
  logout as apiLogout,
} from '@/lib/auth';

interface AuthContextValue {
  /** Optimistic auth state: true while a non-expired hint exists. */
  authenticated: boolean;
  login: (password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Holds the single-user auth state. Seeded synchronously from the localStorage hint
 * so the app renders without a flash or a blocking /me call. A background confirm
 * refreshes the hint when the backend is awake, and a 401 from any request (relayed
 * as the unauthorized event) drops us back to logged-out.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [authenticated, setAuthenticated] = useState(isAuthedOptimistic);

  useEffect(() => {
    function onUnauthorized() {
      clearHint();
      setAuthenticated(false);
    }
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    // Confirm in the background only if we think we're logged in; fire-and-forget.
    if (isAuthedOptimistic()) void confirmSession();
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  }, []);

  const login = useCallback(async (password: string) => {
    await apiLogin(password);
    setAuthenticated(true);
  }, []);

  const logout = useCallback(async () => {
    await apiLogout();
    setAuthenticated(false);
  }, []);

  return (
    <AuthContext.Provider value={{ authenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

/** Access the auth state/actions. Must be used within <AuthProvider>. */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
