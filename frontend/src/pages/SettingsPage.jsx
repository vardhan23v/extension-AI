import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { userApi, errorMessage } from '../lib/api';
import { Button, Field, Input, PageHeader, Tabs } from '../components/ui';
import { AiKeys } from '../features/settings/AiKeys';
import { GitHubSettings } from '../features/github/GitHubSettings';

const Section = ({ title, description, children }) => (
  <section className="grid gap-4 border-b border-rule py-7 md:grid-cols-[220px_1fr]">
    <div>
      <h2 className="text-sm font-semibold">{title}</h2>
      {description && <p className="mt-1 text-[13px] text-muted">{description}</p>}
    </div>
    <div>{children}</div>
  </section>
);

const SettingsPage = () => {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    userApi
      .profile()
      .then((r) => setName(r.user.name || ''))
      .catch(() => setName(user?.name || ''))
      .finally(() => setLoaded(true));
  }, [user]);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await userApi.updateProfile(name.trim());
      toast.success('Profile saved');
    } catch (err) {
      toast.error(errorMessage(err, 'Could not save profile'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <PageHeader title="Settings" />
      <Section title="Profile">
        <form onSubmit={save} className="space-y-4">
          <Field label="Display name">
            <Input value={name} maxLength={100} disabled={!loaded} autoComplete="name" onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="Email" hint="Email changes are not available yet.">
            <Input value={user?.email || ''} readOnly disabled />
          </Field>
          <Button type="submit" variant="primary" loading={saving} disabled={!name.trim()}>Save</Button>
        </form>
      </Section>
      <Section title="Appearance">
        <Tabs label="Theme" value={theme} onChange={setTheme} tabs={[{ id: 'light', label: 'Light' }, { id: 'dark', label: 'Dark' }]} />
      </Section>
      <Section title="AI keys" description="Optional. Use your own Groq, Gemini or OpenRouter key — you pay the provider directly, and you aren’t limited by shared platform quotas.">
        <AiKeys />
      </Section>
      <Section title="GitHub" description="Optional. Export projects to your GitHub repositories.">
        <GitHubSettings />
      </Section>
      <Section title="Session">
        <Button variant="danger-ghost" onClick={async () => { await logout(); navigate('/'); }}>Sign out</Button>
      </Section>
    </div>
  );
};

export default SettingsPage;
