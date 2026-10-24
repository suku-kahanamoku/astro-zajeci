import cs from "./cs.json";
import en from "./en.json";
import { get } from "../CoreModule/objects";
export type Locale = "cs" | "en";
export function t(
  key: string | undefined,
  locale: string = "cs",
  params: Record<string, any> = {},
) {
  if (!key) return "";
  if (!key.startsWith("$.")) return key;
  const value = get(locale === "en" ? en : cs, key) ?? get(cs, key);
  const text =
    typeof value === "string"
      ? value
      : key.split(".").at(-1)!.replaceAll("_", " ");
  return text.replace(/\{(\w+)\}/g, (_, name) =>
    String(params[name] ?? "{" + name + "}"),
  );
}
