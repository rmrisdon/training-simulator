/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Nunito Sans', 'IBM Plex Sans', 'system-ui', 'sans-serif'],
        mono: ['IBM Plex Mono', 'ui-monospace', 'monospace'],
      },
      colors: {
        ink: {
          950: '#0b1210',
          900: '#121a16',
          800: '#18241e',
          700: '#20322a',
          600: '#2a4036',
        },
        lime: {
          DEFAULT: '#8dc63f',
          bright: '#c5e86c',
          dim: '#5f8a28',
        },
        snagit: {
          DEFAULT: '#f15a24',
          soft: '#ff8a5b',
        },
        camtasia: {
          DEFAULT: '#1aa39a',
          soft: '#5ed0c8',
        },
        audiate: {
          DEFAULT: '#8b6cff',
          soft: '#b9a6ff',
        },
        screencast: {
          DEFAULT: '#3b9bff',
          soft: '#8cc4ff',
        },
        accent: {
          DEFAULT: '#8dc63f',
          dim: '#5f8a28',
          glow: 'rgba(141, 198, 63, 0.22)',
        },
      },
      boxShadow: {
        card: '0 1px 2px rgba(16, 24, 40, 0.05), 0 1px 3px rgba(16, 24, 40, 0.08)',
        'card-hover': '0 4px 12px rgba(16, 24, 40, 0.08)',
        pop: '0 16px 40px rgba(16, 24, 40, 0.14)',
      },
    },
  },
  plugins: [],
}
