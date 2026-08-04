import { expect, test } from "@playwright/test";

test("color hunter exposes a keyboard-operable board", async ({ page }) => {
  await page.goto("/?lang=zh&seed=e2e-color");
  await expect(page).toHaveTitle(/色差猎人 Color Hunter/);
  await expect(page.locator("html")).toHaveAttribute("lang", "zh");
  await expect(page.getByTestId("game-root")).toHaveAttribute("data-hydrated", "true");
  await page.getByRole("button", { name: "开始测试" }).click();

  const tiles = page.getByRole("button", { name: /color tile/i });
  await expect(tiles).toHaveCount(9);
  await tiles.first().focus();
  await expect(tiles.first()).toBeFocused();
});
