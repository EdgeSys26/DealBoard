"use client";

import { useEffect } from "react";

export const THEME_COOKIE = "dealboard-theme";

export function readStoredTheme(): boolean {
  try {
    if (localStorage.getItem(THEME_COOKIE) === "dark") return true;
    if (localStorage.getItem(THEME_COOKIE) === "light") return false;
  } catch {
    /* ignore */
  }
  return typeof document !== "undefined" && document.cookie.includes(`${THEME_COOKIE}=dark`);
}

export function writeTheme(dark: boolean) {
  document.documentElement.classList.toggle("dark", dark);
  try {
    localStorage.setItem(THEME_COOKIE, dark ? "dark" : "light");
  } catch {
    /* ignore */
  }
  document.cookie = `${THEME_COOKIE}=${dark ? "dark" : "light"}; Path=/; Max-Age=31536000; SameSite=Lax`;
}

export function ThemeInit() {
  useEffect(() => {
    writeTheme(readStoredTheme());
  }, []);
  return null;
}
