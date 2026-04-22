/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],

  safelist: [
    "bg-gray-50",
    "text-gray-800",
    "border-gray-200",
    "bg-indigo-600",
    "hover:bg-indigo-700",
    "bg-white",
    "border-gray-300",
    "bg-gray-100",
    "bg-gray-400",
    "bg-gray-500"
  ],

  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#4f46e5",
          light: "#6366f1",
          dark: "#4338ca",
        },
      },

      boxShadow: {
        card: "0 4px 12px rgba(0,0,0,0.05)",
      },

      borderRadius: {
        xl: "0.75rem",
      },
    },
  },

  plugins: [],
};