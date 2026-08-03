import { test, expect } from "@playwright/test";

const routes = ["/", "/lawyers", "/services", "/office", "/contact", "/privacy"];

test.describe("Orechdin production smoke", () => {
  for (const path of routes) {
    test(`renders ${path} with main landmark`, async ({ page }) => {
      await page.goto(path, { waitUntil: "load" });
      await expect(page.locator("#main-content")).toBeVisible();
    });
  }

  test("NEO panel opens with a quiet 1:1 chat surface", async ({ page }) => {
    await page.goto("/en", { waitUntil: "load" });
    await page.getByRole("button", { name: /open neo assistant/i }).click();

    const panel = page.getByRole("dialog", { name: /neo assistant/i });
    await expect(panel).toBeVisible();

    await expect(panel.getByText(/i'?m neo/i)).toBeVisible();
    await expect(panel.getByRole("button", { name: /what kind of cases/i })).toBeVisible();

    await expect(panel.getByRole("textbox", { name: /message/i })).toBeVisible();
    await expect(panel.getByRole("button", { name: /^send$/i })).toBeVisible();
  });

  test("NEO empty state contains no static phone, email, or address", async ({ page }) => {
    await page.goto("/en", { waitUntil: "load" });
    await page.getByRole("button", { name: /open neo assistant/i }).click();

    const panel = page.getByRole("dialog", { name: /neo assistant/i });
    await expect(panel).toBeVisible();

    await expect(panel.getByText("+32 3 227 50 57", { exact: false })).toHaveCount(0);
    await expect(panel.getByText("nirzeltzer@law-id.be", { exact: false })).toHaveCount(0);
    await expect(panel.getByText("Mechelsesteenweg", { exact: false })).toHaveCount(0);
  });

  test("NEO panel does not show legacy navigation chrome", async ({ page }) => {
    await page.goto("/en", { waitUntil: "load" });
    await page.getByRole("button", { name: /open neo assistant/i }).click();

    const panel = page.getByRole("dialog", { name: /neo assistant/i });
    await expect(panel).toBeVisible();

    await expect(panel.getByRole("tab", { name: /^routes$/i })).toHaveCount(0);
    await expect(panel.getByRole("tab", { name: /law skills/i })).toHaveCount(0);
    await expect(panel.getByRole("navigation", { name: /site routes from neo/i })).toHaveCount(0);
  });

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

  test("Case Room route renders with chat and case file", async ({ page }) => {
    await page.goto("/case", { waitUntil: "load" });
    await expect(page.locator("#main-content")).toBeVisible();

    await expect(page.getByText(/case room/i).first()).toBeVisible();
    await expect(page.getByRole("textbox", { name: /message/i })).toBeVisible();
    await expect(page.getByRole("complementary", { name: /case file/i })).toBeVisible();

    await expect(page.getByText("+32 3 227 50 57", { exact: false })).toHaveCount(0);
    await expect(page.getByText("info@orechdin.be", { exact: false })).toHaveCount(0);
  });

  test("expand button on the side panel opens the Case Room", async ({ page }) => {
    await page.goto("/en", { waitUntil: "load" });
    await page.getByRole("button", { name: /open neo assistant/i }).click();

    const panel = page.getByRole("dialog", { name: /neo assistant/i });
    await expect(panel).toBeVisible();

    // Keyboard accessibility: it is a real <a role="link"> with an
    // aria-label, so it is reachable via Tab and activatable via Enter.
    const expand = panel.getByRole("link", { name: /open the case room/i });
    await expect(expand).toBeVisible();
    await expand.click();

    await page.waitForURL(/\/case$/);
    await expect(page.getByRole("complementary", { name: /case file/i })).toBeVisible();
  });

  test("case file builds structured sections after a user message", async ({ page }) => {
    await page.goto("/en/case", { waitUntil: "load" });

    const dossier = page.getByRole("complementary", { name: /case file/i });
    await expect(dossier).toBeVisible();
    await expect(dossier.getByText(/nothing yet/i)).toBeVisible();

    const textbox = page.getByRole("textbox", { name: /message/i });
    await textbox.fill(
      "Last month my landlord in Antwerp tried to evict me without notice. Owe €1500 in deposit.",
    );
    await textbox.press("Enter");

    // Empty state goes away once the structured builder runs.
    await expect(dossier.getByText(/nothing yet/i)).toHaveCount(0, { timeout: 10_000 });

    // Cover section appears with a practice-area chip and the
    // visitor-quoted theme. The rental-disputes hint should fire.
    await expect(dossier.getByText(/cover/i).first()).toBeVisible();
    await expect(dossier.getByText(/rental disputes/i).first()).toBeVisible();

    // Hand-off block exposes the lawyer-facing PDF + Word actions.
    await expect(dossier.getByRole("button", { name: /download pdf/i })).toBeVisible();
    await expect(dossier.getByRole("button", { name: /download word/i })).toBeVisible();
  });

  test("paste-evidence widget exposes a textarea and add-as-evidence button", async ({ page }) => {
    await page.goto("/en/case", { waitUntil: "load" });
    await page.getByRole("button", { name: /paste evidence text/i }).click();
    await expect(page.getByRole("textbox", { name: /paste evidence text/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /add as evidence/i })).toBeVisible();
  });

  test("/api/neo/case-file returns a valid PDF binary", async ({ request }) => {
    const res = await request.post("/api/neo/case-file", {
      data: {
        format: "pdf",
        language: "English",
        messages: [
          {
            id: "m1",
            intake_draft_id: "d1",
            role: "user",
            content_redacted:
              "Last month my landlord in Antwerp tried to evict me without notice. I owe €1500 in deposit. Hearing 12/06/2026.",
            timestamp: "2026-04-19T10:00:00.000Z",
            sequence_no: 1,
          },
        ],
        files: [],
      },
    });
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("application/pdf");
    const body = await res.body();
    expect(body.byteLength).toBeGreaterThan(2000);
    // Every PDF starts with the magic bytes "%PDF-"
    expect(body.subarray(0, 5).toString("ascii")).toBe("%PDF-");
  });

  test("/api/neo/case-file returns a valid DOCX binary", async ({ request }) => {
    const res = await request.post("/api/neo/case-file", {
      data: {
        format: "docx",
        language: "English",
        messages: [
          {
            id: "m1",
            intake_draft_id: "d1",
            role: "user",
            content_redacted: "Quick test message for docx generation.",
            timestamp: "2026-04-19T10:00:00.000Z",
            sequence_no: 1,
          },
        ],
        files: [],
      },
    });
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain(
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    );
    const body = await res.body();
    expect(body.byteLength).toBeGreaterThan(2000);
    // .docx is a ZIP container — magic bytes are PK\x03\x04
    expect(body[0]).toBe(0x50);
    expect(body[1]).toBe(0x4b);
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

  const ROUTES = ["/", "/lawyers", "/services", "/office", "/contact", "/privacy"] as const;
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
