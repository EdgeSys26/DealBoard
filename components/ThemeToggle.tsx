"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { readStoredTheme, writeTheme } from "@/components/ThemeInit";

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  );
}

/** Sun and moon chrome control. Cycles light ↔ dark. */
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

  function setMode(next: boolean) {
    writeTheme(next);
    setDark(next);
  }

  const btn = (on: boolean): CSSProperties => ({
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 32,
    height: 32,
    padding: 0,
    border: "1px solid var(--line)",
    borderRadius: 8,
    background: on ? "var(--card)" : "transparent",
    color: on ? "var(--ink)" : "var(--muted)",
  });

  return (
    <div
      className="theme-toggle"
      role="group"
      aria-label="Color theme"
      style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
    >
      <button
        type="button"
        className="theme-toggle-btn"
        aria-pressed={!isDark}
        aria-label="Light mode"
        title="Light mode"
        style={btn(!isDark)}
        onClick={() => setMode(false)}
      >
        <SunIcon />
      </button>
      <button
        type="button"
        className="theme-toggle-btn"
        aria-pressed={isDark}
        aria-label="Dark mode"
        title="Dark mode"
        style={btn(isDark)}
        onClick={() => setMode(true)}
      >
        <MoonIcon />
      </button>
    </div>
  );
}
