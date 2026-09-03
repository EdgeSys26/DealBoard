"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { readStoredTheme, writeTheme } from "@/components/ThemeInit";
import "./theme-toggle.css";

/** Compact sun/moon control for chrome. Cycles light ↔ dark. */
export function ThemeToggle() {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = readStoredTheme();
    writeTheme(stored);
    setDark(stored);
    setMounted(true);
  }, []);

  const isDark = !mounted || dark;

  function toggleTheme() {
    const next = !readStoredTheme();
    writeTheme(next);
    setDark(next);
  }

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
    >
      {isDark ? (
        <Sun className="theme-toggle-icon" size={16} aria-hidden />
      ) : (
        <Moon className="theme-toggle-icon" size={16} aria-hidden />
      )}
    </button>
  );
}
