import { existsSync } from "node:fs";
import { execSync } from "node:child_process";

const db = "prisma/dev.db";
if (!existsSync(db)) {
  console.log("No SQLite file yet — pushing schema and seeding demo users.");
  execSync("npx prisma db push --skip-generate", { stdio: "inherit" });
  execSync("npx tsx prisma/seed.ts", { stdio: "inherit" });
}
