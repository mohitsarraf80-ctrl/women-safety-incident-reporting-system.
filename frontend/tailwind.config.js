/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          50: '#f5f7fa',
          100: '#e9edf3',
          600: '#334155',
          700: '#1e293b',
          800: '#131c2b',
          900: '#0b1220',
          950: '#070c16',
        },
        brand: {
          50: '#eef1ff',
          100: '#e0e5ff',
          200: '#c7cfff',
          300: '#a5b0fe',
          400: '#8189fb',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
        accent: {
          50: '#ecfdf5',
          100: '#d1fae5',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(15 23 42 / 0.04), 0 1px 3px 0 rgb(15 23 42 / 0.06)',
        lift: '0 10px 30px -12px rgb(15 23 42 / 0.25)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-ring': {
          '0%': { boxShadow: '0 0 0 0 rgb(239 68 68 / 0.45)' },
          '70%': { boxShadow: '0 0 0 18px rgb(239 68 68 / 0)' },
          '100%': { boxShadow: '0 0 0 0 rgb(239 68 68 / 0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 200ms ease-out',
        'pulse-ring': 'pulse-ring 2s infinite',
      },
    },
  },
  plugins: [],
};
