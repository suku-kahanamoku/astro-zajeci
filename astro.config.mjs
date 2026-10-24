import { defineConfig } from "astro/config";
import node from "@astrojs/node";
import netlify from "@astrojs/netlify";
import pwa from "./integrations/pwa.mjs";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import { loadEnv } from "vite";
import { allowedDomains } from "./integrations/hosts.mjs";
export default defineConfig({
  site: "https://www.vinozezajeci.cz",
  output: "server",
  adapter:
    process.env.NETLIFY === "true"
      ? netlify({ imageCDN: false, devFeatures: false })
      : node({ mode: "standalone" }),
  integrations: [react(), pwa()],
  trailingSlash: "never",
  server: { port: 4321, host: "127.0.0.1" },
  security: {
    allowedDomains: allowedDomains(
      loadEnv(process.env.NODE_ENV || "production", process.cwd(), ""),
    ),
  },
  devToolbar: { enabled: false },
  vite: {
    plugins: [tailwindcss()],
    server: { strictPort: true },
    preview: { port: 4321, strictPort: true },
  },
});
