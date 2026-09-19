import { CACHE_TTL_SECONDS, type Theme } from "./config";

/** Builds a stable cache key from the request URL and resolved theme,
 * ignoring any other query parameters so equivalent requests share a
 * cache entry. */
export function buildCacheKey(requestUrl: string, theme: Theme): Request {
  const url = new URL(requestUrl);
  url.search = "";
  url.searchParams.set("theme", theme);
  return new Request(url.toString(), { method: "GET" });
}

export function getCachedResponse(key: Request): Promise<Response | undefined> {
  return caches.default.match(key);
}

export async function cacheResponse(key: Request, response: Response): Promise<void> {
  await caches.default.put(key, response.clone());
}

/** Applies the standard shared/edge caching policy for successful cards. */
export function withCacheHeaders(response: Response): Response {
  response.headers.set(
    "Cache-Control",
    `public, max-age=0, s-maxage=${CACHE_TTL_SECONDS}, stale-while-revalidate=${CACHE_TTL_SECONDS}`
  );
  return response;
}
