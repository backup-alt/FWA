/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#0a0a1a',
          800: '#111122',
          700: '#1a1a33',
        },
        neon: {
          green: '#00ff00',
          gold: '#ffd700',
        }
      },
      fontFamily: {
        sans: ['Montserrat', 'system-ui', 'sans-serif'],
      },
      animation: {
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
      },
      keyframes: {
        'glow-pulse': {
          '0%, 100%': { filter: 'drop-shadow(0 0 8px #00ff00)' },
          '50%': { filter: 'drop-shadow(0 0 20px #00ff00) drop-shadow(0 0 40px #00ff00)' },
        }
      }
    },
  },
  plugins: [],
}