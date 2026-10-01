import { test, expect } from "@playwright/test";

const routes = ["/", "/lawyers", "/services", "/office", "/contact", "/privacy", "/cookies"];

test.describe("Orechdin production smoke", () => {
  for (const path of routes) {
    test(`renders ${path} with main landmark`, async ({ page }) => {
      await page.goto(path, { waitUntil: "load" });
      await expect(page.locator("#main-content")).toBeVisible();
    });
  }

  test("homepage surfaces firm details trust block (Dutch default)", async ({ page }) => {
    // The bare `/` route is locked to Dutch via i18n/routing.ts, so we
    // assert against the Dutch chrome strings directly.
    await page.goto("/", { waitUntil: "load" });
    await expect(
      page.getByRole("navigation", { name: "Hoofdsecties" }),
    ).toBeVisible();
    await expect(page.getByText("Kantoorgegevens", { exact: true })).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Nir Zeltzer", exact: false }).first(),
    ).toBeVisible();
  });


});

test.describe("Default landing locale", () => {
  // The site MUST serve Dutch HTML at the bare `/` route — i18n/routing.ts
  // is configured with defaultLocale: 'nl' + localePrefix: 'as-needed'.
  // This contract test guards that decision against accidental flips.
  test.use({ locale: "en", extraHTTPHeaders: { "Accept-Language": "en;q=1.0" } });

  test("/ serves <html lang='nl'> regardless of browser preference", async ({ page }) => {
    const response = await page.goto("/", { waitUntil: "load" });
    expect(response?.status()).toBe(200);
    await expect(page.locator("html")).toHaveAttribute("lang", "nl");
    await expect(page.getByRole("link", { name: "Naar hoofdinhoud" })).toBeAttached();
  });
});

test.describe("Internationalisation (nl/en/fr)", () => {
  // Markers picked from the always-present "skip to main content" link in
  // each locale's <body>. They are short, locale-distinct, and survive
  // wording changes elsewhere in the bundles.
  const SKIP: Record<"nl" | "en" | "fr", string> = {
    nl: "Naar hoofdinhoud",
    en: "Skip to main content",
    fr: "Aller au contenu principal",
  };

  const ROUTES = ["/", "/lawyers", "/services", "/office", "/contact", "/privacy", "/cookies"] as const;
  const LOCALES = ["nl", "en", "fr"] as const;

  for (const lang of LOCALES) {
    test.describe(`${lang.toUpperCase()} locale`, () => {
      // Using the official browser locale + a strict Accept-Language pin
      // makes next-intl middleware honour the URL prefix instead of
      // negotiating against the OS preference of the test runner.
      test.use({
        locale: lang,
        extraHTTPHeaders: { "Accept-Language": `${lang};q=1.0` },
      });

      for (const route of ROUTES) {
        const prefix = lang === "nl" ? "" : `/${lang}`;
        const url = route === "/" && prefix === "" ? "/" : `${prefix}${route}`;

        test(`serves ${url} with <html lang="${lang}"> and translated chrome`, async ({ page }) => {
          const response = await page.goto(url, { waitUntil: "load" });
          expect(response?.status()).toBe(200);
          await expect(page.locator("html")).toHaveAttribute("lang", lang);
          await expect(page.locator("#main-content")).toBeVisible();
          // The skip link is the locale's most stable marker.
          await expect(page.getByRole("link", { name: SKIP[lang] })).toBeAttached();
        });
      }
    });
  }

  test.describe("switcher", () => {
    test.use({ locale: "nl", extraHTTPHeaders: { "Accept-Language": "nl;q=1.0" } });

    test("preserves the current path across nl/en/fr", async ({ page }) => {
      await page.goto("/lawyers", { waitUntil: "load" });
      await expect(page.locator("html")).toHaveAttribute("lang", "nl");

      // The desktop switcher exposes three links labelled NL / EN / FR.
      // Both header instances (desktop + mobile) carry the same href so
      // .first() is enough.
      const enLink = page.getByRole("link", { name: /^en$/i }).first();
      const frLink = page.getByRole("link", { name: /^fr$/i }).first();
      await expect(enLink).toHaveAttribute("href", "/en/lawyers");
      await expect(frLink).toHaveAttribute("href", "/fr/lawyers");

      await frLink.click();
      await page.waitForURL(/\/fr\/lawyers$/);
      await expect(page.locator("html")).toHaveAttribute("lang", "fr");

      // From the French page, NL should link back to the bare /lawyers
      // (default locale, prefix-less under our `as-needed` strategy).
      const nlLink = page.getByRole("link", { name: /^nl$/i }).first();
      await expect(nlLink).toHaveAttribute("href", "/lawyers");
    });
  });
});
