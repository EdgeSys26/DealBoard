import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { PrismaClient } from "@prisma/client";

function loadDatabaseUrl() {
  if (process.env.DATABASE_URL) return;
  try {
    const file = join(process.cwd(), ".env");
    if (!existsSync(file)) return;
    for (const line of readFileSync(file, "utf8").split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const match = trimmed.match(/^DATABASE_URL\s*=\s*(.*)$/);
      if (match) {
        process.env.DATABASE_URL = match[1].replace(/^["']|["']$/g, "");
        return;
      }
    }
  } catch {
    // fall through — Prisma will throw a clear missing-url error
  }
}

loadDatabaseUrl();

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

globalForPrisma.prisma = prisma;
