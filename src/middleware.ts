import { defineMiddleware } from "astro:middleware";
import { readSession, isAdmin } from "./server/session";
import { json } from "./server/errors";
export const onRequest = defineMiddleware(async (context, next) => {
  context.locals.session = await readSession(context.cookies);
  const path = context.url.pathname.replace(/^\/en(?=\/|$)/, "") || "/";
  if (
    path.startsWith("/api/") &&
    !["GET", "HEAD", "OPTIONS"].includes(context.request.method)
  ) {
    if (context.request.headers.get("origin") !== context.url.origin)
      return json(
        { success: false, message: "Neplatný původ požadavku." },
        403,
      );
    if (
      Number(context.request.headers.get("content-length") || 0) >
      22 * 1024 * 1024
    )
      return json({ success: false, message: "Soubor je příliš velký." }, 413);
  }
  if (
    path === "/admin" ||
    path.startsWith("/admin/") ||
    path.startsWith("/api/admin/")
  ) {
    if (!context.locals.session)
      return path.startsWith("/api/")
        ? json({ success: false, message: "Přihlaste se." }, 401)
        : context.redirect(
            (context.url.pathname.startsWith("/en/") ? "/en" : "") + "/login",
            302,
          );
    if (path !== "/admin/profile" && !isAdmin(context.locals.session.user)) {
      if (path.startsWith("/api/"))
        return json({ success: false, message: "Přístup odepřen." }, 403);
      if (path === "/admin")
        return context.redirect(
          (context.url.pathname.startsWith("/en/") ? "/en" : "") +
            "/admin/profile",
          302,
        );
      return new Response("Přístup odepřen.", {
        status: 403,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-store",
        },
      });
    }
  }
  const response = await next();
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  if (
    context.locals.session ||
    path.startsWith("/api/") ||
    path.startsWith("/admin") ||
    path.includes("cashdesk") ||
    path.includes("password")
  )
    response.headers.set("Cache-Control", "private, no-store");
  return response;
});
