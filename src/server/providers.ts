import { php } from "./php";
import type { Envelope } from "../modules/CoreModule/types";
export async function publicData(
  path: string,
  query: Record<string, string | number> = {},
): Promise<Envelope> {
  return php(path, {
    query: new URLSearchParams(
      Object.entries(query).map(([key, value]) => [key, String(value)]),
    ),
  });
}
export async function homeData() {
  const results = await Promise.allSettled([
    publicData("/products", {
      q: JSON.stringify({ "category.syscode": { $eq: "top" } }),
      limit: 100,
    }),
    publicData("/enumerations", {
      q: JSON.stringify({ type: { $eq: "taste" } }),
      limit: 100,
    }),
    publicData("/enumerations", {
      q: JSON.stringify({
        type: { $eq: "contact" },
        syscode: { $eq: "contact" },
      }),
      limit: 1,
    }),
  ]);
  return {
    wines: results[0].status === "fulfilled" ? results[0].value.data : [],
    tasting: results[1].status === "fulfilled" ? results[1].value.data : [],
    contact:
      results[2].status === "fulfilled"
        ? results[2].value.data?.[0]?.data
        : null,
    error: results.some((result) => result.status === "rejected"),
  };
}
