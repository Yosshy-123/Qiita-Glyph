/**
 * Wraps `fetch` with a hard timeout so a slow or unresponsive upstream
 * (Qiita API or an avatar host) can never hang a request indefinitely.
 */
export async function fetchWithTimeout(
  url: string,
  timeoutMs: number,
  init: RequestInit = {}
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}
