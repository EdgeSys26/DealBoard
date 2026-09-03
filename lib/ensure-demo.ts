import { prisma } from "./prisma";
import { seedDemo } from "./seed-demo";
import { ensureBoardSettings } from "./settings";

let boot: Promise<void> | null = null;

export function ensureDemoDb() {
  if (!boot) {
    boot = (async () => {
      await ensureBoardSettings();
      const users = await prisma.user.count();
      if (users === 0) {
        await seedDemo(prisma);
      }
    })().catch((error) => {
      boot = null;
      throw error;
    });
  }
  return boot;
}
