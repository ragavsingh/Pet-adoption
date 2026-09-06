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
          50: '#FBF9F7',
          100: '#F5EFE6', // Cream
          200: '#E8E0D5',
          300: '#DAC5B0',
          400: '#C8AA83', // Warm Beige / Tan
          500: '#9B7453',
          600: '#805942',
          700: '#6B4A3A', // Dark Brown Primary
          800: '#52372A',
          900: '#3D281E',
          950: '#1D1B19', // Near Black
        },
        surface: {
          DEFAULT: '#FFFFFF',
          soft: '#FAF9F6', // Off-white
          cream: '#F5EFE6',
          muted: '#E8E5E1', // Soft Gray
        },
        status: {
          available: '#2E7D32',
          'available-bg': '#E8F5E9',
          pending: '#B26A00',
          'pending-bg': '#FFF3E0',
          adopted: '#6B4A3A',
          'adopted-bg': '#F5EFE6',
          paused: '#6E6862',
          'paused-bg': '#F0EFEB',
        }
      },
      fontFamily: {
        sans: ['"DM Sans"', 'Manrope', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Manrope', '"DM Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '18px',
        '3xl': '24px',
        '4xl': '28px',
      },
      boxShadow: {
        'soft': '0 8px 30px rgba(107, 74, 58, 0.06)',
        'soft-lg': '0 18px 45px rgba(29, 27, 25, 0.08)',
        'card': '0 4px 20px rgba(107, 74, 58, 0.05)',
        'card-hover': '0 16px 36px rgba(107, 74, 58, 0.12)',
      },
      keyframes: {
        heartPulse: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.28)' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'heart-pulse': 'heartPulse 0.35s ease-in-out',
        'fade-in': 'fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-down': 'slideDown 0.3s ease-out',
      }
    },
  },
  plugins: [],
}
