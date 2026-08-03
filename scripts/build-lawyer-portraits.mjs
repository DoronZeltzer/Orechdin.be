/**
 * Optimises the firm-owned lawyer portraits.
 *
 * Sources are the original PNG files in /public/media/lawyers/ — these
 * are the photographs Nir + Deborah approved. We never re-fetch from a
 * third-party CDN: the law firm owns the visual identity end-to-end.
 *
 * Pipeline (deliberately conservative — no generative retouching):
 *   - rotate()         honour EXIF orientation
 *   - resize 1024w     retina-friendly editorial size, no enlargement
 *   - normalise()      gentle level expansion
 *   - sharpen()        subtle structural pop
 *   - webp(q=90)       modern format at high quality
 *
 *   npm run portraits:build
 */
import sharp from "sharp";
import { readFile, mkdir, writeFile } from "fs/promises";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const PORTRAITS_DIR = join(ROOT, "public", "media", "lawyers");

const SOURCES = [
  { slug: "nir", input: "nir.png" },
  { slug: "deborah", input: "deborah.png" },
];

const SIZE = 1024;

async function buildOne({ slug, input }) {
  const inputPath = join(PORTRAITS_DIR, input);
  const buf = await readFile(inputPath);

  const out = await sharp(buf)
    .rotate()
    .resize(SIZE, null, { withoutEnlargement: true })
    .normalise({ lower: 1, upper: 99 })
    .sharpen({ sigma: 0.45, m1: 0.45, m2: 2.5 })
    .webp({ quality: 90, effort: 5 })
    .toBuffer();

  const outputPath = join(PORTRAITS_DIR, `${slug}.webp`);
  await writeFile(outputPath, out);
  const kb = (out.length / 1024).toFixed(1);
  console.log(`Wrote ${outputPath} (${kb} KB)`);
}

await mkdir(PORTRAITS_DIR, { recursive: true });
for (const src of SOURCES) {
  await buildOne(src);
}
