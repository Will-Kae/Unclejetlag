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
  // Keep CI browser tests isolated: long consent navigation sweeps can compete for
  // the same Next.js server and trigger page.goto aborts under concurrent load.
  // Preserve parallel local development runs; CI prioritizes reliable evidence.
  fullyParallel: !process.env.CI,
  workers: process.env.CI ? 1 : 4,
  retries: 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]] : "list",
  use: { baseURL: `http://127.0.0.1:${PORT}` },
  webServer: {
    command: `npx next start -H 127.0.0.1 -p ${PORT}`,
    url: `http://127.0.0.1:${PORT}/robots.txt`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
