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

// Workbench editor themes (see DESIGN.md): paper/ink with the signal-orange accent.
monaco.editor.defineTheme('workbench-light', {
  base: 'vs',
  inherit: true,
  rules: [
    { token: 'comment', foreground: '8F897D', fontStyle: 'italic' },
    { token: 'keyword', foreground: 'B8410E' },
    { token: 'string', foreground: '2F6B3A' },
    { token: 'number', foreground: '8A4B0F' },
    { token: 'type', foreground: '35517A' },
    { token: 'delimiter', foreground: '5E5A51' },
    { token: 'tag', foreground: 'B8410E' },
    { token: 'attribute.name', foreground: '35517A' },
    { token: 'attribute.value', foreground: '2F6B3A' },
    { token: 'string.key.json', foreground: '35517A' },
    { token: 'string.value.json', foreground: '2F6B3A' },
  ],
  colors: {
    'editor.background': '#FFFFFF',
    'editor.foreground': '#1C1A16',
    'editorLineNumber.foreground': '#B4AFA3',
    'editorLineNumber.activeForeground': '#1C1A16',
    'editor.lineHighlightBackground': '#F5F3EE',
    'editor.selectionBackground': '#C2410C33',
    'editor.inactiveSelectionBackground': '#C2410C1A',
    'editorCursor.foreground': '#C2410C',
    'editorIndentGuide.background1': '#ECE9E1',
    'editorWhitespace.foreground': '#DAD5CA',
    'editorGutter.background': '#FFFFFF',
    'diffEditor.insertedTextBackground': '#15803D1F',
    'diffEditor.removedTextBackground': '#B423181F',
    'scrollbarSlider.background': '#8F897D40',
    'scrollbarSlider.hoverBackground': '#8F897D70',
  },
});

monaco.editor.defineTheme('workbench-dark', {
  base: 'vs-dark',
  inherit: true,
  rules: [
    { token: 'comment', foreground: '8A857A', fontStyle: 'italic' },
    { token: 'keyword', foreground: 'FF8A5B' },
    { token: 'string', foreground: '9BD58A' },
    { token: 'number', foreground: 'F2B36A' },
    { token: 'type', foreground: '9DB8E0' },
    { token: 'delimiter', foreground: 'A39E92' },
    { token: 'tag', foreground: 'FF8A5B' },
    { token: 'attribute.name', foreground: '9DB8E0' },
    { token: 'attribute.value', foreground: '9BD58A' },
    { token: 'string.key.json', foreground: '9DB8E0' },
    { token: 'string.value.json', foreground: '9BD58A' },
  ],
  colors: {
    'editor.background': '#1B1A16',
    'editor.foreground': '#ECE9E1',
    'editorLineNumber.foreground': '#5A564D',
    'editorLineNumber.activeForeground': '#ECE9E1',
    'editor.lineHighlightBackground': '#24221D',
    'editor.selectionBackground': '#FF7A4540',
    'editor.inactiveSelectionBackground': '#FF7A4522',
    'editorCursor.foreground': '#FF7A45',
    'editorIndentGuide.background1': '#2E2B25',
    'editorWhitespace.foreground': '#2E2B25',
    'editorGutter.background': '#1B1A16',
    'diffEditor.insertedTextBackground': '#4ADE8024',
    'diffEditor.removedTextBackground': '#F8717124',
    'scrollbarSlider.background': '#75706640',
    'scrollbarSlider.hoverBackground': '#75706670',
  },
});

loader.config({ monaco });

export { monaco };
