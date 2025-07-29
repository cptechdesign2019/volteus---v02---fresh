// tailwind.config.js
const { fontFamily } = require('tailwindcss/defaultTheme');

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './app/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', ...fontFamily.sans],
      },
      colors: {
        // Example semantic colors
        primary: {
          DEFAULT: '#162944',
          // Add shades like 50, 100, ..., 900 if needed
        },
        // Add other semantic colors like 'secondary', 'accent', etc.
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}; 