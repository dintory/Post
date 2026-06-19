/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        spin: "spin 1s linear infinite",
        heroSweep: "heroSweep 8s ease-in-out infinite",
      },
      keyframes: {
        spin: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        heroSweep: {
          "0%, 100%": {
            opacity: 0.35,
            transform: "translateX(-12%) translateY(-8%)",
          },
          "50%": { opacity: 0.75, transform: "translateX(12%) translateY(8%)" },
        },
      },
    },
  },
  plugins: [],
};
