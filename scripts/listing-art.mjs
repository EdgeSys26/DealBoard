import { writeFileSync, mkdirSync } from "node:fs";

function house(bg, roof, body, label) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 520">
  <rect width="800" height="520" fill="${bg}"/>
  <rect x="0" y="360" width="800" height="160" fill="#c5c9b8"/>
  <polygon points="160,260 400,110 640,260" fill="${roof}"/>
  <rect x="210" y="260" width="380" height="200" fill="${body}"/>
  <rect x="360" y="330" width="80" height="130" fill="#2b2f3a"/>
  <rect x="250" y="300" width="70" height="60" fill="#dbe7ff"/>
  <rect x="480" y="300" width="70" height="60" fill="#dbe7ff"/>
  <text x="400" y="44" text-anchor="middle" fill="#14161c" font-family="Arial" font-size="22" font-weight="700">${label}</text>
</svg>`;
}

mkdirSync("public/listings", { recursive: true });
const files = {
  "pleasant-1.svg": house("#d7e4f4", "#3d4a63", "#f3efe8", "1847 Pleasant St"),
  "pleasant-2.svg": house("#cfd8c4", "#5a4638", "#efe6d6", "Kitchen / living"),
  "pleasant-3.svg": house("#e4d8c8", "#6b3b2a", "#f7f1ea", "Rear yard"),
  "pleasant-4.svg": house("#d9d2e8", "#2f3e56", "#f4f0ea", "Street view"),
  "cicero-1.svg": house("#dde6f0", "#2c3a4d", "#f6f3ee", "622 Cicero Ave"),
  "cicero-2.svg": house("#e8dcc8", "#4a372c", "#fff8ef", "Front porch"),
  "cicero-3.svg": house("#d3e0d6", "#3e5344", "#f3eee6", "Interior"),
  "harbour-1.svg": house("#e7e1d4", "#6d5b45", "#f8f4ee", "401 Harbour Trees"),
  "harbour-2.svg": house("#d8e4ea", "#4b5d6b", "#f5f7f8", "Condo front"),
  "new-1.svg": house("#e8e8ed", "#1A4DFF", "#ffffff", "New listing"),
};
for (const [name, svg] of Object.entries(files)) {
  writeFileSync(`public/listings/${name}`, svg);
}
console.log("wrote listing art");
