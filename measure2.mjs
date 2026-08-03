import { chromium } from "playwright";
import { pathToFileURL } from "url";
import { join } from "path";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  
  const LOCAL_URL = pathToFileURL(join(process.cwd(), "index.html")).href;
  await page.goto(LOCAL_URL, { waitUntil: "load" });

  const getRect = async (selector) => {
    return await page.evaluate((selector) => {
      const el = document.querySelector(selector);
      if (!el) return null;
      return el.getBoundingClientRect();
    }, selector);
  };

  console.log("Header:", await getRect('header'));
  console.log("Hero:", await getRect('.hero'));
  console.log("Value:", await getRect('.value'));
  console.log("Lawyers:", await getRect('.lawyers'));
  console.log("Footer:", await getRect('footer'));
  console.log("Body height:", await page.evaluate(() => document.body.scrollHeight));
  
  await browser.close();
})();
