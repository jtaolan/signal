import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: '#ee7012', 500: '#ee7012', 600: '#d4620f' },
      },
    },
  },
  plugins: [],
};

export default config;
