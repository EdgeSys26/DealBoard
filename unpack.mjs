import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";

const GH_PARTS =
  "https://raw.githubusercontent.com/EdgeSys26/DealBoard/cursor/deal-board-pwa-2e62/tgz-parts";

if (!existsSync("tgz-parts") || readdirSync("tgz-parts").length === 0) {
  mkdirSync("tgz-parts", { recursive: true });
  for (let i = 0; i < 32; i++) {
    const name = `p${String(i).padStart(2, "0")}`;
    try {
      execSync(`curl -fsSL "${GH_PARTS}/${name}" -o tgz-parts/${name}`, { stdio: "inherit" });
    } catch {
      break;
    }
  }
}

if (existsSync("tgz-parts")) {
  const parts = readdirSync("tgz-parts").sort();
  const b64 = parts.map((name) => readFileSync(`tgz-parts/${name}`, "utf8")).join("");
  writeFileSync("app.tgz", Buffer.from(b64, "base64"));
}
if (existsSync("app.tgz")) {
  execSync("tar -xzf app.tgz", { stdio: "inherit" });
}
