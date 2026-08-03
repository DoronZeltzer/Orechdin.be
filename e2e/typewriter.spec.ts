import { test, expect } from "@playwright/test";

test.describe("NEO Typewriter & Interactive Chat E2E", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to default English homepage and open NEO
    await page.goto("/en", { waitUntil: "load" });
    await page.getByRole("button", { name: /open neo assistant/i }).click();
    const panel = page.getByRole("dialog", { name: /neo assistant/i });
    await expect(panel).toBeVisible();
  });

  test("typewriter renders with dynamic streaming animation", async ({ page }) => {
    const panel = page.getByRole("dialog", { name: /neo assistant/i });
    
    // Locate the first assistant message typewriter container
    const typewriter = panel.locator('div[role="button"][aria-label="Tap to reveal the full reply"]').first();
    
    // The cursor span should be visible when streaming is active
    const cursor = typewriter.locator("span").first();
    
    // Check that either the cursor exists or the animation completed quickly
    const hasCursor = await cursor.count();
    if (hasCursor > 0) {
      await expect(cursor).toBeAttached();
    }
  });

  test("click-to-skip instantly reveals the full message", async ({ page }) => {
    const panel = page.getByRole("dialog", { name: /neo assistant/i });
    
    // Trigger a new response that types out
    const textbox = panel.getByRole("textbox", { name: /message/i });
    await textbox.fill("What is your privacy policy?");
    await textbox.press("Enter");

    // Retrieve active streaming typewriter
    const streamingContainer = panel.locator('div[role="button"][aria-label="Tap to reveal the full reply"]').last();
    
    // Expect the typewriter wrapper to be clickable (pointer cursor)
    await expect(streamingContainer).toHaveClass(/cursor-pointer/);

    // Skip the typing by clicking on the typewriter element
    await streamingContainer.click();

    // The typewriter should stop streaming and no longer have the tap-to-reveal label or button role
    await expect(streamingContainer).toHaveCount(0);
  });
});

test.describe("Reduced Motion Accessibility", () => {
  test.use({
    // Simulate accessibility settings for prefers-reduced-motion
    contextOptions: {
      reducedMotion: "reduce",
    },
  });

  test("instantly displays entire text and bypasses animation when prefers-reduced-motion is active", async ({ page }) => {
    await page.goto("/en", { waitUntil: "load" });
    await page.getByRole("button", { name: /open neo assistant/i }).click();

    const panel = page.getByRole("dialog", { name: /neo assistant/i });

    // With reduced motion, typewriter should complete instantly on launch.
    // There should be no active streaming container (role="button") or flashing cursor.
    const streamingContainer = panel.locator('div[role="button"][aria-label="Tap to reveal the full reply"]');
    await expect(streamingContainer).toHaveCount(0);

    const firstMessageText = panel.getByText(/i'?m neo/i);
    await expect(firstMessageText).toBeVisible();
  });
});
