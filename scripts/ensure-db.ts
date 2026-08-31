import { execSync } from "node:child_process";

if (!process.env.DATABASE_URL) {
  console.log("DATABASE_URL is not set — skip local db ensure.");
  process.exit(0);
}

execSync("npx prisma db push --skip-generate", { stdio: "inherit" });
execSync("npx tsx prisma/seed.ts", { stdio: "inherit" });
