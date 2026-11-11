/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        psa: {
          red: '#DA291C',
          darkRed: '#A61910',
          navy: '#0F172A',
          gold: '#F59E0B',
          holo: '#38BDF8'
        }
      }
    },
  },
  plugins: [],
}
