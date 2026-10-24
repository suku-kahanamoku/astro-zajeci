import manifest from "./migration.json";
const routes = new Set(manifest.pages.map((page) => page.route));
export function routePattern(parts: string[]) {
  return (
    "/" +
    parts
      .map((part, index) =>
        (index === 2 && parts[0] === "admin" && part !== "create") ||
        (index === 1 && parts[0] === "wine")
          ? ":id"
          : part,
      )
      .join("/")
  );
}
export function isPageRoute(parts: string[]) {
  return routes.has(parts.length ? routePattern(parts) : "/");
}
