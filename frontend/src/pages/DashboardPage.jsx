import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, FolderKanban, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { projectsApi, errorMessage } from '../lib/api';
import { useAsync } from '../lib/useAsync';
import { Button, Card, EmptyState, ErrorState, Textarea } from '../components/ui';
import { ProjectRow, ProjectRowSkeleton } from '../features/projects/ProjectRow';
import { useProjectActions } from '../features/projects/useProjectActions';

const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [idea, setIdea] = useState('');
  const { loading, error, data, reload } = useAsync(() => projectsApi.list({ limit: 5 }), []);
  const { menuItems, dialogs } = useProjectActions({ onChanged: reload, onRemoved: reload });
  const projects = data?.extensions || [];

  const start = (e) => {
    e.preventDefault();
    navigate('/new', { state: { prompt: idea.trim() } });
  };

  return (
    <>
      <h1 className="font-display text-[1.75rem] font-semibold leading-tight tracking-display">Welcome{user?.name ? `, ${user.name}` : ''}</h1>
      <p className="mt-1 text-sm text-muted">Pick up where you left off, or start something new.</p>

      <Card className="mt-6 p-4">
        <form onSubmit={start}>
          <label htmlFor="quick-idea" className="flex items-center gap-2 text-sm font-medium">
            <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" /> New extension
          </label>
          <Textarea
            id="quick-idea"
            rows={2}
            className="mt-2"
            placeholder="e.g. A popup that saves the current tab to a reading list with tags"
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
          />
          <div className="mt-3 flex justify-end">
            <Button type="submit" variant="primary" disabled={!idea.trim()}>
              Continue <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </form>
      </Card>

      <section className="mt-8" aria-labelledby="recent-heading">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="recent-heading" className="text-sm font-semibold">Recent projects</h2>
          {data?.total > 5 && (
            <Link to="/projects" className="text-[13px] text-primary hover:underline">
              View all {data.total}
            </Link>
          )}
        </div>
        <Card>
          {error && !data ? (
            <ErrorState message={errorMessage(error, 'Could not load projects.')} onRetry={reload} />
          ) : loading && !data ? (
            <ul className="divide-y divide-border">{[0, 1, 2].map((i) => <ProjectRowSkeleton key={i} />)}</ul>
          ) : projects.length === 0 ? (
            <EmptyState icon={FolderKanban} title="No projects yet" description="Your extensions will appear here." />
          ) : (
            <ul className="divide-y divide-border">
              {projects.map((p, i) => <ProjectRow key={p.id} project={p} menuItems={menuItems} index={i} />)}
            </ul>
          )}
        </Card>
      </section>

      <section className="mt-10" aria-label="Shortcuts">
        <ul className="divide-y divide-rule border-y border-rule">
          {[
            ['/templates', 'Start from a template', '20 ready-made prompts for common extension types'],
            ['/security', 'Security Center', 'Audit status across all your projects'],
          ].map(([to, title, body]) => (
            <li key={to}>
              <Link to={to} className="group flex items-center justify-between gap-4 py-3.5 hover:text-primary">
                <span>
                  <span className="block text-sm font-medium">{title}</span>
                  <span className="block text-[13px] text-muted">{body}</span>
                </span>
                <ArrowRight className="h-4 w-4 text-subtle transition-transform duration-fast group-hover:translate-x-0.5 group-hover:text-primary" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      </section>
      {dialogs}
    </>
  );
};

export default DashboardPage;
