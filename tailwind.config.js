/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#7928CA',
          light: '#9D50E8',
          dark: '#5B1E9A'
        },
        secondary: {
          DEFAULT: '#FFD700',
          light: '#FFEB80',
          dark: '#E6C200'
        },
        action: {
          DEFAULT: '#DE0BFB',
          light: '#F54DFF',
          dark: '#B008C8'
        },
        background: {
          DEFAULT: '#121212',
          light: '#1E1E1E',
          lighter: '#2D2D2D'
        },
        text: {
          DEFAULT: '#FFFFFF',
          muted: '#CCCCCC',
          dark: '#999999'
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Montserrat', 'sans-serif']
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 3s ease-in-out infinite',
        'number-roll': 'numberRoll 0.5s ease-in-out infinite'
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' }
        },
        numberRoll: {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(-100%)' }
        }
      }
    },
  },
  plugins: [],
};