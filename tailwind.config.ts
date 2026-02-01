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
        'sol-green-bright': '#00FFBD',
        'sol-pink': '#D884F0',
        'sol-teal': '#80ECFF',
        'sol-blue': '#64A8F2',
        'sol-dark': {
          DEFAULT: '#0B0A10',
          100: '#232323',
          200: '#1A1A2E',
          300: '#151118',
          400: '#121212',
        },
        'sol-gray': {
          DEFAULT: '#ABABBC',
          light: '#f9f9fb',
          muted: '#9D9DAE',
          dim: '#848895',
        },
        // Keep old names mapped to new values for compat
        'solana-purple': '#9945FF',
        'solana-green': '#14F195',
        'dark-bg': '#0B0A10',
        'dark-card': '#151118',
        'dark-border': '#232323',
        'dark-hover': '#1A1A2E',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      backgroundImage: {
        'sol-gradient': 'linear-gradient(135deg, #9945FF, #14F195)',
        'sol-gradient-r': 'linear-gradient(to right, #9945FF, #14F195)',
        'sol-gradient-subtle': 'linear-gradient(135deg, rgba(153, 69, 255, 0.15), rgba(20, 241, 149, 0.08))',
        'sol-btn': 'linear-gradient(135deg, #9945FF, #7B47FF)',
      },
      borderColor: {
        'sol-subtle': 'rgba(153, 69, 255, 0.1)',
      },
      boxShadow: {
        'sol-glow': '0 0 20px rgba(153, 69, 255, 0.15)',
        'sol-glow-green': '0 0 20px rgba(20, 241, 149, 0.15)',
      },
    },
  },
  plugins: [],
};
export default config;
