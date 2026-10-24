import { getSecret } from "astro:env/server";
import { environmentValue } from "./config";
export function env(name: string, fallback = "") {
  return environmentValue(
    name,
    [getSecret, (key) => process.env[key], (key) => import.meta.env[key]],
    fallback,
  );
}
