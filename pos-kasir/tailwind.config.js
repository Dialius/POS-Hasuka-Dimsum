/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#8B4A1E',
        primaryHover: '#703B18', // darker shade of primary
        brand: '#B60000',
        danger: '#B60000',
        success: '#5B8A2E',
        warning: '#C9A227',
        offline: '#C9A227',
        accentPromo: '#DF690B',
        border: '#C49A62',
        borderLight: '#E8D7C0', // lighter version of border
        surface: '#F3E7CE',
        background: '#FAF6ED', // even lighter surface for main bg
        textPrimary: '#2B1810',
        textSecondary: '#6B5448', // muted text
        keypadSpecial: '#E8D7C0',
      },
      screens: {
        'tall': { 'raw': '(min-height: 750px)' },
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
