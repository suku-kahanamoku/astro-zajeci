import { env } from "./env";
import { HttpError } from "./errors";
import type { Envelope } from "../modules/CoreModule/types";
export function headers(token?: string) {
  const key = env("INTERNAL_API_KEY");
  if (!key) throw new HttpError(503, "Chybí konfigurace připojení k backendu.");
  return {
    "X-Internal-Key": key,
    "X-Forwarded-Host": new URL(env("FRONTEND_HOST", "https://vinozezajeci.cz"))
      .hostname,
    ...(token ? { Authorization: "Bearer " + token } : {}),
  };
}
export async function upstream(
  path: string,
  options: {
    method?: string;
    body?: any;
    token?: string;
    query?: URLSearchParams;
  } = {},
) {
  const base = env("PHP_API_BASE_URL");
  if (!base)
    throw new HttpError(503, "Chybí konfigurace připojení k backendu.");
  const target =
    base.replace(/\/+$/, "") +
    path +
    (options.query?.size ? "?" + options.query : "");
  return fetch(target, {
    method: options.method || "GET",
    headers: {
      ...headers(options.token),
      ...(options.body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
    },
    body:
      options.body === undefined
        ? undefined
        : options.body instanceof FormData
          ? options.body
          : JSON.stringify(options.body),
    signal: AbortSignal.timeout(20000),
    redirect: "error",
  });
}
export async function php<T = any>(
  path: string,
  options: Parameters<typeof upstream>[1] = {},
): Promise<Envelope<T>> {
  const response = await upstream(path, options);
  const body = await response.json().catch(() => null);
  if (!response.ok || body?.success === false)
    throw new HttpError(
      response.ok ? 422 : response.status,
      body?.message || "Požadavek se nepodařilo dokončit.",
      body?.errors,
    );
  if (!body) throw new HttpError(502, "Neplatná odpověď backendu.");
  return body;
}
