import { PrismaClient } from "@prisma/client";
import { ensureSqliteFile, sqliteUrl } from "../lib/db-path";
import { seedDemo } from "../lib/seed-demo";

ensureSqliteFile();
const prisma = new PrismaClient({
  datasources: { db: { url: sqliteUrl() } },
});

seedDemo(prisma)
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
