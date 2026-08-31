import { PrismaClient } from "@prisma/client";
import { seedDemo } from "../lib/seed-demo";

const prisma = new PrismaClient();

seedDemo(prisma)
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
