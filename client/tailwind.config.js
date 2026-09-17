/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        grim: {
          950: '#07080a',
          900: '#0c0e12',
          850: '#11141b',
          800: '#161a24',
          750: '#1e2330',
          700: '#272d3e',
          600: '#384056',
          500: '#525d7b',
          400: '#7582a4',
          300: '#a3adcb',
          200: '#cdd3e5',
          100: '#eef1f8',
        },
        gothic: {
          gold: '#cba338',
          goldLight: '#f1cc64',
          goldDark: '#856417',
          crimson: '#9b1c1c',
          crimsonBright: '#dc2626',
          crimsonDark: '#5f0f0f',
          bone: '#dfd7c2',
          parchment: '#f0e6d2',
          iron: '#474d5b',
          rust: '#994d23',
          warp: '#7e3af2',
          warpLight: '#a855f7'
        }
      },
      fontFamily: {
        gothic: ['Cinzel', 'Trajan Pro', 'Georgia', 'serif'],
        tech: ['Share Tech Mono', 'Courier New', 'monospace'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'grim': '0 4px 20px -2px rgba(0, 0, 0, 0.8), 0 0 15px -3px rgba(203, 163, 56, 0.15)',
        'wrath': '0 0 25px 5px rgba(220, 38, 38, 0.4)',
        'glory': '0 0 25px 5px rgba(203, 163, 56, 0.45)',
        'ruin': '0 0 25px 5px rgba(126, 58, 242, 0.45)',
      }
    },
  },
  plugins: [],
}
