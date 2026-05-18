import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        background: {
          DEFAULT: '#ffffff',
          secondary: '#f8f8f8',
          tertiary: '#f2f2f2',
        },
        border: {
          DEFAULT: '#e5e5e5',
          secondary: '#d4d4d4',
        },
        text: {
          primary: '#111111',
          secondary: '#444444',
          muted: '#777777',
          disabled: '#aaaaaa',
        },
        success: { DEFAULT: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
        warning: { DEFAULT: '#b45309', bg: '#fffbeb', border: '#fde68a' },
        danger: { DEFAULT: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
      },
      borderRadius: {
        sm: '6px',
        DEFAULT: '8px',
        md: '10px',
        lg: '12px',
        xl: '14px',
        '2xl': '16px',
      },
      boxShadow: {
        sm: '0 1px 2px rgba(0,0,0,0.04)',
        DEFAULT: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        md: '0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)',
        lg: '0 8px 24px rgba(0,0,0,0.12), 0 4px 8px rgba(0,0,0,0.06)',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'slide-up': { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        'slide-in': { from: { opacity: '0', transform: 'translateX(-8px)' }, to: { opacity: '1', transform: 'translateX(0)' } },
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease',
        'slide-up': 'slide-up 0.2s ease',
        'slide-in': 'slide-in 0.2s ease',
      },
    },
  },
  plugins: [],
}

export default config
