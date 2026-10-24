import type { APIRoute } from "astro";
import { canonical, url, wineUrl } from "../config/site";
import { publicData } from "../server/providers";
const escape = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
export const GET: APIRoute = async () => {
  try {
    const paths = ["/", "/wine", "/terms-conditions", "/gdpr"];
    const wines: any[] = [];
    for (let page = 1; page <= 1000; page++) {
      const response = await publicData("/products", {
        limit: 100,
        page,
        projection: "name,published",
      });
      wines.push(...response.data);
      if (page >= (response.meta?.totalPages || 1)) break;
      if (page === 1000) throw new Error("Sitemap limit");
    }
    const records = [
      ...paths.map((path) => ({
        cs: canonical(url(path, "cs")),
        en: canonical(url(path, "en")),
      })),
      ...wines.map((wine) => ({
        cs: canonical(wineUrl(wine, "cs")),
        en: canonical(wineUrl(wine, "en")),
      })),
    ];
    const xml =
      '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">' +
      records
        .flatMap((record) =>
          [record.cs, record.en].map(
            (loc) =>
              "<url><loc>" +
              escape(loc) +
              '</loc><xhtml:link rel="alternate" hreflang="cs-CZ" href="' +
              escape(record.cs) +
              '"/><xhtml:link rel="alternate" hreflang="en-US" href="' +
              escape(record.en) +
              '"/><xhtml:link rel="alternate" hreflang="x-default" href="' +
              escape(record.cs) +
              '"/></url>',
          ),
        )
        .join("") +
      "</urlset>";
    return new Response(xml, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch {
    return new Response("Sitemap temporarily unavailable", {
      status: 503,
      headers: { "Retry-After": "60", "Cache-Control": "no-store" },
    });
  }
};
