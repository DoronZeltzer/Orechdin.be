/**
 * Pixel-diff live vs clone PNGs in snapshots/screens/.
 * Crops both to min(width) x min(height) so full-page captures with different heights still diff.
 * When the live Wix page renders wider than the viewport (e.g. min-width ~980px), live PNG width can
 * still exceed the clone width; capture.mjs mitigates scrollbar gutter drift but not Wix horizontal overflow.
 * This tool diffs the overlapping top-left region only - expect noise on narrow widths when live is wider.
 * Output: snapshots/screens/diff/<width>.png
 * Usage: node scripts/diff-screens.mjs
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const WIDTHS = [1440, 1280, 1024, 768, 430, 390];
const liveDir = join(ROOT, "snapshots", "screens", "live");
const cloneDir = join(ROOT, "snapshots", "screens", "clone");
const diffDir = join(ROOT, "snapshots", "screens", "diff");
mkdirSync(diffDir, { recursive: true });

function cropPng(src, w, h) {
  const out = new PNG({ width: w, height: h });
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const si = (src.width * y + x) << 2;
      const oi = (w * y + x) << 2;
      out.data[oi] = src.data[si];
      out.data[oi + 1] = src.data[si + 1];
      out.data[oi + 2] = src.data[si + 2];
      out.data[oi + 3] = src.data[si + 3];
    }
  }
  return out;
}

let any = false;
for (const label of WIDTHS) {
  const aPath = join(liveDir, `${label}.png`);
  const bPath = join(cloneDir, `${label}.png`);
  if (!existsSync(aPath) || !existsSync(bPath)) {
    console.warn(`Skip ${label}: missing ${!existsSync(aPath) ? aPath : bPath}`);
    continue;
  }
  any = true;
  const img1 = PNG.sync.read(readFileSync(aPath));
  const img2 = PNG.sync.read(readFileSync(bPath));
  const width = Math.min(img1.width, img2.width);
  const height = Math.min(img1.height, img2.height);
  if (img1.height !== img2.height || img1.width !== img2.width) {
    console.warn(
      `${label}px: crop to ${width}x${height} (live ${img1.width}x${img1.height}, clone ${img2.width}x${img2.height})`,
    );
  }
  const c1 = cropPng(img1, width, height);
  const c2 = cropPng(img2, width, height);
  const diff = new PNG({ width, height });
  const numDiff = pixelmatch(c1.data, c2.data, diff.data, width, height, {
    threshold: 0.12,
    includeAA: false,
  });
  writeFileSync(join(diffDir, `${label}.png`), PNG.sync.write(diff));
  console.log(`${label}px: ${numDiff} differing pixels`);
}
if (!any) {
  console.error("No image pairs found. Run: npm run capture");
  process.exit(1);
}
