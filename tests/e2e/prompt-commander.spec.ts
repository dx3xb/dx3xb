import { expect, test } from "@playwright/test";
test("turns vague requests into executable mission specs", async ({ page }) => {
  await page.goto("/?lang=en&seed=e2e-prompt");
  await expect(page.getByTestId("game-root")).toHaveAttribute("data-hydrated", "true");
  await page.getByRole("button", { name: "TAKE COMMAND" }).click();
  for (let mission = 0; mission < 4; mission += 1) {
    const chips = page.locator(".chips button");
    for (let chip = 0; chip < 4; chip += 1) await chips.nth(chip).click();
    await page.getByRole("button", { name: "RUN COMMAND" }).click();
    await expect(page.getByText(/MISSION COMPLETE|ROBOT GOT STUCK/)).toBeVisible();
    await page.getByRole("button", { name: mission === 3 ? "OPEN COMMAND REPORT" : "NEXT MISSION" }).click();
  }
  await expect(page.getByText("COMMAND REPORT")).toBeVisible();
  await expect(page.getByRole("link", { name: "REMIX A TEMPLATE" })).toHaveAttribute("href", /remix=prompt-commander/);
});

