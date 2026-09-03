"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { readStoredTheme, writeTheme } from "@/components/ThemeInit";

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
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 40,
        height: 40,
        padding: 0,
        border: 0,
        background: "transparent",
        color: "var(--muted)",
        borderRadius: 8,
        flexShrink: 0,
      }}
    >
      {isDark ? <Sun size={16} strokeWidth={2} aria-hidden /> : <Moon size={16} strokeWidth={2} aria-hidden />}
    </button>
  );
}
