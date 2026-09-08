/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#2563EB',
          'primary-dark': '#1D4ED8',
          secondary: '#0284C7',
          light: '#EFF6FF',
        },
        civic: {
          pending: '#64748B',
          'under-review': '#0284C7',
          approved: '#6366F1',
          rejected: '#EF4444',
          resolved: '#10B981',
          warning: '#F59E0B',
        },
        surface: {
          light: '#FFFFFF',
          'light-bg': '#F8FAFC',
          dark: '#1E293B',
          'dark-bg': '#0B1120',
          'dark-border': '#334155',
        },
        txt: {
          primary: '#0F172A',
          secondary: '#64748B',
          'dark-primary': '#F8FAFC',
          'dark-secondary': '#94A3B8',
        }
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        'elevated': '0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -1px rgba(0, 0, 0, 0.04)',
        'modal': '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)',
      }
    },
  },
  plugins: [],
};
