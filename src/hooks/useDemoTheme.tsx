import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type ThemeId = "gold" | "emerald" | "sapphire" | "burgundy" | "onyx";

export interface ThemePreset {
  id: ThemeId;
  name: string;
  /** css gradient for the picker swatch */
  swatch: string;
}

export const THEMES: ThemePreset[] = [
  { id: "gold", name: "Royal Gold", swatch: "linear-gradient(135deg,#BA8C3B,#E5B876)" },
  { id: "emerald", name: "Emerald", swatch: "linear-gradient(135deg,#35805F,#7CC9A5)" },
  { id: "sapphire", name: "Sapphire", swatch: "linear-gradient(135deg,#3B6FD4,#8FB4F0)" },
  { id: "burgundy", name: "Burgundy", swatch: "linear-gradient(135deg,#A63A52,#E08CA0)" },
  { id: "onyx", name: "Onyx", swatch: "linear-gradient(135deg,#4A4A58,#9A9AA8)" },
];

const STORAGE_KEY = "SK_demo_theme";

interface ThemeCtx {
  theme: ThemeId;
  setTheme: (t: ThemeId) => void;
  resetTheme: () => void;
}

const Ctx = createContext<ThemeCtx | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as ThemeId | null;
      return saved && THEMES.some((t) => t.id === saved) ? saved : "gold";
    } catch {
      return "gold";
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "gold") {
      delete root.dataset.theme;
    } else {
      root.dataset.theme = theme;
    }
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* private mode */
    }
  }, [theme]);

  const setTheme = (t: ThemeId) => setThemeState(t);
  const resetTheme = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    setThemeState("gold");
  };

  return <Ctx.Provider value={{ theme, setTheme, resetTheme }}>{children}</Ctx.Provider>;
}

export function useDemoTheme(): ThemeCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useDemoTheme must be used inside ThemeProvider");
  return ctx;
}
