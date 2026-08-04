import { expect, test } from "@playwright/test";
test("labels, trains and reports a real classifier", async ({ page }) => {
  await page.goto("/?lang=en&seed=e2e-data");
  await expect(page.getByTestId("game-root")).toHaveAttribute("data-hydrated", "true");
  await page.getByRole("button", { name: "START LABELING" }).click();
  for (let i = 0; i < 8; i += 1) await page.getByRole("button", { name: /MOMO/ }).click();
  await page.getByRole("button", { name: "RUN CLASSIFIER" }).click();
  await expect(page.getByText("TRAINING REPORT")).toBeVisible();
  await expect(page.getByText("test accuracy")).toBeVisible();
  await expect(page.getByText(/You supplied labels, trained a classifier/)).toBeVisible();
});
