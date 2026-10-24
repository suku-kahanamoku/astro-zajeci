import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { url, canonical, wineUrl, isNoindex } from "../src/config/site";
import { get, set, itemId } from "../src/modules/CoreModule/objects";
import { operation } from "../src/server/operations";
import { t } from "../src/modules/LangModule";
test("canonical and locales always use the production www origin", () => {
  assert.equal(canonical("/"), "https://www.vinozezajeci.cz/");
  assert.equal(url("/wine", "en"), "/en/wine");
  assert.equal(url("/", "en"), "/en");
  assert.equal(
    wineUrl({ name: "Víno & růže", id: 9 }),
    "/" + "wine/V%C3%ADno%20%26%20r%C5%AF%C5%BEe--$9",
  );
  assert.ok(isNoindex("/admin/wine"));
  assert.ok(isNoindex("/gallery"));
  assert.ok(!isNoindex("/wine"));
});
test("API operation registry is closed and preserves PHP resource mapping", () => {
  assert.deepEqual(operation("wine/1", "GET"), {
    path: "/products/1",
    admin: false,
  });
  assert.equal(operation("wine/1", "DELETE"), null);
  assert.equal(operation("admin/wine/1", "PATCH")?.admin, true);
  assert.equal(operation("../auth/me", "GET"), null);
  assert.equal(operation("https://evil.test", "GET"), null);
  assert.equal(operation("admin/user", "POST"), null);
});
test("nested fields retain data and block prototype pollution", () => {
  const item: any = { data: { batch: "a" } };
  set(item, "data.year", 2024);
  assert.equal(get(item, "data.batch"), "a");
  assert.equal(get(item, "data.year"), 2024);
  set(item, "__proto__.polluted", true);
  assert.equal(({} as any).polluted, undefined);
  assert.equal(itemId("Ryzlink--$123"), "123");
});
test("every original public asset and configuration is preserved byte for byte", () => {
  const source = resolve("../../nuxt/zajeci");
  for (const entry of readdirSync(source + "/public", {
    recursive: true,
    withFileTypes: true,
  })) {
    if (entry.isFile()) {
      const relative = resolve(entry.parentPath, entry.name).slice(
        (source + "/public/").length,
      );
      assert.deepEqual(
        readFileSync("public/" + relative),
        readFileSync(source + "/public/" + relative),
        relative,
      );
    }
  }
  for (const module of readdirSync(source + "/modules")) {
    const dir = source + "/modules/" + module + "/runtime/assets/configs";
    try {
      for (const name of readdirSync(dir))
        assert.deepEqual(
          JSON.parse(
            readFileSync("src/modules/AdminModule/configs/" + name, "utf8"),
          ),
          JSON.parse(readFileSync(dir + "/" + name, "utf8")),
          name,
        );
    } catch (error: any) {
      if (error.code !== "ENOENT") throw error;
    }
  }
});
test("application and module translations exist in both supported languages", () => {
  for (const locale of ["cs", "en"])
    for (const key of [
      "$.base.title",
      "$.intro.title",
      "$.about.description",
      "$.wine.title",
      "$.cashdesk.title",
      "$.login.title",
      "$.admin.wine.title",
      "$.terms.title",
    ]) {
      assert.ok(t(key, locale));
      assert.notEqual(t(key, locale), key);
    }
});
import {
  decodeStoredCart,
  cartSubtotal,
  shippingPrice,
} from "../src/modules/ShopModule/cart";
test("existing Nuxt storage migrates its seven-day cart and payment", () => {
  const stored = {
    created: 1000,
    expiry: 7,
    unit: "d",
    value: JSON.stringify({
      carts: [
        { wine: { id: 4, price: "100", price_with_vat: "121" }, quantity: 2 },
      ],
      billing: { value: "bank" },
      user: { email: "a@example.test" },
    }),
  };
  const migrated = decodeStoredCart(JSON.stringify(stored), 2000)!;
  assert.equal(migrated.carts[0].total_price_with_vat, 242);
  assert.equal(migrated.payment.value, "bank");
  assert.equal(cartSubtotal(migrated.carts), 242);
  assert.equal(
    decodeStoredCart(JSON.stringify(stored), 1000 + 8 * 86400000),
    null,
  );
  assert.equal(shippingPrice({ data: { price: 150 } }, 2501), 0);
  assert.equal(shippingPrice({ data: { price: 150 } }, 2500), 150);
});
import { normalizeQuery, configQuery } from "../src/modules/CoreModule/query";
import { isPageRoute } from "../src/config/routes";
import migration from "../src/config/migration.json";
test("all 52 original route patterns resolve and unsupported nested routes do not", () => {
  for (const page of migration.pages) {
    const parts = page.route
      .replace(":id", "Test--$1")
      .split("/")
      .filter(Boolean);
    assert.ok(isPageRoute(parts), page.route);
  }
  assert.equal(isPageRoute(["admin", "profile", "1"]), false);
  assert.equal(isPageRoute(["admin", "mail", "create"]), false);
  assert.equal(itemId("wrong123"), null);
});
test("legacy query/bookmarks retain filter operators, sorting, pagination and projections", () => {
  const query = normalizeQuery({
    q: {
      name: {
        value: "Ryzlink%20vla%C5%A1sk%C3%BD",
        operator: { value: "$regex" },
      },
    },
    sort: "name DESC",
    projection: ["name", "files"],
    skip: 40,
    limit: 20,
  });
  assert.deepEqual(JSON.parse(query.get("q")!), {
    name: { $regex: "Ryzlink vlašský" },
  });
  assert.equal(query.get("page"), "3");
  assert.equal(query.get("projection"), "name,files");
  assert.equal(query.get("sort"), '[{"name":-1}]');
  const params = new URLSearchParams({
    "admin-taste-list": JSON.stringify({
      fields: { label: { value: "Basic", operator: "eq" } },
      pagination: { page: 2, limit: 50 },
    }),
  });
  const restored = configQuery(
    { syscode: "admin-taste-list" },
    params,
    new URLSearchParams({ q: '{"type":{"$eq":"taste"}}' }),
  );
  assert.deepEqual(JSON.parse(restored.get("q")!), {
    type: { $eq: "taste" },
    label: { $eq: "Basic" },
  });
  assert.equal(restored.get("page"), "2");
  assert.equal(restored.get("limit"), "50");
});
