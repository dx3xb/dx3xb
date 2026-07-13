import { expect, test } from "@playwright/test";

test("home and studio remain usable with keyboard", async ({ page }) => {
  await page.goto("/?lang=zh");
  await expect(page.locator("html")).toHaveAttribute("lang", "zh");
  await expect(page.locator("body")).toBeVisible();
  await page.keyboard.press("Tab");
  await expect(page.locator(":focus")).toBeVisible();
  await page.goto("/studio?lang=en");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
});

test("protected APIs reject missing credentials", async ({ request }) => {
  const library = await request.get("/api/me/library");
  expect(library.status()).toBe(401);
  const funnel = await request.post("/api/funnel", { data: { event: "workshop_enter", microappId: "123e4567-e89b-12d3-a456-426614174000" } });
  expect(funnel.status()).toBe(401);
});
