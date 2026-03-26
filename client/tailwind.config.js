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
        primary: {
          DEFAULT: '#1e3a5f',
          dark: '#152a45',
          light: '#2d4a6f'
        },
        accent: {
          DEFAULT: '#22c55e',
          dark: '#16a34a',
          light: '#4ade80'
        },
        brand: {
          blue: '#5B5EFF',
          purple: '#B84AF3',
          green: '#00D084'
        }
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #5B5EFF 0%, #B84AF3 100%)',
      },
      animation: {
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
};
