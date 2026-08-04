import { expect, test } from "@playwright/test";

test("instant memory exposes a keyboard-operable input board", async ({ page }) => {
  await page.goto("/?lang=zh&seed=e2e-memory");
  await expect(page).toHaveTitle(/瞬间记忆 Instant Memory/);
  await expect(page.locator("html")).toHaveAttribute("lang", "zh");
  await expect(page.getByTestId("game-root")).toHaveAttribute("data-hydrated", "true");
  await page.getByRole("button", { name: "开始测试" }).click();

  const tiles = page.getByRole("button", { name: /memory tile/i });
  await expect(tiles).toHaveCount(9, { timeout: 5_000 });
  const firstTile = page.getByRole("button", { name: "memory tile 1", exact: true });
  await expect(firstTile).toBeEnabled();
  await firstTile.focus();
  await expect(firstTile).toBeFocused();
});
