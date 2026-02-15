import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f5f5f5",
          100: "#e8e8e8",
          500: "#1a3a5c",
          600: "#14304d",
          700: "#0f2640",
        },
        wsj: {
          black: "#111111",
          dark: "#333333",
          mid: "#666666",
          light: "#999999",
          rule: "#d4d4d4",
          bg: "#f7f7f5",
          accent: "#0274B6",
          red: "#9e2b25",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        serif: ["Georgia", "Cambria", "'Times New Roman'", "Times", "serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      borderRadius: {
        DEFAULT: "0px",
      },
      fontSize: {
        "body": ["13px", { lineHeight: "1.5" }],
        "body-lg": ["14px", { lineHeight: "1.55" }],
      },
    },
  },
  plugins: [],
};
export default config;
