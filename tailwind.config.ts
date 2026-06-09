import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        bg: "rgb(var(--bg) / <alpha-value>)",
        canvas: "rgb(var(--canvas) / <alpha-value>)",
        card: "rgb(var(--card) / <alpha-value>)",
        line: "rgb(var(--line) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
        fg: "rgb(var(--fg) / <alpha-value>)",
        ink: "#0b1020",

        accent: "#7c5cff",
        drop: "#ef4444",
        automate: "#22c55e",
        hybrid: "#eab308",
        own: "#38bdf8",
        ux: "#f472b6",
        marketing: "#a78bfa",
        product: "#f59e0b",
        ops: "#34d399",
        analyst: "#60a5fa",
        gm: "#e879f9",
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
      },
      boxShadow: {
        card: "0 6px 20px -8px rgba(0,0,0,0.6)",
      },
    },
  },
  plugins: [],
} satisfies Config;
