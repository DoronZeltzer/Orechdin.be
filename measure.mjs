import { chromium } from "playwright";
(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.route("**/*", route => {
    return route.request().resourceType() === "image" || route.request().resourceType() === "font" ? route.continue() : route.continue();
  });
  
  await page.goto("https://www.orechdin.be/", { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(3000); // wait for wix to init

  const getRect = async (selector) => {
    return await page.evaluate((selector) => {
      const el = document.querySelector(selector);
      if (!el) return null;
      return el.getBoundingClientRect();
    }, selector);
  };

  console.log("Header:", await getRect('header'));
  console.log("Section 1 (Hero):", await getRect('#comp-krkjmuob'));
  console.log("Section 2 (Value):", await getRect('#comp-lbqg7q0q'));
  console.log("Section 3 (Lawyers):", await getRect('#comp-lbqg7q0z'));
  console.log("Footer:", await getRect('footer'));
  console.log("Body height:", await page.evaluate(() => document.body.scrollHeight));
  
  await browser.close();
})();
