import React from 'react';
import { Link } from 'react-router-dom';

export const LogoMark = ({ className = 'h-6 w-6' }) => (
  <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
    <rect width="32" height="32" rx="8" className="fill-primary" />
    <path d="M10 9h12v3.5h-8v2h7v3.5h-7v2h8V23H10z" className="fill-primary-fg" />
  </svg>
);

export const Logo = ({ to = '/' }) => (
  <Link to={to} className="flex shrink-0 items-center gap-2 whitespace-nowrap font-semibold tracking-tight text-fg">
    <LogoMark />
    <span>Extensio AI</span>
  </Link>
);
