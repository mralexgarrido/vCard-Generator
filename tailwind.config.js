/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './App.tsx', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fff3f0',
          100: '#ffe4dd',
          200: '#ffc9bd',
          300: '#ff9f8a',
          400: '#ff6d52',
          500: '#f05023',
          600: '#db3509',
          700: '#b72706',
          800: '#96220c',
          900: '#7c200f',
          950: '#431006'
        }
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif']
      }
    }
  },
  plugins: []
};
