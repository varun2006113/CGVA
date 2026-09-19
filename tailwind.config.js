/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./api/**/*.{js,ts}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#bae0fd',
          500: '#0284c7',
          600: '#0369a1',
          700: '#075985',
          800: '#0c4a6e',
          900: '#0f3854',
          950: '#082f49',
        },
        scientific: {
          bg: '#f8fafc',
          card: '#ffffff',
          border: '#e2e8f0',
          muted: '#64748b',
          dark: '#0f172a',
          accent: '#0e7490',
        },
        status: {
          pathogenic: '#b91c1c',
          pathogenicBg: '#fef2f2',
          pathogenicBorder: '#fca5a5',
          benign: '#15803d',
          benignBg: '#f0fdf4',
          benignBorder: '#86efac',
          vus: '#b45309',
          vusBg: '#fffbeb',
          vusBorder: '#fde68a',
          conflicting: '#6b21a8',
          conflictingBg: '#faf5ff',
          conflictingBorder: '#d8b4fe',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'Monaco', 'monospace'],
      }
    },
  },
  plugins: [],
}
