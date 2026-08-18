"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type Theme = "dark" | "light";

const KEY = "ta_theme";
const ThemeContext = createContext<{ theme: Theme; setTheme: (t: Theme) => void; toggle: () => void }>({
  theme: "dark",
  setTheme: () => undefined,
  toggle: () => undefined,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");

  useEffect(() => {
    const stored = (localStorage.getItem(KEY) as Theme | null) || "dark";
    apply(stored);
    setThemeState(stored);
  }, []);

  function apply(next: Theme) {
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(next);
    localStorage.setItem(KEY, next);
  }

  function setTheme(next: Theme) {
    setThemeState(next);
    apply(next);
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggle: () => setTheme(theme === "dark" ? "light" : "dark") }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
