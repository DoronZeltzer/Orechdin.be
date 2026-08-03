import { chromium } from "playwright";
(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.goto("file:///D:/GITHUB RESPIRATORY/NIR-WEBSITE/snapshots/homepage-verified.html");

  const getStyle = async (selector, props) => {
    return await page.evaluate(({selector, props}) => {
      const el = document.querySelector(selector);
      if (!el) return null;
      const computed = window.getComputedStyle(el);
      let res = {};
      props.forEach(p => res[p] = computed[p]);
      const rect = el.getBoundingClientRect();
      res.rect = rect;
      return res;
    }, {selector, props});
  };

  const navLinks = await getStyle('.wixui-dropdown-menu__item a', ['fontSize', 'fontFamily', 'color', 'padding', 'margin']);
  const titleStyle = await getStyle('h2.wixui-rich-text__text', ['fontSize', 'fontWeight', 'letterSpacing', 'color', 'fontFamily', 'marginTop', 'marginBottom', 'lineHeight']);
  const textSpacing = await getStyle('#comp-lbt3ma77', ['marginTop', 'marginBottom', 'paddingTop', 'paddingBottom']);
  const ctaContainer = await getStyle('#comp-lbqgdmy9', ['marginTop']);
  const section1 = await getStyle('#comp-krkjmuob', ['paddingTop', 'paddingBottom']);
  const heroSection = await getStyle('#comp-lbt3ma30', ['paddingTop', 'paddingBottom', 'height']);
  const lawyersSection = await getStyle('#comp-lbqg7q0z', ['paddingTop', 'paddingBottom', 'height']);
  const footer = await getStyle('#comp-kvhdbigk', ['height', 'paddingTop', 'paddingBottom']);

  console.log("Nav:", navLinks);
  console.log("Title:", titleStyle);
  console.log("Title container:", textSpacing);
  console.log("CTA container margin top:", ctaContainer);
  console.log("Header Section:", section1);
  console.log("Hero Section:", heroSection);
  console.log("Lawyers Section:", lawyersSection);
  console.log("Footer:", footer);
  
  await browser.close();
})();
