// Theme block kept at the top of the popup stylesheet. Plain CSS variables so
// the generated extension needs no build step and no remote fonts (MV3).
export const START = '/* extensio:theme — edited by the Design tab */';
export const END = '/* /extensio:theme */';

export const FONTS = {
  system: { label: 'System UI', stack: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" },
  humanist: { label: 'Humanist', stack: "'Seravek', 'Gill Sans Nova', Ubuntu, Calibri, 'DejaVu Sans', sans-serif" },
  rounded: { label: 'Rounded', stack: "ui-rounded, 'Hiragino Maru Gothic ProN', Quicksand, Comfortaa, sans-serif" },
  serif: { label: 'Serif', stack: "Charter, 'Bitstream Charter', 'Sitka Text', Cambria, serif" },
  mono: { label: 'Monospace', stack: "ui-monospace, 'Cascadia Code', Menlo, Consolas, monospace" },
};

export const DEFAULT_THEME = {
  light: { bg: '#ffffff', surface: '#f4f4f5', text: '#18181b', muted: '#52525b', accent: '#2563eb', accentText: '#ffffff' },
  dark: { bg: '#18181b', surface: '#27272a', text: '#f4f4f5', muted: '#a1a1aa', accent: '#60a5fa', accentText: '#0b0b0d' },
  font: 'system',
  radius: 8,
  space: 12,
  width: 340,
  darkMode: true,
};

const varsOf = (c) =>
  `  --ext-bg: ${c.bg};\n  --ext-surface: ${c.surface};\n  --ext-text: ${c.text};\n  --ext-muted: ${c.muted};\n  --ext-accent: ${c.accent};\n  --ext-accent-text: ${c.accentText};`;

export const buildBlock = (t) =>
  [
    START,
    ':root {',
    varsOf(t.light),
    `  --ext-font: ${FONTS[t.font]?.stack || FONTS.system.stack};`,
    `  --ext-radius: ${t.radius}px;`,
    `  --ext-space: ${t.space}px;`,
    `  --ext-width: ${t.width}px;`,
    '}',
    ...(t.darkMode ? ['@media (prefers-color-scheme: dark) {', '  :root {', varsOf(t.dark).replace(/^ {2}/gm, '    '), '  }', '}'] : []),
    'body {',
    '  width: var(--ext-width);',
    '  margin: 0;',
    '  padding: var(--ext-space);',
    '  background: var(--ext-bg);',
    '  color: var(--ext-text);',
    '  font-family: var(--ext-font);',
    '}',
    END,
  ].join('\n');

const BLOCK_RE = /\/\* extensio:theme[\s\S]*?\/\* \/extensio:theme \*\/\n*/;

export const hasBlock = (css) => BLOCK_RE.test(css);

export const writeBlock = (css, theme) => {
  const block = `${buildBlock(theme)}\n\n`;
  return hasBlock(css) ? css.replace(BLOCK_RE, block) : block + css;
};

// Reads values back from an existing block (best effort).
export const readTheme = (css) => {
  const m = css.match(BLOCK_RE);
  if (!m) return null;
  const block = m[0];
  const [lightPart, darkPart = ''] = block.split('@media (prefers-color-scheme: dark)');
  const get = (src, name) => src.match(new RegExp(`--ext-${name}:\\s*([^;]+);`))?.[1].trim();
  const colors = (src, fallback) => ({
    bg: get(src, 'bg') || fallback.bg,
    surface: get(src, 'surface') || fallback.surface,
    text: get(src, 'text') || fallback.text,
    muted: get(src, 'muted') || fallback.muted,
    accent: get(src, 'accent') || fallback.accent,
    accentText: get(src, 'accent-text') || fallback.accentText,
  });
  const font = Object.entries(FONTS).find(([, f]) => f.stack === get(lightPart, 'font'))?.[0] || 'system';
  return {
    light: colors(lightPart, DEFAULT_THEME.light),
    dark: colors(darkPart, DEFAULT_THEME.dark),
    font,
    radius: parseInt(get(lightPart, 'radius'), 10) || DEFAULT_THEME.radius,
    space: parseInt(get(lightPart, 'space'), 10) || DEFAULT_THEME.space,
    width: parseInt(get(lightPart, 'width'), 10) || DEFAULT_THEME.width,
    darkMode: Boolean(darkPart),
  };
};

// WCAG contrast ratio between two #rrggbb colours.
export const contrast = (a, b) => {
  const lum = (hex) => {
    const n = hex.replace('#', '');
    if (!/^[0-9a-f]{6}$/i.test(n)) return null;
    const [r, g, bl] = [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [x, y] = [lum(a), lum(b)];
  if (x === null || y === null) return null;
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};
