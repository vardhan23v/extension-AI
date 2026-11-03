import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import { CheckCircle2, Circle, Download, Hand, Image as ImageIcon, Sparkles } from 'lucide-react';
import { projectsApi, saveBlob, errorMessage } from '../../lib/api';
import { Button, ErrorState, Field, Input, Select, Spinner, Textarea, cx } from '../../components/ui';

const CATEGORIES = [
  'Accessibility', 'Art & Design', 'Communication', 'Developer Tools', 'Education', 'Entertainment', 'Functionality & UI', 'Games',
  'Household', 'Just for Fun', 'News & Weather', 'Privacy & Security', 'Shopping', 'Social Networking', 'Tools', 'Travel',
  'Well-being', 'Workflow & Planning',
];

const EMPTY_KIT = { shortDescription: '', longDescription: '', category: 'Tools', singlePurpose: '', permissionJustifications: {}, privacyPolicy: '' };

const StatusIcon = ({ status }) =>
  status === 'pass' ? (
    <CheckCircle2 className="h-4 w-4 shrink-0 text-success" aria-label="Done" />
  ) : status === 'manual' ? (
    <Hand className="h-4 w-4 shrink-0 text-info" aria-label="Manual step" />
  ) : (
    <Circle className="h-4 w-4 shrink-0 text-warning" aria-label="To do" />
  );

const iconDataUrl = (files) => {
  const m = (() => {
    try {
      return JSON.parse(files.find((f) => f.filename === 'manifest.json')?.content || '{}');
    } catch {
      return {};
    }
  })();
  const name = m.icons?.['128'] || m.icons?.['48'];
  const f = files.find((x) => x.filename === name && x.encoding === 'base64');
  return f ? `data:image/png;base64,${f.content}` : null;
};

// 440×280 promotional tile drawn on a canvas from the project icon and listing.
const PromoTile = ({ title, tagline, icon }) => {
  const canvas = useRef(null);
  useEffect(() => {
    const c = canvas.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    const draw = (img) => {
      ctx.fillStyle = '#F5F3EE';
      ctx.fillRect(0, 0, 440, 280);
      ctx.strokeStyle = 'rgba(28,26,22,0.06)';
      for (let x = 0; x <= 440; x += 20) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 280); ctx.stroke(); }
      for (let y = 0; y <= 280; y += 20) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(440, y); ctx.stroke(); }
      if (img) ctx.drawImage(img, 32, 40, 72, 72);
      ctx.fillStyle = '#1C1A16';
      ctx.font = '600 30px "Bricolage Grotesque Variable", system-ui, sans-serif';
      const words = (title || 'Extension').split(' ');
      let line = '';
      let y = 160;
      for (const w of words) {
        if (ctx.measureText(`${line}${w} `).width > 376 && line) { ctx.fillText(line.trim(), 32, y); line = ''; y += 34; }
        line += `${w} `;
      }
      ctx.fillText(line.trim(), 32, y);
      ctx.fillStyle = '#5E5A51';
      ctx.font = '400 15px "Geist Variable", system-ui, sans-serif';
      ctx.fillText((tagline || '').slice(0, 52), 32, Math.min(y + 30, 256));
      ctx.fillStyle = '#C2410C';
      ctx.fillRect(32, 254, 40, 4);
    };
    if (icon) {
      const img = new Image();
      img.onload = () => draw(img);
      img.src = icon;
    } else draw(null);
  }, [title, tagline, icon]);
  return (
    <div>
      <canvas ref={canvas} width={440} height={280} className="w-full max-w-[440px] rounded border border-rule" role="img" aria-label={`Promotional tile for ${title}`} />
      <Button size="sm" className="mt-2" onClick={() => canvas.current.toBlob((b) => saveBlob(b, 'promo-tile-440x280.png'))}>
        <ImageIcon className="h-3.5 w-3.5" aria-hidden="true" /> Download tile (440×280)
      </Button>
    </div>
  );
};

export const PublishPanel = ({ project, files, beforeAction }) => {
  const [state, setState] = useState({ loading: true, error: null });
  const [checklist, setChecklist] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [kit, setKit] = useState(EMPTY_KIT);
  const [busy, setBusy] = useState(null);

  const load = async () => {
    setState({ loading: true, error: null });
    try {
      await beforeAction();
      const r = await projectsApi.publishing(project.id);
      setChecklist(r.checklist);
      setPermissions(r.permissions);
      setKit({ ...EMPTY_KIT, ...(r.kit || {}) });
      setState({ loading: false, error: null });
    } catch (e) {
      setState({ loading: false, error: e });
    }
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [project.id]);

  const run = async (name, fn) => {
    setBusy(name);
    try {
      await fn();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(null);
    }
  };

  const draft = () =>
    run('draft', async () => {
      await beforeAction();
      const r = await projectsApi.draftStoreKit(project.id);
      setKit({ ...EMPTY_KIT, ...r.kit });
      setChecklist(r.checklist);
      toast.success('Store kit drafted — review and edit before submitting');
    });

  const save = () =>
    run('save', async () => {
      const r = await projectsApi.saveStoreKit(project.id, kit);
      setChecklist(r.checklist);
      toast.success('Store kit saved');
    });

  if (state.loading) return <div className="p-3"><Spinner label="Checking store readiness" /></div>;
  if (state.error) return <ErrorState message={errorMessage(state.error)} onRetry={load} />;

  const todo = checklist.items.filter((i) => i.status === 'todo').length;
  const icon = iconDataUrl(files);
  const set = (k) => (e) => setKit({ ...kit, [k]: e.target.value });

  return (
    <div className="h-full space-y-6 overflow-y-auto p-3">
      <section aria-labelledby="ready-h">
        <div className="flex items-baseline justify-between gap-2">
          <h3 id="ready-h" className="text-sm font-semibold">Store readiness</h3>
          <span className={cx('text-[12px]', todo ? 'text-warning' : 'text-success')}>{todo ? `${todo} to do` : 'Ready for manual steps'}</span>
        </div>
        <ul className="mt-2 divide-y divide-rule rounded-lg border border-rule bg-surface">
          {checklist.items.map((i, n) => (
            <li key={i.id} className="stagger-item flex gap-2.5 px-3 py-2" style={{ animationDelay: `${Math.min(n, 8) * 30}ms` }}>
              <StatusIcon status={i.status} />
              <div className="min-w-0">
                <p className="text-[13px]">{i.title}</p>
                <p className="text-[12px] text-muted">{i.detail}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="kit-h" className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h3 id="kit-h" className="text-sm font-semibold">Store listing</h3>
          <Button size="sm" onClick={draft} loading={busy === 'draft'}>
            {busy !== 'draft' && <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />} {kit.longDescription ? 'Redraft with AI' : 'Draft with AI'}
          </Button>
        </div>
        <Field label="Short description" hint={`${kit.shortDescription.length}/132`}>
          <Input value={kit.shortDescription} maxLength={132} onChange={set('shortDescription')} />
        </Field>
        <Field label="Category">
          <Select value={kit.category} onChange={set('category')}>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </Select>
        </Field>
        <Field label="Description">
          <Textarea rows={6} value={kit.longDescription} onChange={set('longDescription')} />
        </Field>
        <Field label="Single purpose" hint="One sentence describing the extension’s single purpose.">
          <Input value={kit.singlePurpose} onChange={set('singlePurpose')} />
        </Field>
        {permissions.length > 0 && (
          <fieldset className="space-y-2">
            <legend className="text-[13px] font-medium">Permission justifications</legend>
            {permissions.map((p) => (
              <Field key={p} label={<span className="font-mono text-[12px]">{p}</span>}>
                <Input
                  value={kit.permissionJustifications?.[p] || ''}
                  onChange={(e) => setKit({ ...kit, permissionJustifications: { ...kit.permissionJustifications, [p]: e.target.value } })}
                />
              </Field>
            ))}
          </fieldset>
        )}
        <Field label="Privacy policy (Markdown)" hint={checklist.collectsData ? 'Required: the code sends or reads user data.' : 'Recommended even when no data is collected.'}>
          <Textarea rows={6} className="font-mono text-[12px]" value={kit.privacyPolicy} onChange={set('privacyPolicy')} />
        </Field>
        <Button variant="primary" onClick={save} loading={busy === 'save'} disabled={!kit.longDescription.trim()}>
          Save listing
        </Button>
      </section>

      <section aria-labelledby="assets-h" className="space-y-2">
        <h3 id="assets-h" className="text-sm font-semibold">Assets</h3>
        <PromoTile title={project.title} tagline={kit.shortDescription} icon={icon} />
        {icon && (
          <a href={icon} download="icon-128.png" className="inline-flex items-center gap-1.5 text-[13px] text-primary underline decoration-rule underline-offset-4 hover:decoration-primary">
            Download 128×128 icon
          </a>
        )}
        <p className="text-[12px] text-muted">Screenshots: 1280×800 or 640×400. Capture the popup in Chrome, or use the Testing Lab once it is available.</p>
      </section>

      <section className="space-y-2 border-t border-rule pt-4">
        <Button
          variant="primary"
          disabled={!checklist.items.find((i) => i.id === 'listing' && i.status === 'pass')}
          loading={busy === 'package'}
          onClick={() => run('package', async () => { await beforeAction(); await projectsApi.downloadStorePackage(project.id, project.title); })}
        >
          {busy !== 'package' && <Download className="h-4 w-4" aria-hidden="true" />} Download store package
        </Button>
        <p className="text-[12px] text-muted">
          Includes the extension, the listing and the privacy policy. You still submit it yourself in the Chrome Web Store developer dashboard;
          approval is decided by Google and is not guaranteed.
        </p>
      </section>
    </div>
  );
};
