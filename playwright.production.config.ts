import { defineConfig } from "@playwright/test";
import base from "./playwright.config";
const servers = Array.isArray(base.webServer)
  ? base.webServer
  : [base.webServer!];
export default defineConfig({
  ...base,
  webServer: servers.map((server) =>
    server.command.includes("npm run dev")
      ? {
          ...server,
          command: "node dist/server/entry.mjs",
          env: { ...server.env, HOST: "127.0.0.3", PORT: "4321" },
        }
      : server,
  ),
});
