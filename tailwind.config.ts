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
        'sol-purple': { DEFAULT: '#9945FF', light: '#B47BFF', dim: '#7B47FF' },
        'sol-green': { DEFAULT: '#14F195', bright: '#00FFBD', muted: '#44EBA6' },
        'sol-teal': '#80ECFF',
        'sol-pink': '#EB54BB',
        'sol-blue': '#64A8F2',
        'sol-orange': '#F99C00',
        'sol-dark': {
          DEFAULT: '#0B0A10',
          surface: '#131218',
          raised: '#1A1925',
          100: '#232323',
        },
        'sol-gray': {
          DEFAULT: '#ABABBC',
          light: '#f0f0f4',
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
