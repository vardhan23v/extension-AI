import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { ChevronDown, LayoutTemplate, Sparkles, Wand2, AlertTriangle } from 'lucide-react';
import { projectsApi, createWithProgress, errorMessage, errorDetails } from '../lib/api';
import { CrewProgress } from '../features/crew/CrewProgress';
import { Button, Card, Field, Input, PageHeader, Switch, Textarea } from '../components/ui';

const LANGUAGES = [
  ['en', 'English'], ['es', 'Spanish'], ['fr', 'French'], ['de', 'German'], ['pt_BR', 'Portuguese (BR)'],
  ['hi', 'Hindi'], ['ja', 'Japanese'], ['zh_CN', 'Chinese (Simplified)'],
];


const httpsOrEmpty = (v) => !v || /^https:\/\/[^\s]+$/i.test(v);

const NewProjectPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [prompt, setPrompt] = useState(location.state?.prompt || '');
  const [advanced, setAdvanced] = useState(false);
  const [support, setSupport] = useState({ on: false, url: '' });
  const [webhook, setWebhook] = useState({ on: false, url: '' });
  const [i18n, setI18n] = useState({ on: false, langs: ['en'] });
  const [busy, setBusy] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const [agents, setAgents] = useState({});
  const [plan, setPlan] = useState(null);
  const [failure, setFailure] = useState(null);

  const supportError = support.on && !httpsOrEmpty(support.url) ? 'Must be an https:// URL' : null;
  const webhookError = webhook.on && !httpsOrEmpty(webhook.url) ? 'Must be an https:// URL' : null;

  const enhance = async () => {
    setEnhancing(true);
    try {
      const { enhancedPrompt } = await projectsApi.enhancePrompt(prompt);
      setPrompt(enhancedPrompt);
    } catch (e) {
      toast.error(errorMessage(e, 'Could not improve the prompt'));
    } finally {
      setEnhancing(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!prompt.trim() || supportError || webhookError) return;
    setBusy(true);
    setFailure(null);
    try {
      setAgents({});
      setPlan(null);
      const onEvent = (e) => {
        setAgents((prev) => ({ ...prev, [e.agent]: e.type === 'agent:start' ? { status: 'running' } : { status: e.status, ms: e.ms, summary: e.summary } }));
        if (e.plan) setPlan(e.plan);
      };
      const { extension, generation } = await createWithProgress({
        prompt: prompt.trim(),
        monetizationLink: support.on && support.url ? support.url : null,
        webhookUrl: webhook.on && webhook.url ? webhook.url : null,
        languages: i18n.on ? i18n.langs : [],
      }, onEvent);
      if (generation?.warnings?.length) toast(`${generation.warnings.length} validation warning(s) — see the Problems tab.`);
      navigate(`/projects/${extension.id}`, { replace: true });
    } catch (err) {
      setFailure({ message: errorMessage(err, 'Generation failed'), details: errorDetails(err) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="AI Builder"
        description="Describe the extension. Be specific about what the popup shows and which sites it should work on."
        actions={
          <Link to="/templates" className="inline-flex h-9 items-center gap-2 rounded border border-border px-3.5 text-sm font-medium hover:bg-surface-2">
            <LayoutTemplate className="h-4 w-4" aria-hidden="true" /> Templates
          </Link>
        }
      />

      <form onSubmit={submit}>
        <Card className="p-4">
          <Field label="What should your extension do?" hint={`${prompt.length}/4000 characters`}>
            <Textarea
              rows={8}
              maxLength={4000}
              value={prompt}
              disabled={busy}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={'A popup that lists all open tabs, lets me search them, and has a button to close duplicates.\nRemember my last search using chrome.storage.'}
            />
          </Field>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <Button variant="ghost" size="sm" onClick={enhance} loading={enhancing} disabled={busy || prompt.trim().length < 5}>
              <Wand2 className="h-4 w-4" aria-hidden="true" /> Improve prompt
            </Button>
            <button
              type="button"
              className="inline-flex items-center gap-1 text-[13px] text-muted hover:text-fg"
              aria-expanded={advanced}
              aria-controls="advanced-options"
              onClick={() => setAdvanced((a) => !a)}
            >
              Advanced options <ChevronDown className={`h-4 w-4 transition-transform duration-fast ${advanced ? 'rotate-180' : ''}`} aria-hidden="true" />
            </button>
          </div>

          {advanced && (
            <div id="advanced-options" className="mt-4 space-y-5 border-t border-border pt-4">
              <div>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium">Support link</p>
                    <p className="text-[13px] text-muted">Adds a small “Support” link to the popup.</p>
                  </div>
                  <Switch label="Add support link" checked={support.on} onChange={(on) => setSupport({ ...support, on })} />
                </div>
                {support.on && (
                  <Field className="mt-3" error={supportError}>
                    <Input aria-label="Support URL" type="url" placeholder="https://buymeacoffee.com/you" value={support.url} onChange={(e) => setSupport({ ...support, url: e.target.value })} />
                  </Field>
                )}
              </div>
              <div>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium">Webhook</p>
                    <p className="text-[13px] text-muted">The extension sends data to this URL. Users will be told in the popup.</p>
                  </div>
                  <Switch label="Send data to a webhook" checked={webhook.on} onChange={(on) => setWebhook({ ...webhook, on })} />
                </div>
                {webhook.on && (
                  <Field className="mt-3" error={webhookError}>
                    <Input aria-label="Webhook URL" type="url" placeholder="https://example.com/hook" value={webhook.url} onChange={(e) => setWebhook({ ...webhook, url: e.target.value })} />
                  </Field>
                )}
              </div>
              <div>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium">Translations</p>
                    <p className="text-[13px] text-muted">Generates _locales files for the selected languages.</p>
                  </div>
                  <Switch label="Generate translations" checked={i18n.on} onChange={(on) => setI18n({ ...i18n, on })} />
                </div>
                {i18n.on && (
                  <fieldset className="mt-3 flex flex-wrap gap-2">
                    <legend className="sr-only">Languages</legend>
                    {LANGUAGES.map(([code, label]) => {
                      const on = i18n.langs.includes(code);
                      return (
                        <label key={code} className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1 text-[13px] ${on ? 'border-primary bg-primary-soft text-primary' : 'border-border text-muted'}`}>
                          <input
                            type="checkbox"
                            className="sr-only"
                            checked={on}
                            disabled={code === 'en'}
                            onChange={() => setI18n({ ...i18n, langs: on ? i18n.langs.filter((l) => l !== code) : [...i18n.langs, code] })}
                          />
                          {label}
                        </label>
                      );
                    })}
                  </fieldset>
                )}
              </div>
            </div>
          )}
        </Card>

        {(busy || Object.keys(agents).length > 0) && (
          <div className="mt-4 animate-in">
            <CrewProgress agents={agents} plan={plan} />
          </div>
        )}

        {failure && (
          <div role="alert" className="mt-4 rounded-lg border border-danger/30 bg-danger/5 p-4">
            <p className="flex items-center gap-2 text-sm font-medium text-danger">
              <AlertTriangle className="h-4 w-4" aria-hidden="true" /> {failure.message}
            </p>
            {failure.details.length > 0 && (
              <ul className="mt-2 list-disc space-y-1 pl-6 text-[13px] text-muted">
                {failure.details.slice(0, 6).map((d) => <li key={d}>{d}</li>)}
              </ul>
            )}
          </div>
        )}

        <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[13px] text-muted" aria-live="polite">
            {busy ? 'Your crew is working — this usually takes 15–40 seconds.' : 'A planner, engineer, QA reviewer and security analyst build and check every project.'}
          </p>
          <Button type="submit" variant="primary" size="lg" loading={busy} disabled={!prompt.trim() || !!supportError || !!webhookError}>
            {!busy && <Sparkles className="h-4 w-4" aria-hidden="true" />}
            {busy ? 'Generating' : 'Generate extension'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default NewProjectPage;
