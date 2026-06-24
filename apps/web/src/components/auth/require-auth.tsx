import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/components/auth/auth-provider';

/**
 * Route guard for the authenticated app. Reads the optimistic auth state (the
 * localStorage hint), so it redirects instantly without waiting on the backend —
 * critical when the server is cold. Remembers the attempted path so login can send
 * the user back to it.
 */
export function RequireAuth() {
  const { authenticated } = useAuth();
  const location = useLocation();

  if (!authenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <Outlet />;
}
