import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./*/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        wood: {
          50: "#fdf8f3",
          100: "#f5e6d3",
          200: "#e8c9a8",
          300: "#d4a574",
          400: "#c4894d",
          500: "#a86f3d",
          600: "#8b5a2b",
          700: "#6b4423",
          800: "#4a2f18",
          900: "#2d1b0e",
        },
        cream: {
          50: "#fffef7",
          100: "#fef9e7",
          200: "#fdf3cf",
          300: "#fce9a8",
        },
        blood: {
          400: "#c94a4a",
          500: "#a63d3d",
          600: "#8b2e2e",
        },
        // Suspect colors for gameplay
        suspect: {
          red: "#c94a4a",
          orange: "#d4874d",
          yellow: "#d4b34d",
          green: "#4d9a4d",
          cyan: "#4d9a9a",
          purple: "#8b4d8b",
        },
      },
      fontFamily: {
        pixel: ["var(--font-pixel)", "monospace"],
      },
      animation: {
        float: "float 3s ease-in-out infinite",
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
