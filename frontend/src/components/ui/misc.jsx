import React from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from './Button';
import { cx } from './cx';

const TONES = {
  neutral: 'bg-surface-2 text-muted border-border',
  primary: 'bg-primary-soft text-primary border-primary/20',
  success: 'bg-success/10 text-success border-success/20',
  warning: 'bg-warning/10 text-warning border-warning/25',
  danger: 'bg-danger/10 text-danger border-danger/20',
  info: 'bg-info/10 text-info border-info/20',
};

export const Badge = ({ tone = 'neutral', className, children }) => (
  <span className={cx('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium', TONES[tone], className)}>
    {children}
  </span>
);

export const Card = ({ className, children, as: Tag = 'div', ...props }) => (
  <Tag className={cx('rounded-lg border border-border bg-bg', className)} {...props}>
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
  <div className={cx('flex flex-col items-center justify-center text-center px-6 py-14', className)}>
    {Icon && (
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-surface text-muted">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>
    )}
    <h3 className="text-sm font-semibold">{title}</h3>
    {description && <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>}
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
  <kbd className="rounded border border-border bg-surface px-1.5 py-0.5 font-mono text-[11px] text-muted">{children}</kbd>
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
    <div role="tablist" aria-label={label} onKeyDown={onKeyDown} className={cx('flex items-center gap-1 overflow-x-auto', className)}>
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
              'inline-flex shrink-0 items-center gap-1.5 rounded font-medium transition-colors duration-fast',
              size === 'sm' ? 'h-7 px-2 text-[12px]' : 'h-8 px-2.5 text-[13px]',
              active ? 'bg-surface-2 text-fg' : 'text-muted hover:text-fg hover:bg-surface-2/60'
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
  <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-6">
    <div>
      <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
      {description && <p className="mt-1 text-sm text-muted">{description}</p>}
    </div>
    {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
  </div>
);
