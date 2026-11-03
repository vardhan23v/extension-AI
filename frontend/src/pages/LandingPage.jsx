import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, FileCheck2, MessageSquare, Code2, ShieldCheck, History, Download } from 'lucide-react';

const FEATURES = [
  { icon: MessageSquare, title: 'Describe it, get a project', body: 'Write what the extension should do. The AI generates a complete Manifest V3 project — manifest, popup, scripts and icons.' },
  { icon: FileCheck2, title: 'Validated before you see it', body: 'Every result is checked for MV3 structure, missing files, remote code, inline scripts and JavaScript syntax errors.' },
  { icon: Code2, title: 'Edit like a developer', body: 'A real code editor with a file tree, tabs, search and autosave — or ask the assistant to make changes and review the diff first.' },
  { icon: ShieldCheck, title: 'Security checks', body: 'Deterministic checks for broad permissions, eval, unsafe DOM use and exposed keys, with plain-language explanations.' },
  { icon: History, title: 'Version history', body: 'A snapshot is taken before every AI change, so you can restore any earlier version.' },
  { icon: Download, title: 'Download and load', body: 'Export a ZIP and load it in chrome://extensions with “Load unpacked”.' },
];

const STEPS = [
  ['Describe', 'Explain the extension in plain English, or start from a template.'],
  ['Review', 'Browse the files, preview the popup and read the validation results.'],
  ['Refine', 'Edit the code directly or ask the assistant for changes.'],
  ['Export', 'Run the security checks and download the ZIP.'],
];

const LandingPage = () => (
  <>
    <section className="mx-auto max-w-6xl px-4 pt-16 pb-14 sm:pt-24">
      <div className="max-w-2xl">
        <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-[12px] text-muted">
          Chrome extensions · Manifest V3
        </p>
        <h1 className="text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl">Build Chrome extensions by describing them.</h1>
        <p className="mt-5 text-lg leading-relaxed text-muted">
          Extensio AI turns a plain-English idea into a working extension project you can edit, check and download — no setup needed.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/register" className="inline-flex h-11 items-center gap-2 rounded bg-primary px-5 text-[15px] font-medium text-primary-fg hover:bg-primary/90">
            Start building <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <Link to="/templates" className="inline-flex h-11 items-center rounded border border-border px-5 text-[15px] font-medium hover:bg-surface-2">
            Browse templates
          </Link>
        </div>
      </div>

      <div className="mt-14 overflow-hidden rounded-xl border border-border bg-surface" aria-hidden="true">
        <div className="flex items-center gap-1.5 border-b border-border px-4 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-border-strong" />
          <span className="h-2.5 w-2.5 rounded-full bg-border-strong" />
          <span className="h-2.5 w-2.5 rounded-full bg-border-strong" />
          <span className="ml-3 font-mono text-[12px] text-subtle">tab-cleaner / popup.js</span>
        </div>
        <div className="grid sm:grid-cols-[180px_1fr_260px] text-[13px]">
          <div className="hidden sm:block border-r border-border p-3 font-mono text-muted space-y-1.5">
            <div>manifest.json</div>
            <div className="text-fg">popup.js</div>
            <div>popup.html</div>
            <div>popup.css</div>
            <div>icon128.png</div>
          </div>
          <pre className="overflow-x-auto p-4 font-mono leading-6 text-muted">
            <code>
              <span className="text-primary">const</span> tabs = <span className="text-primary">await</span> chrome.tabs.query({'{'} currentWindow: <span className="text-primary">true</span> {'}'});{'\n'}
              <span className="text-primary">const</span> seen = <span className="text-primary">new</span> Set();{'\n'}
              <span className="text-primary">for</span> (<span className="text-primary">const</span> tab <span className="text-primary">of</span> tabs) {'{'}{'\n'}
              {'  '}<span className="text-primary">if</span> (seen.has(tab.url)) chrome.tabs.remove(tab.id);{'\n'}
              {'  '}seen.add(tab.url);{'\n'}
              {'}'}
            </code>
          </pre>
          <div className="hidden sm:block border-l border-border p-4 space-y-3">
            <div className="rounded-lg bg-surface-2 px-3 py-2 text-fg">Also close duplicate tabs in other windows</div>
            <div className="rounded-lg border border-border px-3 py-2 text-muted">Updated popup.js — 1 file changed. Review the diff before applying.</div>
          </div>
        </div>
      </div>
    </section>

    <section className="border-t border-border bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-2xl font-semibold tracking-tight">What you get</h2>
        <div className="mt-8 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title}>
              <f.icon className="h-5 w-5 text-primary" aria-hidden="true" />
              <h3 className="mt-3 text-[15px] font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{f.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    <section className="mx-auto max-w-6xl px-4 py-16">
      <h2 className="text-2xl font-semibold tracking-tight">How it works</h2>
      <ol className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map(([title, body], i) => (
          <li key={title} className="border-t border-border pt-4">
            <span className="font-mono text-[12px] text-subtle">0{i + 1}</span>
            <h3 className="mt-1 font-semibold">{title}</h3>
            <p className="mt-1 text-sm text-muted">{body}</p>
          </li>
        ))}
      </ol>
      <p className="mt-10 max-w-2xl text-[13px] text-muted">
        The in-app preview is a visual mock with simulated Chrome APIs. Always load the downloaded extension in Chrome to test real
        behavior. Security checks are automated and are not a certification.
      </p>
    </section>
  </>
);

export default LandingPage;
