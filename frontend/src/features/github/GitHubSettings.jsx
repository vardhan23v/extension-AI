import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Github } from 'lucide-react';
import { githubApi, errorMessage } from '../../lib/api';
import { useAsync } from '../../lib/useAsync';
import { Badge, Button, ConfirmDialog, ErrorState, Skeleton, Switch } from '../../components/ui';

const REASONS = {
  expired: 'The connection request expired or was invalid. Please try again.',
  denied: 'GitHub access was not granted.',
  exchange: 'GitHub sign-in failed. Please try again.',
  'not-configured': 'GitHub export is not set up on this server yet.',
};

// Settings → GitHub: connect with least privilege, show status, disconnect (revokes the grant).
export const GitHubSettings = () => {
  const { loading, error, data, reload } = useAsync(() => githubApi.status(), []);
  const [params, setParams] = useSearchParams();
  const [privateRepos, setPrivateRepos] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);

  // Result of the OAuth redirect.
  useEffect(() => {
    const result = params.get('github');
    if (!result) return;
    if (result === 'connected') toast.success('GitHub connected');
    else toast.error(REASONS[params.get('reason')] || 'GitHub connection failed');
    params.delete('github');
    params.delete('reason');
    setParams(params, { replace: true });
  }, [params, setParams]);

  if (loading && !data) return <Skeleton className="h-12" />;
  if (error && !data) return <ErrorState message={errorMessage(error)} onRetry={reload} />;
  if (!data.available) return <p className="text-[13px] text-muted">GitHub export isn’t set up on this server yet.</p>;

  const connect = async () => {
    setBusy(true);
    try {
      const { url } = await githubApi.connect(privateRepos);
      window.location.assign(url);
    } catch (e) {
      toast.error(errorMessage(e));
      setBusy(false);
    }
  };

  if (data.connected) {
    return (
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="flex items-center gap-2 text-sm">
            <Github className="h-4 w-4" aria-hidden="true" /> Connected as <strong className="font-medium">@{data.login}</strong>
          </p>
          <Badge tone={data.privateRepos ? 'info' : 'neutral'}>{data.privateRepos ? 'Public and private repos' : 'Public repos only'}</Badge>
        </div>
        <Button variant="danger-ghost" onClick={() => setConfirm(true)}>Disconnect</Button>
        <ConfirmDialog
          open={confirm}
          onClose={() => setConfirm(false)}
          loading={busy}
          danger
          title="Disconnect GitHub?"
          description="Extensio’s access is revoked on GitHub and the stored token is deleted. Repositories you exported stay on GitHub."
          confirmLabel="Disconnect"
          onConfirm={async () => {
            setBusy(true);
            try {
              await githubApi.disconnect();
              toast.success('GitHub disconnected');
              setConfirm(false);
              reload();
            } catch (e) {
              toast.error(errorMessage(e));
            } finally {
              setBusy(false);
            }
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-[13px] text-muted">Export projects to a GitHub repository. Extensio asks for the smallest access GitHub offers for this, and the token is stored encrypted.</p>
      <div className="flex items-center justify-between gap-4">
        <span className="text-[13px]">Allow private repositories <span className="text-subtle">(asks for full repo access)</span></span>
        <Switch label="Allow private repositories" checked={privateRepos} onChange={setPrivateRepos} />
      </div>
      <Button variant="primary" onClick={connect} loading={busy}>
        {!busy && <Github className="h-4 w-4" aria-hidden="true" />} Connect GitHub
      </Button>
    </div>
  );
};
