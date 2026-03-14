import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background) / <alpha-value>)",
        foreground: "hsl(var(--foreground) / <alpha-value>)",
        muted: {
          foreground: "hsl(var(--muted-foreground) / <alpha-value>)",
        },
        border: "hsl(var(--border) / <alpha-value>)",
        brand: {
          50: "#E1F5EE",
          100: "#9FE1CB",
          500: "#1D9E75",
          600: "#0F6E56",
        },
        vault: {
          amber: "#BA7517",
          blue: "#185FA5",
        },
      },
    },
  },
  plugins: [],
};

export default config;
