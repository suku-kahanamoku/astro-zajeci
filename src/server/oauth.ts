import { randomBytes, createHash } from "node:crypto";
import { createRemoteJWKSet, jwtVerify } from "jose";
import type { APIContext } from "astro";
import { env } from "./env";
import { HttpError } from "./errors";
import { php } from "./php";
import { saveSession, sealOAuth, openOAuth } from "./session";
const providers = {
  google: {
    authorize: "https://accounts.google.com/o/oauth2/v2/auth",
    token: "https://oauth2.googleapis.com/token",
    jwks: createRemoteJWKSet(
      new URL("https://www.googleapis.com/oauth2/v3/certs"),
    ),
    issuer: ["https://accounts.google.com", "accounts.google.com"],
  },
  linkedin: {
    authorize: "https://www.linkedin.com/oauth/v2/authorization",
    token: "https://www.linkedin.com/oauth/v2/accessToken",
    jwks: createRemoteJWKSet(
      new URL("https://www.linkedin.com/oauth/openid/jwks"),
    ),
    issuer: "https://www.linkedin.com",
  },
};
export async function oauth(
  context: APIContext,
  provider: "google" | "linkedin",
) {
  const config = providers[provider];
  const prefix = "NUXT_OAUTH_" + provider.toUpperCase();
  const clientId = env(prefix + "_CLIENT_ID");
  const clientSecret = env(prefix + "_CLIENT_SECRET");
  if (!clientId || !clientSecret)
    throw new HttpError(503, "Tento způsob přihlášení není nakonfigurován.");
  const callback = env(
    prefix + "_REDIRECT_URL",
    env("OAUTH_CALLBACK_ORIGIN", context.url.origin) + "/api/login/" + provider,
  );
  const cookie = "zajeci-oauth-" + provider;
  const options = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: context.url.protocol === "https:",
    path: "/api/login/" + provider,
    maxAge: 600,
  };
  if (
    !context.url.searchParams.has("code") &&
    !context.url.searchParams.has("error")
  ) {
    const state = randomBytes(32).toString("base64url");
    const nonce = randomBytes(32).toString("base64url");
    const verifier = randomBytes(48).toString("base64url");
    const locale =
      context.url.searchParams.get("locale") === "en" ? "en" : "cs";
    context.cookies.set(
      cookie,
      await sealOAuth({ state, nonce, verifier, locale }),
      options,
    );
    const target = new URL(config.authorize);
    target.search = new URLSearchParams({
      client_id: clientId,
      redirect_uri: callback,
      response_type: "code",
      scope: "openid email profile",
      state,
      nonce,
      ...(provider === "google"
        ? {
            code_challenge: createHash("sha256")
              .update(verifier)
              .digest("base64url"),
            code_challenge_method: "S256",
          }
        : {}),
    }).toString();
    return context.redirect(target.href, 302);
  }
  const stored = context.cookies.get(cookie)?.value;
  context.cookies.delete(cookie, { path: options.path });
  if (!stored)
    throw new HttpError(400, "Přihlášení vypršelo. Zkuste to znovu.");
  const state = await openOAuth(stored).catch(() => null);
  if (
    !state ||
    state.state !== context.url.searchParams.get("state") ||
    context.url.searchParams.has("error")
  )
    throw new HttpError(400, "Přihlášení se nepodařilo ověřit.");
  const response = await fetch(config.token, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code: context.url.searchParams.get("code")!,
      redirect_uri: callback,
      client_id: clientId,
      client_secret: clientSecret,
      ...(provider === "google"
        ? { code_verifier: String(state.verifier) }
        : {}),
    }),
    signal: AbortSignal.timeout(15000),
    redirect: "error",
  });
  if (!response.ok)
    throw new HttpError(400, "Přihlášení se nepodařilo ověřit.");
  const tokens = await response.json();
  const { payload } = await jwtVerify(tokens.id_token, config.jwks, {
    issuer: config.issuer,
    audience: clientId,
    algorithms: ["RS256"],
    maxTokenAge: "10m",
  });
  if (
    payload.nonce !== state.nonce ||
    !payload.sub ||
    typeof payload.email !== "string" ||
    payload.email_verified === false ||
    (provider === "google" && payload.email_verified !== true)
  )
    throw new HttpError(400, "E-mail se nepodařilo ověřit.");
  const login = await php("/auth/oauth", {
    method: "POST",
    body: {
      provider,
      subject: payload.sub,
      email: payload.email,
      first_name: payload.given_name || "",
      last_name: payload.family_name || "",
    },
  });
  await saveSession(context, login.data.token, login.data.id);
  return context.redirect((state.locale === "en" ? "/en" : "") + "/admin", 302);
}
