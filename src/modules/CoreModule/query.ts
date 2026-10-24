/** Translate the original Nuxt bookmark/query format to the current php-core wire contract. */
export function normalizeQuery(input: Record<string, any>): URLSearchParams {
  const result = new URLSearchParams();
  for (const [key, value] of Object.entries(input)) {
    if (value === undefined || value === null || value === "" || key === "skip")
      continue;
    if (key === "q") {
      const filter = typeof value === "string" ? JSON.parse(value) : value;
      if (!filter || typeof filter !== "object" || Array.isArray(filter))
        throw new Error("Neplatný filtr.");
      const converted = Object.fromEntries(
        Object.entries(filter).map(([column, condition]) => {
          if (
            condition &&
            typeof condition === "object" &&
            !Array.isArray(condition) &&
            "value" in condition
          ) {
            const spec = condition as any;
            const op = String(
              typeof spec.operator === "object"
                ? spec.operator.value
                : spec.operator || "eq",
            ).replace(/^\$/, "");
            const operators: Record<string, string> = {
              eq: "$eq",
              ne: "$ne",
              neq: "$ne",
              regex: "$regex",
              in: "$in",
              gt: "$gt",
              gte: "$gte",
              lt: "$lt",
              lte: "$lte",
            };
            if (!operators[op]) throw new Error("Neplatný operátor.");
            return [
              column,
              {
                [operators[op]]:
                  typeof spec.value === "string"
                    ? decodeURIComponent(spec.value)
                    : spec.value,
              },
            ];
          }
          return [column, condition];
        }),
      );
      result.set(key, JSON.stringify(converted));
    } else if (key === "sort") {
      let sort = value;
      if (typeof sort === "string") {
        const legacy = /^([a-zA-Z_][\w.]*)\s+(ASC|DESC)$/i.exec(sort.trim());
        sort = legacy
          ? [{ [legacy[1]]: legacy[2].toUpperCase() === "ASC" ? 1 : -1 }]
          : JSON.parse(sort);
      }
      if (
        !Array.isArray(sort) ||
        sort.some(
          (item) =>
            !item ||
            typeof item !== "object" ||
            Object.keys(item).length !== 1 ||
            ![1, -1].includes(Object.values(item)[0] as number),
        )
      )
        throw new Error("Neplatné řazení.");
      result.set(key, JSON.stringify(sort));
    } else if (key === "projection") {
      let projection = value;
      if (typeof value === "string" && /^[\[{]/.test(value))
        projection = JSON.parse(value);
      result.set(
        key,
        Array.isArray(projection)
          ? projection.join(",")
          : typeof projection === "object"
            ? Object.keys(projection).join(",")
            : String(projection),
      );
    } else
      result.set(
        key,
        typeof value === "object" ? JSON.stringify(value) : String(value),
      );
  }
  if (input.skip !== undefined && input.limit)
    result.set(
      "page",
      String(Math.floor(Number(input.skip) / Number(input.limit)) + 1),
    );
  return result;
}
export function configQuery(
  config: any,
  params: URLSearchParams,
  base: URLSearchParams,
): URLSearchParams {
  const values: Record<string, any> = Object.fromEntries(base);
  const legacy = params.get(config.syscode);
  if (legacy) {
    const parsed = JSON.parse(legacy);
    if (parsed.fields)
      values.q = { ...JSON.parse(values.q || "{}"), ...parsed.fields };
    if (parsed.sort) values.sort = parsed.sort;
    if (parsed.pagination) Object.assign(values, parsed.pagination);
  }
  for (const key of ["q", "sort", "page", "limit"])
    if (params.has(key)) values[key] = params.get(key);
  values.limit = Math.min(
    100,
    Math.max(1, Number(values.limit) || config.pagination?.limit || 20),
  );
  values.page = Math.max(1, Number(values.page) || 1);
  return normalizeQuery(values);
}
