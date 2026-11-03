import React, { useMemo, useState } from 'react';
import { ChevronRight, File, FileCode2, FileJson, FileType2, Folder, Image, MoreHorizontal, FilePlus2, Search, X } from 'lucide-react';
import { buildTree, checkFilename, isBinary } from '../../lib/files';
import { Button, ConfirmDialog, Dialog, Field, IconButton, Input, Menu, cx } from '../../components/ui';

const iconFor = (name) => {
  if (name.endsWith('.json')) return FileJson;
  if (/\.m?js$/.test(name)) return FileCode2;
  if (/\.(html|css)$/.test(name)) return FileType2;
  if (/\.(png|jpe?g|gif|webp|svg|ico)$/.test(name)) return Image;
  return File;
};

const TreeNode = ({ node, depth, active, onOpen, actions, problems }) => {
  const [open, setOpen] = useState(true);
  if (node.children) {
    return (
      <li>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          className="flex h-7 w-full items-center gap-1 rounded px-1.5 text-[13px] text-muted hover:bg-surface-2"
          style={{ paddingLeft: 6 + depth * 12 }}
        >
          <ChevronRight className={cx('h-3.5 w-3.5 transition-transform duration-fast', open && 'rotate-90')} aria-hidden="true" />
          <Folder className="h-3.5 w-3.5" aria-hidden="true" />
          {node.name}
        </button>
        {open && (
          <ul>
            {node.children.map((c) => (
              <TreeNode key={c.path} node={c} depth={depth + 1} active={active} onOpen={onOpen} actions={actions} problems={problems} />
            ))}
          </ul>
        )}
      </li>
    );
  }
  const Icon = iconFor(node.name);
  const isActive = active === node.path;
  const hasProblem = problems.has(node.path);
  return (
    <li className="group relative">
      <button
        type="button"
        onClick={() => onOpen(node.path)}
        aria-current={isActive ? 'true' : undefined}
        className={cx(
          'flex h-7 w-full items-center gap-1.5 rounded pr-8 text-left text-[13px] transition-colors duration-fast',
          isActive ? 'bg-primary-soft text-fg' : 'text-muted hover:bg-surface-2 hover:text-fg'
        )}
        style={{ paddingLeft: 24 + depth * 12 }}
      >
        <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span className={cx('truncate', hasProblem && 'text-danger')}>{node.name}</span>
        {hasProblem && <span className="sr-only">(has problems)</span>}
      </button>
      <div className="absolute right-0.5 top-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100">
        <Menu
          items={actions(node.file)}
          trigger={
            <IconButton label={`Actions for ${node.path}`} size="icon-sm" className="h-6 w-6">
              <MoreHorizontal className="h-3.5 w-3.5" />
            </IconButton>
          }
        />
      </div>
    </li>
  );
};

const SearchPanel = ({ files, onOpen }) => {
  const [q, setQ] = useState('');
  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (term.length < 2) return [];
    const out = [];
    for (const f of files) {
      if (isBinary(f)) continue;
      f.content.split('\n').forEach((line, i) => {
        if (out.length < 200 && line.toLowerCase().includes(term)) out.push({ file: f.filename, line: i + 1, text: line.trim().slice(0, 120) });
      });
    }
    return out;
  }, [q, files]);
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="p-2">
        <Input type="search" aria-label="Search in files" placeholder="Search in files" value={q} onChange={(e) => setQ(e.target.value)} className="h-8 text-[13px]" autoFocus />
      </div>
      <ul className="min-h-0 flex-1 overflow-y-auto px-1 pb-2" aria-live="polite">
        {q.trim().length >= 2 && results.length === 0 && <li className="px-2 py-1 text-[13px] text-muted">No results</li>}
        {results.map((r) => (
          <li key={`${r.file}:${r.line}`}>
            <button type="button" onClick={() => onOpen(r.file, r.line)} className="w-full rounded px-2 py-1 text-left hover:bg-surface-2">
              <span className="block truncate font-mono text-[11px] text-subtle">{r.file}:{r.line}</span>
              <span className="block truncate font-mono text-[12px]">{r.text}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export const FileExplorer = ({ files, active, onOpen, onCreate, onRename, onDelete, problemFiles }) => {
  const [mode, setMode] = useState('files');
  const [dialog, setDialog] = useState(null); // { kind: 'create'|'rename', file? }
  const [name, setName] = useState('');
  const [deleting, setDeleting] = useState(null);
  const tree = useMemo(() => buildTree(files), [files]);
  const names = files.map((f) => f.filename);
  const nameError = dialog ? checkFilename(name, names.filter((n) => n !== dialog.file?.filename)) : null;

  const actions = (file) => [
    { label: 'Rename', onSelect: () => { setDialog({ kind: 'rename', file }); setName(file.filename); } },
    { label: 'Delete', danger: true, disabled: file.filename === 'manifest.json', onSelect: () => setDeleting(file) },
  ];

  const submit = (e) => {
    e.preventDefault();
    if (nameError) return;
    const clean = name.trim().replace(/^\.\//, '');
    if (dialog.kind === 'create') onCreate(clean);
    else onRename(dialog.file.filename, clean);
    setDialog(null);
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex h-10 shrink-0 items-center justify-between border-b border-border px-2">
        <span className="px-1 text-[11px] font-semibold uppercase tracking-wider text-subtle">{mode === 'files' ? 'Files' : 'Search'}</span>
        <div className="flex">
          <IconButton label={mode === 'files' ? 'Search in files' : 'Close search'} size="icon-sm" onClick={() => setMode(mode === 'files' ? 'search' : 'files')}>
            {mode === 'files' ? <Search className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
          </IconButton>
          <IconButton label="New file" size="icon-sm" onClick={() => { setDialog({ kind: 'create' }); setName(''); }}>
            <FilePlus2 className="h-3.5 w-3.5" />
          </IconButton>
        </div>
      </div>
      {mode === 'search' ? (
        <SearchPanel files={files} onOpen={onOpen} />
      ) : (
        <nav aria-label="Project files" className="min-h-0 flex-1 overflow-y-auto p-1.5">
          <ul>
            {tree.map((n) => (
              <TreeNode key={n.path} node={n} depth={0} active={active} onOpen={onOpen} actions={actions} problems={problemFiles} />
            ))}
          </ul>
        </nav>
      )}

      <Dialog open={!!dialog} onClose={() => setDialog(null)} title={dialog?.kind === 'rename' ? 'Rename file' : 'New file'} size="sm">
        <form onSubmit={submit} className="space-y-4">
          <Field label="Path" hint="Relative to the project root, e.g. options.html or scripts/util.js" error={name && nameError}>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="font-mono" data-autofocus />
          </Field>
          <div className="flex justify-end gap-2">
            <Button onClick={() => setDialog(null)}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={!!nameError}>
              {dialog?.kind === 'rename' ? 'Rename' : 'Create'}
            </Button>
          </div>
        </form>
      </Dialog>
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => { onDelete(deleting.filename); setDeleting(null); }}
        danger
        title={`Delete ${deleting?.filename}?`}
        description="You can restore it later from History."
        confirmLabel="Delete file"
      />
    </div>
  );
};
