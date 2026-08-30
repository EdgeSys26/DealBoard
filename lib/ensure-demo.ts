import { prisma } from "./prisma";
import { seedDemo } from "./seed-demo";

let boot: Promise<void> | null = null;

export function ensureDemoDb() {
  if (!boot) {
    boot = (async () => {
      try {
        const users = await prisma.user.count();
        if (users === 0) {
          await seedDemo(prisma);
        }
      } catch {
        await seedDemo(prisma);
      }
    })();
  }
  return boot;
}
