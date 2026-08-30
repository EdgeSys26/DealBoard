import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";

export function isServerlessFs() {
  return Boolean(process.env.VERCEL || process.env.DEALBOARD_TMP_DB === "1");
}

export function sqliteFilePath() {
  if (isServerlessFs()) {
    return "/tmp/dealboard.db";
  }
  return path.join(process.cwd(), "prisma", "dev.db");
}

export function sqliteUrl() {
  return `file:${sqliteFilePath()}`;
}

export function templateDbPath() {
  return path.join(process.cwd(), "prisma", "demo.template.db");
}

/** Copy the bundled demo SQLite file onto a writable path (Vercel: /tmp). */
export function ensureSqliteFile() {
  const dest = sqliteFilePath();
  if (existsSync(dest)) return dest;
  const dir = path.dirname(dest);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  const template = templateDbPath();
  if (existsSync(template)) {
    copyFileSync(template, dest);
  }
  return dest;
}
