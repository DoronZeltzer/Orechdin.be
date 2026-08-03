/**
 * Capture full-page screenshots at fixed widths for parity diffing.
 * Targets homepage only: live https://www.orechdin.be/ and local index.html.
 * Dismisses common consent banners before capture to reduce noise vs clone.
 * Uses Chromium --hide-scrollbars plus injected CSS so live/clone widths align closer at 1024px (no gutter drift).
 *
 * Usage: node scripts/capture.mjs live | local | all
 * Output: snapshots/screens/live/<width>.png and snapshots/screens/clone/<width>.png
 */
import { chromium } from "playwright";
import { mkdir } from "fs/promises";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { pathToFileURL } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const WIDTHS = [1440, 1280, 1024, 768, 430, 390];
const LIVE_URL = "https://www.orechdin.be/";
const LOCAL_URL = pathToFileURL(join(ROOT, "index.html")).href;

async function dismissConsent(page) {
  const candidates = [
    page.getByRole("button", { name: /accept all/i }),
    page.getByRole("button", { name: /^accept$/i }),
    page.locator('[data-testid="consent-banner-accept"]'),
    page.locator("button:has-text(\"Accept\")").first(),
  ];
  for (const loc of candidates) {
    try {
      const el = loc.first();
      if (await el.isVisible({ timeout: 800 })) {
        await el.click({ timeout: 2000 });
        await new Promise((r) => setTimeout(r, 400));
        return;
      }
    } catch {
      /* try next */
    }
  }
}

const SCROLLBAR_HIDE_CSS = `
  html { scrollbar-gutter: stable; }
  * { scrollbar-width: none; }
  *::-webkit-scrollbar { width: 0 !important; height: 0 !important; }
`;

async function captureSet(label, startUrl) {
  const outDir = join(ROOT, "snapshots", "screens", label);
  await mkdir(outDir, { recursive: true });
  const browser = await chromium.launch({
    headless: true,
    args: ["--hide-scrollbars", "--force-device-scale-factor=1"],
  });
  try {
    for (const width of WIDTHS) {
      const context = await browser.newContext({
        viewport: { width, height: 900 },
        deviceScaleFactor: 1,
        ignoreHTTPSErrors: true,
      });
      const page = await context.newPage();
      await page.goto(startUrl, { waitUntil: "load", timeout: 120000 });
      await page.addStyleTag({ content: SCROLLBAR_HIDE_CSS });
      try {
        await page.evaluate(() => document.fonts.ready);
      } catch {
        /* file:// or older engines */
      }
      const delayMs = startUrl.startsWith("http") ? 2200 : 500;
      await new Promise((r) => setTimeout(r, delayMs));
      if (startUrl.startsWith("http")) {
        await dismissConsent(page);
      }
      await new Promise((r) => setTimeout(r, 500));
      const path = join(outDir, `${width}.png`);
      await page.screenshot({ path, fullPage: true, animations: "disabled" });
      await context.close();
    }
  } finally {
    await browser.close();
  }
}

const mode = (process.argv[2] || "all").toLowerCase();
if (mode === "live") {
  await captureSet("live", LIVE_URL);
} else if (mode === "local") {
  await captureSet("clone", LOCAL_URL);
} else if (mode === "all") {
  await captureSet("live", LIVE_URL);
  await captureSet("clone", LOCAL_URL);
} else {
  console.error("Usage: node scripts/capture.mjs [live|local|all]");
  process.exit(1);
}
