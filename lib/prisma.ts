import { PrismaClient } from "@prisma/client";
import { ensureSqliteFile, sqliteUrl } from "./db-path";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

ensureSqliteFile();

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: { db: { url: sqliteUrl() } },
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

globalForPrisma.prisma = prisma;
