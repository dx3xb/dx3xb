const { test, expect } = require("@playwright/test");

test("color hunter mobile flow", async ({ page }) => {
  const issues = [];
  page.on("console", (message) => {
    if (["warning", "error"].includes(message.type())) issues.push(`${message.type()}: ${message.text()}`);
  });
  page.on("pageerror", (error) => {
    issues.push(`pageerror: ${error.message}`);
  });

  await page.clock.install();
  await page.setViewportSize({ width: 390, height: 844 });
  const baseUrl = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3010";
  await page.goto(`${baseUrl}/?seed=qa-seed&score=1200`);
  await expect(page.getByRole("heading", { name: "色差猎人" })).toBeVisible();
  await page.getByRole("button", { name: "开始测试" }).click();

  for (let level = 0; level < 8; level += 1) {
    await page.waitForSelector(".swatch");
    const index = await page.$$eval(".swatch", (buttons) => {
      const colors = buttons.map((button) => getComputedStyle(button).backgroundColor);
      const counts = new Map();
      for (const color of colors) counts.set(color, (counts.get(color) || 0) + 1);
      return colors.findIndex((color) => counts.get(color) === 1);
    });
    expect(index).toBeGreaterThanOrEqual(0);
    await page.locator(".swatch").nth(index).click();
  }

  await expect(page.locator(".hud")).toContainText("SCORE");
  await page.clock.runFor(61000);
  await expect(page.locator(".reportCard")).toContainText("你打败了");
  await expect(page.locator(".reportCard")).toContainText("最小色差");
  await page.screenshot({ path: "/tmp/color-hunter-mobile.png", fullPage: true });
  expect(issues).toEqual([]);
});
