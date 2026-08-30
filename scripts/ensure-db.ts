import { existsSync } from "node:fs";
import { execSync } from "node:child_process";
import { sqliteFilePath } from "../lib/db-path";

const db = sqliteFilePath();
if (!existsSync(db)) {
  console.log("No SQLite file yet — pushing schema and seeding demo users.");
  execSync("npx prisma db push --skip-generate", { stdio: "inherit" });
  execSync("npx tsx prisma/seed.ts", { stdio: "inherit" });
}
