import type { APIRoute } from "astro";
import { SITE_URL } from "../config/site";
export const GET: APIRoute = () =>
  new Response(
    "User-agent: *\nAllow: /\n" +
      ["/api/", ...["/admin", "/pz"].flatMap((path) => [path, "/en" + path])]
        .map((path) => "Disallow: " + path)
        .join("\n") +
      "\nSitemap: " +
      SITE_URL +
      "/sitemap.xml\n",
    { headers: { "Content-Type": "text/plain; charset=utf-8" } },
  );
