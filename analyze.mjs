import { chromium } from "playwright";
(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.goto("https://www.orechdin.be/", { waitUntil: "load", timeout: 60000 });

  const getStyle = async (selector, props) => {
    return await page.evaluate(({selector, props}) => {
      const el = document.querySelector(selector);
      if (!el) return null;
      const computed = window.getComputedStyle(el);
      let res = {};
      props.forEach(p => res[p] = computed[p]);
      const rect = el.getBoundingClientRect();
      res.width = rect.width;
      res.height = rect.height;
      return res;
    }, {selector, props});
  };

  const ctaStyle = await getStyle('a[href^="tel"]', ['backgroundColor', 'color', 'border', 'padding', 'fontSize', 'fontFamily', 'fontWeight', 'borderRadius', 'marginTop', 'lineHeight']);
  const titleStyle = await getStyle('h1', ['fontSize', 'fontWeight', 'letterSpacing', 'color', 'fontFamily', 'marginTop', 'marginBottom', 'lineHeight']);
  const headerStyle = await getStyle('header', ['height', 'padding', 'backgroundColor']);
  const logoStyle = await getStyle('header img', ['width', 'height']);
  const contactSpacing = await getStyle('.footer-block', ['marginTop', 'marginBottom', 'paddingTop', 'paddingBottom']);
  
  console.log("CTA:", ctaStyle);
  console.log("Title:", titleStyle);
  console.log("Header:", headerStyle);
  console.log("Logo:", logoStyle);
  console.log("Contact:", contactSpacing);
  
  await browser.close();
})();
