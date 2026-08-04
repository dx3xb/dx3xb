import { defineConfig, devices } from "@playwright/test";

const externalBaseUrl = process.env.PLAYWRIGHT_BASE_URL;
const reuseExistingServer = !process.env.CI;

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 45_000,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : 4,
  expect: { timeout: 15_000 },
  use: { trace: "retain-on-failure" },
  webServer: externalBaseUrl ? undefined : [
    { command: "npm run dev -- --port 3100", url: "http://127.0.0.1:3100", reuseExistingServer, timeout: 120_000 },
    { command: "npm --prefix color-hunter run dev -- --port 3101", url: "http://127.0.0.1:3101", reuseExistingServer, timeout: 120_000 },
    { command: "npm --prefix dont-click-wrong run dev -- --port 3102", url: "http://127.0.0.1:3102", reuseExistingServer, timeout: 120_000 },
    { command: "npm --prefix instant-memory run dev -- --port 3103", url: "http://127.0.0.1:3103", reuseExistingServer, timeout: 120_000 },
  ],
  projects: [
    {
      name: "desktop",
      testMatch: /smoke\.spec\.ts/,
      use: { ...devices["Desktop Chrome"], baseURL: externalBaseUrl || "http://127.0.0.1:3100" },
    },
    {
      name: "mobile",
      testMatch: /smoke\.spec\.ts/,
      use: { ...devices["Pixel 7"], baseURL: externalBaseUrl || "http://127.0.0.1:3100" },
    },
    ...(!externalBaseUrl ? [
      { name: "color-desktop", testMatch: /color-hunter\.spec\.ts/, use: { ...devices["Desktop Chrome"], baseURL: "http://127.0.0.1:3101" } },
      { name: "color-mobile", testMatch: /color-hunter\.spec\.ts/, use: { ...devices["Pixel 7"], baseURL: "http://127.0.0.1:3101" } },
      { name: "reaction-desktop", testMatch: /dont-click-wrong\.spec\.ts/, use: { ...devices["Desktop Chrome"], baseURL: "http://127.0.0.1:3102" } },
      { name: "reaction-mobile", testMatch: /dont-click-wrong\.spec\.ts/, use: { ...devices["Pixel 7"], baseURL: "http://127.0.0.1:3102" } },
      { name: "memory-desktop", testMatch: /instant-memory\.spec\.ts/, use: { ...devices["Desktop Chrome"], baseURL: "http://127.0.0.1:3103" } },
      { name: "memory-mobile", testMatch: /instant-memory\.spec\.ts/, use: { ...devices["Pixel 7"], baseURL: "http://127.0.0.1:3103" } },
    ] : []),
  ],
});
