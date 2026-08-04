import { expect, test } from "@playwright/test";
import { CASES_PER_RUN, casesForSeed } from "../../ai-truth-detective/app/game";

test("AI detective completes a deterministic keyboard-operable case set", async ({ page }) => {
  const seed = "e2e-ai-detective";
  const cases = casesForSeed(seed);
  await page.goto(`/?lang=zh&seed=${seed}`);
  await expect(page).toHaveTitle(/AI 侦探社/);
  await expect(page.locator("html")).toHaveAttribute("lang", "zh");
  await expect(page.getByTestId("game-root")).toHaveAttribute("data-hydrated", "true");
  await page.getByRole("button", { name: "开始查案" }).click();

  for (let index = 0; index < CASES_PER_RUN; index += 1) {
    const claims = page.getByRole("button", { name: /claim \d:/i });
    await expect(claims).toHaveCount(3);
    await claims.first().focus();
    await expect(claims.first()).toBeFocused();
    await page.getByRole("button", { name: new RegExp(`^claim ${cases[index].unreliable + 1}:`, "i") }).click();
    await expect(page.getByText("判断成立")).toBeVisible();
    await page.getByRole("button", { name: index === CASES_PER_RUN - 1 ? "查看侦探报告 →" : "下一案 →" }).click();
  }

  await expect(page.getByText("核验掌握度")).toBeVisible();
  await expect(page.locator(".passport h3")).toHaveText(/证据芯片已点亮|正在保存本局记录…/);
});
