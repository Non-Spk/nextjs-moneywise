"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

const ThemeContext = createContext<{
  theme: Theme;
  toggleTheme: () => void;
  privacyMode: boolean;
  togglePrivacy: () => void;
}>({ theme: "light", toggleTheme: () => {}, privacyMode: false, togglePrivacy: () => {} });

export function useTheme() {
  return useContext(ThemeContext);
}

export default function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [theme, setTheme] = useState<Theme>("light");
  const [privacyMode, setPrivacyMode] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("theme") as Theme | null;
    if (saved) {
      setTheme(saved);
      document.documentElement.setAttribute("data-theme", saved);
    }
    const savedPrivacy = localStorage.getItem("privacyMode");
    if (savedPrivacy === "true") setPrivacyMode(true);
  }, []);

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    localStorage.setItem("theme", next);
    document.documentElement.setAttribute("data-theme", next);
  };

  const togglePrivacy = () => {
    const next = !privacyMode;
    setPrivacyMode(next);
    localStorage.setItem("privacyMode", String(next));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, privacyMode, togglePrivacy }}>
      {children}
    </ThemeContext.Provider>
  );
}
