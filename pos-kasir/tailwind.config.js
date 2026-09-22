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
        'xs': '375px',
        'sm': '640px',
        'md': '744px', // Menjangkau iPad Mini portrait (744px), iPad 9.7/10.2 (768px), Galaxy Tab (800px)
        'lg': '1024px', // Menjangkau Tablet Landscape (1024px-1194px)
        'xl': '1280px', // Menjangkau Laptop Standar (1366px), MacBook (1440px), Desktop
        '2xl': '1536px',
        'tall': { 'raw': '(min-height: 750px)' },
        'short': { 'raw': '(max-height: 700px)' },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['"Playfair Display"', 'Lora', 'Georgia', 'serif'],
        display: ['"Playfair Display"', 'serif'],
      },
      boxShadow: {
        'card': '0 10px 40px -10px rgba(0,0,0,0.08)',
      }
    },
  },
  plugins: [],
}
