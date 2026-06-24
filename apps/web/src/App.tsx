import { Route, Routes } from 'react-router-dom';
import { AppLayout } from '@/components/layout/app-layout';
import { RequireAuth } from '@/components/auth/require-auth';
import { LoginPage } from '@/pages/login';
import { DashboardPage } from '@/pages/dashboard';
import { RelapsesPage } from '@/pages/relapses';
import { RelapseDetailPage } from '@/pages/relapse-detail';
import { MoodPage } from '@/pages/mood';
import { NotFoundPage } from '@/pages/not-found';

/**
 * Route map. /login is public; everything else sits behind RequireAuth, with
 * AppLayout as the "parent" route (sidebar + Outlet) so navigation persists across
 * screens.
 */
export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="relapses" element={<RelapsesPage />} />
          <Route path="relapses/:id" element={<RelapseDetailPage />} />
          <Route path="mood" element={<MoodPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
