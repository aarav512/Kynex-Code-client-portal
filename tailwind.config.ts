import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#0B0D0F',
          900: '#12151A',
          800: '#1B1F26',
          700: '#282D36',
          600: '#3C424D'
        },
        paper: {
          DEFAULT: '#FAFAF8',
          100: '#F3F2EE',
          200: '#E8E6E0'
        },
        line: '#DEDBD3',
        signal: {
          DEFAULT: '#3355FF',
          600: '#2A46E0',
          100: '#E8ECFF'
        },
        moss: {
          DEFAULT: '#4B7A5A',
          100: '#E7F0E9'
        },
        rust: {
          DEFAULT: '#B5502D',
          100: '#F6E7DF'
        },
        amber: {
          DEFAULT: '#B98A1E',
          100: '#F7EEDA'
        }
      },
      fontFamily: {
        display: ['var(--font-display)', 'sans-serif'],
        body: ['var(--font-body)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace']
      },
      borderRadius: {
        sm: '3px',
        DEFAULT: '4px',
        md: '6px',
        lg: '8px'
      },
      boxShadow: {
        none: 'none'
      }
    }
  },
  plugins: []
};

export default config;
