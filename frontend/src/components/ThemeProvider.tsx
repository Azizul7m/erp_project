"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type ColorScheme = "default" | "onedark" | "gruvbox";
export type ThemeMode = "light" | "dark";

interface ThemeContextType {
  scheme: ColorScheme;
  mode: ThemeMode;
  setScheme: (scheme: ColorScheme) => void;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [scheme, setScheme] = useState<ColorScheme>("default");
  const [mode, setMode] = useState<ThemeMode>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedScheme = localStorage.getItem("erp_scheme") as ColorScheme;
    const savedMode = localStorage.getItem("erp_mode") as ThemeMode;
    if (savedScheme) setScheme(savedScheme);
    if (savedMode) setMode(savedMode);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    const html = document.documentElement;
    html.classList.remove("theme-onedark", "theme-gruvbox", "dark");
    
    if (scheme !== "default") {
      html.classList.add(`theme-${scheme}`);
    }
    if (mode === "dark") {
      html.classList.add("dark");
    }
    
    localStorage.setItem("erp_scheme", scheme);
    localStorage.setItem("erp_mode", mode);
  }, [scheme, mode, mounted]);

  const toggleMode = () => setMode((m) => (m === "light" ? "dark" : "light"));

  return (
    <ThemeContext.Provider value={{ scheme, mode, setScheme, setMode, toggleMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
