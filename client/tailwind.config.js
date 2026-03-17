/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#0f172a',
        secondary: '#111827',
        accent: '#22c55e'
      },
      borderRadius: {
        '2.5xl': '1.5rem'
      },
      boxShadow: {
        'soft-glass': '0 18px 45px rgba(15,23,42,0.45)'
      }
    }
  },
  plugins: []
};

