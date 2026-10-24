import type { FormConfig } from "../CoreModule/types";
const configs = import.meta.glob("./configs/*.json", {
  eager: true,
  import: "default",
}) as Record<string, FormConfig>;
export const sections = [
  ["wine", "$.admin.wine.title", "heroicons:beaker"],
  ["taste", "$.admin.taste.title", "heroicons:sparkles"],
  ["category", "$.admin.category.title", "heroicons:tag"],
  ["order", "$.admin.order.title", "heroicons:shopping-bag"],
  ["invoice", "$.admin.invoice.title", "heroicons:document-text"],
  ["user", "$.admin.user.title", "heroicons:users"],
  ["address", "$.admin.address.title", "heroicons:map-pin"],
  ["role", "$.admin.role.title", "heroicons:shield-check"],
  ["text", "$.admin.text.title", "heroicons:document"],
  ["mail", "$.admin.mail.title", "heroicons:envelope"],
  ["enum", "$.admin.enum.title", "heroicons:list-bullet"],
  ["payment", "$.admin.payment.title", "heroicons:credit-card"],
  ["shipping", "$.admin.shipping.title", "heroicons:truck"],
  ["vat-rate", "$.admin.vat_rate.title", "heroicons:receipt-percent"],
];
export function adminConfig(section: string, mode: string) {
  return configs[
    `./configs/${section === "profile" ? "profile" : "admin-" + section + "-" + mode}.json`
  ];
}
export function resolveConfigPath(path: string, id?: string) {
  return path
    .replaceAll("${route.meta.id}", id || "")
    .replaceAll("${item.id}", id || "");
}
