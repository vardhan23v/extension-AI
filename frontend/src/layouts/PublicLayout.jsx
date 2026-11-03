import React from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Logo } from '../components/Logo';
import { ThemeToggle } from '../components/ThemeToggle';

const linkClass = ({ isActive }) =>
  `text-sm transition-colors duration-fast ${isActive ? 'text-fg font-medium' : 'text-muted hover:text-fg'}`;

const PublicLayout = () => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  return (
    <div className="min-h-screen flex flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded focus:bg-bg focus:px-3 focus:py-2">
        Skip to content
      </a>
      <header className="sticky top-0 z-30 border-b border-rule bg-bg">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
          <div className="flex items-center gap-6">
            <Logo />
            <nav aria-label="Main" className="hidden sm:flex items-center gap-5">
              <NavLink to="/templates" className={linkClass}>Templates</NavLink>
              <NavLink to="/gallery" className={linkClass}>Community</NavLink>
            </nav>
          </div>
          <div className="flex items-center gap-1.5">
            <ThemeToggle />
            {isAuthenticated ? (
              <Link to="/dashboard" className="inline-flex h-8 items-center whitespace-nowrap rounded bg-primary px-3 text-[13px] font-medium text-primary-fg hover:bg-primary/90">
                Open app
              </Link>
            ) : (
              <>
                <Link to="/login" className="hidden sm:inline-flex h-8 items-center px-3 text-sm text-muted hover:text-fg">
                  Sign in
                </Link>
                <Link to="/register" className="inline-flex h-8 items-center whitespace-nowrap rounded bg-primary px-3 text-[13px] font-medium text-primary-fg hover:bg-primary/90">
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>
      <main id="main" key={location.pathname} className="animate-page flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-[13px] text-muted sm:flex-row sm:justify-between">
          <span>Extensio AI — open source, MIT licensed.</span>
          <a href="https://github.com/vardhan23v/extension-AI" target="_blank" rel="noopener noreferrer" className="hover:text-fg">
            GitHub
          </a>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;
