/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary brand color - blue
        // Used for primary actions, links, and key interactive elements
        // Provides good contrast and accessibility (WCAG AA compliant)
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        // Secondary brand color - magenta/purple
        // Used for secondary actions and accent elements
        // Provides visual hierarchy when used alongside primary
        secondary: {
          50: '#fdf4ff',
          100: '#fae8ff',
          200: '#f5d0fe',
          300: '#f0abfc',
          400: '#e879f9',
          500: '#d946ef',
          600: '#c026d3',
          700: '#a21caf',
          800: '#86198f',
          900: '#701a75',
        },
        // Neutral grays for backgrounds, text, borders
        // Provides consistent visual language across the application
        // Replaces default gray scale for a more modern look
        neutral: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
        },
      },
      spacing: {
        // Using Tailwind's default spacing scale (0.25rem increments)
        // Consistent with 4px base unit for predictable layouts
        // Can be extended here if custom spacing values are needed
      },
      fontSize: {
        // Using Tailwind's default typography scale
        // Based on major third (1.250) scale for harmonious proportions
        // Can be extended here if custom font sizes are needed
      },
    },
  },
  plugins: [],
}
