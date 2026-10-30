/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#409EFF',
          light: '#79BBFF',
        },
        success: '#67C23A',
        danger: '#F56C6C',
        warning: '#E6A23C',
        bg: 'var(--color-bg)',
        card: 'var(--color-card)',
        'text-main': 'var(--color-text)',
        'text-sub': 'var(--color-text-sub)',
        border: 'var(--color-border)',
      },
      borderRadius: {
        xl2: '1rem',
      },
      boxShadow: {
        card: '0 1px 2px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 3px 10px rgba(0, 0, 0, 0.08)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.35s ease-out both',
      },
    },
  },
  plugins: [],
};