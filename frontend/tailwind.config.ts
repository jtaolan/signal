import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: { 500: '#667eea', 600: '#5a67d8' },
      },
    },
  },
  plugins: [],
};

export default config;
