import { Route, Routes } from 'react-router-dom';
import { AppLayout } from '@/components/layout/app-layout';
import { DashboardPage } from '@/pages/dashboard';
import { RecaidasPage } from '@/pages/recaidas';
import { RecaidaDetallePage } from '@/pages/recaida-detalle';
import { MoodPage } from '@/pages/mood';
import { NotFoundPage } from '@/pages/not-found';

/**
 * Mapa de rutas. AppLayout es la ruta "padre" (sidebar + Outlet) y todo lo
 * demás cuelga adentro, así la navegación persiste entre pantallas.
 */
export function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="recaidas" element={<RecaidasPage />} />
        <Route path="recaidas/:id" element={<RecaidaDetallePage />} />
        <Route path="mood" element={<MoodPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
