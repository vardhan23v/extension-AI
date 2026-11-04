import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Github } from 'lucide-react';
import { githubApi, errorMessage } from '../../lib/api';
import { Button, Dialog, Field, Input, Select, Spinner, Switch, Tabs } from '../../components/ui';

const slug = (s) => String(s || 'extension').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'extension';

// Export the project to a new or existing GitHub repository.
export const ExportDialog = ({ open, onClose, project, beforeExport }) => {
  const [status, setStatus] = useState(null);
  const [mode, setMode] = useState('new');
  const [name, setName] = useState(slug(project.title));
  const [priv, setPriv] = useState(false);
  const [repos, setRepos] = useState(null);
  const [repo, setRepo] = useState('');
  const [branch, setBranch] = useState(`extensio/${slug(project.title)}`);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!open) return;
    setResult(null);
    setError('');
    githubApi.status().then(setStatus).catch((e) => setError(errorMessage(e)));
  }, [open]);

  useEffect(() => {
    if (!open || mode !== 'existing' || repos || !status?.connected) return;
    githubApi
      .repos()
      .then((r) => {
        setRepos(r.repos);
        setRepo(r.repos[0]?.fullName || '');
      })
      .catch((e) => setError(errorMessage(e)));
  }, [open, mode, repos, status]);

  const selected = repos?.find((r) => r.fullName === repo);
  const needsBranch = mode === 'existing' && selected && !selected.empty;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await beforeExport();
      const target = mode === 'new' ? { mode, name: name.trim(), private: priv } : { mode, repo, ...(needsBranch ? { branch: branch.trim() } : {}) };
      setResult(await githubApi.exportProject(project.id, target));
    } catch (err) {
      setError(errorMessage(err, 'Export failed'));
    } finally {
      setBusy(false);
    }
  };

  let body;
  if (!status && !error) body = <Spinner label="Checking GitHub connection" />;
  else if (status && !status.available) body = <p className="text-sm text-muted">GitHub export isn’t set up on this server yet.</p>;
  else if (status && !status.connected) {
    body = (
      <p className="text-sm text-muted">
        Connect your GitHub account first in{' '}
        <Link to="/settings" className="font-medium text-primary underline" onClick={onClose}>Settings</Link>.
      </p>
    );
  } else if (result) {
    body = (
      <div className="space-y-3 text-sm" role="status">
        <p>
          {result.createdRepo ? 'Created' : 'Committed to'} <strong className="font-mono">{result.repo}</strong> on branch <span className="font-mono">{result.branch}</span>.
        </p>
        <div className="flex flex-wrap gap-3">
          <a href={result.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-primary underline">Open repository <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" /></a>
          <a href={result.commitUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-muted underline">View commit</a>
        </div>
      </div>
    );
  } else {
    body = (
      <form id="gh-export" onSubmit={submit} className="space-y-4">
        <p className="text-[13px] text-muted">Signed in as @{status.login}. A README is added if the project doesn’t have one.</p>
        <Tabs label="Destination" value={mode} onChange={setMode} tabs={[{ id: 'new', label: 'New repository' }, { id: 'existing', label: 'Existing repository' }]} />
        {mode === 'new' ? (
          <>
            <Field label="Repository name" hint="Letters, numbers, dots, dashes and underscores.">
              <Input value={name} onChange={(e) => setName(e.target.value)} className="font-mono" data-autofocus />
            </Field>
            <div className="flex items-center justify-between gap-4">
              <span className="text-[13px]">Private repository{!status.privateRepos && <span className="text-subtle"> — reconnect with private access in Settings</span>}</span>
              <Switch label="Private repository" checked={priv} onChange={(v) => status.privateRepos && setPriv(v)} />
            </div>
          </>
        ) : !repos ? (
          <Spinner label="Loading your repositories" />
        ) : repos.length === 0 ? (
          <p className="text-sm text-muted">No repositories found on your account.</p>
        ) : (
          <>
            <Field label="Repository">
              <Select value={repo} onChange={(e) => setRepo(e.target.value)}>
                {repos.map((r) => <option key={r.fullName} value={r.fullName}>{r.fullName}{r.private ? ' (private)' : ''}{r.empty ? ' — empty' : ''}</option>)}
              </Select>
            </Field>
            {needsBranch && (
              <Field label="New branch" hint={`This repository already has content, so the export goes to a new branch. ${selected.defaultBranch} is not changed.`}>
                <Input value={branch} onChange={(e) => setBranch(e.target.value)} className="font-mono" />
              </Field>
            )}
          </>
        )}
      </form>
    );
  }

  const canSubmit = status?.connected && !result && (mode === 'new' ? name.trim() : repo && (!needsBranch || branch.trim()));
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Export to GitHub"
      description="Commits the current project files. Existing history is never rewritten."
      footer={
        <>
          <Button onClick={onClose}>{result ? 'Done' : 'Cancel'}</Button>
          {!result && status?.connected && (
            <Button type="submit" form="gh-export" variant="primary" loading={busy} disabled={!canSubmit}>
              {!busy && <Github className="h-4 w-4" aria-hidden="true" />} Export
            </Button>
          )}
        </>
      }
    >
      {body}
      {error && <p role="alert" className="mt-3 rounded border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">{error}</p>}
    </Dialog>
  );
};
