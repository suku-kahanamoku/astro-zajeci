/** @param {Record<string, string | undefined>} environment */
export function allowedDomains(environment) {
  const origins = [
    "https://www.vinozezajeci.cz",
    "https://vinozezajeci.cz",
    ...["localhost", "127.0.0.1", "127.0.0.3"].map(
      (host) => `http://${host}:4321`,
    ),
    environment.NUXT_FRONTEND_HOST || environment.FRONTEND_HOST,
    ...(environment.NETLIFY === "true"
      ? [environment.URL, environment.DEPLOY_URL, environment.DEPLOY_PRIME_URL]
      : []),
  ];
  return [...new Set(origins.filter(Boolean))].flatMap((origin) => {
    try {
      const url = new URL(origin);
      if (!["https:", "http:"].includes(url.protocol)) return [];
      return [
        {
          hostname: url.hostname,
          protocol: url.protocol.slice(0, -1),
          ...(url.port ? { port: url.port } : {}),
        },
      ];
    } catch {
      return [];
    }
  });
}
