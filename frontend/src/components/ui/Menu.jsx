import React, { useEffect, useRef, useState, useId } from 'react';
import { cx } from './cx';

// Dropdown menu with keyboard support (arrows, Home/End, Escape).
// items: [{ label, icon, onSelect, danger, disabled }] or { divider: true }
export const Menu = ({ trigger, items, align = 'end', label }) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const listRef = useRef(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => !rootRef.current?.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', onDoc);
    listRef.current?.querySelector('[role="menuitem"]:not([disabled])')?.focus();
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const close = (focusTrigger = true) => {
    setOpen(false);
    if (focusTrigger) rootRef.current?.querySelector('[aria-haspopup]')?.focus();
  };

  const onKeyDown = (e) => {
    const nodes = [...(listRef.current?.querySelectorAll('[role="menuitem"]:not([disabled])') || [])];
    const i = nodes.indexOf(document.activeElement);
    if (e.key === 'ArrowDown') nodes[(i + 1) % nodes.length]?.focus();
    else if (e.key === 'ArrowUp') nodes[(i - 1 + nodes.length) % nodes.length]?.focus();
    else if (e.key === 'Home') nodes[0]?.focus();
    else if (e.key === 'End') nodes[nodes.length - 1]?.focus();
    else if (e.key === 'Escape' || e.key === 'Tab') return close(e.key === 'Escape');
    else return;
    e.preventDefault();
  };

  return (
    <div ref={rootRef} className="relative inline-block">
      {React.cloneElement(trigger, {
        'aria-haspopup': 'menu',
        'aria-expanded': open,
        'aria-controls': open ? menuId : undefined,
        'aria-label': trigger.props['aria-label'] || label,
        onClick: (e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        },
      })}
      {open && (
        <div
          id={menuId}
          ref={listRef}
          role="menu"
          onKeyDown={onKeyDown}
          className={cx(
            'absolute z-40 mt-1 min-w-[180px] rounded-lg border border-rule bg-surface p-1 shadow-lg animate-in',
            align === 'end' ? 'right-0' : 'left-0'
          )}
        >
          {items.map((item, i) =>
            item.divider ? (
              <div key={i} role="separator" className="my-1 h-px bg-border" />
            ) : (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                disabled={item.disabled}
                onClick={(e) => {
                  e.stopPropagation();
                  close(false);
                  item.onSelect();
                }}
                className={cx(
                  'flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-left text-sm outline-none',
                  'hover:bg-surface-2 focus:bg-surface-2 disabled:opacity-50',
                  item.danger ? 'text-danger' : 'text-fg'
                )}
              >
                {item.icon && <item.icon className="h-4 w-4 shrink-0 opacity-70" aria-hidden="true" />}
                {item.label}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
};
