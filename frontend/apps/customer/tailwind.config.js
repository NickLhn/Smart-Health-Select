/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: '#00B96B',
          50: '#E6F8F0',
          100: '#CCF1E1',
          200: '#99E3C3',
          300: '#66D4A5',
          400: '#33C687',
          500: '#00B96B',
          600: '#009456',
          700: '#006F40',
          800: '#004A2B',
          900: '#002515',
        },
        secondary: {
          DEFAULT: '#1890FF',
          50: '#E6F7FF',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          subtle: '#F8FAFC', // Slate 50
          muted: '#F1F5F9', // Slate 100
        },
        text: {
          main: '#1F2937', // Gray 800
          secondary: '#6B7280', // Gray 500
          light: '#9CA3AF', // Gray 400
        }
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
        'card': '0 0 0 1px rgba(0,0,0,0.03), 0 2px 8px rgba(0,0,0,0.04)',
        'glow': '0 0 20px rgba(0, 185, 107, 0.25)',
        'float': '0 8px 30px rgba(0,0,0,0.08)',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
        '4xl': '2.5rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        }
      }
    },
  },
  plugins: [],
}
