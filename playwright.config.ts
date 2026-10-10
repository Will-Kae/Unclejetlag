/**
 * Preservation harness (Phase 1A): end-to-end checks against a local production build.
 * Run `npm run build` first, then `npm run test:e2e`. Third-party hosts are blocked in every test
 * (see e2e/helpers.ts), so no partner service is contacted.
 */
import { defineConfig } from "@playwright/test";

const PORT = Number(process.env.HARNESS_PORT ?? 3210);

export default defineConfig({
  testDir: "e2e",
  timeout: 120_000,
  fullyParallel: true,
  workers: process.env.CI ? 2 : 4,
  retries: 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]] : "list",
  use: { baseURL: `http://127.0.0.1:${PORT}` },
  webServer: {
    command: `npx next start -p ${PORT}`,
    url: `http://127.0.0.1:${PORT}/robots.txt`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
