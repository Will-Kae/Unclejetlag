// Copies self-hosted variable fonts from @fontsource-variable packages into src/app/fonts
// so next/font/local can bundle them (no build-time dependency on Google Fonts).
import fs from "node:fs";
import path from "node:path";

const map = {
  "@fontsource-variable/fraunces/files/fraunces-latin-standard-normal.woff2": "fraunces-standard-normal.woff2",
  "@fontsource-variable/fraunces/files/fraunces-latin-standard-italic.woff2": "fraunces-standard-italic.woff2",
  "@fontsource-variable/inter/files/inter-latin-wght-normal.woff2": "inter-wght-normal.woff2",
  "@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2": "jetbrains-mono-wght-normal.woff2",
};
const out = path.join(process.cwd(), "src/app/fonts");
fs.mkdirSync(out, { recursive: true });
for (const [src, dest] of Object.entries(map)) {
  fs.copyFileSync(path.join(process.cwd(), "node_modules", src), path.join(out, dest));
}
console.log("fonts copied");
