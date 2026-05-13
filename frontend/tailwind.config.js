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
          50: '#F0F4F8',
          100: '#D9E2EC',
          200: '#BCCCDC',
          300: '#9FB3C8',
          400: '#829AB1',
          500: '#3B6EA5', // Steel Blue
          600: '#1D4E89', // Academic Blue
          700: '#0F2D52', // Deep Navy
          800: '#0B2340',
          900: '#06172E',
        },
        accent: {
          50: '#FDF2F2',
          100: '#FCE8E8',
          200: '#FBD5D5',
          300: '#F8B4B4',
          400: '#F98080',
          500: '#C62828', // Institutional Red
          600: '#A61E2D', // Deep Maroon
          700: '#8B1A25',
          800: '#6A131C',
          900: '#4D0E14',
        },
        slate: {
          750: '#1e2d42',
        }
      },
    },
  },
  plugins: [],
}
