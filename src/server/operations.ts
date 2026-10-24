export const resources: Record<string, string> = {
  wine: "products",
  category: "categories",
  text: "texts",
  enum: "enumerations",
  user: "users",
  role: "roles",
  address: "address",
  order: "orders",
  invoice: "invoices",
};
export function operation(path: string, method: string) {
  const match =
    /^(admin\/)?(wine|category|text|enumerations|enum|user|role|address|order|invoice)(?:\/(\d+))?$/.exec(
      path,
    );
  if (!match) return null;
  const [, admin, raw, id] = match;
  const name = raw === "enumerations" ? "enum" : raw;
  if (admin) {
    if (method === "GET")
      return {
        path: "/" + resources[name] + (id ? "/" + id : ""),
        admin: true,
      };
    if (method === "POST" && !id && name !== "user")
      return { path: "/" + resources[name], admin: true };
    if (["PATCH", "DELETE"].includes(method) && id)
      return {
        path:
          "/" +
          resources[name] +
          "/" +
          id +
          (name === "invoice" && method === "PATCH" ? "/status" : ""),
        admin: true,
      };
  } else if (
    method === "GET" &&
    ["wine", "category", "text", "enumerations"].includes(raw)
  )
    return { path: "/" + resources[name] + (id ? "/" + id : ""), admin: false };
  return null;
}
