import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { KeyRound, ShieldCheck } from 'lucide-react';
import { userApi, errorMessage } from '../../lib/api';
import { useAsync } from '../../lib/useAsync';
import { Badge, Button, ConfirmDialog, ErrorState, Input, Skeleton, Switch } from '../../components/ui';

const ProviderRow = ({ p, onChanged }) => {
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(null);
  const [confirm, setConfirm] = useState(false);

  const act = async (name, fn) => {
    setBusy(name);
    try {
      await fn();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(null);
    }
  };

  return (
    <li className="py-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <p className="text-sm font-medium">{p.label}</p>
          <p className="text-[12px] text-muted">{p.costNote}</p>
        </div>
        {p.saved ? <Badge tone="success">Saved · ends in {p.last4}</Badge> : <Badge>Not set</Badge>}
      </div>
      <form
        className="mt-3 flex flex-col gap-2 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          act('save', async () => {
            const r = await userApi.saveKey(p.id, value.trim());
            setValue('');
            toast.success(r.note || `${p.label} key verified and saved`);
            onChanged();
          });
        }}
      >
        <label className="sr-only" htmlFor={`key-${p.id}`}>{p.label} API key</label>
        <Input
          id={`key-${p.id}`}
          type="password"
          autoComplete="off"
          spellCheck={false}
          placeholder={p.saved ? 'Replace key' : 'Paste API key'}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="font-mono text-[12px]"
        />
        <div className="flex shrink-0 gap-2">
          <Button type="submit" variant="primary" disabled={!value.trim()} loading={busy === 'save'}>Verify & save</Button>
          {p.saved && (
            <>
              <Button
                loading={busy === 'test'}
                onClick={() => act('test', async () => {
                  const r = await userApi.testKey(p.id);
                  (r.ok ? toast.success : toast.error)(r.message);
                })}
              >
                Test
              </Button>
              <Button variant="danger-ghost" onClick={() => setConfirm(true)}>Remove</Button>
            </>
          )}
        </div>
      </form>
      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        loading={busy === 'delete'}
        danger
        title={`Remove your ${p.label} key?`}
        description="It is deleted from our database. Requests will use the platform keys again unless “Use only my keys” is on."
        confirmLabel="Remove key"
        onConfirm={() => act('delete', async () => {
          await userApi.deleteKey(p.id);
          setConfirm(false);
          toast.success('Key removed');
          onChanged();
        })}
      />
    </li>
  );
};

// Settings → AI keys (bring your own key).
export const AiKeys = () => {
  const { loading, error, data, reload, setData } = useAsync(() => userApi.keys(), []);
  const [saving, setSaving] = useState(false);

  if (loading && !data) return <div className="space-y-3"><Skeleton className="h-12" /><Skeleton className="h-12" /></div>;
  if (error && !data) return <ErrorState message={errorMessage(error)} onRetry={reload} />;
  if (!data.available) {
    return <p className="text-[13px] text-muted">Saving your own keys isn’t enabled on this server yet. Extensio uses its platform keys for now.</p>;
  }

  const anySaved = data.providers.some((p) => p.saved);
  const toggle = async (byokOnly) => {
    setSaving(true);
    try {
      const r = await userApi.saveSettings({ byokOnly });
      setData((d) => ({ ...d, byokOnly: r.byokOnly }));
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <p className="flex gap-2 text-[13px] text-muted">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden="true" />
        Keys are checked with the provider, encrypted (AES-256-GCM) and stored server-side. They are never shown again or sent to your browser.
      </p>
      <ul className="mt-2 divide-y divide-rule">
        {data.providers.map((p) => <ProviderRow key={p.id} p={p} onChanged={reload} />)}
      </ul>
      <div className="mt-2 flex items-start justify-between gap-4 border-t border-rule pt-4">
        <div>
          <p className="flex items-center gap-1.5 text-sm font-medium"><KeyRound className="h-4 w-4" aria-hidden="true" /> Use only my keys</p>
          <p className="text-[12px] text-muted">
            {anySaved ? 'When on, requests fail instead of falling back to platform keys.' : 'Add a key first.'} Your own keys also get a higher hourly request limit.
          </p>
        </div>
        <Switch label="Use only my keys" checked={data.byokOnly} onChange={(v) => !saving && anySaved && toggle(v)} />
      </div>
    </div>
  );
};
