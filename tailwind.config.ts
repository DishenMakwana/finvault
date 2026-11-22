import type { Config } from "tailwindcss";
import defaultTheme from "tailwindcss/defaultTheme";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-geist-sans)", ...defaultTheme.fontFamily.sans],
      },
      colors: {
        background: "var(--background)",
        sidebar: "var(--sidebar)",
        card: {
          DEFAULT: "var(--card)",
          hover: "var(--card-hover)",
          modal: "var(--surface-modal)",
        },
        surface: {
          DEFAULT: "var(--surface)",
          hover: "var(--surface-hover)",
          elevated: "var(--surface-elevated)",
          pill: "var(--surface-pill)",
          modal: "var(--surface-modal)",
        },
        border: {
          DEFAULT: "var(--border-subtle)",
          subtle: "var(--border-subtle)",
          muted: "var(--border-muted)",
          hover: "var(--border-hover)",
          contrast: "var(--border-contrast)",
          active: "var(--border-active)",
        },
        primary: {
          DEFAULT: "rgb(var(--primary-rgb) / <alpha-value>)",
          hover: "var(--color-primary-hover)",
          tint: "var(--bg-primary-tint)",
        },
        danger: {
          DEFAULT: "rgb(var(--danger-rgb) / <alpha-value>)",
          hover: "var(--color-danger-hover)",
          tint: "var(--bg-danger-tint)",
        },
        loan: {
          DEFAULT: "rgb(var(--loan-rgb) / <alpha-value>)",
          light: "rgb(var(--loan-light-rgb) / <alpha-value>)",
          tint: "var(--bg-loan-tint)",
        },
        amber: {
          DEFAULT: "rgb(var(--amber-rgb) / <alpha-value>)",
        },
        cyan: {
          DEFAULT: "rgb(var(--cyan-rgb) / <alpha-value>)",
        },
        text: {
          muted: "var(--text-muted)",
          subtle: "var(--text-subtle)",
        },
        fin: {
          emerald: "rgb(var(--primary-rgb) / <alpha-value>)",
          rose: "rgb(var(--danger-rgb) / <alpha-value>)",
          purple: "rgb(var(--loan-rgb) / <alpha-value>)",
          indigo: "rgb(var(--loan-rgb) / <alpha-value>)",
          amber: "rgb(var(--amber-rgb) / <alpha-value>)",
          cyan: "rgb(var(--cyan-rgb) / <alpha-value>)",
        },
      },
    },
  },
  plugins: [],
};

export default config;
