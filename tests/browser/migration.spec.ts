import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
const login = async (page: any, email = "admin@example.test") => {
  await page.goto("/login");
  await page.getByLabel("E-mail", { exact: true }).fill(email);
  await page.getByLabel("Heslo", { exact: true }).fill("test-password");
  await page.getByTestId("form-submit").click();
  await page.waitForURL(/\/admin/);
};
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (window.top !== window) return;
    try {
      sessionStorage.setItem("homepage-promotion-2026-08-26-closed", "true");
      document.cookie = "_cookies=1; Path=/";
    } catch {}
  });
  await page.route("https://www.google.com/maps/**", (route) => route.abort());
});
test("public SSR, canonical SEO, metadata, product schema and sitemap", async ({
  request,
}) => {
  const response = await request.get("/");
  expect(response.status()).toBe(200);
  const html = await response.text();
  expect(html).toContain("Objevte s námi nejlepší vína z Moravy");
  expect(html).toContain("Ryzlink vlašský");
  expect(html).toContain('href="https://www.vinozezajeci.cz/"');
  expect(html).not.toContain("test-internal-key");
  for (const path of [
    "/wine",
    "/en/wine",
    "/wine/Ryzlink%20vla%C5%A1sk%C3%BD--$1",
    "/terms-conditions",
    "/gdpr",
    "/gallery",
    "/cashdesk",
    "/cashdesk-completed",
    "/login",
    "/signup",
    "/forgot-password",
    "/reset-password",
    "/en",
  ]) {
    const result = await request.get(path);
    expect(result.status(), path).toBe(200);
    expect(await result.text()).toContain('rel="canonical"');
  }
  const product = await (await request.get("/wine/1")).text();
  expect(product).toContain('"@type":"Product"');
  expect(product).toContain('"price":217.8');
  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.status()).toBe(200);
  expect(await sitemap.text()).toContain(
    "https://www.vinozezajeci.cz/wine/Ryzlink",
  );
  expect(await sitemap.text()).not.toContain("/gallery");
  expect(await (await request.get("/robots.txt")).text()).toContain(
    "Disallow: /en/admin",
  );
  expect((await request.get("/missing-page")).status()).toBe(404);
  expect((await request.get("/wine/missing--$999")).status()).toBe(404);
});
test("mobile navigation, dark mode, gallery and responsive layout", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Objevte",
  );
  await page.getByRole("button", { name: "Boční navigace" }).click();
  await expect(page.locator("#mobile-nav")).toBeVisible();
  await page.getByRole("button", { name: "Přepnout na tmavý režim" }).click();
  await expect(page.locator("html")).toHaveClass("dark");
  await page.reload();
  await expect(page.locator("html")).toHaveClass("dark");
  for (const path of [
    "/",
    "/wine",
    "/wine/1",
    "/gallery",
    "/login",
    "/cashdesk",
    "/terms-conditions",
  ]) {
    await page.goto(path);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      path,
    ).toBe(true);
  }
  await page.goto("/gallery");
  await page.locator("#gallery a").first().click();
  await expect(page.locator(".pswp")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator(".pswp")).toHaveCount(0);
  await page.goto("/wine");
  await page.screenshot({
    path: "test-results/mobile-wines.png",
    fullPage: true,
  });
});
test("cart persists, validates checkout and sends the PHP order contract once", async ({
  page,
  request,
}) => {
  await page.goto("/wine/1");
  await page.getByRole("button", { name: "Do košíku", exact: true }).click();
  await expect(page.locator("dialog")).toBeVisible();
  await page.getByRole("link", { name: "Přejit k objednávce" }).click();
  await expect(
    page.getByRole("heading", { name: "Pokladna", exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByText("Ryzlink vlašský", { exact: true }).first(),
  ).toBeVisible();
  await page.getByRole("button", { name: /Doprava a platba/ }).click();
  await page.getByRole("button", { name: /Shrnutí/ }).click();
  await expect(page.getByLabel("E-mail", { exact: true })).toBeVisible();
  await page.getByLabel("E-mail", { exact: true }).fill("guest@example.test");
  await page.getByLabel("Křestní jméno", { exact: true }).fill("Jan");
  await page.getByLabel("Příjmeni", { exact: true }).fill("Novák");
  await page.getByLabel("Ulice", { exact: true }).fill("Školní 156");
  await page.getByLabel("Město", { exact: true }).fill("Zaječí");
  await page.getByLabel("PSČ", { exact: true }).fill("69105");
  await page.getByLabel("Stát", { exact: true }).selectOption("cz");
  await page.getByRole("button", { name: /Shrnutí/ }).click();
  await page.getByRole("button", { name: /Dokončit objednávku/ }).click();
  await page.waitForURL(/cashdesk-completed/);
  await expect(page.locator("#main-content")).toContainText(
    "guest@example.test",
  );
  const state = await (
    await request.get("http://127.0.0.1:8787/__state")
  ).json();
  const orders = state.calls.filter(
    (call: any) => call.path === "/orders" && call.method === "POST",
  );
  expect(orders).toHaveLength(1);
  expect(orders[0].body).toMatchObject({
    user: { email: "guest@example.test" },
    carts: [{ product_id: 1, quantity: 1 }],
    shipping: { value: "free" },
    billing: { value: "bank" },
  });
  expect(
    state.calls.some(
      (call: any) =>
        call.path === "/mailer/send" && call.body.template === "order",
    ),
  ).toBe(true);
});
test("contact form reaches PHP mailer and keeps server credentials private", async ({
  page,
  request,
}) => {
  await page.goto("/#contact");
  await page
    .locator("#contact")
    .getByLabel("E-mail")
    .fill("contact@example.test");
  await page
    .locator("#contact")
    .getByLabel("Zpráva")
    .fill("Prosím o degustaci.");
  await page.locator("#contact").getByTestId("form-submit").click();
  await expect(page.locator("#contact [role=status]")).toContainText("úspěšně");
  const state = await (
    await request.get("http://127.0.0.1:8787/__state")
  ).json();
  expect(
    state.calls.some(
      (call: any) =>
        call.path === "/mailer" && call.body.message === "Prosím o degustaci.",
    ),
  ).toBe(true);
});
test("login, every admin section, profile, filters, mutations and file upload", async ({
  page,
  request,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await login(page);
  for (const section of [
    "wine",
    "taste",
    "category",
    "order",
    "invoice",
    "user",
    "address",
    "role",
    "text",
    "mail",
    "enum",
    "payment",
    "shipping",
    "vat-rate",
    "profile",
  ]) {
    await page.goto("/admin/" + section);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator("[role=alert]")).toHaveCount(0);
  }
  await page.goto("/admin/wine/1");
  await page.getByLabel("Název vína", { exact: true }).fill("Ryzlink upravený");
  await page.getByTestId("form-submit").click();
  await page.waitForURL("/admin/wine");
  const state = await (
    await request.get("http://127.0.0.1:8787/__state")
  ).json();
  const changed = state.calls.findLast(
    (call: any) => call.path === "/products/1" && call.method === "PATCH",
  );
  expect(changed.body.data.untouched).toBe("retain me");
  await page.goto("/admin/wine/1");
  await expect(page.locator("input[type=file]")).toBeEnabled();
  await page.locator("input[type=file]").setInputFiles({
    name: "wine.jpg",
    mimeType: "image/jpeg",
    buffer: Buffer.from("test-image"),
  });
  await page
    .locator("section")
    .filter({
      has: page.getByRole("heading", { name: "Soubory", exact: true }),
    })
    .getByRole("button", { name: "Odeslat", exact: true })
    .click();
  await expect(
    page
      .locator("section")
      .filter({
        has: page.getByRole("heading", { name: "Soubory", exact: true }),
      })
      .getByText("wine.jpg"),
  ).toHaveCount(0);
  await page.goto("/admin/invoice/1");
  await page.getByLabel("Stav", { exact: true }).selectOption("paid");
  await page.getByTestId("form-submit").click();
  await page.waitForURL("/admin/invoice");
  expect(errors).toEqual([]);
});
test("authorization, CSRF, session redaction and OAuth state checks", async ({
  page,
  request,
}) => {
  expect((await request.get("/api/admin/wine")).status()).toBe(401);
  expect(
    (
      await request.post("/api/login", {
        data: { email: "admin@example.test", password: "test-password" },
        headers: { origin: "https://evil.test" },
      })
    ).status(),
  ).toBe(403);
  expect(
    (await request.get("/api/login/google?code=forged&state=forged")).status(),
  ).toBe(400);
  await login(page, "user@example.test");
  await page.waitForURL("/admin/profile");
  await page.goto("/admin/wine");
  expect(await page.textContent("body")).toContain("Přístup odepřen");
  const response = await page.request.get("/api/auth/session");
  const session = await response.json();
  expect(JSON.stringify(session)).not.toContain("user-token");
  expect((await page.request.get("/api/admin/user")).status()).toBe(403);
});
test("desktop light and dark pages have no overflow or hydration errors", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  await page.screenshot({
    path: "test-results/desktop-home.png",
    fullPage: true,
  });
  for (const path of [
    "/",
    "/wine",
    "/wine/1",
    "/gallery",
    "/en",
    "/terms-conditions",
  ]) {
    await page.goto(path);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      path,
    ).toBe(true);
  }
  await page.getByRole("button", { name: "Přepnout na tmavý režim" }).click();
  await page.screenshot({
    path: "test-results/desktop-dark-terms.png",
    fullPage: true,
  });
  expect(errors).toEqual([]);
});

test("all migrated routes, legacy bookmarks, filters, sort and confirmed CRUD", async ({
  page,
  request,
}) => {
  await login(page);
  const manifest = JSON.parse(
    readFileSync(
      new URL("../../src/config/migration.json", import.meta.url),
      "utf8",
    ),
  ) as { pages: { route: string }[] };
  for (const path of new Set(
    manifest.pages.map((item) => item.route.replace(":id", "1")),
  )) {
    const response = await page.request.get(path);
    expect(response.status(), path).toBe(200);
  }
  const legacy = {
    "admin-wine-list": JSON.stringify({
      fields: { name: { value: "Ryzlink", operator: "regex" } },
      sort: [{ name: 1 }],
      pagination: { page: 1, limit: 50 },
    }),
  };
  await page.goto("/admin/wine?" + new URLSearchParams(legacy));
  await expect(page.locator("input[name=name]")).toHaveValue("Ryzlink");
  await expect(page.getByLabel("Záznamů na stránce")).toHaveValue("50");
  await page.locator("input[name=name]").fill("upravený");
  await page.getByRole("button", { name: "Filtrovat", exact: true }).click();
  await expect
    .poll(() => new URL(page.url()).searchParams.get("q"))
    .toContain("upravený");
  const sort = page.getByRole("button", { name: "Název vína ↕", exact: true });
  await sort.click();
  await expect
    .poll(() => new URL(page.url()).searchParams.get("sort"))
    .toBe('[{"name":-1}]');
  await sort.click();
  await expect
    .poll(() => new URL(page.url()).searchParams.get("sort"))
    .toBe('[{"name":1}]');
  await page.goto("/admin/category/create");
  await page.locator("input[name=name]").fill("Testovací kategorie");
  await page.locator("input[name=syscode]").fill("migration-test");
  await page.getByTestId("form-submit").click();
  await page.waitForURL("/admin/category");
  await page
    .getByRole("checkbox", { name: "Testovací kategorie", exact: true })
    .check();
  await page.getByRole("button", { name: "Smazat (1)", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Smazat", exact: true })
    .click();
  await expect(
    page.getByRole("checkbox", { name: "Testovací kategorie", exact: true }),
  ).toHaveCount(0);
  const state = await (
    await request.get("http://127.0.0.1:8787/__state")
  ).json();
  expect(
    state.calls.some(
      (call: any) =>
        call.path === "/categories" &&
        call.method === "POST" &&
        call.body.syscode === "migration-test",
    ),
  ).toBe(true);
  expect(
    state.calls.some(
      (call: any) =>
        call.path.startsWith("/categories/") && call.method === "DELETE",
    ),
  ).toBe(true);
});

test("profile is an editable self-service form and refreshes the session", async ({
  page,
  request,
}) => {
  await login(page);
  await page.goto("/admin/profile");
  await page.getByLabel("Křestní jméno", { exact: true }).fill("Aktualizovaný");
  await page.getByTestId("form-submit").click();
  await expect(page.getByRole("status")).toContainText("úspěšně");
  const session = await (await page.request.get("/api/auth/session")).json();
  expect(session.data.first_name).toBe("Aktualizovaný");
  await expect(page.locator("[name=role_id]")).toHaveCount(0);
  const state = await (
    await request.get("http://127.0.0.1:8787/__state")
  ).json();
  expect(
    state.calls.some(
      (call: any) =>
        call.path === "/users/1" &&
        call.method === "PATCH" &&
        call.body.first_name === "Aktualizovaný",
    ),
  ).toBe(true);
});

test("PWA registers with auto updates and never caches private API responses", async ({
  page,
  request,
}, testInfo) => {
  test.skip(
    !testInfo.config.configFile?.includes("production"),
    "Service worker is generated for production builds.",
  );
  await page.goto("/wine");
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  const worker = await request.get("/sw.js");
  expect(worker.status()).toBe(200);
  const script = await worker.text();
  expect(script).toContain("skipWaiting");
  expect(script).toContain("_astro/");
  expect(script).not.toContain('url:"/admin');
  expect(script).not.toContain('url:"/api');
  await page.request.get("/api/auth/session");
  const cached = await page.evaluate(async () => {
    for (const name of await caches.keys())
      if (await (await caches.open(name)).match("/api/auth/session"))
        return true;
    return false;
  });
  expect(cached).toBe(false);
  const manifest = await (await request.get("/manifest.webmanifest")).json();
  expect(manifest).toMatchObject({
    name: "Víno ze Zaječí",
    short_name: "Zaječí",
    display: "standalone",
    start_url: "/",
  });
});

test("registration, password recovery, password reset and logout use their PHP contracts", async ({
  page,
  request,
}) => {
  await page.goto("/signup");
  await page.getByLabel("E-mail", { exact: true }).fill("signup@example.test");
  await page.locator("[name=password]").fill("test-password");
  await page.locator("[name=confirm_password]").fill("mismatched-password");
  await page.locator("[name=terms]").check();
  await page.getByTestId("form-submit").click();
  await expect(page.getByRole("alert")).toContainText("neshodují");
  await page.locator("[name=confirm_password]").fill("test-password");
  await page.getByTestId("form-submit").click();
  await page.waitForURL(/\/admin/);
  await page.goto("/forgot-password");
  await page.getByLabel("E-mail", { exact: true }).fill("signup@example.test");
  await page.getByTestId("form-submit").click();
  await expect(page.getByRole("status")).toContainText("odeslán");
  await page.goto("/reset-password?token=reset-test");
  await page.locator("[name=new_password]").fill("updated-password");
  await page.locator("[name=confirm_password]").fill("updated-password");
  await page.getByTestId("form-submit").click();
  await expect(page.getByRole("status")).toContainText("změněno");
  await page.locator(".profile-menu summary").click();
  await page.getByRole("button", { name: "Odhlásit", exact: true }).click();
  await page.waitForURL("/login");
  expect(
    (await (await page.request.get("/api/auth/session")).json()).data,
  ).toBeNull();
  const state = await (
    await request.get("http://127.0.0.1:8787/__state")
  ).json();
  expect(
    state.calls.some(
      (call: any) =>
        call.path === "/auth/register" &&
        call.body.email === "signup@example.test",
    ),
  ).toBe(true);
  expect(
    state.calls.some(
      (call: any) =>
        call.path === "/auth/reset-password" &&
        call.body.email === "signup@example.test",
    ),
  ).toBe(true);
  expect(
    state.calls.some(
      (call: any) =>
        call.path === "/auth/complete-reset" &&
        call.body.token === "reset-test" &&
        call.body.new_password === "updated-password",
    ),
  ).toBe(true);
  expect(state.calls.some((call: any) => call.path === "/auth/logout")).toBe(
    true,
  );
});

test("original cookie banner can be closed and remembers consent", async ({
  context,
}) => {
  const page = await context.newPage();
  await page.goto("/wine");
  await expect(page.getByTestId("cookie-banner-close")).toBeVisible();
  await page.getByTestId("cookie-banner-close").click();
  await expect(page.getByTestId("cookie-banner-close")).toHaveCount(0);
  await page.reload();
  await expect(page.getByTestId("cookie-banner-close")).toHaveCount(0);
  expect(
    (await context.cookies()).some(
      (cookie) => cookie.name === "_cookies" && cookie.value === "1",
    ),
  ).toBe(true);
  await page.close();
});
