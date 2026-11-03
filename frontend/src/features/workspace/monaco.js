// Loads Monaco from the npm package (no CDN) and wires its language workers.
import { loader } from '@monaco-editor/react';
// Editor core plus only the languages extensions use (keeps the chunk small).
import * as monaco from 'monaco-editor/esm/vs/editor/edcore.main';
import 'monaco-editor/esm/vs/language/json/monaco.contribution';
import 'monaco-editor/esm/vs/language/css/monaco.contribution';
import 'monaco-editor/esm/vs/language/html/monaco.contribution';
import 'monaco-editor/esm/vs/language/typescript/monaco.contribution';
import 'monaco-editor/esm/vs/basic-languages/javascript/javascript.contribution';
import 'monaco-editor/esm/vs/basic-languages/markdown/markdown.contribution';
import 'monaco-editor/esm/vs/basic-languages/xml/xml.contribution';
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import JsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
import CssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker';
import HtmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker';
import TsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';

self.MonacoEnvironment = {
  getWorker(_, label) {
    if (label === 'json') return new JsonWorker();
    if (label === 'css' || label === 'scss' || label === 'less') return new CssWorker();
    if (label === 'html' || label === 'handlebars' || label === 'razor') return new HtmlWorker();
    if (label === 'typescript' || label === 'javascript') return new TsWorker();
    return new EditorWorker();
  },
};

// Minimal Manifest V3 schema for inline diagnostics (the server validator is authoritative).
const MANIFEST_SCHEMA = {
  type: 'object',
  required: ['manifest_version', 'name', 'version'],
  properties: {
    manifest_version: { const: 3, description: 'Must be 3 (Manifest V3).' },
    name: { type: 'string', maxLength: 75 },
    version: { type: 'string', pattern: '^\\d+(\\.\\d+){0,3}$', description: '1–4 dot-separated integers, e.g. "1.0.0".' },
    description: { type: 'string', maxLength: 132 },
    permissions: { type: 'array', items: { type: 'string' }, uniqueItems: true },
    host_permissions: { type: 'array', items: { type: 'string' }, uniqueItems: true },
    background: {
      type: 'object',
      properties: { service_worker: { type: 'string' }, type: { enum: ['module'] } },
      not: { anyOf: [{ required: ['scripts'] }, { required: ['persistent'] }] },
      errorMessage: 'Use "service_worker" in Manifest V3.',
    },
    action: { type: 'object' },
    browser_action: { not: {}, description: 'Manifest V2 only — use "action".' },
    page_action: { not: {}, description: 'Manifest V2 only — use "action".' },
    content_security_policy: { type: 'object', description: 'Must be an object in Manifest V3.' },
    content_scripts: {
      type: 'array',
      items: { type: 'object', required: ['matches'], properties: { matches: { type: 'array', minItems: 1 } } },
    },
  },
};

monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
  validate: true,
  allowComments: false,
  enableSchemaRequest: false,
  schemas: [{ uri: 'inmemory://schemas/chrome-manifest-v3.json', fileMatch: ['manifest.json', '*/manifest.json'], schema: MANIFEST_SCHEMA }],
});

monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
  target: monaco.languages.typescript.ScriptTarget.ES2022,
  allowNonTsExtensions: true,
  checkJs: false,
  lib: ['es2022', 'dom'],
});
// Minimal typings so `chrome.*` autocompletes without errors.
monaco.languages.typescript.javascriptDefaults.addExtraLib(
  'declare const chrome: { [api: string]: any };',
  'inmemory://types/chrome.d.ts'
);

loader.config({ monaco });

export { monaco };
