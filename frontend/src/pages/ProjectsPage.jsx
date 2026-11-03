import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FolderKanban, Plus, Search } from 'lucide-react';
import { projectsApi, errorMessage } from '../lib/api';
import { useAsync } from '../lib/useAsync';
import { Button, EmptyState, ErrorState, Input, PageHeader, Select, Card } from '../components/ui';
import { ProjectRow, ProjectRowSkeleton } from '../features/projects/ProjectRow';
import { useProjectActions } from '../features/projects/useProjectActions';

const PAGE = 25;

const ProjectsPage = () => {
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState(params.get('q') || '');
  const status = params.get('status') || '';
  const page = Math.max(parseInt(params.get('page') || '0', 10), 0);
  const q = params.get('q') || '';

  // Debounce search input into the URL.
  useEffect(() => {
    const t = setTimeout(() => {
      if (query === q) return;
      const next = new URLSearchParams(params);
      if (query) next.set('q', query);
      else next.delete('q');
      next.delete('page');
      setParams(next, { replace: true });
    }, 300);
    return () => clearTimeout(t);
  }, [query, q, params, setParams]);

  const { loading, error, data, reload, setData } = useAsync(
    () => projectsApi.list({ q: q || undefined, status: status || undefined, limit: PAGE, offset: page * PAGE }),
    [q, status, page]
  );

  const { menuItems, dialogs } = useProjectActions({
    onChanged: () => reload(),
    onRemoved: (id) => setData((d) => ({ ...d, total: d.total - 1, extensions: d.extensions.filter((x) => x.id !== id) })),
  });

  const setParam = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== 'page') next.delete('page');
    setParams(next);
  };

  const projects = data?.extensions || [];
  const total = data?.total || 0;
  const filtered = Boolean(q || status);

  return (
    <>
      <PageHeader
        title="My Projects"
        description="All your extensions. Open one to edit it in Code Studio."
        actions={
          <Link to="/new" className="inline-flex h-9 items-center gap-2 rounded bg-primary px-3.5 text-sm font-medium text-primary-fg hover:bg-primary/90">
            <Plus className="h-4 w-4" aria-hidden="true" /> New extension
          </Link>
        }
      />

      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" aria-hidden="true" />
          <Input
            type="search"
            aria-label="Search projects"
            placeholder="Search by name or prompt"
            className="pl-9"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <Select aria-label="Filter by status" className="sm:w-40" value={status} onChange={(e) => setParam('status', e.target.value)}>
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="ready">Ready</option>
          <option value="archived">Archived</option>
        </Select>
      </div>

      <Card>
        {error && !data ? (
          <ErrorState message={errorMessage(error, 'Could not load projects.')} onRetry={reload} />
        ) : loading && !data ? (
          <ul className="divide-y divide-border">{[0, 1, 2, 3].map((i) => <ProjectRowSkeleton key={i} />)}</ul>
        ) : projects.length === 0 ? (
          <EmptyState
            icon={FolderKanban}
            title={filtered ? 'No matching projects' : 'No projects yet'}
            description={filtered ? 'Try a different search or filter.' : 'Describe an extension and the AI will build the first version.'}
            action={
              filtered ? (
                <Button onClick={() => { setQuery(''); setParams({}); }}>Clear filters</Button>
              ) : (
                <Link to="/new" className="inline-flex h-9 items-center rounded bg-primary px-3.5 text-sm font-medium text-primary-fg hover:bg-primary/90">
                  Create an extension
                </Link>
              )
            }
          />
        ) : (
          <ul className={`divide-y divide-border ${loading ? 'opacity-60' : ''}`} aria-busy={loading}>
            {projects.map((p) => (
              <ProjectRow key={p.id} project={p} menuItems={menuItems} />
            ))}
          </ul>
        )}
      </Card>

      {total > PAGE && (
        <nav aria-label="Pagination" className="mt-4 flex items-center justify-between text-sm text-muted">
          <span>
            {page * PAGE + 1}–{Math.min((page + 1) * PAGE, total)} of {total}
          </span>
          <div className="flex gap-2">
            <Button size="sm" disabled={page === 0} onClick={() => setParam('page', String(page - 1))}>Previous</Button>
            <Button size="sm" disabled={(page + 1) * PAGE >= total} onClick={() => setParam('page', String(page + 1))}>Next</Button>
          </div>
        </nav>
      )}
      {dialogs}
    </>
  );
};

export default ProjectsPage;
