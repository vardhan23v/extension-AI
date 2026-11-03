import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { AlertCircle, AlertTriangle, CheckCircle2, History, RotateCcw, ShieldCheck, Info, Moon, Sun } from 'lucide-react';
import { projectsApi, errorMessage } from '../../lib/api';
import { timeAgo } from '../../lib/format';
import { buildPreviewDoc, previewPages } from '../../lib/preview';
import { Button, ConfirmDialog, EmptyState, ErrorState, Spinner, Tabs, IconButton } from '../../components/ui';
import { AuditReport } from '../security/AuditReport';

const VIEWPORTS = { popup: 360, wide: 640 };

export const PreviewPanel = ({ files }) => {
  const pages = useMemo(() => previewPages(files), [files]);
  const [page, setPage] = useState(pages[0]?.id);
  const [dark, setDark] = useState(false);
  const [width, setWidth] = useState('popup');
  const [errors, setErrors] = useState([]);
  const current = pages.find((p) => p.id === page) || pages[0];
  // Rebuild after a short pause so typing does not reload the frame on every keystroke.
  const [doc, setDoc] = useState('');
  useEffect(() => {
    const t = setTimeout(() => {
      setErrors([]);
      setDoc(current ? buildPreviewDoc(files, current.file, { dark }) : '');
    }, 400);
    return () => clearTimeout(t);
  }, [files, current, dark]);

  useEffect(() => {
    const onMsg = (e) => {
      if (e.data?.type === 'preview-error') setErrors((es) => [...es.slice(-4), e.data.message]);
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, []);

  if (!pages.length) {
    return <EmptyState icon={Info} title="Nothing to preview" description="This extension has no popup, options or side panel page. Load it in Chrome to test background behavior." />;
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-border px-2 py-1.5">
        <Tabs size="sm" label="Preview page" value={current.id} onChange={setPage} tabs={pages.map((p) => ({ id: p.id, label: p.label }))} />
        <div className="flex items-center gap-1">
          <Tabs size="sm" label="Preview width" value={width} onChange={setWidth} tabs={[{ id: 'popup', label: '360' }, { id: 'wide', label: '640' }]} />
          <IconButton label={dark ? 'Preview in light mode' : 'Preview in dark mode'} size="icon-sm" onClick={() => setDark(!dark)}>
            {dark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
          </IconButton>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-auto bg-surface-2 p-4">
        <div className="mx-auto overflow-hidden rounded-lg border border-border bg-white shadow-sm" style={{ maxWidth: VIEWPORTS[width] }}>
          <iframe
            title={`${current.label} preview`}
            sandbox="allow-scripts"
            srcDoc={doc}
            className="block h-[480px] w-full border-0"
            style={{ colorScheme: dark ? 'dark' : 'light' }}
          />
        </div>
        {errors.length > 0 && (
          <div role="alert" className="mx-auto mt-3 max-w-md rounded border border-danger/30 bg-danger/5 p-2 font-mono text-[12px] text-danger">
            {errors.map((e, i) => <div key={i}>{e}</div>)}
          </div>
        )}
      </div>
      <p className="shrink-0 border-t border-border px-3 py-2 text-[11px] text-muted">
        Visual preview only. Chrome APIs are simulated; content scripts and the service worker don’t run here. Load the ZIP in chrome://extensions to test real behavior.
      </p>
    </div>
  );
};

export const ProblemsPanel = ({ validation, onRevalidate, onOpenFile }) => {
  const [busy, setBusy] = useState(false);
  const fileOf = (msg) => msg.match(/^([\w./-]+\.\w+)[: ]/)?.[1];
  const items = [...validation.errors.map((m) => ['error', m]), ...validation.warnings.map((m) => ['warning', m])];
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex h-10 shrink-0 items-center justify-between border-b border-border px-3">
        <span className="text-[12px] text-muted">
          {validation.errors.length} errors · {validation.warnings.length} warnings
        </span>
        <Button size="sm" variant="ghost" loading={busy} onClick={async () => { setBusy(true); try { await onRevalidate(); } finally { setBusy(false); } }}>
          Re-check
        </Button>
      </div>
      {items.length === 0 ? (
        <EmptyState icon={CheckCircle2} title="No problems found" description="Manifest V3 structure, file references and JavaScript syntax all passed." />
      ) : (
        <ul className="min-h-0 flex-1 divide-y divide-border overflow-y-auto">
          {items.map(([kind, msg]) => {
            const file = fileOf(msg);
            return (
              <li key={msg} className="flex gap-2 px-3 py-2 text-[13px]">
                {kind === 'error' ? <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger" aria-label="Error" /> : <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-label="Warning" />}
                <span>
                  {msg}
                  {file && (
                    <button type="button" onClick={() => onOpenFile(file)} className="ml-1 text-primary hover:underline">Open</button>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export const HistoryPanel = ({ projectId, beforeRestore, onRestored, refreshKey }) => {
  const [state, setState] = useState({ loading: true, error: null, versions: [] });
  const [restoring, setRestoring] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    projectsApi
      .versions(projectId)
      .then((r) => setState({ loading: false, error: null, versions: r.versions }))
      .catch((error) => setState({ loading: false, error, versions: [] }));
  };
  useEffect(load, [projectId, refreshKey]);

  const restore = async () => {
    setBusy(true);
    try {
      await beforeRestore();
      const { extension } = await projectsApi.restore(projectId, restoring.id);
      onRestored(extension);
      toast.success('Version restored. The previous state was saved to history.');
      setRestoring(null);
      load();
    } catch (e) {
      toast.error(errorMessage(e, 'Restore failed'));
    } finally {
      setBusy(false);
    }
  };

  if (state.loading) return <div className="p-3"><Spinner label="Loading history" /></div>;
  if (state.error) return <ErrorState message={errorMessage(state.error)} onRetry={load} />;
  if (!state.versions.length) {
    return <EmptyState icon={History} title="No versions yet" description="A snapshot is saved before every AI change, restore, and session of manual edits." />;
  }
  return (
    <>
      <ol className="h-full divide-y divide-border overflow-y-auto">
        {state.versions.map((v) => (
          <li key={v.id} className="flex items-start justify-between gap-2 px-3 py-2.5">
            <div className="min-w-0">
              <p className="truncate text-[13px]">{v.note || 'Snapshot'}</p>
              <p className="text-[11px] text-subtle">{timeAgo(v.createdAt)}</p>
            </div>
            <Button size="sm" variant="ghost" onClick={() => setRestoring(v)}>
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" /> Restore
            </Button>
          </li>
        ))}
      </ol>
      <ConfirmDialog
        open={!!restoring}
        onClose={() => setRestoring(null)}
        onConfirm={restore}
        loading={busy}
        title="Restore this version?"
        description="Your current files will be replaced. They are saved to history first, so you can undo this."
        confirmLabel="Restore"
      />
    </>
  );
};

export const SecurityPanel = ({ projectId, beforeAudit, onOpenFile, onAudited }) => {
  const [audit, setAudit] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const run = async () => {
    setBusy(true);
    setError(null);
    try {
      await beforeAudit();
      const res = await projectsApi.audit(projectId);
      setAudit(res.audit);
      onAudited?.(res.audit);
    } catch (e) {
      setAudit(null);
      setError(errorMessage(e, 'The audit could not run. The extension has NOT been reviewed.'));
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="h-full overflow-y-auto p-3">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-[13px] text-muted">Checks permissions, remote code, unsafe DOM use, CSP and exposed keys.</p>
        <Button size="sm" variant="primary" onClick={run} loading={busy}>
          {!busy && <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />} {audit ? 'Run again' : 'Run audit'}
        </Button>
      </div>
      {error && <div role="alert" className="rounded border border-danger/30 bg-danger/5 p-3 text-[13px] text-danger">{error}</div>}
      {audit && <AuditReport audit={audit} onOpenFile={onOpenFile} />}
    </div>
  );
};
