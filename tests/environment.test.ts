import { test } from "node:test";
import assert from "node:assert/strict";
import { environmentValue, sessionKey } from "../src/server/config";
import { allowedDomains } from "../integrations/hosts.mjs";

test("original .env names work and Nuxt runtime overrides take precedence", () => {
  const built: Record<string, string> = {
    PHP_API_BASE_URL: "https://old-api.example/api",
    FRONTEND_HOST: "https://vinozezajeci.cz",
    INTERNAL_API_KEY: "build-key",
    PHP_FILE_ROOT: "/original/php",
    NUXT_PUBLIC_GTAG_ID: "G-ORIGINAL",
  };
  const runtime: Record<string, string> = {
    NUXT_PHP_API_BASE_URL: "https://runtime-api.example/api",
    NUXT_INTERNAL_API_KEY: "runtime-key",
    INTERNAL_API_KEY: "raw-runtime-key",
    FRONTEND_HOST: "https://tenant.example",
  };
  const read = (name: string) =>
    environmentValue(name, [(key) => runtime[key], (key) => built[key]]);
  assert.equal(read("PHP_API_BASE_URL"), runtime.NUXT_PHP_API_BASE_URL);
  assert.equal(read("INTERNAL_API_KEY"), runtime.NUXT_INTERNAL_API_KEY);
  assert.equal(read("FRONTEND_HOST"), runtime.FRONTEND_HOST);
  assert.equal(read("PHP_FILE_ROOT"), built.PHP_FILE_ROOT);
  assert.equal(read("NUXT_PUBLIC_GTAG_ID"), built.NUXT_PUBLIC_GTAG_ID);
  assert.equal(environmentValue("missing", [], "fallback"), "fallback");
});

test("sessions reuse existing secrets without requiring a new environment variable", () => {
  const password = "old-nuxt-session-password-at-least-32-characters";
  const read = (values: Record<string, string>) => (name: string) =>
    environmentValue(name, [(key) => values[key]]);
  const original = sessionKey(read({ NUXT_SESSION_PASSWORD: password }));
  assert.deepEqual(original, sessionKey(read({ SESSION_SECRET: password })));
  assert.deepEqual(
    original,
    sessionKey(
      read({
        NUXT_SESSION_PASSWORD: password,
        SESSION_SECRET: "different-but-valid-secret-with-32-characters",
      }),
    ),
  );
  const derived = sessionKey(
    read({ INTERNAL_API_KEY: "existing-private-backend-key" }),
  );
  assert.equal(derived.length, 32);
  assert.deepEqual(
    derived,
    sessionKey(read({ NUXT_INTERNAL_API_KEY: "existing-private-backend-key" })),
  );
  assert.notDeepEqual(
    derived,
    sessionKey(read({ INTERNAL_API_KEY: "another-private-backend-key" })),
  );
  assert.throws(() => sessionKey(read({})), /konfigurace relace/);
  assert.throws(
    () =>
      sessionKey(
        read({ NUXT_SESSION_PASSWORD: "short", INTERNAL_API_KEY: "valid-key" }),
      ),
    /konfigurace relace/,
  );
});

test("existing Netlify and preview origins are trusted without changing SEO origin", () => {
  const domains = allowedDomains({
    NETLIFY: "true",
    FRONTEND_HOST: "https://vinozezajeci.cz",
    URL: "https://zajeci-existing.netlify.app",
    DEPLOY_URL: "https://deploy-id--zajeci-existing.netlify.app",
    DEPLOY_PRIME_URL: "https://preview--zajeci-existing.netlify.app",
  });
  assert.ok(domains.some((item) => item.hostname === "www.vinozezajeci.cz"));
  assert.ok(
    domains.some((item) => item.hostname === "zajeci-existing.netlify.app"),
  );
  assert.ok(
    domains.some(
      (item) => item.hostname === "preview--zajeci-existing.netlify.app",
    ),
  );
  assert.equal(
    allowedDomains({ URL: "https://untrusted.example" }).some(
      (item) => item.hostname === "untrusted.example",
    ),
    false,
  );
  assert.doesNotThrow(() => allowedDomains({ FRONTEND_HOST: "invalid-url" }));
});
