import React from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from './Button';
import { cx } from './cx';

const TONES = {
  neutral: 'text-muted before:bg-subtle',
  primary: 'text-primary before:bg-primary',
  success: 'text-success before:bg-success',
  warning: 'text-warning before:bg-warning',
  danger: 'text-danger before:bg-danger',
  info: 'text-info before:bg-info',
};

// Status label: small text with a leading dot (no filled pills — see DESIGN.md).
export const Badge = ({ tone = 'neutral', className, children }) => (
  <span
    className={cx(
      "inline-flex items-center gap-1.5 whitespace-nowrap text-[12px] font-medium before:h-1.5 before:w-1.5 before:shrink-0 before:rounded-full before:content-['']",
      TONES[tone],
      className
    )}
  >
    {children}
  </span>
);

export const Card = ({ className, children, as: Tag = 'div', ...props }) => (
  <Tag className={cx('rounded-lg border border-rule bg-surface', className)} {...props}>
    {children}
  </Tag>
);

export const Skeleton = ({ className }) => <div className={cx('skeleton', className)} aria-hidden="true" />;

export const Spinner = ({ label = 'Loading', className }) => (
  <span role="status" className={cx('inline-flex items-center gap-2 text-sm text-muted', className)}>
    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
    {label}
  </span>
);

export const EmptyState = ({ icon: Icon, title, description, action, className }) => (
  <div className={cx('px-6 py-12 text-center', className)}>
    <h3 className="inline-flex items-center gap-2 text-sm font-semibold">
      {Icon && <Icon className="h-4 w-4 text-subtle" aria-hidden="true" />}
      {title}
    </h3>
    {description && <p className="mx-auto mt-1 max-w-sm text-sm text-muted">{description}</p>}
    {action && <div className="mt-5">{action}</div>}
  </div>
);

export const ErrorState = ({ title = 'Something went wrong', message, onRetry }) => (
  <div role="alert" className="flex flex-col items-center text-center px-6 py-12">
    <AlertTriangle className="h-6 w-6 text-danger mb-3" aria-hidden="true" />
    <h3 className="text-sm font-semibold">{title}</h3>
    {message && <p className="mt-1 max-w-md text-sm text-muted">{message}</p>}
    {onRetry && (
      <Button className="mt-4" onClick={onRetry}>
        Try again
      </Button>
    )}
  </div>
);

export const Kbd = ({ children }) => (
  <kbd className="rounded border border-rule bg-surface-2 px-1.5 py-0.5 font-mono text-[11px] text-muted">{children}</kbd>
);

// Accessible tabs (roving focus with arrow keys). tabs: [{ id, label, icon, badge }]
export const Tabs = ({ tabs, value, onChange, className, label, size = 'md' }) => {
  const onKeyDown = (e) => {
    const i = tabs.findIndex((t) => t.id === value);
    let next;
    if (e.key === 'ArrowRight') next = tabs[(i + 1) % tabs.length];
    else if (e.key === 'ArrowLeft') next = tabs[(i - 1 + tabs.length) % tabs.length];
    else if (e.key === 'Home') next = tabs[0];
    else if (e.key === 'End') next = tabs[tabs.length - 1];
    if (!next) return;
    e.preventDefault();
    onChange(next.id);
    e.currentTarget.querySelector(`[data-tab="${next.id}"]`)?.focus();
  };
  return (
    <div role="tablist" aria-label={label} onKeyDown={onKeyDown} className={cx('flex items-center gap-0.5 overflow-x-auto', className)}>
      {tabs.map((t) => {
        const active = t.id === value;
        return (
          <button
            key={t.id}
            data-tab={t.id}
            role="tab"
            type="button"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(t.id)}
            className={cx(
              'relative inline-flex shrink-0 items-center gap-1.5 font-medium transition-colors duration-fast',
              "after:absolute after:inset-x-1 after:-bottom-px after:h-0.5 after:rounded-full after:content-['']",
              size === 'sm' ? 'h-9 px-2 text-[12px]' : 'h-10 px-2.5 text-[13px]',
              active ? 'text-fg after:bg-primary' : 'text-muted hover:text-fg after:bg-transparent'
            )}
          >
            {t.icon && <t.icon className="h-3.5 w-3.5" aria-hidden="true" />}
            {t.label}
            {t.badge}
          </button>
        );
      })}
    </div>
  );
};

export const PageHeader = ({ title, description, actions }) => (
  <div className="mb-8 flex flex-col gap-4 border-b border-rule pb-6 sm:flex-row sm:items-end sm:justify-between">
    <div>
      <h1 className="font-display text-[1.75rem] font-semibold leading-tight tracking-display">{title}</h1>
      {description && <p className="mt-1 text-sm text-muted">{description}</p>}
    </div>
    {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
  </div>
);
