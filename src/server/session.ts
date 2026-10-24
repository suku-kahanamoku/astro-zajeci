import { createHash } from "node:crypto";
import { EncryptJWT, jwtDecrypt } from "jose";
import type { APIContext, AstroCookies } from "astro";
import type { Session, RecordData } from "../modules/CoreModule/types";
import { env } from "./env";
import { HttpError } from "./errors";
import { php } from "./php";
const cookie = "zajeci-session";
function key() {
  const secret = env("SESSION_SECRET");
  if (secret.length < 32) throw new HttpError(503, "Chybí konfigurace relace.");
  return createHash("sha256").update(secret).digest();
}
export async function sealOAuth(value: RecordData) {
  return new EncryptJWT(value)
    .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
    .setIssuer("astro-zajeci")
    .setAudience("oauth-state")
    .setIssuedAt()
    .setExpirationTime("10m")
    .encrypt(key());
}
export async function openOAuth(value: string) {
  return (
    await jwtDecrypt(value, key(), {
      issuer: "astro-zajeci",
      audience: "oauth-state",
    })
  ).payload;
}
export function publicUser(user: RecordData) {
  return Object.fromEntries(
    [
      "id",
      "email",
      "first_name",
      "last_name",
      "name",
      "phone",
      "picture",
      "role",
      "role_id",
      "address",
      "status",
    ]
      .filter((k) => user[k] !== undefined)
      .map((k) => [k, user[k]]),
  );
}
export async function readSession(
  cookies: AstroCookies,
): Promise<Session | null> {
  const value = cookies.get(cookie)?.value;
  if (!value) return null;
  try {
    const { payload } = await jwtDecrypt(value, key(), {
      issuer: "astro-zajeci",
      audience: "zajeci-session",
    });
    return typeof payload.token === "string"
      ? { token: payload.token, user: payload.user as RecordData }
      : null;
  } catch {
    return null;
  }
}
export async function saveSession(
  context: Pick<APIContext, "cookies" | "url">,
  token: string,
  userId: number,
  remember = false,
) {
  const response = await php("/users/" + userId, { token });
  const user = publicUser(response.data);
  const maxAge = remember ? 60 * 60 * 24 * 30 : 60 * 60 * 12;
  const value = await new EncryptJWT({ token, user })
    .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
    .setIssuer("astro-zajeci")
    .setAudience("zajeci-session")
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + maxAge)
    .encrypt(key());
  if (value.length > 3900) throw new HttpError(502, "Relaci nelze uložit.");
  context.cookies.set(cookie, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: context.url.protocol === "https:",
    path: "/",
    maxAge,
  });
  return user;
}
export function clearSession(cookies: AstroCookies) {
  cookies.delete(cookie, { path: "/" });
}
export function isAdmin(user?: RecordData | null) {
  return (user?.role?.name || user?.role) === "admin";
}
