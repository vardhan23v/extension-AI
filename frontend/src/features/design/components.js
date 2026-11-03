// Accessible, dependency-free snippets that use the --ext-* theme variables.
// `html` is inserted into the popup page; `css` is appended to its stylesheet once.
export const COMPONENTS = [
  {
    id: 'button',
    label: 'Buttons',
    html: '<div class="ext-row">\n  <button type="button" class="ext-btn ext-btn--primary">Save</button>\n  <button type="button" class="ext-btn">Cancel</button>\n</div>',
    css: `.ext-row { display: flex; gap: calc(var(--ext-space) * 0.5); }
.ext-btn { font: inherit; padding: 6px 12px; border-radius: var(--ext-radius); border: 1px solid color-mix(in srgb, var(--ext-text) 30%, transparent); background: var(--ext-surface); color: var(--ext-text); cursor: pointer; }
.ext-btn:hover { filter: brightness(0.97); }
.ext-btn:focus-visible { outline: 2px solid var(--ext-accent); outline-offset: 2px; }
.ext-btn--primary { background: var(--ext-accent); border-color: transparent; color: var(--ext-accent-text); }`,
  },
  {
    id: 'input',
    label: 'Text input',
    html: '<label class="ext-field">\n  <span>Label</span>\n  <input type="text" class="ext-input" placeholder="Type here" />\n</label>',
    css: `.ext-field { display: grid; gap: 4px; font-size: 13px; }
.ext-input { font: inherit; padding: 6px 10px; border-radius: var(--ext-radius); border: 1px solid color-mix(in srgb, var(--ext-text) 30%, transparent); background: var(--ext-bg); color: var(--ext-text); }
.ext-input:focus { outline: 2px solid var(--ext-accent); outline-offset: 1px; }`,
  },
  {
    id: 'toggle',
    label: 'Toggle',
    html: '<label class="ext-toggle">\n  <input type="checkbox" role="switch" />\n  <span>Enable feature</span>\n</label>',
    css: `.ext-toggle { display: flex; align-items: center; gap: 8px; cursor: pointer; }
.ext-toggle input { appearance: none; width: 32px; height: 18px; border-radius: 999px; background: color-mix(in srgb, var(--ext-text) 25%, transparent); position: relative; transition: background 0.15s; margin: 0; }
.ext-toggle input::after { content: ''; position: absolute; top: 2px; left: 2px; width: 14px; height: 14px; border-radius: 50%; background: #fff; transition: transform 0.15s; }
.ext-toggle input:checked { background: var(--ext-accent); }
.ext-toggle input:checked::after { transform: translateX(14px); }
.ext-toggle input:focus-visible { outline: 2px solid var(--ext-accent); outline-offset: 2px; }`,
  },
  {
    id: 'card',
    label: 'Card',
    html: '<section class="ext-card">\n  <h2 class="ext-card__title">Title</h2>\n  <p class="ext-card__body">Supporting text.</p>\n</section>',
    css: `.ext-card { background: var(--ext-surface); border-radius: var(--ext-radius); padding: var(--ext-space); }
.ext-card__title { margin: 0 0 4px; font-size: 15px; }
.ext-card__body { margin: 0; color: var(--ext-muted); font-size: 13px; }`,
  },
  {
    id: 'list',
    label: 'List',
    html: '<ul class="ext-list">\n  <li>First item</li>\n  <li>Second item</li>\n  <li>Third item</li>\n</ul>',
    css: `.ext-list { list-style: none; margin: 0; padding: 0; }
.ext-list li { padding: 8px 0; border-bottom: 1px solid color-mix(in srgb, var(--ext-text) 12%, transparent); font-size: 13px; }
.ext-list li:last-child { border-bottom: 0; }`,
  },
  {
    id: 'status',
    label: 'Status message',
    html: '<p class="ext-status" role="status">Saved</p>',
    css: `.ext-status { margin: 0; padding: 6px 10px; border-radius: var(--ext-radius); background: color-mix(in srgb, var(--ext-accent) 14%, transparent); color: var(--ext-text); font-size: 13px; }`,
  },
];

// Returns updated { html, css } with the component inserted (before the first
// <script> in <body>, or before </body>) and its CSS appended once.
export const insertComponent = (html, css, comp) => {
  const snippet = `\n  ${comp.html.replace(/\n/g, '\n  ')}\n`;
  // Only look for scripts inside <body>, never in <head>.
  const bodyOpen = html.match(/<body\b[^>]*>/i);
  const bodyStart = bodyOpen ? bodyOpen.index + bodyOpen[0].length : 0;
  const rel = html.slice(bodyStart).search(/<script\b/i);
  const close = html.search(/<\/body>/i);
  const at = rel !== -1 ? bodyStart + rel : close !== -1 ? close : html.length;
  const nextHtml = html.slice(0, at) + snippet + html.slice(at);
  const marker = `/* extensio:component ${comp.id} */`;
  const nextCss = css.includes(marker) ? css : `${css.trimEnd()}\n\n${marker}\n${comp.css}\n`;
  return { html: nextHtml, css: nextCss };
};
