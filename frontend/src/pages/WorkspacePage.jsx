import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  ArrowLeft, Bot, Check, CloudOff, Download, Eye, FileCode2, FolderTree, History, MoreHorizontal,
  ShieldCheck, AlertTriangle, Globe, GitCompare, Copy, AlertCircle, CheckCircle2, Rocket, Palette,
} from 'lucide-react';
import { projectsApi, errorMessage } from '../lib/api';
import { useProject } from '../features/workspace/useProject';
import { rememberProject } from '../features/workspace/recent';
import { useMediaQuery } from '../lib/useMediaQuery';
import { FileExplorer } from '../features/workspace/FileExplorer';
import { EditorPanel, EditorTabs, DiffPanel } from '../features/workspace/EditorPanel';
import { AssistantPanel } from '../features/workspace/AssistantPanel';
import { PreviewPanel, ProblemsPanel, HistoryPanel, SecurityPanel } from '../features/workspace/SidePanels';
import { PublishPanel } from '../features/publishing/PublishPanel';
import { DesignPanel } from '../features/design/DesignPanel';
import { Badge, Button, ErrorState, IconButton, Menu, Select, Spinner, Tabs } from '../components/ui';

const SaveIndicator = ({ state, error, onRetry }) => {
  if (state === 'saving') return <span className="flex items-center gap-1.5 text-[12px] text-muted"><span className="h-1.5 w-1.5 rounded-full bg-primary pulse-dot" aria-hidden="true" />Saving…</span>;
  if (state === 'dirty') return <span className="text-[12px] text-muted">Unsaved changes</span>;
  if (state === 'error') {
    return (
      <span className="flex items-center gap-1.5 text-[12px] text-danger" role="alert">
        <CloudOff className="h-3.5 w-3.5" aria-hidden="true" /> {error || 'Save failed'}
        <button type="button" className="underline" onClick={onRetry}>Retry</button>
      </span>
    );
  }
  return <span className="animate-in flex items-center gap-1 text-[12px] text-subtle"><Check className="h-3.5 w-3.5" aria-hidden="true" />Saved</span>;
};

const WorkspacePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const p = useProject(id);
  const [openTabs, setOpenTabs] = useState([]);
  const [active, setActive] = useState(null);
  const [reveal, setReveal] = useState(null);
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const [params] = useSearchParams();
  const initialPanel = params.get('panel');
  const [side, setSide] = useState(initialPanel || 'assistant');
  const [mobile, setMobile] = useState(initialPanel || 'code');
  const [proposal, setProposal] = useState(null);
  const [reviewing, setReviewing] = useState(null); // filename being diffed
  const [applying, setApplying] = useState(false);
  const [historyKey, setHistoryKey] = useState(0);
  const [publishing, setPublishing] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => rememberProject(id), [id]);

  // Open manifest + popup by default once files load.
  useEffect(() => {
    if (!p.project || initialized) return;
    setInitialized(true);
    const names = p.files.map((f) => f.filename);
    const initial = ['popup.js', 'popup.html', 'manifest.json'].filter((n) => names.includes(n));
    const first = initial[0] || names[0];
    setOpenTabs(initial.length ? initial.reverse() : first ? [first] : []);
    setActive(first || null);
  }, [p.project, p.files, initialized]);

  useEffect(() => {
    if (p.project) document.title = `${p.project.title} — Extensio AI`;
    return () => {
      document.title = 'Extensio AI';
    };
  }, [p.project]);

  const fileByName = useMemo(() => new Map(p.files.map((f) => [f.filename, f])), [p.files]);
  const problemFiles = useMemo(
    () => new Set(p.validation.errors.map((m) => m.match(/^([\w./-]+\.\w+)[: ]/)?.[1]).filter(Boolean)),
    [p.validation]
  );

  const openFile = useCallback((name, line) => {
    setReviewing(null);
    setOpenTabs((t) => (t.includes(name) ? t : [...t, name]));
    setActive(name);
    setReveal(line || null);
    setMobile('code');
  }, []);

  const closeTab = (name) => {
    setOpenTabs((t) => {
      const next = t.filter((n) => n !== name);
      if (active === name) setActive(next[next.length - 1] || null);
      return next;
    });
  };

  const flush = useCallback(() => p.save().catch(() => { throw new Error('Save your changes before continuing.'); }), [p]);

  // Asks the crew for a change and opens it as a proposal (used by the Design tab).
  const requestEdit = async (prompt) => {
    setSide('assistant');
    setMobile('assistant');
    const pending = toast.loading('The crew is preparing the change…');
    try {
      await flush();
      const res = await projectsApi.edit(id, prompt);
      setProposal({ ...res.proposal, changes: res.changes, summary: res.generation?.summary, warnings: res.generation?.warnings || [], trace: res.generation?.trace || [] });
      toast.success('Proposal ready — review the diff', { id: pending });
    } catch (e) {
      toast.error(errorMessage(e, 'Could not prepare the change'), { id: pending });
    }
  };

  const startReview = () => {
    const first = proposal.changes.changed[0] || proposal.changes.added[0] || proposal.changes.removed[0];
    setReviewing(first || null);
    setMobile('code');
  };

  const applyProposal = async () => {
    setApplying(true);
    try {
      await flush();
      const res = await projectsApi.apply(id, {
        files: proposal.files,
        instruction: proposal.instruction,
        title: proposal.title,
        summary: proposal.summary,
        trace: proposal.trace,
      });
      p.replaceFromServer(res.extension);
      await p.refreshValidation().catch(() => {});
      setProposal(null);
      setReviewing(null);
      setHistoryKey((k) => k + 1);
      // Close tabs for removed files.
      setOpenTabs((t) => t.filter((n) => res.extension.files.some((f) => f.filename === n)));
      toast.success('Changes applied');
      return res;
    } catch (e) {
      toast.error(errorMessage(e, 'Could not apply the changes'));
      return null;
    } finally {
      setApplying(false);
    }
  };

  const onRestored = async (extension) => {
    p.replaceFromServer(extension);
    await p.refreshValidation().catch(() => {});
    setOpenTabs((t) => t.filter((n) => extension.files.some((f) => f.filename === n)));
  };

  const renameFile = (from, to) => {
    p.renameFile(from, to);
    setOpenTabs((t) => t.map((n) => (n === from ? to : n)));
    if (active === from) setActive(to);
  };
  const deleteFile = (name) => {
    p.deleteFile(name);
    closeTab(name);
  };

  const togglePublish = async () => {
    setPublishing(true);
    try {
      const { isPublic } = await projectsApi.publish(id);
      p.setProject((pr) => ({ ...pr, isPublic }));
      toast.success(isPublic ? 'Shared to the community gallery' : 'Removed from the community gallery');
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setPublishing(false);
    }
  };

  const setStatus = async (status) => {
    try {
      const { extension } = await projectsApi.update(id, { status });
      p.setProject((pr) => ({ ...pr, status: extension.status }));
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  const download = async () => {
    try {
      await flush();
      if (p.validation.errors.length) toast(`Downloading with ${p.validation.errors.length} unresolved problem(s). Chrome may refuse to load it.`, { icon: '⚠️' });
      await projectsApi.download(id, p.project.title);
    } catch (e) {
      toast.error(errorMessage(e, 'Download failed'));
    }
  };

  if (p.loading && !p.project) {
    return <div className="flex h-full items-center justify-center"><Spinner label="Opening project" /></div>;
  }
  if (p.loadError) {
    const notFound = p.loadError.response?.status === 404 || p.loadError.response?.status === 400;
    if (notFound) rememberProject(null);
    return (
      <ErrorState
        title={notFound ? 'Project not found' : 'Could not open project'}
        message={notFound ? 'It may have been deleted, or it belongs to another account.' : errorMessage(p.loadError)}
        onRetry={notFound ? () => navigate('/projects') : p.reload}
      />
    );
  }

  const errorsCount = p.validation.errors.length;
  const SIDE_TABS = [
    { id: 'assistant', label: 'Assistant', icon: Bot },
    { id: 'preview', label: 'Preview', icon: Eye },
    { id: 'design', label: 'Design', icon: Palette },
    { id: 'problems', label: 'Problems', icon: AlertTriangle, badge: errorsCount ? <Badge tone="danger" className="px-1.5 py-0">{errorsCount}</Badge> : null },
    { id: 'history', label: 'History', icon: History },
    { id: 'security', label: 'Security', icon: ShieldCheck },
    { id: 'publish', label: 'Publish', icon: Rocket },
  ];

  const sidePanel = (tab) => {
    switch (tab) {
      case 'preview':
        return <PreviewPanel files={p.files} />;
      case 'problems':
        return <ProblemsPanel validation={p.validation} onRevalidate={async () => { await flush(); await p.refreshValidation(); }} onOpenFile={openFile} />;
      case 'history':
        return <HistoryPanel projectId={id} refreshKey={historyKey} beforeRestore={flush} onRestored={onRestored} />;
      case 'security':
        return <SecurityPanel projectId={id} beforeAudit={flush} onOpenFile={openFile} />;
      case 'design':
        return (
          <DesignPanel
            files={p.files}
            locked={!!proposal}
            onUpdateFile={p.updateFile}
            onPropose={(pr) => {
              setProposal({ ...pr, title: p.project.title, warnings: [], trace: [] });
              setSide('assistant');
              setMobile('assistant');
              setReviewing(pr.changes.changed[0] || null);
            }}
            onRequestEdit={requestEdit}
          />
        );
      case 'publish':
        return <PublishPanel project={p.project} files={p.files} beforeAction={flush} />;
      default:
        return (
          <AssistantPanel
            projectId={id}
            proposal={proposal}
            setProposal={(pr) => { setProposal(pr); if (!pr) setReviewing(null); }}
            onReview={startReview}
            onApply={applyProposal}
            beforeRequest={flush}
            applying={applying}
          />
        );
    }
  };

  const reviewFiles = proposal ? [...proposal.changes.changed, ...proposal.changes.added, ...proposal.changes.removed] : [];
  const proposedByName = proposal ? new Map(proposal.files.map((f) => [f.filename, f])) : new Map();

  const editorArea = reviewing ? (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex h-10 shrink-0 items-center gap-2 border-b border-border bg-surface px-2">
        <GitCompare className="h-4 w-4 text-primary" aria-hidden="true" />
        <Select aria-label="Changed file" className="h-7 !w-auto max-w-[50%] text-[12px]" value={reviewing} onChange={(e) => setReviewing(e.target.value)}>
          {reviewFiles.map((f) => <option key={f} value={f}>{f}</option>)}
        </Select>
        <span className="hidden sm:inline text-[12px] text-muted">Current ← → Proposed</span>
        <div className="ml-auto flex gap-1.5">
          <Button size="sm" variant="ghost" onClick={() => setReviewing(null)}>Back to editor</Button>
          <Button size="sm" variant="primary" loading={applying} onClick={applyProposal}>Apply</Button>
        </div>
      </div>
      <div className="min-h-0 flex-1">
        <DiffPanel
          filename={reviewing}
          original={fileByName.get(reviewing)?.encoding === 'base64' ? '(binary)' : fileByName.get(reviewing)?.content}
          modified={proposedByName.get(reviewing)?.encoding === 'base64' ? '(binary)' : proposedByName.get(reviewing)?.content}
        />
      </div>
    </div>
  ) : (
    <div className="flex h-full min-h-0 flex-col">
      {openTabs.length > 0 && <EditorTabs tabs={openTabs} active={active} onSelect={setActive} onClose={closeTab} />}
      <div className="min-h-0 flex-1">
        <EditorPanel
          file={fileByName.get(active)}
          onChange={p.updateFile}
          onSave={() => p.save().catch(() => {})}
          revealLine={reveal}
          readOnly={!!proposal}
        />
      </div>
      {proposal && (
        <div className="shrink-0 border-t border-primary/30 bg-primary-soft/50 px-3 py-1.5 text-[12px] text-muted">
          Editing is paused while an AI proposal is open. Apply or discard it in the Assistant panel.
        </div>
      )}
    </div>
  );

  const explorer = (
    <FileExplorer
      files={p.files}
      active={active}
      onOpen={openFile}
      onCreate={(name) => { p.createFile(name); openFile(name); }}
      onRename={renameFile}
      onDelete={deleteFile}
      problemFiles={problemFiles}
    />
  );

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Project header */}
      <div className="flex h-12 shrink-0 items-center gap-2 border-b border-border px-2 sm:px-3">
        <Link to="/projects" aria-label="Back to projects" className="flex h-8 w-8 items-center justify-center rounded text-muted hover:bg-surface-2 hover:text-fg">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="min-w-0 truncate font-display text-[15px] font-semibold tracking-display">{p.project.title}</h1>
        <Select aria-label="Project status" className="hidden md:block h-7 !w-auto text-[12px]" value={p.project.status} onChange={(e) => setStatus(e.target.value)}>
          <option value="draft">Draft</option>
          <option value="ready">Ready</option>
          <option value="archived">Archived</option>
        </Select>
        <div className="ml-auto flex items-center gap-2">
          <Button size="sm" variant="primary" onClick={download}>
            <Download className="h-3.5 w-3.5" aria-hidden="true" /> <span className="hidden sm:inline">Download ZIP</span>
          </Button>
          <Menu
            items={[
              { label: p.project.isPublic ? 'Unshare from community' : 'Share to community', icon: Globe, disabled: publishing, onSelect: togglePublish },
              ...(p.project.isPublic
                ? [{ label: 'Copy share link', icon: Copy, onSelect: () => navigator.clipboard.writeText(`${window.location.origin}/shared/${id}`).then(() => toast.success('Link copied')) }]
                : []),
            ]}
            trigger={<IconButton label="More project actions" size="icon-sm"><MoreHorizontal className="h-4 w-4" /></IconButton>}
          />
        </div>
      </div>

      {/* Desktop: three panels. Only one layout is mounted at a time, so the editor and panels never run twice. */}
      {isDesktop ? (
      <div className="grid min-h-0 flex-1 grid-cols-[220px_minmax(0,1fr)_380px] xl:grid-cols-[240px_minmax(0,1fr)_420px]">
        <aside className="min-h-0 border-r border-rule bg-bg">{explorer}</aside>
        <section aria-label="Editor" className="min-h-0">{editorArea}</section>
        <aside aria-label="Tools" className="flex min-h-0 flex-col border-l border-rule bg-bg">
          <div className="flex h-10 shrink-0 items-center border-b border-border px-1.5">
            <Tabs size="sm" label="Tools" value={side} onChange={setSide} tabs={SIDE_TABS} />
          </div>
          <div className="min-h-0 flex-1">{sidePanel(side)}</div>
        </aside>
      </div>

      ) : (
      /* Mobile / tablet: one panel at a time */
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="shrink-0 border-b border-border px-1.5 py-1">
          <Tabs
            size="sm"
            label="Workspace panels"
            value={mobile}
            onChange={setMobile}
            tabs={[{ id: 'files', label: 'Files', icon: FolderTree }, { id: 'code', label: 'Code', icon: FileCode2 }, ...SIDE_TABS]}
          />
        </div>
        <div className="min-h-0 flex-1">
          {mobile === 'files' ? explorer : mobile === 'code' ? editorArea : sidePanel(mobile)}
        </div>
      </div>
      )}

      {/* Status line */}
      <footer className="flex h-7 shrink-0 items-center gap-4 border-t border-rule bg-bg px-3 font-mono text-[11.5px] text-muted tabular" aria-label="Project status">
        <span className={`inline-flex items-center gap-1 ${errorsCount ? 'text-danger' : 'text-success'}`}>
          {errorsCount ? <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" /> : <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />}
          {errorsCount ? `MV3 · ${errorsCount} problem${errorsCount > 1 ? 's' : ''}` : 'MV3 valid'}
        </span>
        <span className="hidden sm:inline">{p.files.length} files</span>
        {p.validation.warnings.length > 0 && <span className="hidden text-warning sm:inline">{p.validation.warnings.length} warnings</span>}
        <span className="ml-auto font-sans" aria-live="polite">
          <SaveIndicator state={p.saveState} error={p.saveError} onRetry={() => p.save().catch(() => {})} />
        </span>
      </footer>
    </div>
  );
};

export default WorkspacePage;
