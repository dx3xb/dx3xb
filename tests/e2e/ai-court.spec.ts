import { expect, test } from "@playwright/test";
test("balances metrics with human accountability", async ({ page }) => {
  await page.goto("/?lang=en&seed=e2e-court");
  await expect(page.getByTestId("game-root")).toHaveAttribute("data-hydrated", "true");
  await page.getByRole("button", { name: "COURT IS IN SESSION" }).click();
  for (let caseNo = 0; caseNo < 4; caseNo += 1) {
    await page.locator(".safeguards button").first().click();
    await page.getByRole("button", { name: "SUBMIT VERDICT" }).click();
    await expect(page.getByText(/EVIDENCE-BASED VERDICT|THIS VERDICT NEEDS REVIEW/)).toBeVisible();
    await page.getByRole("button", { name: caseNo === 3 ? "ISSUE FINAL REPORT" : "NEXT CASE" }).click();
  }
  await expect(page.getByText("AI COURT REPORT")).toBeVisible();
  await expect(page.getByText("ALL FIVE CHIPS COMPLETE")).toBeVisible();
});

