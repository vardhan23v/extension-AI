import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, FlaskConical } from 'lucide-react';
import { projectsApi, errorMessage } from '../lib/api';
import { useAsync } from '../lib/useAsync';
import { RUN_STATUS, timeAgo } from '../lib/format';
import { Badge, EmptyState, ErrorState, PageHeader, Skeleton, staggerStyle } from '../components/ui';

// Recent automated browser runs across all projects.
const TestingLabPage = () => {
  const { loading, error, data, reload } = useAsync(() => projectsApi.allTestRuns(), []);
  return (
    <>
      <PageHeader
        title="Testing Lab"
        description="Each run loads an extension in real headless Chromium on GitHub Actions: does it load, does the service worker start, do its pages open without errors, do content scripts run. Start a run from a project’s Tests tab."
      />
      {error && !data ? (
        <ErrorState message={errorMessage(error)} onRetry={reload} />
      ) : loading && !data ? (
        <div className="space-y-2">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-14" />)}</div>
      ) : !data.configured ? (
        <EmptyState icon={FlaskConical} title="Testing Lab isn’t set up yet" description="The server’s GitHub Actions runner hasn’t been configured. See the README’s Testing Lab section." />
      ) : data.runs.length === 0 ? (
        <EmptyState
          icon={FlaskConical}
          title="No test runs yet"
          description="Open a project, go to the Tests tab and press Run tests."
          action={<Link to="/projects" className="text-sm font-medium text-primary hover:underline">Choose a project</Link>}
        />
      ) : (
        <ul className="divide-y divide-rule border-y border-rule">
          {data.runs.map((run, i) => {
            const st = RUN_STATUS[run.status] || RUN_STATUS.error;
            return (
              <li key={run.id} className="stagger-item" style={staggerStyle(i)}>
                <Link to={`/projects/${run.extensionId}?panel=tests`} className="group flex items-center justify-between gap-4 py-3.5 hover:text-primary">
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{run.title || 'Untitled project'}</span>
                    <span className="block text-[12px] text-subtle">{timeAgo(run.createdAt)}</span>
                  </span>
                  <span className="flex items-center gap-4">
                    <Badge tone={st.tone}>{st.label}</Badge>
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

export default TestingLabPage;
