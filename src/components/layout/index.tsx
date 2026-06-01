'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores';

const NAV_ITEMS = [
  { href: '/salaries', label: 'Salaries' },
  { href: '/companies', label: 'Companies' },
  { href: '/reviews', label: 'Reviews' },
  { href: '/interviews', label: 'Interviews' },
  { href: '/compare', label: 'Compare' },
  { href: '/workplace-index', label: 'Rankings' },
  { href: '/tools', label: 'Tools' },
  { href: '/community', label: 'Community' },
];

export function Header() {
  const pathname = usePathname();
  const { isMobileMenuOpen, toggleMobileMenu, closeMobileMenu } = useUIStore();
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  React.useEffect(() => {
    closeMobileMenu();
  }, [pathname, closeMobileMenu]);

  return (
    <header
      className={cn(
        'sticky top-0 z-40 transition-all duration-300',
        scrolled ? 'glass border-b border-border shadow-sm' : 'bg-white/95'
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <span className="text-lg font-bold text-heading tracking-tight">
              Talent<span className="text-primary">Dash</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-4">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                  pathname === item.href || pathname.startsWith(item.href + '/')
                    ? 'text-primary bg-primary-light'
                    : 'text-body hover:text-heading hover:bg-surface-secondary'
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Link
              href="/contribute"
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-primary rounded-lg hover:bg-primary-hover transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.98]"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Contribute
            </Link>

            {/* Mobile menu button */}
            <button
              onClick={toggleMobileMenu}
              className="lg:hidden p-2 rounded-lg text-body hover:bg-surface-secondary transition-colors"
              aria-label="Toggle menu"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {isMobileMenuOpen ? (
                  <path d="M18 6L6 18M6 6l12 12" />
                ) : (
                  <>
                    <path d="M4 6h16" />
                    <path d="M4 12h16" />
                    <path d="M4 18h16" />
                  </>
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {isMobileMenuOpen && (
          <nav className="lg:hidden py-4 border-t border-border animate-slide-down">
            <div className="flex flex-col gap-1">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'px-4 py-3 text-sm font-medium rounded-lg transition-colors',
                    pathname === item.href
                      ? 'text-primary bg-primary-light'
                      : 'text-body hover:bg-surface-secondary'
                  )}
                >
                  {item.label}
                </Link>
              ))}
              <Link
                href="/contribute"
                className="mx-4 mt-2 flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-white bg-primary rounded-lg"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Contribute
              </Link>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}

// ─── Footer ─────────────────────────────────────────────────
const FOOTER_LINKS = {
  Product: [
    { href: '/salaries', label: 'Salary Explorer' },
    { href: '/companies', label: 'Companies' },
    { href: '/compare', label: 'Compare' },
    { href: '/workplace-index', label: 'Rankings' },
    { href: '/tools', label: 'Tools' },
  ],
  Resources: [
    { href: '/reviews', label: 'Reviews' },
    { href: '/interviews', label: 'Interviews' },
    { href: '/community', label: 'Community' },
    { href: '/tools/salary-calculator', label: 'Salary Calculator' },
    { href: '/tools/tax-calculator', label: 'Tax Calculator' },
  ],
  Company: [
    { href: '/about', label: 'About Us' },
    { href: '/contact', label: 'Contact' },
    { href: '/privacy', label: 'Privacy Policy' },
    { href: '/terms', label: 'Terms of Service' },
  ],
};

export function Footer() {
  return (
    <footer className="bg-white border-t border-border mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
              </div>
              <span className="text-lg font-bold text-heading">
                Talent<span className="text-primary">Dash</span>
              </span>
            </Link>
            <p className="text-body-sm text-muted leading-relaxed">
              India&apos;s largest career intelligence platform. Compare salaries, research companies, and make informed career decisions.
            </p>
          </div>

          {/* Links */}
          {Object.entries(FOOTER_LINKS).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-sm font-semibold text-heading mb-4">{title}</h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-body-sm text-muted hover:text-primary transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-caption text-muted">
            © {new Date().getFullYear()} TalentDash. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <span className="text-caption text-muted">
              Built with ❤️ for the Indian tech community
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
