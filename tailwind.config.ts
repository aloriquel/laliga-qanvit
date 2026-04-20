import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        // Brand tokens — Qanvit
        brand: {
          navy: "#22183a",
          salmon: "#f4a9aa",
          lavender: "#f1e8f4",
        },
        league: {
          ideation: "#b8c5d6",
          seed: "#a8d5ba",
          growth: "#f4a9aa",
          elite: "#c8a2c8",
        },
        rank: {
          gold: "#d4af37",
          silver: "#c0c0c0",
          bronze: "#cd7f32",
        },
        ink: {
          primary: "#1a1230",
          secondary: "#6b5b8a",
        },
        surface: {
          card: "#ffffff",
        },
        "border-soft": "#e5d8ea",
      },
      fontFamily: {
        sora: ["var(--font-sora)", "sans-serif"],
        body: ["var(--font-open-sans)", "sans-serif"],
        sans: ["var(--font-open-sans)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        card: "16px",
        hero: "24px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(34, 24, 58, 0.04), 0 8px 24px rgba(34, 24, 58, 0.06)",
      },
      maxWidth: {
        container: "1280px",
      },
    },
  },
  plugins: [],
};
export default config;
