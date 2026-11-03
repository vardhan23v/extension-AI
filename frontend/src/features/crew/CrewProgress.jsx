import React from 'react';
import { AlertCircle, MinusCircle } from 'lucide-react';
import { cx } from '../../components/ui';

export const CREW = [
  { id: 'planner', role: 'Product Planner', goal: 'Plans files and the least permissions needed' },
  { id: 'engineer', role: 'Extension Engineer', goal: 'Writes the Manifest V3 project' },
  { id: 'qa', role: 'QA Reviewer', goal: 'Checks MV3 rules and the plan' },
  { id: 'security', role: 'Security Analyst', goal: 'Looks for dangerous patterns' },
];

const Check = () => (
  <svg viewBox="0 0 16 16" className="h-4 w-4 text-success" aria-hidden="true">
    <path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="draw-check" />
  </svg>
);

const StatusIcon = ({ state }) => {
  if (state.status === 'done') return <Check />;
  if (state.status === 'failed') return <AlertCircle className="h-4 w-4 text-danger" aria-hidden="true" />;
  if (state.status === 'skipped') return <MinusCircle className="h-4 w-4 text-subtle" aria-hidden="true" />;
  if (state.status === 'running') return <span className="h-2 w-2 rounded-full bg-primary pulse-dot" aria-hidden="true" />;
  return <span className="h-2 w-2 rounded-full border border-control" aria-hidden="true" />;
};

const label = { waiting: 'Waiting', running: 'Working', done: 'Done', skipped: 'Skipped', failed: 'Failed' };

/**
 * Live view of the agent crew. `agents` maps id → { status, ms, summary }.
 * `agents` comes from the streamed events in lib/api.js createWithProgress.
 */
export const CrewProgress = ({ agents, plan, agentsList = CREW }) => (
  <div className="rounded-lg border border-rule bg-surface" aria-live="polite">
    <ol>
      {agentsList.map((a, i) => {
        const state = agents[a.id] || { status: 'waiting' };
        return (
          <li key={a.id} className={cx('relative overflow-hidden px-4 py-3', i > 0 && 'border-t border-rule')}>
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center">
                <StatusIcon state={state} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                  <span className={cx('text-sm font-medium', state.status === 'waiting' && 'text-muted')}>{a.role}</span>
                  <span className="font-mono text-[11.5px] text-subtle tabular">
                    {state.ms ? `${(state.ms / 1000).toFixed(1)}s` : label[state.status]}
                  </span>
                </div>
                <p className="text-[13px] text-muted">{state.summary || a.goal}</p>
                {a.id === 'planner' && plan && (
                  <ul className="mt-2 grid gap-1 text-[12.5px] sm:grid-cols-2">
                    {plan.features.slice(0, 4).map((f, j) => (
                      <li key={f} className="stagger-item flex gap-1.5" style={{ animationDelay: `${j * 60}ms` }}>
                        <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-subtle" aria-hidden="true" />
                        {f}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            {state.status === 'running' && (
              <span className="absolute inset-x-0 bottom-0 h-px overflow-hidden" aria-hidden="true">
                <span className="progress-sweep block h-px w-2/5 bg-primary" />
              </span>
            )}
          </li>
        );
      })}
    </ol>
  </div>
);

// Compact read-only trace for chat messages.
export const CrewTrace = ({ trace }) =>
  trace?.length ? (
    <ol className="mt-2 flex flex-wrap gap-x-3 gap-y-1 border-t border-rule pt-2 text-[11.5px] text-muted">
      {trace.map((t) => (
        <li key={t.agent} className="inline-flex items-center gap-1" title={t.summary}>
          <span className={cx('h-1.5 w-1.5 rounded-full', t.status === 'done' ? 'bg-success' : t.status === 'failed' ? 'bg-danger' : 'bg-subtle')} aria-hidden="true" />
          {t.role}
          <span className="font-mono tabular text-subtle">{t.ms ? `${(t.ms / 1000).toFixed(1)}s` : t.status}</span>
        </li>
      ))}
    </ol>
  ) : null;
