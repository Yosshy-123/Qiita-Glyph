import { ITEMS_PER_PAGE, QIITA_API_BASE, REQUEST_TIMEOUT_MS } from "../config";
import { QiitaRequestError } from "../errors";
import type { QiitaItem, QiitaUser } from "../types";
import { fetchWithTimeout } from "../utils/http";

async function fetchQiitaJson<T>(url: string): Promise<T> {
  const res = await fetchWithTimeout(url, REQUEST_TIMEOUT_MS);

  if (res.ok) {
    return (await res.json()) as T;
  }

  let message = `Qiita API error (${res.status})`;
  try {
    const body: unknown = await res.json();
    if (body && typeof body === "object" && "message" in body && typeof body.message === "string") {
      message = body.message;
    }
  } catch {
    // Response body wasn't JSON; keep the default message.
  }

  throw new QiitaRequestError(message, res.status);
}

export function fetchUser(userId: string): Promise<QiitaUser> {
  return fetchQiitaJson<QiitaUser>(`${QIITA_API_BASE}/users/${encodeURIComponent(userId)}`);
}

export async function fetchAllItems(userId: string): Promise<QiitaItem[]> {
  const items: QiitaItem[] = [];
  let page = 1;

  for (;;) {
    const url = `${QIITA_API_BASE}/users/${encodeURIComponent(
      userId
    )}/items?per_page=${ITEMS_PER_PAGE}&page=${page}`;

    const data = await fetchQiitaJson<QiitaItem[]>(url);
    if (data.length === 0) break;

    items.push(...data);

    // A short page means this was the last one; avoids one wasted
    // trailing request per lookup compared to always probing an extra page.
    if (data.length < ITEMS_PER_PAGE) break;

    page++;
  }

  return items;
}

/** Prefers the user's display name, falling back to their id when unset. */
export function resolveUsername(user: QiitaUser): string {
  const trimmed = user.name?.trim();
  return trimmed ? trimmed : user.id;
}
