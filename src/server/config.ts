import { createHash, createHmac } from "node:crypto";
import { HttpError } from "./errors";

const aliases: Record<string, string[]> = {
  PHP_API_BASE_URL: ["NUXT_PHP_API_BASE_URL", "PHP_API_BASE_URL"],
  PHP_FILE_ROOT: ["NUXT_PHP_FILE_ROOT", "PHP_FILE_ROOT"],
  INTERNAL_API_KEY: ["NUXT_INTERNAL_API_KEY", "INTERNAL_API_KEY"],
  FRONTEND_HOST: ["NUXT_FRONTEND_HOST", "FRONTEND_HOST"],
  NUXT_SESSION_PASSWORD: ["NUXT_SESSION_PASSWORD", "SESSION_SECRET"],
  NUXT_PUBLIC_GTAG_ID: ["NUXT_PUBLIC_GTAG_ID", "PUBLIC_GTAG_ID"],
};

export function environmentValue(
  name: string,
  sources: Array<(key: string) => string | undefined>,
  fallback = "",
) {
  // Runtime Nuxt overrides win over values captured from .env during build.
  for (const source of sources)
    for (const key of aliases[name] || [name]) {
      const value = source(key);
      if (value) return value;
    }
  return fallback;
}

export function sessionKey(read: (key: string) => string) {
  const password = read("NUXT_SESSION_PASSWORD");
  if (password) {
    if (password.length < 32)
      throw new HttpError(503, "Neplatná konfigurace relace.");
    return createHash("sha256").update(password).digest();
  }
  // The old auth module supplied a shared password when none was configured.
  // Derive a private, purpose-specific key from an existing server secret instead.
  const internalKey = read("INTERNAL_API_KEY");
  if (!internalKey) throw new HttpError(503, "Chybí konfigurace relace.");
  return createHmac("sha256", internalKey)
    .update("astro-zajeci/session/v1")
    .digest();
}
