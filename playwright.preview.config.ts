/** Opt-in external preview audit. Never starts or deploys a server. */
import { defineConfig } from "@playwright/test";
const baseURL = process.env.PREVIEW_AUDIT_URL;
if (!baseURL) throw new Error("Set PREVIEW_AUDIT_URL to the deployment whose commit you verified.");
const url = new URL(baseURL);
if (url.protocol !== "https:" || !url.hostname.endsWith(".vercel.app")) {
  throw new Error("Preview audit requires an HTTPS vercel.app URL; production domains are rejected.");
}
if (!process.env.PREVIEW_AUDIT_COMMIT) throw new Error("Set PREVIEW_AUDIT_COMMIT after confirming the deployment commit.");
export default defineConfig({
  testDir: "preview-audit",
  timeout: 90_000,
  workers: 1,
  retries: 0,
  reporter: [["list"], ["html", { outputFolder: "preview-audit-report", open: "never" }]],
  use: { baseURL, trace: "on", screenshot: "on", serviceWorkers: "block" },
  outputDir: "preview-audit-results",
});
