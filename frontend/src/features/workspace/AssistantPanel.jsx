import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Bot, Bug, Send, GitCompare, Check, X, AlertTriangle } from 'lucide-react';
import { projectsApi, errorMessage, errorDetails } from '../../lib/api';
import { timeAgo } from '../../lib/format';
import { Badge, Button, Spinner, Tabs, Textarea, cx } from '../../components/ui';

const SUGGESTIONS = ['Add a dark mode toggle to the popup', 'Add an options page', 'Remove permissions the code does not use', 'Add a keyboard shortcut'];

const ChangeList = ({ changes }) => {
  const rows = [
    ...changes.added.map((f) => ['added', f]),
    ...changes.changed.map((f) => ['changed', f]),
    ...changes.removed.map((f) => ['removed', f]),
  ];
  if (!rows.length) return <p className="text-[12px] text-muted">No file changes.</p>;
  return (
    <ul className="space-y-0.5">
      {rows.map(([kind, f]) => (
        <li key={f} className="flex items-center gap-2 font-mono text-[12px]">
          <span className={cx('w-3 text-center', kind === 'added' ? 'text-success' : kind === 'removed' ? 'text-danger' : 'text-warning')}>
            {kind === 'added' ? '+' : kind === 'removed' ? '−' : '~'}
          </span>
          <span className="truncate">{f}</span>
        </li>
      ))}
    </ul>
  );
};

const Message = ({ m }) => (
  <li className={cx('flex flex-col gap-1', m.role === 'user' ? 'items-end' : 'items-start')}>
    <div className={cx('max-w-[92%] rounded-lg px-3 py-2 text-[13px] leading-relaxed whitespace-pre-wrap', m.role === 'user' ? 'bg-primary-soft text-fg' : 'border border-border bg-bg')}>
      {m.content}
      {m.meta?.changes && <div className="mt-2 border-t border-border pt-2"><ChangeList changes={m.meta.changes} /></div>}
    </div>
    {m.createdAt && <span className="text-[11px] text-subtle">{timeAgo(m.createdAt)}</span>}
  </li>
);

/**
 * Chat with the coding assistant. Edits come back as proposals: the parent
 * shows the diff (onReview) and applies them via onApply.
 */
export const AssistantPanel = ({ projectId, proposal, setProposal, onReview, onApply, beforeRequest, applying }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState('edit');
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState(null);
  const listRef = useRef(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    projectsApi
      .messages(projectId)
      .then((r) => alive && setMessages(r.messages))
      .catch(() => alive && setMessages([]))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [projectId]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages, proposal, busy]);

  const send = async (e) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    setBusy(true);
    setFailure(null);
    try {
      await beforeRequest();
      const res = mode === 'fix' ? await projectsApi.debug(projectId, text) : await projectsApi.edit(projectId, text);
      setProposal({ ...res.proposal, changes: res.changes, summary: res.generation?.summary, warnings: res.generation?.warnings || [] });
      setInput('');
    } catch (err) {
      setFailure({ message: errorMessage(err, 'The assistant could not complete this request.'), details: errorDetails(err) });
    } finally {
      setBusy(false);
    }
  };

  const apply = async () => {
    const res = await onApply();
    if (res) {
      setMessages((ms) => [
        ...ms,
        { id: `u${Date.now()}`, role: 'user', content: proposal.instruction },
        { id: `a${Date.now()}`, role: 'assistant', content: proposal.summary || 'Applied the changes.', meta: { changes: res.changes } },
      ]);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex h-10 shrink-0 items-center justify-between border-b border-border px-2">
        <Tabs
          size="sm"
          label="Assistant mode"
          value={mode}
          onChange={setMode}
          tabs={[{ id: 'edit', label: 'Edit', icon: Bot }, { id: 'fix', label: 'Fix an error', icon: Bug }]}
        />
      </div>

      <ul ref={listRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3" aria-live="polite">
        {loading ? (
          <Spinner label="Loading conversation" />
        ) : messages.length === 0 && !proposal ? (
          <li className="text-[13px] text-muted">
            <p>Ask for a change and the assistant will propose edits to your files. You review the diff before anything is saved.</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {SUGGESTIONS.map((s) => (
                <button key={s} type="button" onClick={() => setInput(s)} className="rounded-full border border-border px-2.5 py-1 text-[12px] hover:bg-surface-2">
                  {s}
                </button>
              ))}
            </div>
          </li>
        ) : (
          messages.map((m) => <Message key={m.id} m={m} />)
        )}

        {busy && (
          <li>
            <Spinner label={mode === 'fix' ? 'Diagnosing and preparing a fix…' : 'Preparing changes…'} />
          </li>
        )}

        {proposal && (
          <li className="rounded-lg border border-primary/40 bg-primary-soft/40 p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[13px] font-semibold">Proposed changes</span>
              <Badge tone="primary">Not saved yet</Badge>
            </div>
            <p className="mt-1 text-[13px] text-muted">{proposal.instruction}</p>
            {proposal.summary && <p className="mt-2 text-[13px]">{proposal.summary}</p>}
            <div className="mt-2"><ChangeList changes={proposal.changes} /></div>
            {proposal.warnings.length > 0 && (
              <p className="mt-2 text-[12px] text-warning">{proposal.warnings.length} validation warning(s)</p>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" onClick={onReview}><GitCompare className="h-3.5 w-3.5" aria-hidden="true" /> Review diff</Button>
              <Button size="sm" variant="primary" onClick={apply} loading={applying}><Check className="h-3.5 w-3.5" aria-hidden="true" /> Apply</Button>
              <Button size="sm" variant="ghost" onClick={() => { setProposal(null); toast('Changes discarded'); }}><X className="h-3.5 w-3.5" aria-hidden="true" /> Discard</Button>
            </div>
          </li>
        )}

        {failure && (
          <li role="alert" className="rounded-lg border border-danger/30 bg-danger/5 p-3 text-[13px]">
            <p className="flex items-center gap-1.5 font-medium text-danger"><AlertTriangle className="h-4 w-4" aria-hidden="true" /> {failure.message}</p>
            {failure.details.length > 0 && <ul className="mt-1 list-disc pl-5 text-muted">{failure.details.slice(0, 4).map((d) => <li key={d}>{d}</li>)}</ul>}
          </li>
        )}
      </ul>

      <form onSubmit={send} className="shrink-0 border-t border-border p-2">
        <label htmlFor="assistant-input" className="sr-only">{mode === 'fix' ? 'Paste the error message' : 'Describe the change'}</label>
        <Textarea
          id="assistant-input"
          rows={3}
          maxLength={4000}
          value={input}
          disabled={busy || !!proposal}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) send(e);
          }}
          placeholder={proposal ? 'Apply or discard the proposal first' : mode === 'fix' ? 'Paste the error from chrome://extensions or the console' : 'Describe the change you want'}
          className="text-[13px]"
        />
        <div className="mt-2 flex items-center justify-between">
          <span className="text-[11px] text-subtle">Ctrl/⌘ + Enter to send</span>
          <Button type="submit" size="sm" variant="primary" disabled={!input.trim() || busy || !!proposal} loading={busy}>
            {!busy && <Send className="h-3.5 w-3.5" aria-hidden="true" />} Send
          </Button>
        </div>
      </form>
    </div>
  );
};
