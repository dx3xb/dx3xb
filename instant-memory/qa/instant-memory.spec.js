const { test, expect } = require("@playwright/test");

test("instant memory mobile flow", async ({ page }) => {
  const issues = [];
  page.on("console", (message) => {
    if (["warning", "error"].includes(message.type())) issues.push(`${message.type()}: ${message.text()}`);
  });
  page.on("pageerror", (error) => {
    issues.push(`pageerror: ${error.message}`);
  });

  await page.clock.install();
  await page.setViewportSize({ width: 390, height: 844 });
  const baseUrl = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3011";
  await page.goto(`${baseUrl}/?seed=qa-memory&score=900`);
  await expect(page.getByRole("heading", { name: "瞬间记忆" })).toBeVisible();
  await page.getByRole("button", { name: "开始测试" }).click();
  await page.clock.runFor(2500);
  await expect(page.locator(".roundMeta")).toContainText("输入");

  const labels = await page.locator(".memoryTile").evaluateAll((tiles) => {
    return tiles.map((tile) => ({
      label: tile.getAttribute("aria-label") || "",
      text: tile.textContent || "",
    }));
  });
  const sequence = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll(".memoryTile"));
    return Array.from(document.querySelectorAll(".progressDots span")).map((_, i) => {
      const active = buttons.findIndex((button) => button.classList.contains("active"));
      return active;
    });
  });
  expect(labels.length).toBeGreaterThanOrEqual(9);
  expect(sequence.length).toBeGreaterThan(0);

  const indices = await page.$$eval(".memoryTile", (buttons) => {
    const levelText = document.querySelector(".hud b")?.textContent || "1";
    const seed = "qa-memory";
    function hashString(input) {
      let hash = 2166136261;
      for (let i = 0; i < input.length; i += 1) {
        hash ^= input.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
      }
      return hash >>> 0;
    }
    function mulberry32(seedValue) {
      return () => {
        let t = (seedValue += 0x6d2b79f5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    }
    const level = Number(levelText);
    const rand = mulberry32(hashString(`${seed}:instant-memory:${level}`));
    const length = Math.max(3, Math.min(14, 3 + Math.floor((level - 1) / 2)));
    const boardSize = buttons.length;
    const out = [];
    for (let i = 0; i < length; i += 1) {
      let next = Math.floor(rand() * boardSize);
      if (out.length > 0 && next === out[out.length - 1]) {
        next = (next + 1 + Math.floor(rand() * (boardSize - 1))) % boardSize;
      }
      out.push(next);
    }
    return out;
  });

  for (const index of indices) {
    await page.locator(".memoryTile").nth(index).click();
  }

  await expect(page.locator(".hud")).toContainText("SCORE");
  await page.clock.runFor(61000);
  await page.getByPlaceholder("你的称呼").fill("QA");
  await page.getByRole("button", { name: "生成战报" }).click();
  await expect(page.locator(".reportCard")).toContainText("你打败了");
  await expect(page.locator(".reportCard")).toContainText("最长序列");
  await page.screenshot({ path: "/tmp/instant-memory-mobile.png", fullPage: true });
  expect(issues).toEqual([]);
});
