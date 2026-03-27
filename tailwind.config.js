/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        hind: ['"Hind Siliguri"', 'sans-serif'],
        noto: ['"Noto Serif Bengali"', 'serif'],
      },
      colors: {
        saffron: '#FF6B00',
        deepgreen: '#1A5C2A',
        gold: '#E8A000',
        cream: '#FFF8EE',
        bark: '#3D2B1F',
      },
      animation: {
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'wave': 'wave 1.5s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        wave: {
          '0%, 100%': { transform: 'scaleY(0.5)' },
          '50%': { transform: 'scaleY(1.5)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        }
      }
    },
  },
  plugins: [],
}
