import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, ChevronRight, Download } from 'lucide-react';
import ExtensionAnatomy from '../components/illustrations/ExtensionAnatomy';

// Small, real-looking fragments of the product for the walkthrough strip.
const Fragment = ({ title, children }) => (
  <div className="flex min-w-0 flex-1 flex-col">
    <h3 className="text-[15px] font-semibold">{title}</h3>
    <div className="mt-3 flex-1 rounded-lg border border-rule bg-surface p-3 text-[12.5px] shadow-sm">{children}</div>
  </div>
);

const STAGES = [
  {
    title: 'Describe',
    body: (
      <p className="leading-relaxed text-muted">
        “A popup that lists my open tabs and closes duplicates. Remember the last search.”
      </p>
    ),
  },
  {
    title: 'Validated files',
    body: (
      <ul className="space-y-1 font-mono text-[12px]">
        {['manifest.json', 'popup.html', 'popup.js', 'background.js', 'icon128.png'].map((f) => (
          <li key={f} className="flex items-center gap-2">
            <Check className="h-3.5 w-3.5 text-success" aria-hidden="true" />
            {f}
          </li>
        ))}
      </ul>
    ),
  },
  {
    title: 'Review the change',
    body: (
      <pre className="overflow-hidden font-mono text-[12px] leading-5">
        <span className="block text-danger">- tabs.forEach(close)</span>
        <span className="block text-success">+ if (seen.has(tab.url))</span>
        <span className="block text-success">+   chrome.tabs.remove(tab.id)</span>
      </pre>
    ),
  },
  {
    title: 'Check',
    body: (
      <dl className="space-y-1.5">
        <div className="flex justify-between gap-2"><dt className="text-muted">Permissions</dt><dd>tabs, storage</dd></div>
        <div className="flex justify-between gap-2"><dt className="text-muted">Remote code</dt><dd>none</dd></div>
        <div className="flex justify-between gap-2"><dt className="text-muted">eval, innerHTML</dt><dd>none</dd></div>
      </dl>
    ),
  },
  {
    title: 'Download',
    body: (
      <div className="flex h-full flex-col justify-between gap-3">
        <span className="font-mono text-[12px]">tab-cleaner.zip</span>
        <span className="inline-flex items-center gap-1.5 text-muted">
          <Download className="h-3.5 w-3.5" aria-hidden="true" /> Load unpacked in Chrome
        </span>
      </div>
    ),
  },
];

const LandingPage = () => (
  <>
    <section className="border-b border-rule">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-14 sm:py-20 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <div>
          <h1 className="font-display text-[2.75rem] font-semibold leading-[1.02] tracking-display sm:text-[3.5rem]">
            Describe it.
            <br />
            Ship a Chrome extension.
          </h1>
          <p className="mt-6 max-w-[34rem] text-lg leading-relaxed text-muted">
            Write what the extension should do. Extensio builds a complete Manifest V3 project, checks it, and lets you edit,
            review and download it — no setup.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3">
            <Link
              to="/register"
              className="inline-flex h-11 items-center gap-2 rounded bg-primary px-5 text-[15px] font-medium text-primary-fg shadow-sm hover:bg-primary/90"
            >
              Start building <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link to="/templates" className="text-[15px] font-medium text-fg underline decoration-rule decoration-2 hover:decoration-primary">
              Browse 20 templates
            </Link>
          </div>
        </div>
        <div className="bg-drafting -mx-4 px-2 py-6 sm:mx-0 sm:rounded-lg sm:border sm:border-rule">
          <ExtensionAnatomy className="mx-auto max-w-[640px]" />
        </div>
      </div>
    </section>

    <section aria-labelledby="flow-heading" className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
      <h2 id="flow-heading" className="font-display text-[1.75rem] font-semibold tracking-display">
        From a sentence to a ZIP
      </h2>
      <p className="mt-2 max-w-2xl text-muted">
        Every result is checked before you see it. Changes from the assistant arrive as a diff you approve, and nothing is
        saved until you do.
      </p>
      <ol className="mt-10 grid gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-5">
        {STAGES.map((s, i) => (
          <li key={s.title} className="relative flex">
            <Fragment title={s.title}>{s.body}</Fragment>
            {i < STAGES.length - 1 && (
              <ChevronRight className="absolute -right-3.5 top-[55%] hidden h-4 w-4 text-subtle lg:block" aria-hidden="true" />
            )}
          </li>
        ))}
      </ol>
    </section>

    <section className="border-t border-rule bg-surface-2/50">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-2">
        <div>
          <h2 className="font-display text-[1.375rem] font-semibold tracking-display">What it is honest about</h2>
          <p className="mt-2 max-w-md text-muted">The tool tells you what it checked and what it couldn’t.</p>
        </div>
        <ul className="space-y-4 text-[15px]">
          <li>
            <strong className="font-semibold">The preview is visual.</strong>{' '}
            <span className="text-muted">Chrome APIs are simulated; load the ZIP in Chrome to test real behaviour.</span>
          </li>
          <li>
            <strong className="font-semibold">Security checks are automated.</strong>{' '}
            <span className="text-muted">They catch common problems. They are not a certification or a store approval.</span>
          </li>
          <li>
            <strong className="font-semibold">Your code is yours.</strong>{' '}
            <span className="text-muted">Download it any time; projects stay private unless you share them.</span>
          </li>
        </ul>
      </div>
    </section>
  </>
);

export default LandingPage;
