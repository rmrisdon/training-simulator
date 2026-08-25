/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['IBM Plex Sans', 'system-ui', 'sans-serif'],
        mono: ['IBM Plex Mono', 'ui-monospace', 'monospace'],
      },
      colors: {
        ink: {
          950: '#070b14',
          900: '#0b1220',
          800: '#10192c',
          700: '#162238',
          600: '#1c2c48',
        },
        accent: {
          DEFAULT: '#2dd4bf',
          dim: '#0f766e',
          glow: 'rgba(45, 212, 191, 0.18)',
        },
      },
      boxShadow: {
        panel: '0 0 0 1px rgba(148, 163, 184, 0.08), 0 18px 40px rgba(0, 0, 0, 0.35)',
      },
    },
  },
  plugins: [],
}
