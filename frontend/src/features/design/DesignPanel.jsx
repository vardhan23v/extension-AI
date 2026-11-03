import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Plus, Wand2 } from 'lucide-react';
import { Button, EmptyState, Field, Select, Switch, Tabs, cx } from '../../components/ui';
import { DEFAULT_THEME, FONTS, contrast, readTheme, writeBlock, hasBlock } from './theme';
import { COMPONENTS, insertComponent } from './components';

const resolve = (from, ref) => {
  const clean = ref.split(/[?#]/)[0].replace(/^\.\//, '');
  if (clean.startsWith('/')) return clean.slice(1);
  const dir = from.includes('/') ? from.slice(0, from.lastIndexOf('/') + 1) : '';
  const parts = [];
  for (const seg of (dir + clean).split('/')) {
    if (seg === '..') parts.pop();
    else if (seg && seg !== '.') parts.push(seg);
  }
  return parts.join('/');
};

// Finds the popup page and the first local stylesheet it links.
const findTargets = (files) => {
  let popup = null;
  try {
    popup = JSON.parse(files.find((f) => f.filename === 'manifest.json')?.content || '{}').action?.default_popup || null;
  } catch {
    // invalid manifest
  }
  const page = files.find((f) => f.filename === (popup || 'popup.html'));
  if (!page) return {};
  const href = [...page.content.matchAll(/<link\b[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["']/gi)].map((m) => m[1]).find((h) => !/^(https?:)?\/\//.test(h));
  const cssName = href ? resolve(page.filename, href) : null;
  return { page, css: files.find((f) => f.filename === cssName) || null };
};

const ColorField = ({ label, value, onChange, against, againstLabel }) => {
  const ratio = against ? contrast(value, against) : null;
  return (
    <div className="flex items-center gap-2">
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)} aria-label={label} className="h-8 w-9 cursor-pointer rounded border border-control/60 bg-transparent p-0.5" />
      <div className="min-w-0 flex-1">
        <p className="text-[13px]">{label}</p>
        <p className="font-mono text-[11px] text-subtle">{value}</p>
      </div>
      {ratio && (
        <span className={cx('font-mono text-[11px] tabular', ratio >= 4.5 ? 'text-success' : ratio >= 3 ? 'text-warning' : 'text-danger')} title={`Contrast against ${againstLabel}`}>
          {ratio.toFixed(1)}:1
        </span>
      )}
    </div>
  );
};

/**
 * Design tab: edits a marked CSS-variable block at the top of the popup's stylesheet
 * (autosaved like any edit) and inserts components as a reviewable proposal.
 */
export const DesignPanel = ({ files, onUpdateFile, onPropose, onRequestEdit, locked }) => {
  const { page, css } = useMemo(() => findTargets(files), [files]);
  const [mode, setMode] = useState('light');
  const [theme, setTheme] = useState(() => (css && readTheme(css.content)) || DEFAULT_THEME);
  const writeTimer = useRef(null);
  const enabled = css && hasBlock(css.content);

  // Re-read when the file changes elsewhere (restore, AI apply).
  useEffect(() => {
    const t = css && readTheme(css.content);
    if (t) setTheme(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [css?.filename]);

  if (!page) return <EmptyState title="No popup page" description="The Design tab styles the popup. Add a popup page to the manifest first." />;
  if (!css) return <EmptyState title="No stylesheet linked" description={`Link a local stylesheet from ${page.filename} (for example popup.css) to use the Design tab.`} />;

  const update = (next) => {
    setTheme(next);
    clearTimeout(writeTimer.current);
    writeTimer.current = setTimeout(() => onUpdateFile(css.filename, writeBlock(css.content, next)), 250);
  };
  const setColor = (k) => (v) => update({ ...theme, [mode]: { ...theme[mode], [k]: v } });
  const c = theme[mode];

  if (!enabled) {
    return (
      <div className="space-y-3 p-4 text-[13px]">
        <p className="font-medium">Theme your popup with variables</p>
        <p className="text-muted">
          Adds a small, clearly marked block of CSS variables (<span className="font-mono">--ext-accent</span>, <span className="font-mono">--ext-bg</span>, …) to the top of{' '}
          <span className="font-mono">{css.filename}</span>. Your existing styles keep working.
        </p>
        <Button variant="primary" disabled={locked} onClick={() => update(theme)}>Add theme controls</Button>
      </div>
    );
  }

  return (
    <div className="h-full space-y-6 overflow-y-auto p-3">
      <section className="space-y-3" aria-labelledby="colors-h">
        <div className="flex items-center justify-between">
          <h3 id="colors-h" className="text-sm font-semibold">Colours</h3>
          <Tabs size="sm" label="Colour scheme" value={mode} onChange={setMode} tabs={[{ id: 'light', label: 'Light' }, ...(theme.darkMode ? [{ id: 'dark', label: 'Dark' }] : [])]} />
        </div>
        <ColorField label="Background" value={c.bg} onChange={setColor('bg')} />
        <ColorField label="Surface" value={c.surface} onChange={setColor('surface')} />
        <ColorField label="Text" value={c.text} onChange={setColor('text')} against={c.bg} againstLabel="background" />
        <ColorField label="Secondary text" value={c.muted} onChange={setColor('muted')} against={c.bg} againstLabel="background" />
        <ColorField label="Accent" value={c.accent} onChange={setColor('accent')} against={c.bg} againstLabel="background" />
        <ColorField label="Text on accent" value={c.accentText} onChange={setColor('accentText')} against={c.accent} againstLabel="accent" />
        <div className="flex items-center justify-between gap-3 pt-1">
          <span className="text-[13px]">Dark mode variant</span>
          <Switch label="Dark mode variant" checked={theme.darkMode} onChange={(v) => { update({ ...theme, darkMode: v }); if (!v) setMode('light'); }} />
        </div>
      </section>

      <section className="space-y-3" aria-labelledby="type-h">
        <h3 id="type-h" className="text-sm font-semibold">Type & layout</h3>
        <Field label="Font">
          <Select value={theme.font} onChange={(e) => update({ ...theme, font: e.target.value })}>
            {Object.entries(FONTS).map(([id, f]) => <option key={id} value={id}>{f.label}</option>)}
          </Select>
        </Field>
        {[
          ['radius', 'Corner radius', 0, 20],
          ['space', 'Spacing', 4, 24],
          ['width', 'Popup width', 260, 560],
        ].map(([k, label, min, max]) => (
          <label key={k} className="block">
            <span className="flex justify-between text-[13px]"><span>{label}</span><span className="font-mono text-[12px] text-subtle tabular">{theme[k]}px</span></span>
            <input type="range" min={min} max={max} value={theme[k]} onChange={(e) => update({ ...theme, [k]: Number(e.target.value) })} className="mt-1 w-full accent-[rgb(var(--primary))]" />
          </label>
        ))}
        <p className="text-[12px] text-muted">Only system fonts are offered — Manifest V3 extensions can’t load fonts from the web unless you bundle them.</p>
      </section>

      <section className="space-y-2" aria-labelledby="comp-h">
        <h3 id="comp-h" className="text-sm font-semibold">Components</h3>
        <p className="text-[12px] text-muted">Inserted into {page.filename} as a change you review and apply.</p>
        <div className="grid grid-cols-2 gap-2">
          {COMPONENTS.map((comp) => (
            <Button
              key={comp.id}
              size="sm"
              disabled={locked}
              className="justify-start"
              onClick={() => {
                const next = insertComponent(page.content, css.content, comp);
                onPropose({
                  instruction: `Insert ${comp.label.toLowerCase()} component`,
                  summary: `Adds a ${comp.label.toLowerCase()} to ${page.filename}, styled with the theme variables.`,
                  files: files.map((f) => (f.filename === page.filename ? { ...f, content: next.html } : f.filename === css.filename ? { ...f, content: next.css } : f)),
                  changes: { added: [], removed: [], changed: [page.filename, css.filename] },
                });
              }}
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" /> {comp.label}
            </Button>
          ))}
        </div>
      </section>

      <section className="space-y-2 border-t border-rule pt-4">
        <Button
          disabled={locked}
          onClick={() =>
            onRequestEdit(
              `Refactor ${css.filename} so existing colours, font, corner radius and spacing use the CSS variables defined in the "extensio:theme" block (--ext-bg, --ext-surface, --ext-text, --ext-muted, --ext-accent, --ext-accent-text, --ext-font, --ext-radius, --ext-space). Keep the theme block unchanged and do not change behaviour.`
            )
          }
        >
          <Wand2 className="h-3.5 w-3.5" aria-hidden="true" /> Connect existing styles to the theme
        </Button>
        <p className="text-[12px] text-muted">The assistant rewrites your stylesheet to use the variables; you review the diff before it is applied.</p>
      </section>
    </div>
  );
};
