/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        'purple-main': '#7C3AED',
        'blue-main': '#2563EB',
        'glass': 'rgba(255, 255, 255, 0.05)',
        'glass-border': 'rgba(255, 255, 255, 0.1)',
        'emerald-accent': '#34D399',
        'amber-accent': '#FBBF24',
        'rose-accent': '#FB7185',
      },
      backgroundImage: {
        'gradient-main': 'linear-gradient(135deg, #7C3AED 0%, #2563EB 100%)',
        'gradient-glass': 'linear-gradient(180deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%)',
      },
      backdropBlur: {
        'xs': '2px',
      },
      animation: {
        'spotlight': 'spotlight 2s ease-in-out infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'stepper-line': 'stepper-line 0.5s ease-out forwards',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        spotlight: {
          '0%, 100%': { opacity: '0.5' },
          '50%': { opacity: '1' },
        },
        'stepper-line': {
          '0%': { width: '0%' },
          '100%': { width: '100%' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
};
