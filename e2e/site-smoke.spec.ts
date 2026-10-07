import { test, expect } from "@playwright/test";

// English is the master. Dutch and Hebrew are translated from it (see lib/i18n-status.ts).
const LOCALES = ["en", "nl", "he"] as const;
const ROUTES = ["", "/services", "/lawyers", "/office", "/contact", "/privacy", "/cookies", "/legal-notice"] as const;

test.describe("ORECH/DIN smoke", () => {
  test("the bare address goes to /en", async ({ page }) => {
    await page.goto("/", { waitUntil: "load" });
    await expect(page).toHaveURL(/\/en$/);
  });

  for (const locale of LOCALES) {
    for (const route of ROUTES) {
      const url = `/${locale}${route}`;
      test(`renders ${url} with a main landmark`, async ({ page }) => {
        const response = await page.goto(url, { waitUntil: "load" });
        expect(response?.status()).toBe(200);
        await expect(page.locator("#main-content")).toBeVisible();
      });
    }
  }

  test("there is no French version", async ({ page }) => {
    const response = await page.goto("/fr", { waitUntil: "load" });
    expect(response?.status()).toBe(404);
  });

  test("the home page title and first-screen actions", async ({ page }) => {
    await page.goto("/en", { waitUntil: "load" });
    await expect(page).toHaveTitle("ORECH/DIN | Boutique Law Office in Antwerp, Belgium");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Legal assistance when it matters the most.");
    await expect(page.getByRole("link", { name: "Call us" }).first()).toHaveAttribute("href", /^tel:/);
    await expect(page.getByRole("link", { name: "Email us" }).first()).toHaveAttribute("href", /^mailto:/);
    await expect(page.getByRole("link", { name: "Send enquiry" }).first()).toHaveAttribute("href", /\/en\/contact#enquiry$/);
  });

  test("the language switch keeps the visitor on the same page", async ({ page }) => {
    await page.goto("/en/lawyers", { waitUntil: "load" });
    await expect(page.getByRole("link", { name: "NL", exact: true }).first()).toHaveAttribute("href", "/nl/lawyers");
    await expect(page.getByRole("link", { name: "HE", exact: true }).first()).toHaveAttribute("href", "/he/lawyers");
  });

  test("Dutch is left to right and Hebrew right to left, each in its own language", async ({ page }) => {
    await page.goto("/nl", { waitUntil: "load" });
    await expect(page.locator("html")).toHaveAttribute("lang", "nl");
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Juridische bijstand wanneer het er het meest toe doet.");

    await page.goto("/he", { waitUntil: "load" });
    await expect(page.locator("html")).toHaveAttribute("lang", "he");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("סיוע משפטי כשזה חשוב באמת.");
  });

  test("privacy and cookie policy: translated in Dutch, English-only with a Hebrew notice in Hebrew", async ({ page }) => {
    await page.goto("/nl/privacy", { waitUntil: "load" });
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Privacyverklaring");
    // Hebrew: a Hebrew notice above one English, left-to-right document.
    await page.goto("/he/cookies", { waitUntil: "load" });
    await expect(page.getByText("מדיניות העוגיות זמינה בשלב זה באנגלית בלבד.")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Cookie policy");
    await expect(page.locator('div[lang="en"][dir="ltr"]').first()).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  });
});
