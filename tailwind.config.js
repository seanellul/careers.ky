/** @type {import('tailwindcss').Config} */
export default {
  darkMode: [class],
  content: [
    ./app/**/*.{js,ts,jsx,tsx},
    ./components/**/*.{js,ts,jsx,tsx},
    ./lib/**/*.{js,ts,jsx,tsx},
  ],
  theme: {
    extend: {
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      colors: {
        primary: {
          50: '#E0F2FE',
          500: '#0077B6',
          600: '#005FA3',
          700: '#00498A',
        },
        accent: {
          50: '#FFEAEA',
          500: '#E76F51',
          600: '#D4573A',
        },
        cayman: {
          sand: '#F4A261',
          ocean: '#0077B6',
          coral: '#E76F51',
          warm: '#FEFCF3',
        },
      },
    },
  },
  plugins: [],
}
