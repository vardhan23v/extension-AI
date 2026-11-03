import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Sparkles, FolderKanban, Code2, FlaskConical, ShieldCheck, LayoutTemplate,
  Rocket, Settings, Menu as MenuIcon, X, LogOut, Users,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Logo } from '../components/Logo';
import { ThemeToggle } from '../components/ThemeToggle';
import { IconButton, Menu, cx } from '../components/ui';
import { lastProjectId } from '../features/workspace/recent';

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/new', label: 'AI Builder', icon: Sparkles },
  { to: '/projects', label: 'My Projects', icon: FolderKanban },
  { to: '/studio', label: 'Code Studio', icon: Code2 },
  { label: 'Testing Lab', icon: FlaskConical, soon: 'Phase 3' },
  { to: '/security', label: 'Security Center', icon: ShieldCheck },
  { to: '/templates', label: 'Templates', icon: LayoutTemplate },
  { to: '/gallery', label: 'Community', icon: Users },
  { label: 'Publishing', icon: Rocket, soon: 'Phase 5' },
];

const NavItems = ({ onNavigate }) => {
  const location = useLocation();
  const studioActive = location.pathname.startsWith('/projects/');
  return (
    <ul className="space-y-0.5">
      {NAV.map((item) => (
        <li key={item.label}>
          {item.soon ? (
            <span
              className="flex h-8 cursor-not-allowed items-center gap-2.5 px-2.5 text-[13px] text-subtle"
              aria-disabled="true"
              title={`Planned for ${item.soon}`}
            >
              <item.icon className="h-4 w-4 opacity-70" aria-hidden="true" />
              {item.label}
              <span className="ml-auto text-[11px]">later</span>
            </span>
          ) : (
            <NavLink
              to={item.to}
              onClick={onNavigate}
              className={({ isActive }) =>
                cx(
                  'flex h-8 items-center gap-2.5 rounded px-2.5 text-[13px] transition-colors duration-fast',
                  isActive || (item.to === '/studio' && studioActive)
                    ? 'bg-surface text-fg font-medium shadow-sm ring-1 ring-rule'
                    : 'text-muted hover:bg-surface-2/70 hover:text-fg'
                )
              }
            >
              <item.icon className="h-4 w-4" aria-hidden="true" />
              {item.label}
            </NavLink>
          )}
        </li>
      ))}
    </ul>
  );
};

const UserMenu = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const initial = (user?.name || user?.email || '?').charAt(0).toUpperCase();
  return (
    <Menu
      label="Account menu"
      trigger={
        <button type="button" className="flex h-8 w-8 items-center justify-center rounded-full border border-control/60 bg-surface font-display text-[13px] font-semibold text-fg hover:border-control">
          {initial}
        </button>
      }
      items={[
        { label: user?.email || 'Account', disabled: true, onSelect: () => {} },
        { divider: true },
        { label: 'Settings', icon: Settings, onSelect: () => navigate('/settings') },
        {
          label: 'Sign out',
          icon: LogOut,
          onSelect: async () => {
            await logout();
            navigate('/');
          },
        },
      ]}
    />
  );
};

const AppShell = () => {
  const [drawer, setDrawer] = useState(false);
  const location = useLocation();
  const fullBleed = location.pathname.startsWith('/projects/');

  useEffect(() => setDrawer(false), [location.pathname]);
  useEffect(() => {
    if (!drawer) return undefined;
    const onKey = (e) => e.key === 'Escape' && setDrawer(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [drawer]);

  const sidebar = (
    <>
      <div className="flex h-14 items-center px-4">
        <Logo to="/dashboard" />
      </div>
      <nav aria-label="Main" className="flex-1 overflow-y-auto px-2 py-2">
        <NavItems onNavigate={() => setDrawer(false)} />
      </nav>
      <div className="border-t border-border p-2">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            cx('flex h-8 items-center gap-2.5 rounded px-2.5 text-[13px]', isActive ? 'bg-surface text-fg font-medium shadow-sm ring-1 ring-rule' : 'text-muted hover:bg-surface-2/70 hover:text-fg')
          }
        >
          <Settings className="h-4 w-4" aria-hidden="true" />
          Settings
        </NavLink>
      </div>
    </>
  );

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-bg">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded focus:bg-bg focus:px-3 focus:py-2">
        Skip to content
      </a>
      <aside className="hidden lg:flex w-56 shrink-0 flex-col border-r border-rule bg-surface-2/50 dark:bg-[rgb(17_16_13)]">{sidebar}</aside>

      {drawer && (
        <div className="lg:hidden fixed inset-0 z-40" role="dialog" aria-modal="true" aria-label="Navigation">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDrawer(false)} aria-hidden="true" />
          <aside className="relative flex h-full w-64 flex-col border-r border-rule bg-bg animate-in">
            <IconButton label="Close navigation" autoFocus className="absolute right-2 top-3" onClick={() => setDrawer(false)}>
              <X className="h-4 w-4" />
            </IconButton>
            {sidebar}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-border bg-bg px-3 lg:px-5">
          <div className="flex items-center gap-2">
            <IconButton label="Open navigation" className="lg:hidden" onClick={() => setDrawer(true)}>
              <MenuIcon className="h-4 w-4" />
            </IconButton>
            <div className="lg:hidden">
              <Logo to="/dashboard" />
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <ThemeToggle />
            <UserMenu />
          </div>
        </header>
        <main id="main" className={cx('min-h-0 flex-1', fullBleed ? 'overflow-hidden' : 'overflow-y-auto')}>
          {fullBleed ? (
            <Outlet />
          ) : (
            <div key={location.pathname} className="animate-page mx-auto w-full max-w-6xl px-4 py-6 lg:px-8 lg:py-8">
              <Outlet />
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default AppShell;

// Redirects "Code Studio" to the most recently opened project.
export const StudioRedirect = () => {
  const navigate = useNavigate();
  useEffect(() => {
    const id = lastProjectId();
    navigate(id ? `/projects/${id}` : '/projects', { replace: true });
  }, [navigate]);
  return null;
};
