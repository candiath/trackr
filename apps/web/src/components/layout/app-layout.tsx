import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, ShieldCheck, SmilePlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from './theme-toggle';

/**
 * Navegación principal. Centralizada en un array para que agregar una sección
 * (ej: Tareas/Hábitos en Fase 2) sea una línea, no tocar el JSX en dos lugares
 * (sidebar de escritorio + barra móvil).
 */
const NAV = [
  { to: '/', label: 'Inicio', Icon: LayoutDashboard, end: true },
  { to: '/recaidas', label: 'Recaídas', Icon: ShieldCheck, end: false },
  { to: '/mood', label: 'Ánimo', Icon: SmilePlus, end: false },
] as const;

function Logo() {
  return (
    <div className="flex items-center gap-2 font-semibold">
      <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
        ✓
      </span>
      <span className="text-lg tracking-tight">Track</span>
    </div>
  );
}

function navLinkClass({ isActive }: { isActive: boolean }) {
  return cn(
    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
    isActive
      ? 'bg-primary/10 text-primary'
      : 'text-muted-foreground hover:bg-accent hover:text-foreground',
  );
}

export function AppLayout() {
  return (
    <div className="min-h-dvh bg-background">
      {/* Sidebar fijo en escritorio (md+). */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-border bg-card px-4 py-6 md:flex">
        <div className="px-2">
          <Logo />
        </div>
        <nav className="mt-8 flex flex-1 flex-col gap-1">
          {NAV.map(({ to, label, Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={navLinkClass}>
              <Icon className="size-4" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center justify-between border-t border-border pt-4">
          <span className="px-2 text-xs text-muted-foreground">Tema</span>
          <ThemeToggle />
        </div>
      </aside>

      {/* Barra superior en móvil (md:hidden). */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-card/80 px-4 py-3 backdrop-blur md:hidden">
        <Logo />
        <ThemeToggle />
      </header>
      <nav className="sticky top-[57px] z-20 flex gap-1 overflow-x-auto border-b border-border bg-card/80 px-2 py-2 backdrop-blur md:hidden">
        {NAV.map(({ to, label, Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={navLinkClass}>
            <Icon className="size-4" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Contenido: deja espacio para el sidebar en escritorio. */}
      <main className="md:pl-60">
        <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
