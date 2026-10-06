import { defineConfig } from "@playwright/test";
const webPort = process.env.E2E_WEB_PORT || "5174";
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 60000,
  use: {
    baseURL: `http://localhost:${webPort}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: [
    {
      command:
        "powershell -NoProfile -ExecutionPolicy Bypass -File ../wisdom-api/scripts/start-e2e.ps1",
      url: "http://localhost:18080/api/public/categories",
      env: { APP_ORIGIN: `http://localhost:${webPort}`, APP_URL: `http://localhost:${webPort}` },
      timeout: 120000,
      reuseExistingServer: false,
    },
    {
      command: `npm run dev -- --host 127.0.0.1 --port ${webPort} --strictPort`,
      url: `http://localhost:${webPort}`,
      env: { API_PROXY_TARGET: "http://localhost:18080", VITE_API_URL: "/api" },
      timeout: 60000,
      reuseExistingServer: false,
    },
  ],
});
