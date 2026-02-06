"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type Theme = "solar" | "orbit" | "aurora";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const themes: { id: Theme; name: string; description: string }[] = [
  { id: "solar", name: "Solar Flare", description: "Warm orange & gold" },
  { id: "orbit", name: "Deep Orbit", description: "Cosmic purple & blue" },
  { id: "aurora", name: "Aurora", description: "Ethereal green & violet" },
];

// All CSS variables for each theme — applied directly to <html> style
const themeTokens: Record<Theme, Record<string, string>> = {
  solar: {
    "--background": "15 20% 4%",
    "--foreground": "35 20% 95%",
    "--card": "15 20% 7%",
    "--card-foreground": "35 20% 95%",
    "--popover": "15 20% 7%",
    "--popover-foreground": "35 20% 95%",
    "--primary": "20 100% 60%",
    "--primary-foreground": "0 0% 100%",
    "--secondary": "15 20% 12%",
    "--secondary-foreground": "35 20% 95%",
    "--muted": "15 15% 12%",
    "--muted-foreground": "35 15% 55%",
    "--accent": "20 25% 14%",
    "--accent-foreground": "35 20% 95%",
    "--destructive": "0 62.8% 30.6%",
    "--destructive-foreground": "210 40% 98%",
    "--border": "20 15% 16%",
    "--input": "20 15% 16%",
    "--ring": "20 100% 60%",
    "--theme-primary": "#FF6B35",
    "--theme-secondary": "#FFB800",
    "--theme-glow": "rgba(255, 107, 53, 0.5)",
  },
  orbit: {
    "--background": "250 40% 4%",
    "--foreground": "210 40% 98%",
    "--card": "255 30% 8%",
    "--card-foreground": "210 40% 98%",
    "--popover": "255 30% 8%",
    "--popover-foreground": "210 40% 98%",
    "--primary": "262 83% 58%",
    "--primary-foreground": "210 40% 98%",
    "--secondary": "255 25% 15%",
    "--secondary-foreground": "210 40% 98%",
    "--muted": "255 20% 15%",
    "--muted-foreground": "215 20% 65%",
    "--accent": "255 25% 18%",
    "--accent-foreground": "210 40% 98%",
    "--destructive": "0 62.8% 30.6%",
    "--destructive-foreground": "210 40% 98%",
    "--border": "255 20% 18%",
    "--input": "255 20% 18%",
    "--ring": "262 83% 58%",
    "--theme-primary": "#7C3AED",
    "--theme-secondary": "#38BDF8",
    "--theme-glow": "rgba(124, 58, 237, 0.5)",
  },
  aurora: {
    "--background": "222 47% 5%",
    "--foreground": "210 40% 98%",
    "--card": "220 40% 8%",
    "--card-foreground": "210 40% 98%",
    "--popover": "220 40% 8%",
    "--popover-foreground": "210 40% 98%",
    "--primary": "168 80% 48%",
    "--primary-foreground": "0 0% 100%",
    "--secondary": "220 30% 12%",
    "--secondary-foreground": "210 40% 98%",
    "--muted": "220 25% 12%",
    "--muted-foreground": "215 20% 55%",
    "--accent": "220 30% 15%",
    "--accent-foreground": "210 40% 98%",
    "--destructive": "0 62.8% 30.6%",
    "--destructive-foreground": "210 40% 98%",
    "--border": "220 25% 16%",
    "--input": "220 25% 16%",
    "--ring": "168 80% 48%",
    "--theme-primary": "#22D3BB",
    "--theme-secondary": "#A78BFA",
    "--theme-glow": "rgba(34, 211, 187, 0.5)",
  },
};

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  const tokens = themeTokens[theme];

  for (const [key, value] of Object.entries(tokens)) {
    root.style.setProperty(key, value);
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("orbit");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("jellysignal-theme") as Theme | null;
    if (stored && themes.some((t) => t.id === stored)) {
      setTheme(stored);
      applyTheme(stored);
    } else {
      applyTheme("orbit");
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;

    applyTheme(theme);
    localStorage.setItem("jellysignal-theme", theme);
  }, [theme, mounted]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
