/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        'purple-main': '#7C3AED',
        'blue-main': '#2563EB',
      },
      backgroundImage: {
        'gradient-main': 'linear-gradient(135deg, #7C3AED 0%, #2563EB 100%)',
      },
    },
  },
  plugins: [],
};
