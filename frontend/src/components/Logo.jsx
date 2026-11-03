import React from 'react';
import { Link } from 'react-router-dom';

// The mark: an "E" cut from a graphite block, with a signal-orange dot.
export const LogoMark = ({ className = 'h-6 w-6' }) => (
  <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
    <rect width="32" height="32" rx="7" className="fill-fg" />
    <path d="M9 8h13v3.6h-9v2.6h8v3.6h-8v2.6h9V24H9z" className="fill-bg" />
    <circle cx="24.5" cy="22.5" r="2.5" className="fill-primary" />
  </svg>
);

export const Logo = ({ to = '/' }) => (
  <Link to={to} className="flex shrink-0 items-center gap-2 whitespace-nowrap font-display text-[17px] font-semibold tracking-display text-fg">
    <LogoMark />
    <span>Extensio</span>
  </Link>
);
