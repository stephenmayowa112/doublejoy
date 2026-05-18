/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'deep-purple': '#4A1A5C',
        'royal-purple': '#6B2D8F',
        'light-purple': '#8B5BA8',
        'wedding-gold': '#D4AF37',
        'soft-gold': '#F4E4C1',
      },
      fontFamily: {
        serif: ['var(--font-playfair)', 'serif'],
        sans: ['var(--font-inter)', 'sans-serif'],
        script: ['var(--font-satisfy)', 'cursive'],
      },
    },
  },
  plugins: [],
}
