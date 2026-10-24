import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/browser",
  fullyParallel: false,
  workers: 1,
  timeout: 30000,
  use: {
    baseURL: "http://127.0.0.3:4321",
    headless: true,
    trace: "retain-on-failure",
  },
  webServer: [
    {
      command: "node tests/mock-php.mjs",
      port: 8787,
      reuseExistingServer: false,
    },
    {
      command: "npm run dev -- --ignore-lock --host 127.0.0.3",
      url: "http://127.0.0.3:4321",
      reuseExistingServer: false,
      env: {
        PHP_API_BASE_URL: "",
        NUXT_PHP_API_BASE_URL: "http://127.0.0.1:8787/api",
        INTERNAL_API_KEY: "",
        NUXT_INTERNAL_API_KEY: "test-internal-key",
        FRONTEND_HOST: "https://unused-build-tenant.example",
        NUXT_FRONTEND_HOST: "https://www.vinozezajeci.cz",
        SESSION_SECRET: "",
        NUXT_SESSION_PASSWORD:
          "test-session-secret-only-for-offline-tests-12345678",
        PUBLIC_GTAG_ID: "",
        NUXT_PUBLIC_GTAG_ID: "",
        NUXT_OAUTH_GOOGLE_CLIENT_ID: "test-client",
        NUXT_OAUTH_GOOGLE_CLIENT_SECRET: "test-secret",
      },
    },
  ],
});
