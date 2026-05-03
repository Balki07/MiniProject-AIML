/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#ecfffd',
          100: '#c7fffa',
          200: '#9af9f2',
          300: '#64f0e8',
          400: '#31d7ff',
          500: '#13c4ff',
          600: '#0b8cff',
          700: '#0b5fe0',
          800: '#0c3f9a',
          900: '#08285f',
        },
        trust: {
          high:   '#20f6b2',
          medium: '#ffd34d',
          low:    '#ff5f7a',
        },
      },
      fontFamily: {
        sans: ['Space Grotesk', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(135deg, #050c14, #0a1630, #102a44)',
        'card-gradient': 'linear-gradient(145deg, rgba(19,196,255,0.08), rgba(32,246,178,0.03))',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: 'translateY(20px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
}
