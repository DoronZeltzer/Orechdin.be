import { test, expect } from "@playwright/test";

// English is the master and the only language with approved text so far. Dutch and Hebrew routes
// exist and currently show the English text, declared as such (see lib/i18n-status.ts).
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

  test("a language without a translation says so and is not indexed", async ({ page }) => {
    await page.goto("/nl", { waitUntil: "load" });
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  });
});
