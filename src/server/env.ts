import { getSecret } from "astro:env/server";
export function env(name: string, fallback = "") {
  return (
    getSecret(name) || import.meta.env[name] || process.env[name] || fallback
  );
}
