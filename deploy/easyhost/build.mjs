#!/usr/bin/env node
/**
 * Builds the website for ordinary web hosting (Easyhost): plain HTML files plus one PHP script for the
 * contact form. Nothing is uploaded and no DNS is touched; the result is a folder you upload yourself.
 *
 *   npm run build:easyhost            test build (hidden from search engines, address from --url)
 *   npm run build:easyhost -- --live  go-live build (https://www.orechdin.be, search engines allowed)
 *   npm run build:easyhost -- --url=https://orechdinbe.webhosting.be   test on Easyhost's temporary address
 *
 * How it works, so the main project stays exactly as it is for Vercel:
 *   1. copies the source into .static-build/ (a disposable folder, never the real project);
 *   2. in that copy only: removes what cannot run without a server (the /api route, the middleware, the
 *      on-demand image routes), adds the static settings and the pre-made share images;
 *   3. runs `next build` there, which writes plain files to .static-build/out;
 *   4. makes the photo sizes ahead of time (there is no image optimiser on ordinary hosting);
 *   5. assembles dist-easyhost/: www/ (upload into the site's /www folder), config/ (goes ABOVE www, holds
 *      the mail password) and INSTRUCTIONS.md.
 *
 * The two generated folders (.static-build and dist-easyhost) are rebuilt from scratch on every run, so the
 * script clears only those two folders and nothing else.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import sharp from "sharp";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..", "..");
const WORK = path.join(ROOT, ".static-build");
const DIST = path.join(ROOT, "dist-easyhost");

const args = process.argv.slice(2);
const live = args.includes("--live");
const urlArg = args.find((a) => a.startsWith("--url="))?.slice(6);
const SITE_URL = (urlArg || (live ? "https://www.orechdin.be" : "https://www.orechdin.be")).replace(/\/$/, "");
const ALLOW_INDEXING = live ? "true" : "false";

// Must match deviceSizes and imageSizes in overrides/next.config.ts.
const IMAGE_WIDTHS = [16, 32, 48, 64, 96, 128, 256, 640, 768, 1024, 1280, 1536];

const log = (m) => console.log(`\n▶ ${m}`);
const die = (m) => {
  console.error(`\n✖ ${m}`);
  process.exit(1);
};

function emptyDir(dir) {
  // Only ever called with WORK or DIST (checked here), the two folders this script owns.
  if (dir !== WORK && dir !== DIST) die(`refusing to clear ${dir}`);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
}

function copyTree(from, to, filter) {
  fs.cpSync(from, to, { recursive: true, filter });
}

/* ----------------------------------------------------------------------------- 1. copy the source */
log("Copying the source into .static-build/ (the real project is not touched)");
emptyDir(WORK);
const SKIP_TOP = new Set(["node_modules", ".next", ".git", ".static-build", "dist-easyhost", "out", ".claude", "deploy", "e2e", "docs", "test-results", "playwright-report"]);
// Entry by entry, because the copy lives inside the project folder and Node refuses to copy a folder into itself.
for (const entry of fs.readdirSync(ROOT)) {
  if (SKIP_TOP.has(entry)) continue;
  if (entry.startsWith(".env") && entry !== ".env.example") continue; // never copy secrets into a build
  if (entry.endsWith(".pdf") || entry.endsWith(".log")) continue;
  copyTree(path.join(ROOT, entry), path.join(WORK, entry), (src) => {
    const base = path.basename(src);
    return !(base.endsWith(".pdf") || base.endsWith(".log") || base === "node_modules");
  });
}
// Windows: link the installed packages instead of copying them.
fs.symlinkSync(path.join(ROOT, "node_modules"), path.join(WORK, "node_modules"), "junction");

/* ----------------------------------------------------------------------------- 2. static-only changes, in the copy */
log("Applying the static settings inside the copy");
for (const p of ["app/api", "middleware.ts", "app/opengraph-image.tsx", "app/twitter-image.tsx", "app/apple-icon.tsx"]) {
  fs.rmSync(path.join(WORK, p), { recursive: true, force: true }); // the COPY: these need a server
}
copyTree(path.join(HERE, "overrides"), WORK, () => true); // next.config.ts, image-loader.ts, app/*.png share images

/* ----------------------------------------------------------------------------- 3. build */
log(`Running next build (site address ${SITE_URL}, search engines ${live ? "allowed" : "blocked"})`);
const env = {
  ...process.env,
  NEXT_PUBLIC_SITE_URL: SITE_URL,
  NEXT_PUBLIC_ALLOW_INDEXING: ALLOW_INDEXING,
  NEXT_PUBLIC_TRAILING_SLASH: "true",
  NEXT_PUBLIC_HOSTING: "easyhost",
  NEXT_PUBLIC_CONTACT_ENDPOINT: "/api/contact.php",
  NEXT_TELEMETRY_DISABLED: "1",
};
const nextBin = path.join(ROOT, "node_modules", "next", "dist", "bin", "next");
const build = spawnSync(process.execPath, [nextBin, "build"], { cwd: WORK, env, stdio: "inherit" });
if (build.status !== 0) die("next build failed (see above)");
const OUT = path.join(WORK, "out");
if (!fs.existsSync(path.join(OUT, "en", "index.html"))) die("the build did not produce en/index.html");

/* ----------------------------------------------------------------------------- 4. photo sizes */
log("Making the photo sizes ahead of time");
const mediaDirs = ["media/site", "media/lawyers"];
let made = 0;
for (const dir of mediaDirs) {
  const abs = path.join(OUT, dir);
  if (!fs.existsSync(abs)) continue;
  for (const file of fs.readdirSync(abs)) {
    if (!/\.webp$/i.test(file) || /^logo-/.test(file) || /-w\d+\.webp$/.test(file)) continue;
    const input = path.join(abs, file);
    const stem = file.replace(/\.webp$/i, "");
    for (const w of IMAGE_WIDTHS) {
      await sharp(input).resize({ width: w, withoutEnlargement: true }).webp({ quality: 85 }).toFile(path.join(abs, `${stem}-w${w}.webp`));
      made++;
    }
  }
}
console.log(`  ${made} files`);

/* ----------------------------------------------------------------------------- 5. assemble */
log("Assembling dist-easyhost/");
emptyDir(DIST);
const WWW = path.join(DIST, "www");
copyTree(OUT, WWW, (src) => {
  // The large original PNG portraits are not used by the site; leave them out of the upload.
  return !(/media[\\/]lawyers[\\/].*\.png$/i.test(src));
});
// The site only uses the pre-made sizes (-wNNN), so the one very large original (the 1.6 MB hero photo) is left
// out of the upload. The small lawyer portraits stay: the structured data for search engines points at them.
for (const dir of mediaDirs) {
  const abs = path.join(WWW, dir);
  if (!fs.existsSync(abs)) continue;
  for (const file of fs.readdirSync(abs)) {
    const full = path.join(abs, file);
    if (/\.webp$/.test(file) && !/^logo-/.test(file) && !/-w\d+\.webp$/.test(file) && fs.statSync(full).size > 400 * 1024) {
      fs.rmSync(full, { force: true }); // inside dist-easyhost, a generated folder
    }
  }
}

const KIT = path.join(HERE, "kit");
fs.mkdirSync(path.join(WWW, "api"), { recursive: true });
fs.copyFileSync(path.join(KIT, "contact.php"), path.join(WWW, "api", "contact.php"));
fs.copyFileSync(path.join(KIT, "api.htaccess"), path.join(WWW, "api", ".htaccess"));
fs.copyFileSync(path.join(KIT, "site.htaccess"), path.join(WWW, ".htaccess"));
fs.mkdirSync(path.join(DIST, "config"), { recursive: true });
fs.copyFileSync(path.join(KIT, "orechdin-mail.sample.php"), path.join(DIST, "config", "orechdin-mail.sample.php"));
fs.copyFileSync(path.join(KIT, "nginx-snippet.conf"), path.join(DIST, "nginx-snippet.conf"));
fs.copyFileSync(path.join(KIT, "INSTRUCTIONS.md"), path.join(DIST, "INSTRUCTIONS.md"));

// The bare address and the five old Wix addresses. The .htaccess redirects them properly (301) when the
// server honours it; these small pages are the fallback that works on any server.
const stub = (target) =>
  `<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><title>ORECH/DIN</title>\n` +
  `<meta name="robots" content="noindex"><link rel="canonical" href="${SITE_URL}${target}">\n` +
  `<meta http-equiv="refresh" content="0; url=${target}"><script>location.replace(${JSON.stringify(target)});</script></head>\n` +
  `<body><p><a href="${target}">ORECH/DIN</a></p></body></html>\n`;
const stubs = {
  "index.html": "/en/",
  "the-office/index.html": "/en/office/",
  "services/index.html": "/en/services/",
  "contact-8/index.html": "/en/contact/",
  "privacy-policy/index.html": "/en/privacy/",
  "cookies/index.html": "/en/cookies/",
};
for (const [file, target] of Object.entries(stubs)) {
  const dest = path.join(WWW, file);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, stub(target));
}

/* ----------------------------------------------------------------------------- 6. checks */
log("Checking the result");
const must = [
  "index.html", "404.html", "robots.txt", "sitemap.xml", ".htaccess", "api/contact.php", "api/.htaccess",
  ...["en", "nl", "he"].flatMap((l) => ["", "services", "lawyers", "office", "contact", "privacy", "cookies", "legal-notice"].map((p) => path.posix.join(l, p, "index.html"))),
  "media/lawyers/nir-2026b-w640.webp", "media/lawyers/deborah-2026b-w640.webp", "media/site/antwerp-chambers-w1536.webp", "media/site/logo-orechdin.webp",
];
const missing = must.filter((f) => !fs.existsSync(path.join(WWW, f)));
if (missing.length) die(`missing from the result: ${missing.join(", ")}`);

let bytes = 0;
let files = 0;
(function walk(d) {
  for (const f of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, f.name);
    if (f.isDirectory()) walk(p);
    else {
      files++;
      bytes += fs.statSync(p).size;
    }
  }
})(WWW);
console.log(`  all ${must.length} required files present`);
console.log(`  www/: ${files} files, ${(bytes / 1048576).toFixed(1)} MB`);
console.log(`\n✔ Done: ${path.relative(ROOT, DIST)}${path.sep}  (see INSTRUCTIONS.md inside). Nothing was uploaded.`);
