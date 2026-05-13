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
          50: '#F4F6F8',
          100: '#E9EEF2',
          200: '#C8D4E1',
          300: '#A6BACF',
          400: '#6487A9',
          500: '#1D3557', // Changed to match Invertis theme primary
          600: '#1A304E', 
          700: '#112034',
          800: '#0D1827',
          900: '#09101A',
        },
        accent: {
          50: '#FDF7F7',
          100: '#FBE8E9',
          200: '#F5C6C9',
          300: '#EFA4A8',
          400: '#E36067',
          500: '#E63946', // Changed to match Invertis theme red
          600: '#CF333F', 
          700: '#8A222A',
          800: '#671A20',
          900: '#451115',
        },
        invertis: {
          bg: '#F1FAEE', // Page background
          red: '#E63946',
          blue: '#1D3557',
        },
        slate: {
          750: '#1e2d42',
        }
      },
    },
  },
  plugins: [],
}
