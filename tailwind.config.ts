import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'sol-purple': '#9945FF',
        'sol-green': '#14F195',
        'sol-dark': {
          DEFAULT: '#0B0A10',
          100: '#232323',
          200: '#1A1A2E',
          300: '#151118',
          400: '#121212',
        },
        'sol-gray': {
          DEFAULT: '#9D9DAE',
          light: '#f9f9fb',
          muted: '#9D9DAE',
          dim: '#848895',
        },
        'border-low': 'rgba(255,255,255,0.08)',
        'border-medium': 'rgba(255,255,255,0.15)',
        'border-strong': 'rgba(255,255,255,0.25)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
};
export default config;
