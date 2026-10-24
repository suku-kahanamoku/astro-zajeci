export const SITE_URL = "https://www.vinozezajeci.cz";
export const SITE_NAME = "ZAJECI - VÍNO ZE ZAJECÍ";
export function url(path: string, locale = "cs") {
  return (
    (locale === "en" ? "/en" : "") +
    (path === "/" ? (locale === "en" ? "" : "/") : path)
  );
}
export function canonical(path: string) {
  return SITE_URL + (path === "/" ? "/" : path.replace(/\/+$/, ""));
}
export function wineUrl(
  wine: { id: number | string; name: string },
  locale = "cs",
) {
  return url(
    "/wine/" + encodeURIComponent(wine.name) + "--$" + wine.id,
    locale,
  );
}
export const privatePaths = [
  "/admin",
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/gallery",
  "/cashdesk",
  "/cashdesk-completed",
  "/pz",
];
export function isNoindex(path: string) {
  return privatePaths.some(
    (prefix) => path === prefix || path.startsWith(prefix + "/"),
  );
}
