import { defineConfig } from "@playwright/test";

const port = process.env.PLAYWRIGHT_PORT ?? "3001";
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  workers: 1,
  reporter: "list",
  use: {
    baseURL,
    browserName: "chromium",
    viewport: { width: 1440, height: 960 },
    trace: "retain-on-failure",
  },
  webServer: {
    command: `PORT=${port} corepack pnpm dev --hostname 127.0.0.1`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
