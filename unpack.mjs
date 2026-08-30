import { execSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";

if (existsSync("tgz-parts")) {
  const parts = readdirSync("tgz-parts").sort();
  const b64 = parts.map((name) => readFileSync(`tgz-parts/${name}`, "utf8")).join("");
  writeFileSync("app.tgz", Buffer.from(b64, "base64"));
}
if (existsSync("app.tgz")) {
  execSync("tar -xzf app.tgz", { stdio: "inherit" });
}
