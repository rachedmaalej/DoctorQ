/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // MediBook uses the same color palette as DoctorQ for brand consistency
        primary: {
          DEFAULT: '#0D9488',
          50: '#E6F7F5',
          100: '#CCEFEB',
          200: '#99DFD7',
          300: '#66CFC3',
          400: '#33BFAF',
          500: '#0D9488',
          600: '#0A766D',
          700: '#085952',
          800: '#053B37',
          900: '#031E1C',
        },
        secondary: {
          DEFAULT: '#1E3A5F',
          50: '#E8EDF4',
          100: '#D1DBE9',
          200: '#A3B7D3',
          300: '#7593BD',
          400: '#476FA7',
          500: '#1E3A5F',
          600: '#182E4C',
          700: '#122339',
          800: '#0C1726',
          900: '#060C13',
        },
        accent: {
          DEFAULT: '#F59E0B',
          50: '#FEF3E2',
          100: '#FDE8C5',
          200: '#FBD18B',
          300: '#F9BA51',
          400: '#F7A317',
          500: '#F59E0B',
          600: '#C47E09',
          700: '#935F07',
          800: '#623F04',
          900: '#312002',
        },
      },
      fontFamily: {
        sans: ['IBM Plex Sans', 'system-ui', 'sans-serif'],
        arabic: ['IBM Plex Sans Arabic', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [
    require('tailwindcss-rtl'),
  ],
}
