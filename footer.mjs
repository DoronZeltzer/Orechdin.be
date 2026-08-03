import { chromium } from "playwright";
(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.route("**/*", route => route.request().resourceType() === "image" || route.request().resourceType() === "font" ? route.continue() : route.continue());
  await page.goto("https://www.orechdin.be/", { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(2000); 

  console.log(await page.evaluate(() => {
    return document.querySelector('footer').innerHTML.replace(/<svg.*?<\/svg>/g, '');
  }));
  
  await browser.close();
})();
