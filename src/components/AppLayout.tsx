import type { ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { CalendarDays, Dumbbell, History, Home, Settings } from 'lucide-react';
import { cn } from '@/lib/cn';

const NAV = [
  { to: '/', label: 'Hoje', Icon: Home, end: true },
  { to: '/calendario', label: 'Calendário', Icon: CalendarDays, end: false },
  { to: '/historico', label: 'Histórico', Icon: History, end: false },
  { to: '/exercicios', label: 'Exercícios', Icon: Dumbbell, end: false },
  { to: '/definicoes', label: 'Definições', Icon: Settings, end: false },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  // O modo "Realizar treino" ocupa o ecrã todo para libertar espaço no telemóvel.
  const immersive = location.pathname.endsWith('/treinar');

  return (
    <div className="min-h-dvh md:flex">
      <a
        href="#conteudo"
        className="bg-accent text-on-accent sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:px-4 focus:py-2"
      >
        Saltar para o conteúdo
      </a>

      {!immersive && (
        <nav
          aria-label="Navegação principal"
          className="border-app surface-raised hidden w-60 shrink-0 border-r p-4 md:block"
        >
          <p className="text-muted mb-6 px-2 text-xs font-semibold tracking-widest uppercase">
            Treinos
          </p>
          <ul className="space-y-1">
            {NAV.map(({ to, label, Icon, end }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    cn(
                      'tap flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium',
                      isActive ? 'bg-accent text-on-accent' : 'hover:surface-sunken',
                    )
                  }
                >
                  <Icon aria-hidden="true" className="size-5" />
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      )}

      <div className="min-w-0 flex-1">
        <main
          id="conteudo"
          className={cn('mx-auto w-full max-w-3xl px-4 pt-4', immersive ? 'pb-4' : 'pb-24 md:pb-8')}
        >
          {children}
        </main>
      </div>

      {!immersive && (
        <nav
          aria-label="Navegação principal"
          className="border-app surface-raised safe-bottom fixed inset-x-0 bottom-0 z-40 border-t md:hidden"
        >
          <ul className="mx-auto flex max-w-lg">
            {NAV.map(({ to, label, Icon, end }) => (
              <li key={to} className="flex-1">
                <NavLink
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    cn(
                      'tap flex flex-col items-center gap-0.5 px-1 py-2 text-[11px] font-medium',
                      isActive ? 'text-accent' : 'text-muted',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        aria-hidden="true"
                        className={cn('size-5', isActive && 'stroke-[2.5]')}
                      />
                      <span>{label}</span>
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  );
}
