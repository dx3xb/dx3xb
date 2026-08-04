import { expect, test } from "@playwright/test";
test("shows a recommendation feedback loop and escape controls", async ({ page }) => {
  await page.goto("/?lang=en&seed=e2e-feed");
  await expect(page.getByTestId("game-root")).toHaveAttribute("data-hydrated", "true");
  await page.getByRole("button", { name: "OPEN THE LAB FEED" }).click();
  for (let i = 0; i < 8; i += 1) await page.getByRole("button", { name: /MORE LIKE THIS/ }).click();
  await expect(page.getByText("YOUR FEED HAS SHIFTED")).toBeVisible();
  await page.getByRole("button", { name: "PICK 3 MOVES TO TAKE BACK CONTROL" }).click();
  const choices = page.locator(".choices button");
  for (let i = 0; i < 3; i += 1) await choices.nth(i).click();
  await page.getByRole("button", { name: "SUBMIT TAMING PLAN" }).click();
  await expect(page.getByText("FEED LAB REPORT")).toBeVisible();
  await expect(page.getByText("100%")).toBeVisible();
});

