import { expect, test } from "@playwright/test";

test("reaction challenge is deterministic and keyboard operable", async ({ page }) => {
  const challenge = "/?lang=zh&seed=e2e-reaction&score=10&from=E2E";
  await page.goto(challenge);
  await expect(page).toHaveTitle(/不要点错 Don't Tap Wrong/);
  await expect(page.locator("html")).toHaveAttribute("lang", "zh");
  await expect(page.getByTestId("game-root")).toHaveAttribute("data-hydrated", "true");
  await expect(page.getByText(/同题战书/)).toBeVisible();
  await page.getByRole("button", { name: "开始挑战" }).click();

  const choices = page.getByRole("button", { name: /选项 \d/ });
  await expect(choices).toHaveCount(4);
  const firstRunLabels = await choices.evaluateAll((buttons) => buttons.map((button) => button.getAttribute("aria-label")));
  await choices.first().focus();
  await expect(choices.first()).toBeFocused();
  await page.keyboard.press("Enter");

  await page.goto(challenge);
  await expect(page.getByTestId("game-root")).toHaveAttribute("data-hydrated", "true");
  await expect(page.getByText(/同题战书/)).toBeVisible();
  await page.getByRole("button", { name: "开始挑战" }).click();
  const replayChoices = page.getByRole("button", { name: /选项 \d/ });
  await expect(replayChoices).toHaveCount(4);
  await expect.poll(() => replayChoices.evaluateAll((buttons) => buttons.map((button) => button.getAttribute("aria-label")))).toEqual(firstRunLabels);
});
