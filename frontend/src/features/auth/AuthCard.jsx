import React from 'react';
import { LogoMark } from '../../components/Logo';

export const AuthCard = ({ title, subtitle, children, footer }) => (
  <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12">
    <div className="w-full max-w-sm">
      <LogoMark className="h-8 w-8" />
      <h1 className="mt-6 text-xl font-semibold tracking-tight">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      <div className="mt-6">{children}</div>
      {footer && <p className="mt-6 text-sm text-muted">{footer}</p>}
    </div>
  </div>
);
