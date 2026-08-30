import { prisma } from "./prisma";
import { seedDemo } from "./seed-demo";
import { SQLITE_SCHEMA } from "./sqlite-schema";

let boot: Promise<void> | null = null;

async function applySchema() {
  const statements = SQLITE_SCHEMA.split(";")
    .map((s) => s.trim())
    .filter(Boolean);
  for (const sql of statements) {
    await prisma.$executeRawUnsafe(sql);
  }
}

export function ensureDemoDb() {
  if (!boot) {
    boot = (async () => {
      await applySchema();
      const users = await prisma.user.count();
      if (users === 0) {
        await seedDemo(prisma);
      }
    })();
  }
  return boot;
}
