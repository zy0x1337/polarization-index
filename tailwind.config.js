import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: "#F8F7F4",   // Warm paper background
        surface: "#FFFFFF",  // Elevated pane surface
        ink: "#1A1A1A",
        muted: "#6B6B6B",
        faint: "#9A968C",
        accent: "#9F1239",   // Deep Red (Right)
        right: "#9F1239",
        center: "#3F6B54",   // Deep Green (Center)
        left: "#1D4ED8",     // Deep Blue (Left)
        border: "#E5E2D9",
        hairline: "#EFEDE6",
      },
      fontFamily: {
        serif: ["var(--font-instrument-serif)", "Georgia", "serif"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "monospace"],
      },
      boxShadow: {
        pane: "0 1px 2px rgba(26,26,26,0.04), 0 8px 24px rgba(26,26,26,0.06)",
        sheet: "0 -8px 40px rgba(26,26,26,0.12)",
        float: "0 12px 48px rgba(26,26,26,0.18)",
      },
      borderRadius: {
        pane: "20px",
      },
    },
  },
  plugins: [],
};

export default config;
