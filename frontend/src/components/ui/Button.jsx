import React, { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cx } from './cx';

const VARIANTS = {
  primary: 'bg-primary text-primary-fg hover:bg-primary/90 border-transparent shadow-sm',
  secondary: 'bg-surface text-fg border-control/70 hover:border-control hover:bg-surface-2',
  ghost: 'bg-transparent text-muted border-transparent hover:bg-surface-2 hover:text-fg',
  danger: 'bg-danger text-white border-transparent hover:bg-danger/90 dark:text-bg',
  'danger-ghost': 'bg-transparent text-danger border-transparent hover:bg-danger/10',
};

const SIZES = {
  sm: 'h-8 px-3 text-[13px] gap-1.5',
  md: 'h-9 px-3.5 text-sm gap-2',
  lg: 'h-11 px-5 text-[15px] gap-2',
  icon: 'h-9 w-9 justify-center',
  'icon-sm': 'h-8 w-8 justify-center',
};

export const Button = forwardRef(function Button(
  { variant = 'secondary', size = 'md', loading = false, disabled, className, children, type = 'button', ...props },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cx(
        'inline-flex items-center rounded border font-medium whitespace-nowrap select-none',
        'transition-colors duration-fast disabled:opacity-50 disabled:pointer-events-none',
        VARIANTS[variant],
        SIZES[size],
        className
      )}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
});

// Icon-only button: `label` is required for screen readers and the tooltip.
export const IconButton = forwardRef(function IconButton({ label, size = 'icon', variant = 'ghost', children, ...props }, ref) {
  return (
    <Button ref={ref} size={size} variant={variant} aria-label={label} title={label} {...props}>
      {children}
    </Button>
  );
});
