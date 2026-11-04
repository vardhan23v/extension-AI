import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { AlertTriangle, CheckCircle2, CircleSlash, FlaskConical, Play, Wrench, XCircle } from 'lucide-react';
import { projectsApi, errorMessage } from '../../lib/api';
import { RUN_STATUS, timeAgo } from '../../lib/format';
import { Badge, Button, EmptyState, ErrorState, Spinner, cx } from '../../components/ui';

const MAX_FIX_ATTEMPTS = 2;
const ICON = {
  pass: <CheckCircle2 className="h-4 w-4 shrink-0 text-success" aria-label="Passed" />,
  fail: <XCircle className="h-4 w-4 shrink-0 text-danger" aria-label="Failed" />,
  warn: <AlertTriangle className="h-4 w-4 shrink-0 text-warning" aria-label="Warning" />,
  skip: <CircleSlash className="h-4 w-4 shrink-0 text-subtle" aria-label="Not applicable" />,
};

const RunDetail = ({ run, onFix, fixAttempts, locked }) => {
  const r = run.report;
  if (run.status === 'queued' || run.status === 'running') {
    return (
      <div className="space-y-2 rounded-lg border border-rule bg-surface p-3 text-[13px]">
        <Spinner label={run.status === 'queued' ? 'Waiting for a test runner (usually under a minute)…' : 'Loading the extension in Chromium…'} />
        <p className="text-[12px] text-muted">Runs on GitHub Actions in real headless Chromium. The page updates by itself.</p>
      </div>
    );
  }
  if (!r || run.status === 'error') {
    return (
      <div role="alert" className="rounded-lg border border-warning/30 bg-warning/5 p-3 text-[13px]">
        {run.stale ? 'The runner never reported back. Try again; if it keeps happening, check the GitHub Actions setup.' : r?.error || 'The test could not run.'}
      </div>
    );
  }
  const failures = r.checks.filter((c) => c.status === 'fail');
  return (
    <div className="space-y-4">
      <ul className="divide-y divide-rule rounded-lg border border-rule bg-surface">
        {r.checks.map((c, i) => (
          <li key={c.id} className="stagger-item flex gap-2.5 px-3 py-2" style={{ animationDelay: `${Math.min(i, 8) * 30}ms` }}>
            {ICON[c.status]}
            <div className="min-w-0">
              <p className="text-[13px]">{c.title}</p>
              {c.detail && <p className="break-words text-[12px] text-muted">{c.detail}</p>}
            </div>
          </li>
        ))}
      </ul>

      {failures.length > 0 && (
        <div className="space-y-1.5">
          <Button size="sm" variant="primary" disabled={locked || fixAttempts >= MAX_FIX_ATTEMPTS} onClick={() => onFix(r)}>
            <Wrench className="h-3.5 w-3.5" aria-hidden="true" /> Fix with the crew
          </Button>
          <p className="text-[12px] text-muted">
            {fixAttempts >= MAX_FIX_ATTEMPTS
              ? 'Automatic fixes tried twice for this run — look at the errors yourself or ask the assistant something specific.'
              : 'Sends the failures to the crew; you review the diff, apply it, then run the tests again.'}
          </p>
        </div>
      )}

      {r.consoleErrors?.length > 0 && (
        <div>
          <h4 className="text-[13px] font-semibold">Console errors</h4>
          <ul className="mt-1 space-y-1">
            {r.consoleErrors.map((e, i) => (
              <li key={i} className="rounded border border-danger/20 bg-danger/5 px-2 py-1 font-mono text-[11.5px] text-danger">
                <span className="text-subtle">{e.source}: </span>{e.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {r.screenshots?.map((s) => (
        <figure key={s.name}>
          <img src={`data:image/png;base64,${s.data}`} alt={`${s.name} as rendered in Chromium`} className="w-full rounded border border-rule" />
          <figcaption className="mt-1 text-[12px] text-muted">{s.name} — real Chromium render</figcaption>
        </figure>
      ))}

      {r.blockedRequests?.length > 0 && (
        <details className="text-[12px] text-muted">
          <summary className="cursor-pointer">{r.blockedRequests.length} external request(s) blocked during the test</summary>
          <ul className="mt-1 font-mono">{r.blockedRequests.map((u) => <li key={u} className="truncate">{u}</li>)}</ul>
        </details>
      )}

      {r.notTested?.length > 0 && (
        <div className="text-[12px] text-muted">
          <p className="font-medium text-fg">Not tested automatically</p>
          <ul className="mt-1 list-disc pl-5">{r.notTested.map((t) => <li key={t}>{t}</li>)}</ul>
        </div>
      )}
      <p className="text-[11px] text-subtle">{r.chromium} · {r.durationMs ? `${(r.durationMs / 1000).toFixed(1)} s` : ''}</p>
    </div>
  );
};

export const TestsPanel = ({ projectId, beforeRun, onFixWithCrew, locked }) => {
  const [state, setState] = useState({ loading: true, error: null, configured: true, runs: [] });
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [starting, setStarting] = useState(false);
  const [fixes, setFixes] = useState({});

  const load = useCallback(async () => {
    try {
      const r = await projectsApi.testRuns(projectId);
      setState({ loading: false, error: null, configured: r.configured, runs: r.runs });
      setSelected((cur) => cur || r.runs[0]?.id || null);
    } catch (error) {
      setState((s) => ({ ...s, loading: false, error }));
    }
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  // Load the selected run's report; poll while it is in progress.
  useEffect(() => {
    if (!selected) return undefined;
    let alive = true;
    let timer;
    const fetchRun = async () => {
      try {
        const { run } = await projectsApi.testRun(selected);
        if (!alive) return;
        setDetail(run);
        if (run.status === 'queued' || run.status === 'running') timer = setTimeout(fetchRun, 4000);
        else setState((s) => ({ ...s, runs: s.runs.map((x) => (x.id === run.id ? { ...x, status: run.status } : x)) }));
      } catch {
        if (alive) timer = setTimeout(fetchRun, 8000);
      }
    };
    fetchRun();
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [selected]);

  const start = async () => {
    setStarting(true);
    try {
      await beforeRun();
      const { run } = await projectsApi.startTest(projectId);
      setState((s) => ({ ...s, runs: [run, ...s.runs] }));
      setSelected(run.id);
      setDetail(run);
    } catch (e) {
      toast.error(errorMessage(e, 'Could not start the test'));
    } finally {
      setStarting(false);
    }
  };

  const fix = (report) => {
    setFixes((f) => ({ ...f, [selected]: (f[selected] || 0) + 1 }));
    const lines = [
      ...report.checks.filter((c) => c.status === 'fail').map((c) => `${c.title}: ${c.detail}`),
      ...(report.consoleErrors || []).map((e) => `${e.source}: ${e.message}`),
    ];
    onFixWithCrew(`Automated Chromium test failures:\n${lines.join('\n')}`);
  };

  if (state.loading) return <div className="p-3"><Spinner label="Loading test runs" /></div>;
  if (state.error) return <ErrorState message={errorMessage(state.error)} onRetry={load} />;
  if (!state.configured) {
    return <EmptyState icon={FlaskConical} title="Testing Lab isn’t set up yet" description="The server needs its GitHub Actions runner configured. See the README’s Testing Lab section." />;
  }

  const busy = detail && (detail.status === 'queued' || detail.status === 'running');
  return (
    <div className="h-full space-y-4 overflow-y-auto p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[13px] text-muted">Loads this extension in real Chromium and checks that it starts, its pages open without errors, and content scripts run.</p>
        <Button size="sm" variant="primary" onClick={start} loading={starting} disabled={busy}>
          {!starting && <Play className="h-3.5 w-3.5" aria-hidden="true" />} Run tests
        </Button>
      </div>

      {state.runs.length === 0 ? (
        <EmptyState icon={FlaskConical} title="No test runs yet" description="A run takes about a minute." />
      ) : (
        <>
          <div className="flex flex-wrap gap-1.5" role="listbox" aria-label="Test runs">
            {state.runs.slice(0, 6).map((run) => {
              const st = RUN_STATUS[run.status] || RUN_STATUS.error;
              return (
                <button
                  key={run.id}
                  type="button"
                  role="option"
                  aria-selected={run.id === selected}
                  onClick={() => setSelected(run.id)}
                  className={cx('rounded border px-2 py-1 text-left text-[12px]', run.id === selected ? 'border-primary bg-primary-soft/40' : 'border-rule hover:bg-surface-2')}
                >
                  <Badge tone={st.tone}>{st.label}</Badge>
                  <span className="mt-0.5 block text-[11px] text-subtle">{timeAgo(run.createdAt)}</span>
                </button>
              );
            })}
          </div>
          {detail && detail.id === selected && <RunDetail run={detail} onFix={fix} fixAttempts={fixes[selected] || 0} locked={locked} />}
        </>
      )}
    </div>
  );
};
