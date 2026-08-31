import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";

const GH_REF = process.env.DEALBOARD_BUNDLE_REF || "cursor/deal-board-pwa-2e62";
const GH_PARTS = `https://raw.githubusercontent.com/EdgeSys26/DealBoard/${GH_REF}/tgz-parts`;

// Vercel build cache can restore a stale tgz-parts dir. Always refetch.
if (existsSync("tgz-parts")) {
  rmSync("tgz-parts", { recursive: true, force: true });
}
mkdirSync("tgz-parts", { recursive: true });
for (let i = 0; i < 32; i++) {
  const name = `p${String(i).padStart(2, "0")}`;
  try {
    execSync(`curl -fsSL "${GH_PARTS}/${name}" -o tgz-parts/${name}`, { stdio: "inherit" });
  } catch {
    if (existsSync(`tgz-parts/${name}`)) rmSync(`tgz-parts/${name}`);
    break;
  }
}
if (readdirSync("tgz-parts").length === 0) {
  throw new Error(`Failed to download app bundle from ${GH_PARTS}`);
}

if (existsSync("tgz-parts")) {
  const parts = readdirSync("tgz-parts").sort();
  const b64 = parts.map((name) => readFileSync(`tgz-parts/${name}`, "utf8")).join("");
  writeFileSync("app.tgz", Buffer.from(b64, "base64"));
}
if (existsSync("app.tgz")) {
  execSync("tar -xzf app.tgz", { stdio: "inherit" });
}
