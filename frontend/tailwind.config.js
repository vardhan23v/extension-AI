/** @type {import('tailwindcss').Config} */
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`;

// Workbench design tokens — see DESIGN.md.
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: token('bg'),
        surface: token('surface'),
        'surface-2': token('surface-2'),
        rule: token('rule'),
        control: token('control'),
        // `border` kept as an alias of `rule` so existing classes keep working.
        border: token('rule'),
        'border-strong': token('control'),
        fg: token('fg'),
        muted: token('muted'),
        subtle: token('subtle'),
        primary: token('primary'),
        'primary-fg': token('primary-fg'),
        'primary-soft': token('primary-soft'),
        success: token('success'),
        warning: token('warning'),
        danger: token('danger'),
        info: token('info'),
      },
      fontFamily: {
        display: ['"Bricolage Grotesque Variable"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['"Geist Variable"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono Variable"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '6px',
        lg: '10px',
      },
      boxShadow: {
        sm: '0 1px 2px rgb(28 26 22 / 0.06)',
        DEFAULT: '0 1px 2px rgb(28 26 22 / 0.06), 0 4px 12px -6px rgb(28 26 22 / 0.10)',
        lg: '0 1px 2px rgb(28 26 22 / 0.08), 0 12px 32px -16px rgb(28 26 22 / 0.28)',
      },
      letterSpacing: {
        display: '-0.03em',
      },
      transitionDuration: {
        fast: '120ms',
        DEFAULT: '200ms',
        slow: '320ms',
      },
      transitionTimingFunction: {
        out: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
};
