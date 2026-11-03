import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Rocket } from 'lucide-react';
import { projectsApi, errorMessage } from '../lib/api';
import { useAsync } from '../lib/useAsync';
import { timeAgo, PROJECT_STATUS } from '../lib/format';
import { Badge, EmptyState, ErrorState, PageHeader, Skeleton, staggerStyle } from '../components/ui';

// Entry point for store preparation: pick a project, then work in its Publish tab.
const PublishingPage = () => {
  const { loading, error, data, reload } = useAsync(() => projectsApi.list({ limit: 100 }), []);
  const projects = (data?.extensions || []).filter((p) => p.status !== 'archived');
  return (
    <>
      <PageHeader
        title="Publishing"
        description="Prepare an extension for the Chrome Web Store: readiness checklist, listing, permission justifications, privacy policy and assets. You submit it yourself."
      />
      {error && !data ? (
        <ErrorState message={errorMessage(error)} onRetry={reload} />
      ) : loading && !data ? (
        <div className="space-y-2">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-14" />)}</div>
      ) : projects.length === 0 ? (
        <EmptyState icon={Rocket} title="Nothing to publish yet" description="Build or import an extension first." />
      ) : (
        <ul className="divide-y divide-rule border-y border-rule">
          {projects.map((p, i) => {
            const status = PROJECT_STATUS[p.status] || PROJECT_STATUS.draft;
            return (
              <li key={p.id} className="stagger-item" style={staggerStyle(i)}>
                <Link to={`/projects/${p.id}?panel=publish`} className="group flex items-center justify-between gap-4 py-3.5 hover:text-primary">
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{p.title}</span>
                    <span className="block text-[12px] text-subtle">Updated {timeAgo(p.updatedAt)}</span>
                  </span>
                  <span className="flex items-center gap-4">
                    <Badge tone={status.tone}>{status.label}</Badge>
                    <ArrowRight className="h-4 w-4 text-subtle transition-transform duration-fast group-hover:translate-x-0.5 group-hover:text-primary" aria-hidden="true" />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
};

export default PublishingPage;
