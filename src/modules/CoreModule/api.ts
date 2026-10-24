import type { Envelope } from "./types";
export async function api<T = any>(
  path: string,
  method = "GET",
  body?: any,
): Promise<Envelope<T>> {
  const response = await fetch(path, {
    method,
    credentials: "same-origin",
    headers:
      body instanceof FormData ? {} : { "Content-Type": "application/json" },
    body:
      body === undefined
        ? undefined
        : body instanceof FormData
          ? body
          : JSON.stringify(body),
  });
  const result = await response
    .json()
    .catch(() => ({ message: "Služba je dočasně nedostupná." }));
  if (!response.ok || result.success === false)
    throw new Error(result.message || "Požadavek selhal.");
  return result;
}
