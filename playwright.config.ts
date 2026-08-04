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
    { command: "npm --prefix ai-truth-detective run dev -- --port 3104", url: "http://127.0.0.1:3104", reuseExistingServer, timeout: 120_000 },
    { command: "npm --prefix data-monster run dev -- --port 3105", url: "http://127.0.0.1:3105", reuseExistingServer, timeout: 120_000 },
    { command: "npm --prefix prompt-commander run dev -- --port 3106", url: "http://127.0.0.1:3106", reuseExistingServer, timeout: 120_000 },
    { command: "npm --prefix recommendation-tamer run dev -- --port 3107", url: "http://127.0.0.1:3107", reuseExistingServer, timeout: 120_000 },
    { command: "npm --prefix ai-court run dev -- --port 3108", url: "http://127.0.0.1:3108", reuseExistingServer, timeout: 120_000 },
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
      { name: "ai-detective-desktop", testMatch: /ai-truth-detective\.spec\.ts/, use: { ...devices["Desktop Chrome"], baseURL: "http://127.0.0.1:3104" } },
      { name: "ai-detective-mobile", testMatch: /ai-truth-detective\.spec\.ts/, use: { ...devices["Pixel 7"], baseURL: "http://127.0.0.1:3104" } },
      { name: "data-monster-desktop", testMatch: /data-monster\.spec\.ts/, use: { ...devices["Desktop Chrome"], baseURL: "http://127.0.0.1:3105" } },
      { name: "data-monster-mobile", testMatch: /data-monster\.spec\.ts/, use: { ...devices["Pixel 7"], baseURL: "http://127.0.0.1:3105" } },
      { name: "prompt-commander-desktop", testMatch: /prompt-commander\.spec\.ts/, use: { ...devices["Desktop Chrome"], baseURL: "http://127.0.0.1:3106" } },
      { name: "prompt-commander-mobile", testMatch: /prompt-commander\.spec\.ts/, use: { ...devices["Pixel 7"], baseURL: "http://127.0.0.1:3106" } },
      { name: "recommendation-tamer-desktop", testMatch: /recommendation-tamer\.spec\.ts/, use: { ...devices["Desktop Chrome"], baseURL: "http://127.0.0.1:3107" } },
      { name: "recommendation-tamer-mobile", testMatch: /recommendation-tamer\.spec\.ts/, use: { ...devices["Pixel 7"], baseURL: "http://127.0.0.1:3107" } },
      { name: "ai-court-desktop", testMatch: /ai-court\.spec\.ts/, use: { ...devices["Desktop Chrome"], baseURL: "http://127.0.0.1:3108" } },
      { name: "ai-court-mobile", testMatch: /ai-court\.spec\.ts/, use: { ...devices["Pixel 7"], baseURL: "http://127.0.0.1:3108" } },
    ] : []),
  ],
});
