import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, ShieldAlert } from 'lucide-react';
import { projectsApi, errorMessage } from '../lib/api';
import { useAsync } from '../lib/useAsync';
import { AUDIT_STATUS, timeAgo } from '../lib/format';
import { Badge, Button, Card, Dialog, EmptyState, ErrorState, PageHeader, Skeleton } from '../components/ui';
import { AuditReport } from '../features/security/AuditReport';

const SecurityCenterPage = () => {
  const { loading, error, data, reload, setData } = useAsync(() => projectsApi.list({ limit: 100 }), []);
  const [running, setRunning] = useState(null);
  const [report, setReport] = useState(null);
  const [runError, setRunError] = useState(null);

  const run = async (p) => {
    setRunning(p.id);
    setRunError(null);
    try {
      const { audit } = await projectsApi.audit(p.id);
      setReport({ project: p, audit });
      setData((d) => ({ ...d, extensions: d.extensions.map((x) => (x.id === p.id ? { ...x, auditStatus: audit.status, auditAt: new Date().toISOString() } : x)) }));
    } catch (e) {
      setRunError({ project: p, message: errorMessage(e, 'The audit could not run. This project has NOT been reviewed.') });
    } finally {
      setRunning(null);
    }
  };

  const projects = data?.extensions || [];
  const counts = projects.reduce((acc, p) => ({ ...acc, [p.auditStatus || 'none']: (acc[p.auditStatus || 'none'] || 0) + 1 }), {});

  return (
    <>
      <PageHeader title="Security Center" description="Automated checks for permissions, remote code, unsafe DOM use, CSP issues and exposed keys. Not a certification." />

      <dl className="mb-6 flex flex-wrap gap-x-8 gap-y-2 text-sm" aria-label="Audit summary">
        {[
          ['passed', 'passed checks'],
          ['findings', 'with findings'],
          ['incomplete', 'incomplete'],
          ['none', 'never audited'],
        ].map(([k, label]) => (
          <div key={k} className="flex items-baseline gap-1.5">
            <dt className="sr-only">{label}</dt>
            <dd className="font-display text-xl font-semibold tabular">{loading && !data ? '–' : counts[k] || 0}</dd>
            <span className="text-muted" aria-hidden="true">{label}</span>
          </div>
        ))}
      </dl>

      {runError && (
        <div role="alert" className="mb-4 rounded-lg border border-danger/30 bg-danger/5 p-3 text-sm text-danger">
          {runError.project.title}: {runError.message}
        </div>
      )}

      <Card>
        {error && !data ? (
          <ErrorState message={errorMessage(error)} onRetry={reload} />
        ) : loading && !data ? (
          <div className="space-y-3 p-4">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-10" />)}</div>
        ) : projects.length === 0 ? (
          <EmptyState icon={ShieldCheck} title="No projects to audit" description="Create an extension first." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <caption className="sr-only">Audit status by project</caption>
              <thead>
                <tr className="border-b border-border text-left text-[12px] text-muted">
                  <th scope="col" className="px-4 py-2.5 font-medium">Project</th>
                  <th scope="col" className="px-4 py-2.5 font-medium">Last audit</th>
                  <th scope="col" className="px-4 py-2.5 font-medium hidden sm:table-cell">Updated</th>
                  <th scope="col" className="px-4 py-2.5"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {projects.map((p) => {
                  const s = AUDIT_STATUS[p.auditStatus];
                  return (
                    <tr key={p.id}>
                      <td className="max-w-[240px] truncate px-4 py-3">
                        <Link to={`/projects/${p.id}`} className="font-medium hover:underline">{p.title}</Link>
                      </td>
                      <td className="px-4 py-3">{s ? <Badge tone={s.tone}>{s.label}</Badge> : <span className="text-[13px] text-subtle">Never</span>}</td>
                      <td className="hidden px-4 py-3 text-[13px] text-muted sm:table-cell">{timeAgo(p.updatedAt)}</td>
                      <td className="px-4 py-3 text-right">
                        <Button size="sm" onClick={() => run(p)} loading={running === p.id} disabled={!!running && running !== p.id}>
                          {running !== p.id && <ShieldAlert className="h-3.5 w-3.5" aria-hidden="true" />} Audit
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Dialog open={!!report} onClose={() => setReport(null)} title={`Audit — ${report?.project.title}`} size="lg">
        {report && <AuditReport audit={report.audit} />}
      </Dialog>
    </>
  );
};

export default SecurityCenterPage;
