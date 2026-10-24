import { fileURLToPath } from "node:url";
import { generateSW } from "workbox-build";

/** Match the original Nuxt PWA: auto updates and static assets, without a navigation fallback. */
export default function pwa() {
  let clientDir;
  return {
    name: "zajeci-pwa",
    hooks: {
      "astro:config:done": ({ config }) => {
        clientDir =
          config.output === "server"
            ? new URL(config.build.client, config.outDir)
            : config.outDir;
      },
      "astro:build:done": async ({ logger }) => {
        const result = await generateSW({
          globDirectory: fileURLToPath(clientDir),
          globPatterns: [
            "_astro/**/*.{js,css}",
            "favicon.ico",
            "manifest.webmanifest",
            "img/logo*.svg",
          ],
          swDest: fileURLToPath(new URL("sw.js", clientDir)),
          skipWaiting: true,
          clientsClaim: true,
          cleanupOutdatedCaches: true,
          navigateFallback: undefined,
          runtimeCaching: [],
          maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        });
        result.warnings.forEach((warning) => logger.warn(warning));
        logger.info(
          `PWA: precached ${result.count} static assets; API and HTML remain network-only.`,
        );
      },
    },
  };
}
