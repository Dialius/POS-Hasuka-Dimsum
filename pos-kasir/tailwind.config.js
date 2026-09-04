/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#F5F4F1',
        surface: '#FFFFFF',
        primary: '#D45C3E',
        primaryHover: '#C24D30',
        textPrimary: '#2D2926',
        textSecondary: '#9A948C',
        danger: '#D9381E',
        borderLight: '#E2DFD9',
        keypadSpecial: '#EFECE5',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['Lora', 'serif'],
      },
      boxShadow: {
        'card': '0 10px 40px -10px rgba(0,0,0,0.08)',
      }
    },
  },
  plugins: [],
}
