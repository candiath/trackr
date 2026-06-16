import { Route, Routes } from 'react-router-dom';
import { AppLayout } from '@/components/layout/app-layout';
import { DashboardPage } from '@/pages/dashboard';
import { RelapsesPage } from '@/pages/relapses';
import { RelapseDetailPage } from '@/pages/relapse-detail';
import { MoodPage } from '@/pages/mood';
import { NotFoundPage } from '@/pages/not-found';

/**
 * Route map. AppLayout is the "parent" route (sidebar + Outlet) and everything
 * else hangs inside, so navigation persists across screens.
 */
export function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="relapses" element={<RelapsesPage />} />
        <Route path="relapses/:id" element={<RelapseDetailPage />} />
        <Route path="mood" element={<MoodPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
