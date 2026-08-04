import { expect, test } from "@playwright/test";

test("home and studio remain usable with keyboard", async ({ page }) => {
  await page.goto("/?lang=zh");
  await expect(page.locator("html")).toHaveAttribute("lang", "zh");
  await expect(page.locator("body")).toBeVisible();
  await expect(page).toHaveTitle(/网络趣味工具铺/);
  await expect(page.getByLabel("Email")).toBeVisible();
  await page.keyboard.press("Tab");
  await expect(page.locator(":focus")).toBeVisible();
  await page.goto("/studio?lang=en");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page).toHaveTitle(/Studio/);
});

test("crawler discovery endpoints are available", async ({ request }) => {
  const home = await request.get("/?lang=zh");
  expect(home.status()).toBe(200);
  expect(await home.text()).toContain("色差猎人");

  const robots = await request.get("/robots.txt");
  expect(robots.status()).toBe(200);
  expect(await robots.text()).toContain("sitemap.xml");

  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.status()).toBe(200);
  expect(await sitemap.text()).toContain("https://dx3xb.com");
});

test("protected APIs reject missing credentials", async ({ request }) => {
  const library = await request.get("/api/me/library");
  expect(library.status()).toBe(401);
  const funnel = await request.post("/api/funnel", { data: { event: "workshop_enter", microappId: "123e4567-e89b-12d3-a456-426614174000" } });
  expect(funnel.status()).toBe(401);
  const classroom = await request.post("/api/classrooms", { data: { pack: "ai-foundations" } });
  expect(classroom.status()).toBe(401);
});

test("classroom mode states its privacy boundary and offers printable packs", async ({ page }) => {
  await page.goto("/class?lang=en");
  await expect(page.getByRole("heading", { name: /One code puts the whole class/ })).toBeVisible();
  await expect(page.getByText(/Students enter no names/)).toBeVisible();
  await expect(page.getByText("AI Foundations Trio")).toBeVisible();
  await page.getByRole("link", { name: /OPEN PRINTABLE ACTIVITY PACKS/ }).click();
  await expect(page.getByRole("heading", { name: "dx3xb AI Literacy Game Activity Pack" })).toBeVisible();
  await expect(page.getByText("MINOR-SAFETY BOUNDARIES")).toBeVisible();
});
