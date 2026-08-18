/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}", "./features/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        surface: "var(--surface)",
        elevated: "var(--surface-elevated)",
        border: "var(--border)",
        primary: {
          DEFAULT: "var(--primary)",
          hover: "var(--primary-hover)",
          fg: "var(--primary-fg)",
        },
        brand: "var(--brand)",
        ink: {
          950: "var(--background)",
          900: "var(--surface-elevated)",
          800: "var(--surface)",
          700: "var(--surface-elevated)",
          600: "var(--border)",
        },
        line: "var(--border)",
        gold: "var(--primary)",
        gain: "var(--success)",
        loss: "var(--danger)",
        warn: "var(--warning)",
        mist: "var(--text-secondary)",
      },
      textColor: {
        DEFAULT: "var(--text-primary)",
      },
      fontFamily: {
        sans: ["IBM Plex Sans", "ui-sans-serif", "system-ui"],
        mono: ["IBM Plex Mono", "ui-monospace", "SFMono-Regular"],
      },
      boxShadow: {
        terminal: "0 12px 40px rgba(15, 23, 42, 0.18)",
      },
    },
  },
  plugins: [],
};
