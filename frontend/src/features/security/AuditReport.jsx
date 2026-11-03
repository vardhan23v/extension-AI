import React from 'react';
import { Badge } from '../../components/ui';
import { AUDIT_STATUS } from '../../lib/format';

const SEVERITY_TONE = { critical: 'danger', high: 'danger', medium: 'warning', low: 'info', info: 'neutral' };
const ORDER = ['critical', 'high', 'medium', 'low', 'info'];

// Renders an audit result from POST /extensions/:id/audit.
export const AuditReport = ({ audit, onOpenFile }) => {
  const status = AUDIT_STATUS[audit.status] || AUDIT_STATUS.failed;
  const findings = [...(audit.findings || [])].sort((a, b) => ORDER.indexOf(a.severity) - ORDER.indexOf(b.severity));
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border p-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={status.tone}>{status.label}</Badge>
          <span className="text-[12px] text-muted">
            Static checks: {audit.checks?.static || 'unknown'} · AI review: {audit.checks?.ai || 'unknown'}
          </span>
        </div>
        {audit.status === 'incomplete' && (
          <p className="mt-2 text-[13px] text-muted">The static checks found nothing, but the AI review could not run. The extension has not been fully reviewed.</p>
        )}
        {audit.message && <p className="mt-2 text-[13px] text-muted">{audit.message}</p>}
      </div>

      {audit.aiSummary && (
        <div>
          <h4 className="text-[13px] font-semibold">Explanation</h4>
          <p className="mt-1 text-[13px] leading-relaxed text-muted">{audit.aiSummary}</p>
          {audit.aiConcerns?.length > 0 && (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-[13px] text-muted">
              {audit.aiConcerns.map((c) => <li key={c}>{c}</li>)}
            </ul>
          )}
        </div>
      )}

      {findings.length > 0 && (
        <div>
          <h4 className="text-[13px] font-semibold">Findings ({findings.length})</h4>
          <ul className="mt-2 divide-y divide-border rounded-lg border border-border">
            {findings.map((f, i) => (
              <li key={i} className="p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={SEVERITY_TONE[f.severity]}>{f.severity}</Badge>
                  <span className="text-[13px] font-medium">{f.message}</span>
                </div>
                {f.file && (
                  onOpenFile ? (
                    <button type="button" onClick={() => onOpenFile(f.file, f.line)} className="mt-1 font-mono text-[12px] text-primary hover:underline">
                      {f.file}{f.line ? `:${f.line}` : ''}
                    </button>
                  ) : (
                    <p className="mt-1 font-mono text-[12px] text-subtle">{f.file}{f.line ? `:${f.line}` : ''}</p>
                  )
                )}
                {f.recommendation && <p className="mt-1 text-[12px] text-muted">{f.recommendation}</p>}
              </li>
            ))}
          </ul>
        </div>
      )}
      <p className="text-[11px] text-subtle">{audit.disclaimer}</p>
    </div>
  );
};
