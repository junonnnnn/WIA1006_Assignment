import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          '"SF Pro Display"',
          '"SF Pro Text"',
          '"Helvetica Neue"',
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
        mono: ['"SF Mono"', "Menlo", "Consolas", "monospace"],
      },
      colors: {
        surface: {
          light: "#fbfbfd",
          dark: "#000000",
        },
        card: {
          light: "#ffffff",
          dark: "#1d1d1f",
        },
        hairline: {
          light: "#d2d2d7",
          dark: "#3a3a3c",
        },
        ink: {
          light: "#1d1d1f",
          dark: "#f5f5f7",
        },
        muted: {
          light: "#6e6e73",
          dark: "#a1a1a6",
        },
        accent: "#0071e3",
        "accent-hover": "#0077ed",
      },
      borderRadius: {
        xl2: "18px",
      },
      transitionTimingFunction: {
        apple: "cubic-bezier(0.4, 0, 0.2, 1)",
      },
      letterSpacing: {
        tightest: "-0.022em",
      },
      maxWidth: {
        container: "720px",
      },
    },
  },
  plugins: [],
} satisfies Config;
