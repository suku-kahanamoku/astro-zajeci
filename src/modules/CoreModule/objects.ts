export function get(object: any, path: string): any {
  return path.split(".").reduce((value, key) => value?.[key], object);
}
export function set(object: any, path: string, value: any) {
  const keys = path.split(".");
  if (
    keys.some((key) => ["__proto__", "prototype", "constructor"].includes(key))
  )
    return;
  let target = object;
  for (const key of keys.slice(0, -1)) {
    target[key] ??= {};
    target = target[key];
  }
  target[keys.at(-1)!] = value;
}
export const money = (value: unknown, locale = "cs") =>
  new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(
    Number(value) || 0,
  ) + " Kč";
export function itemId(value: string) {
  return /^(?:.+--\$)?([1-9]\d*)$/.exec(value)?.[1] || null;
}
export function fileUrl(path?: string) {
  return path ? "/api/" + path.replace(/^\/+/, "") : "/img/bottle.jpg";
}
