/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1D4ED8',
        success: '#16A34A',
        danger: '#DC2626',
        warning: '#F59E0B',
        background: '#F9FAFB'
      }
    },
  },
  plugins: [],
}
