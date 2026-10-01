// Deploy helper: reassembles brotli-compressed tar chunks and extracts them.
// Newest patch first; each later step only fills in files not already present.
// Files uploaded directly (e.g. daily update posts in content/articles) always win.
import fs from "node:fs";
import zlib from "node:zlib";
import { execSync } from "node:child_process";
function unpack(dir, prefix, flags) {
  if (!fs.existsSync(dir)) return;
  const parts = fs.readdirSync(dir).filter((f) => f.startsWith(prefix)).sort();
  const buf = Buffer.concat(parts.map((p) => fs.readFileSync(`${dir}/${p}`)));
  fs.writeFileSync(`${dir}.tar`, zlib.brotliDecompressSync(buf));
  execSync(`tar ${flags} -xf ${dir}.tar`, { stdio: "inherit" });
  fs.rmSync(dir, { recursive: true, force: true });
  fs.rmSync(`${dir}.tar`);
  console.log(`unpacked ${parts.length} ${dir} parts`);
}
unpack("patch11", "a-", "--skip-old-files");
unpack("patch10", "z-", "--skip-old-files");
unpack("patch9", "y-", "--skip-old-files");
unpack("patch8", "x-", "--skip-old-files");
unpack("patch7", "w-", "--skip-old-files");
unpack("patch6", "v-", "--skip-old-files");
unpack("patch5", "t-", "--skip-old-files");
unpack("patch4", "s-", "--skip-old-files");
unpack("bundle", "part-", "--skip-old-files");
