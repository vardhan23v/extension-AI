import React, { forwardRef, useId } from 'react';
import { cx } from './cx';

const control =
  'w-full rounded border border-control/70 bg-surface text-fg placeholder:text-subtle transition-colors duration-fast ' +
  'hover:border-control focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 ' +
  'disabled:opacity-60 aria-[invalid=true]:border-danger';

export const Input = forwardRef(function Input({ className, ...props }, ref) {
  return <input ref={ref} className={cx(control, 'h-9 px-3 text-sm', className)} {...props} />;
});

export const Textarea = forwardRef(function Textarea({ className, ...props }, ref) {
  return <textarea ref={ref} className={cx(control, 'px-3 py-2 text-sm leading-relaxed resize-y', className)} {...props} />;
});

export const Select = forwardRef(function Select({ className, children, ...props }, ref) {
  return (
    <select ref={ref} className={cx(control, 'h-9 px-2.5 text-sm', className)} {...props}>
      {children}
    </select>
  );
});

// Label + control + hint/error, wired with ids for accessibility.
export const Field = ({ label, hint, error, children, className }) => {
  const id = useId();
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  const child = React.cloneElement(children, {
    id: children.props.id || id,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': describedBy,
  });
  return (
    <div className={cx('space-y-1.5', className)}>
      {label && (
        <label htmlFor={children.props.id || id} className="block text-[13px] font-medium text-fg">
          {label}
        </label>
      )}
      {child}
      {error ? (
        <p id={`${id}-error`} className="text-[13px] text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-[13px] text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
};

export const Switch = ({ checked, onChange, label, id }) => (
  <button
    id={id}
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    onClick={() => onChange(!checked)}
    className={cx(
      'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border border-transparent transition-colors duration-fast',
      checked ? 'bg-primary' : 'bg-control'
    )}
  >
    <span
      className={cx(
        'inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)]',
        checked ? 'translate-x-4' : 'translate-x-0.5'
      )}
    />
  </button>
);
