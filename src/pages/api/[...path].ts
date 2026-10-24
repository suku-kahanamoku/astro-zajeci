import type { APIRoute } from "astro";
import { php, upstream } from "../../server/php";
import { HttpError, json, errorResponse } from "../../server/errors";
import {
  saveSession,
  clearSession,
  isAdmin,
  publicUser,
} from "../../server/session";
import { operation } from "../../server/operations";
import { sendMail } from "../../server/mail";
import { env } from "../../server/env";
import { normalizeQuery } from "../../modules/CoreModule/query";
import { oauth } from "../../server/oauth";
export const ALL: APIRoute = async (context) => {
  try {
    const path = context.params.path || "";
    const method = context.request.method;
    const session = context.locals.session;
    const token = session?.token;
    if (["login/google", "login/linkedin"].includes(path) && method === "GET")
      return await oauth(
        context,
        path.endsWith("google") ? "google" : "linkedin",
      );
    let body: any;
    if (
      !["GET", "HEAD"].includes(method) &&
      !context.request.headers
        .get("content-type")
        ?.includes("multipart/form-data")
    ) {
      const raw = await context.request.text();
      if (raw.length > 1024 * 1024)
        throw new HttpError(413, "Příliš velký požadavek.");
      try {
        body = raw ? JSON.parse(raw) : {};
      } catch {
        throw new HttpError(400, "Neplatná data.");
      }
      if (!body || typeof body !== "object" || Array.isArray(body))
        throw new HttpError(422, "Neplatná data.");
    }
    if (["login", "auth/login"].includes(path) && method === "POST") {
      const result = await php("/auth/login", {
        method,
        body: { email: body.email, password: body.password },
      });
      await saveSession(
        context,
        result.data.token,
        result.data.id,
        !!body.remember,
      );
      return json({ success: true });
    }
    if (path === "auth/session" && method === "GET")
      return json({
        success: true,
        data: session ? publicUser(session.user) : null,
      });
    if (path === "auth/logout" && method === "POST") {
      if (token) await php("/auth/logout", { method, token });
      clearSession(context.cookies);
      return json({ success: true });
    }
    if (path === "auth/signup" && method === "POST") {
      if (body.password !== body.confirm_password || !body.terms)
        throw new HttpError(
          422,
          "Zkontrolujte potvrzení hesla a souhlas s podmínkami.",
        );
      await php("/auth/register", {
        method,
        body: {
          email: body.email,
          password: body.password,
          first_name: body.first_name || "",
          last_name: body.last_name || "",
        },
      });
      const login = await php("/auth/login", {
        method,
        body: { email: body.email, password: body.password },
      });
      await saveSession(context, login.data.token, login.data.id);
      await sendMail(
        "signup",
        body.email,
        "Potvrzení registrace",
        { email: body.email, bcc: env("NUXT_MAILING_FROM") },
        login.data.token,
      ).catch(() => undefined);
      return json({ success: true });
    }
    if (
      ["auth/reset-password", "auth/complete-reset"].includes(path) &&
      method === "POST"
    )
      return json(
        await php("/" + path, {
          method,
          body: path.endsWith("complete-reset")
            ? { token: body.token, new_password: body.new_password }
            : { email: body.email },
        }),
      );
    if (path === "auth/profile" && ["PATCH", "GET"].includes(method)) {
      if (!session) throw new HttpError(401, "Přihlaste se.");
      if (method === "PATCH") {
        if (body.new_password)
          await php("/auth/change-password", {
            method: "POST",
            token,
            body: {
              current_password: body.password,
              new_password: body.new_password,
            },
          });
        await php("/users/" + session.user.id, {
          method: "PATCH",
          token,
          body: {
            email: body.email,
            first_name: body.first_name,
            last_name: body.last_name,
            phone: body.phone,
          },
        });
      }
      const user = await saveSession(context, token!, session.user.id);
      return json({ success: true, data: user });
    }
    if (path === "email/contact" && method === "POST")
      return json(
        await php("/mailer", {
          method,
          body: {
            name: body.name || body.email,
            email: body.email,
            message: body.message || body.msg,
            project: "Víno ze Zaječí",
            phone: body.phone || "",
          },
        }),
      );
    if (path === "order" && method === "POST") {
      if (
        !Array.isArray(body.carts) ||
        !body.carts.length ||
        body.carts.some(
          (item: any) =>
            !Number.isInteger(Number(item.product_id)) ||
            !Number.isInteger(Number(item.quantity)) ||
            Number(item.quantity) < 1,
        )
      )
        throw new HttpError(422, "Zkontrolujte košík.");
      const result = await php("/orders", { method, token, body });
      if (result.data?.id && body.user?.email) {
        let attachments = "";
        try {
          const invoice = await php("/invoices", {
            method: "POST",
            token,
            body: { order_id: result.data.id, projection: ["files"] },
          });
          attachments = (invoice.data.files || [])
            .map((f: any) => f.path)
            .join(",");
        } catch {
          /* Order is already saved; never retry its creation. */
        }
        try {
          await sendMail(
            "order",
            body.user.email,
            "Potvrzení objednávky " +
              (result.data.order_number || result.data.id),
            {
              orderId: String(result.data.order_number || result.data.id),
              email: env("NUXT_MAILING_FROM"),
              bcc: env("NUXT_MAILING_FROM"),
              ...(attachments ? { attachments } : {}),
            },
            token,
          );
        } catch {
          result.message =
            "Objednávka byla uložena. Potvrzovací e-mail se nepodařilo odeslat.";
        }
      }
      return json(result, 201);
    }
    if (path === "files/upload" && method === "POST") {
      if (!session) throw new HttpError(401, "Přihlaste se.");
      const form = await context.request.formData();
      const file = form.get("file");
      if (!(file instanceof File) || file.size > 20 * 1024 * 1024)
        throw new HttpError(422, "Vyberte soubor do 20 MB.");
      const allowed = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
        "application/pdf",
      ];
      if (!allowed.includes(file.type))
        throw new HttpError(422, "Nepodporovaný formát souboru.");
      const upload = new FormData();
      upload.set("file", file);
      return json(await php("/files/upload", { method, token, body: upload }));
    }
    if (path === "files/commit" && method === "POST") {
      if (!session) throw new HttpError(401, "Přihlaste se.");
      return json(await php("/files/commit", { method, token, body }));
    }
    if (
      /^(files|temp)\//.test(path) &&
      method === "GET" &&
      !["files/upload", "files/commit"].includes(path)
    ) {
      if (
        path
          .split("/")
          .some(
            (part) =>
              part === ".." ||
              part === "." ||
              part.includes("\\") ||
              part.includes("\0"),
          )
      )
        throw new HttpError(400, "Neplatná cesta.");
      const response = await upstream(
        "/files/" + (path.startsWith("temp/") ? "temp" : "content"),
        { token, query: new URLSearchParams({ path }) },
      );
      if (!response.ok)
        throw new HttpError(response.status, "Soubor není dostupný.");
      return new Response(response.body, {
        headers: {
          "Content-Type":
            response.headers.get("content-type") || "application/octet-stream",
          "Cache-Control":
            response.headers.get("cache-control") || "private, no-store",
          "X-Content-Type-Options": "nosniff",
          ...(response.headers.get("content-disposition")
            ? {
                "Content-Disposition": response.headers.get(
                  "content-disposition",
                )!,
              }
            : {}),
        },
      });
    }
    if (path === "admin/mail" && method === "GET") {
      if (!isAdmin(session?.user)) throw new HttpError(403, "Přístup odepřen.");
      return json(await php("/mailer/list", { token }));
    }
    if (path === "admin/mail/send" && method === "POST") {
      if (!isAdmin(session?.user)) throw new HttpError(403, "Přístup odepřen.");
      return json(
        await sendMail(body.template, body.to, body.subject, {}, token),
      );
    }
    const op = operation(path, method);
    if (!op) throw new HttpError(404, "Endpoint nenalezen.");
    if (op.admin && !isAdmin(session?.user))
      throw new HttpError(session ? 403 : 401, "Přístup odepřen.");
    let query: URLSearchParams;
    try {
      query = normalizeQuery(
        Object.fromEntries(
          [...context.url.searchParams].filter(([name]) =>
            [
              "q",
              "sort",
              "projection",
              "page",
              "limit",
              "factory",
              "skip",
            ].includes(name),
          ),
        ),
      );
    } catch {
      throw new HttpError(422, "Neplatný filtr nebo řazení.");
    }
    return json(await php(op.path, { method, token, body, query }));
  } catch (error) {
    return errorResponse(error);
  }
};
