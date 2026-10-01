// Build step: downloads the freely licensed photos listed in src/data/photos.json
// from Wikimedia Commons into public/images/<key>.jpg. Never fails the build:
// a photo that can't be downloaded is simply skipped (the page falls back to its
// generated cover art).
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const OUT = path.join(process.cwd(), "public", "images");
const { photos } = JSON.parse(fs.readFileSync(path.join(process.cwd(), "src", "data", "photos.json"), "utf8"));
const UA = "UncleJetlagSiteBuild/1.0 (https://unclejetlag.com; info@unclejetlag.com)";
fs.mkdirSync(OUT, { recursive: true });

function candidates(file) {
  const name = file.replace(/ /g, "_");
  const md5 = crypto.createHash("md5").update(name, "utf8").digest("hex");
  const enc = encodeURIComponent(name);
  const dir = `${md5[0]}/${md5.slice(0, 2)}`;
  return [
    ...[1920, 1280].map((w) => `https://upload.wikimedia.org/wikipedia/commons/thumb/${dir}/${enc}/${w}px-${enc}`),
    `https://commons.wikimedia.org/wiki/Special:FilePath/${enc}?width=1920`,
    `https://upload.wikimedia.org/wikipedia/commons/${dir}/${enc}`,
  ];
}

async function get(url) {
  const res = await fetch(url, { headers: { "User-Agent": UA }, redirect: "follow", signal: AbortSignal.timeout(30000) });
  if (!res.ok) throw new Error(`${res.status}`);
  const type = res.headers.get("content-type") || "";
  if (!type.startsWith("image/")) throw new Error(`not an image (${type})`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 10000) throw new Error("too small");
  return buf;
}

let ok = 0;
for (const [key, p] of Object.entries(photos)) {
  const dest = path.join(OUT, `${key}.jpg`);
  if (fs.existsSync(dest)) { ok++; continue; }
  let done = false;
  for (const url of candidates(p.file)) {
    try {
      fs.writeFileSync(dest, await get(url));
      console.log(`photo ${key}: ${url}`);
      done = true;
      ok++;
      break;
    } catch (e) {
      console.log(`photo ${key}: ${url} failed (${e.message})`);
    }
  }
  if (!done) console.warn(`photo ${key}: SKIPPED, cover art will be used`);
}
console.log(`photos ready: ${ok}/${Object.keys(photos).length}`);
