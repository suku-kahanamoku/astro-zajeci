import { createServer } from "node:http";
import { readFileSync } from "node:fs";
const wine = {
  id: 1,
  name: "Ryzlink vlašský",
  sku: "RV-2024",
  price: 180,
  price_with_vat: 217.8,
  vat_rate: 21,
  published: 1,
  color: "white",
  kind: "dry",
  variant: "Ryzlink",
  stock_quantity: 42,
  description: "Suché moravské víno ze Zaječí.",
  data: {
    year: 2024,
    volume: 0.75,
    alcohol: 12.5,
    quality: "Pozdní sběr",
    batch: "A1",
    untouched: "retain me",
  },
  files: [
    {
      id: 1,
      name: "bottle.jpg",
      path: "files/zajeci/bottle.jpg",
      mime_type: "image/jpeg",
    },
  ],
  file_ids: [1],
  category_ids: [1],
};
const admin = {
  id: 1,
  email: "admin@example.test",
  first_name: "Test",
  last_name: "Vinař",
  phone: "+420700000000",
  role: { id: 1, name: "admin", label: "Administrátor" },
  role_id: 1,
  status: "active",
  address: {
    main: { street: "Školní 156", city: "Zaječí", zip: "69105", state: "cz" },
  },
};
const enums = [
  {
    id: 1,
    type: "taste",
    label: "Basic",
    syscode: "basic",
    published: 1,
    data: {
      price: 350,
      drink: "Ochutnávka 6 vzorků",
      food: "Pečivo, voda",
      time: "1 hodina",
    },
  },
  {
    id: 2,
    type: "contact",
    syscode: "contact",
    published: 1,
    data: {
      email: "vyborne@vinozezajeci.cz",
      phone1: "+420 770 199 999",
      phone2: "+420 778 711 111",
      street: "Školní 156",
      zip: "691 05",
      city: "Zaječí",
      ic: "19737491",
    },
  },
  {
    id: 3,
    type: "shipping",
    syscode: "free",
    value: "free",
    label: "Osobní odběr",
    published: 1,
    data: { price: 0 },
  },
  {
    id: 4,
    type: "shipping",
    syscode: "ppl",
    value: "ppl",
    label: "PPL",
    published: 1,
    data: { price: 150, icon: "/img/shipping/ppl.jpg" },
  },
  {
    id: 5,
    type: "payment",
    syscode: "bank",
    value: "bank",
    label: "Bankovní převod",
    published: 1,
    data: {
      price: 0,
      account: "3897132/0800",
      iban: "CZ6408000000000003897212",
      swift: "GIBACZPX",
    },
  },
  {
    id: 6,
    type: "country_code",
    syscode: "cz",
    value: "cz",
    label: "Česká republika",
    published: 1,
  },
  {
    id: 7,
    type: "wine_kind",
    syscode: "dry",
    value: "dry",
    label: "Suché",
    published: 1,
  },
  {
    id: 8,
    type: "wine_color",
    syscode: "white",
    value: "white",
    label: "Bílé",
    published: 1,
  },
  {
    id: 9,
    type: "shipping",
    syscode: "disabled",
    value: "disabled",
    label: "Nedostupná doprava",
    published: 1,
    data: { disabled: true, price: 20 },
  },
  {
    id: 10,
    type: "vat_rate",
    syscode: "standard",
    value: "21",
    label: "DPH 21 %",
    published: 1,
    data: { rate: 21 },
  },
];
let nextId = 50;
const calls = [];
const db = {
  products: [wine],
  enumerations: enums,
  categories: [{ id: 1, name: "Top vína", syscode: "top", position: 1 }],
  texts: [
    {
      id: 1,
      syscode: "about",
      title: "O nás",
      content: "Příběh vinařství",
      language: "cs",
      published: 1,
    },
  ],
  users: [
    admin,
    {
      ...admin,
      id: 2,
      email: "user@example.test",
      role: { id: 2, name: "user" },
      role_id: 2,
    },
  ],
  roles: [
    { id: 1, name: "admin", label: "Administrátor" },
    { id: 2, name: "user", label: "Uživatel" },
  ],
  address: [
    {
      id: 1,
      name: "Test",
      street: "Školní 156",
      city: "Zaječí",
      zip: "69105",
      type: "billing",
      user_id: 1,
      user: { email: admin.email },
    },
  ],
  orders: [
    {
      id: 1,
      order_number: "20260001",
      status: "pending",
      total_price: 180,
      total_price_all_with_vat: 217.8,
      currency: "CZK",
      customer: {
        email: "customer@example.test",
        first_name: "Jan",
        billing_address: { street: "Školní 156", city: "Zaječí", zip: "69105" },
      },
      items: [
        {
          product_name: wine.name,
          sku: wine.sku,
          quantity: 1,
          price: 180,
          total_price: 180,
        },
      ],
      shipping: { type: "free", label: "Osobní odběr", price: 0 },
      payment: { type: "bank", label: "Bankovní převod" },
    },
  ],
  invoices: [
    {
      id: 1,
      invoice_number: "FV2026001",
      order_number: "20260001",
      status: "issued",
      user: { email: admin.email },
      total_price_all_with_vat: 217.8,
      note: "Poznámka",
      files: [{ id: 1, name: "Faktura.pdf", path: "files/zajeci/invoice.pdf" }],
    },
  ],
};
function send(res, data, status = 200) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}
const server = createServer(async (req, res) => {
  const target = new URL(req.url, "http://localhost:8787");
  if (target.pathname === "/__state") return send(res, { calls, db });
  if (
    req.headers["x-internal-key"] !== "test-internal-key" ||
    req.headers["x-forwarded-host"] !== "www.vinozezajeci.cz"
  )
    return send(
      res,
      { success: false, message: "Bad server credentials" },
      403,
    );
  let raw = "";
  for await (const chunk of req) raw += chunk;
  let body = {};
  try {
    body = JSON.parse(raw || "{}");
  } catch {}
  const path = target.pathname.replace(/^\/api/, "").replace(/\/$/, "");
  calls.push({
    path,
    method: req.method,
    body,
    query: Object.fromEntries(target.searchParams),
    authorization: req.headers.authorization,
  });
  const token = req.headers.authorization || "";
  const user = token.includes("user-token") ? db.users[1] : db.users[0];
  if (path === "/auth/login") {
    if (body.password !== "test-password")
      return send(res, { success: false, message: "Invalid credentials" }, 401);
    return send(res, {
      success: true,
      data: {
        id: body.email === "user@example.test" ? 2 : 1,
        token:
          body.email === "user@example.test" ? "user-token" : "admin-token",
      },
    });
  }
  if (path === "/auth/register")
    return send(res, { success: true, data: { id: 3 } }, 201);
  if (
    [
      "/auth/logout",
      "/auth/reset-password",
      "/auth/complete-reset",
      "/auth/change-password",
    ].includes(path)
  )
    return send(res, { success: true, data: null });
  if (path === "/auth/me") return send(res, { success: true, data: user });
  if (path === "/mailer/list")
    return send(res, {
      success: true,
      data: [{ template: "test" }, { template: "order" }],
    });
  if (path === "/mailer" || path === "/mailer/send")
    return send(res, { success: true, data: null });
  if (path === "/files/upload")
    return send(res, {
      success: true,
      data: { path: "temp/zajeci/upload.jpg" },
    });
  if (path === "/files/commit")
    return send(res, {
      success: true,
      data: { id: ++nextId, path: "files/zajeci/upload.jpg" },
    });
  if (path === "/files/content" || path === "/files/temp") {
    res.writeHead(200, {
      "Content-Type": "image/jpeg",
      "Cache-Control": "public, max-age=60",
    });
    return res.end(
      readFileSync(new URL("../public/img/bottle.jpg", import.meta.url)),
    );
  }
  const [, resource, id, suffix] =
    /^\/([^/]+)(?:\/(\d+))?(?:\/(status|files))?$/.exec(path) || [];
  if (!db[resource])
    return send(res, { success: false, message: "Not found" }, 404);
  if (resource === "users" && id && req.method === "GET")
    return send(res, {
      success: true,
      data: db.users.find((row) => row.id === Number(id)) || user,
    });
  if (req.method === "POST") {
    const item = { ...body, id: ++nextId };
    if (resource === "orders") {
      item.order_number = "2026" + item.id;
      item.total_price_all_with_vat = body.carts?.reduce(
        (sum, row) => sum + 217.8 * row.quantity,
        0,
      );
    }
    if (resource === "invoices") {
      item.invoice_number = "FV" + item.id;
      item.files = [{ id: 1, path: "files/zajeci/invoice.pdf" }];
    }
    db[resource].push(item);
    return send(res, { success: true, data: item }, 201);
  }
  let item = db[resource].find((row) => row.id === Number(id));
  if (id && !item)
    return send(res, { success: false, message: "Not found" }, 404);
  if (req.method === "PATCH") {
    if (resource === "invoices" && !suffix)
      return send(res, { success: false, message: "Not found" }, 404);
    Object.assign(item, body);
    return send(res, { success: true, data: item });
  }
  if (req.method === "DELETE") {
    db[resource] = db[resource].filter((row) => row.id !== Number(id));
    return send(res, { success: true, data: null });
  }
  if (id) return send(res, { success: true, data: item });
  let rows = db[resource];
  try {
    const filter = JSON.parse(target.searchParams.get("q") || "{}");
    rows = rows.filter((row) =>
      Object.entries(filter).every(([key, condition]) => {
        if (key === "category.syscode") return true;
        const value = key.split(".").reduce((obj, k) => obj?.[k], row);
        if (typeof condition !== "object" || condition === null)
          return value === condition;
        return Object.entries(condition).every(([op, wanted]) =>
          op === "$regex"
            ? String(value).includes(String(wanted))
            : op === "$eq"
              ? String(value) === String(wanted)
              : true,
        );
      }),
    );
  } catch {}
  const page = Math.max(1, Number(target.searchParams.get("page")) || 1);
  const limit = Math.max(1, Number(target.searchParams.get("limit")) || 20);
  send(res, {
    success: true,
    data: rows.slice((page - 1) * limit, page * limit).map((row) => {
      if (!target.searchParams.has("factory")) return row;
      const factory = JSON.parse(target.searchParams.get("factory"));
      return {
        ...row,
        gen_data: Object.fromEntries(
          Object.entries(factory).map(([key, template]) => [
            key,
            String(template)
              .replace(/\$\$\{([^}]+)\}/g, (_, name) => "$" + (row[name] ?? ""))
              .replace(/\$\{([^}]+)\}/g, (_, name) => String(row[name] ?? "")),
          ]),
        ),
      };
    }),
    meta: {
      total: rows.length,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(rows.length / limit)),
    },
  });
});
server.listen(8787, "127.0.0.1", () => console.log("Mock PHP ready on 8787"));
