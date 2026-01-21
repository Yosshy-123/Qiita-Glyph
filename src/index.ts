import { Hono } from "hono";

type QiitaUser = {
  id: string;
  name: string | null;
  profile_image_url: string;
  followers_count: number;
};

type QiitaItem = {
  likes_count: number;
  stocks_count: number;
};

type QiitaApiError = {
  message?: string;
  type?: string;
};

const app = new Hono();

async function fetchQiita<T>(url: string): Promise<T> {
  const res = await fetch(url);

  if (res.ok) {
    return res.json() as Promise<T>;
  }

  let message = `Qiita API error (${res.status})`;

  try {
    const err: QiitaApiError = await res.json();
    if (err?.message) {
      message = err.message;
    }
  } catch {
    // Ignore non-JSON formats
  }

  const error = new Error(message) as Error & {
    status?: number;
    type?: string;
  };

  error.status = res.status;
  throw error;
}

async function fetchAllItems(userId: string): Promise<QiitaItem[]> {
  const items: QiitaItem[] = [];
  let page = 1;

  while (true) {
    const data = await fetchQiita<QiitaItem[]>(
      `https://qiita.com/api/v2/users/${userId}/items?per_page=100&page=${page}`
    );

    if (data.length === 0) break;

    items.push(...data);
    page++;
  }

  return items;
}

function resolveUsername(user: QiitaUser): string {
  if (user.name && user.name.trim() !== "") {
    return user.name;
  }
  return user.id;
}

/**
 * GET /{user_id}
 */
app.get("/:user_id", async (c) => {
  const userId = c.req.param("user_id");
  const theme = c.req.query("theme") === "dark" ? "dark" : "light";

  const cache = caches.default; // Cloudflare Workers default cache
  const url = new URL(c.req.url);
  url.search = "";
  url.searchParams.set("theme", theme);
  const cacheKey = new Request(url.toString(), { method: 'GET' });

  const cachedResponse = await cache.match(cacheKey);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const user = await fetchQiita<QiitaUser>(`https://qiita.com/api/v2/users/${userId}`);
    const items = await fetchAllItems(userId);

    const posts = items.length;
    const likes = items.reduce((a, b) => a + b.likes_count, 0);
    const stocks = items.reduce((a, b) => a + b.stocks_count, 0);

    const icon = await imagetobase64(user.profile_image_url);

    const clipId = `avatar-${makeSafeId(user.id)}`;

    const name = resolveUsername(user);

    const svg = generateSvg({
      username: name,
      userId: user.id,
      icon,
      posts,
      likes,
      stocks,
      followers: user.followers_count,
      theme,
      clipId,
    });

    const response = new Response(svg, {
      status: 200,
      headers: {
        "Content-Type": "image/svg+xml; charset=utf-8",
        "Cache-Control": "public, max-age=0, s-maxage=86400, stale-while-revalidate=86400",
      },
    });
    await cache.put(cacheKey, response.clone());
    return response;
  } catch (err: unknown) {
    let message = "Qiita API error";
    let status = 500;

    if (err instanceof Error) {
      message = err.message;
      if ("status" in err && typeof (err as any).status === "number") {
        status = (err as any).status;
      }
    }

    if (status === 404) {
      return errorSvg(c, `User "${userId}" not found`, 404);
    }
    if (status === 429) {
      return errorSvg(c, "Rate limit exceeded", 429);
    }

    return errorSvg(c, message, status);
  }
});

export default {
  fetch: app.fetch,
};

/* ---------- XML escape ---------- */
function escapeXml(str: string) {
  return str.replace(/[<>&"']/g, (c) =>
    ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" }[c]!)
  );
}

/* ---------- id sanitize ---------- */
function makeSafeId(s: string) {
  return s.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 64);
}

/* ---------- img to Base64 ---------- */
async function imagetobase64(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("Icon fetch failed");
  }

  const contentType =
    res.headers.get("content-type") ?? "image/png";

  const buffer = await res.arrayBuffer();

  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = "";

  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    let chunkStr = "";
    for (let j = 0; j < chunk.length; j++) {
      chunkStr += String.fromCharCode(chunk[j]);
    }
    binary += chunkStr;
  }

  const base64 = btoa(binary);
  return `data:${contentType};base64,${base64}`;
}

/* ---------- SVG ---------- */
function generateSvg(data: {
  username: string;
  userId: string;
  icon: string;
  posts: number;
  likes: number;
  stocks: number;
  followers: number;
  theme: string;
  clipId: string;
}) {
  const dark = data.theme === "dark";

  const bgTop = dark ? "#071018" : "#ffffff";
  const bgBottom = dark ? "#04060a" : "#f8fafc";
  const cardBg = dark ? "#071018" : "#fbfdff";
  const fg = dark ? "#e6f0e0" : "#0b1220";
  const sub = dark ? "#93a09a" : "#6b7280";
  const accent = "#55c500";

  const uid = makeSafeId(data.userId);

  const usernameEsc = escapeXml(data.username);
  const userIdEsc = escapeXml(data.userId);

  const postsStr = formatNumber(data.posts);
  const likesStr = formatNumber(data.likes);
  const stocksStr = formatNumber(data.stocks);
  const followersStr = formatNumber(data.followers);

  const accentGradId = `accentGrad-${uid}`;
  const panelGlossId = `panelGloss-${uid}`;
  const clipId = data.clipId;

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="420" height="160" viewBox="0 0 420 160" role="img" aria-label="Qiita profile card for ${usernameEsc}">
  <defs>
    <linearGradient id="bgGrad" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0%" stop-color="${bgTop}" stop-opacity="1"/>
      <stop offset="100%" stop-color="${bgBottom}" stop-opacity="1"/>
    </linearGradient>

    <linearGradient id="${accentGradId}" x1="0" x2="1">
      <stop offset="0%" stop-color="${accent}" stop-opacity="1"/>
      <stop offset="100%" stop-color="#7ce24a" stop-opacity="0.95"/>
    </linearGradient>

    <clipPath id="${clipId}">
      <circle cx="44" cy="44" r="22" />
    </clipPath>

    <linearGradient id="${panelGlossId}" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="${dark ? 0.02 : 0.06}"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
    </linearGradient>
  </defs>

  <g>
    <rect x="0" y="0" width="420" height="160" rx="12" fill="${cardBg}" />
    <rect x="0" y="0" width="420" height="160" rx="12" fill="url(#${panelGlossId})" style="mix-blend-mode: overlay"/>

    <circle cx="44" cy="44" r="26" fill="${dark ? '#071617' : '#f1f5f9'}"/>
    <circle cx="44" cy="44" r="26" stroke="url(#${accentGradId})" stroke-width="2" fill="none" />

    <image
      href="${data.icon}"
      x="22"
      y="22"
      width="44"
      height="44"
      clip-path="url(#${clipId})"
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label="Avatar of ${usernameEsc}"
    />

    <text x="84" y="36" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial" font-weight="700" font-size="16" fill="${fg}">
      ${usernameEsc}
    </text>

    <text x="84" y="56" font-family="system-ui" font-size="12" fill="${sub}">
      @${userIdEsc}
    </text>

    <g transform="translate(16,84)">
      ${createStatBox(0, 0, postsStr, "Posts", postsIconSvg, fg, sub)}
      ${createStatBox(98, 0, likesStr, "LGTM", heartIconSvg, fg, sub)}
      ${createStatBox(196, 0, stocksStr, "Stocks", bookmarkIconSvg, fg, sub)}
      ${createStatBox(294, 0, followersStr, "Followers", userIconSvg, fg, sub)}
    </g>
  </g>
</svg>
`;
}

function formatNumber(n: number) {
  try {
    return new Intl.NumberFormat("ja-JP", { maximumFractionDigits: 0 }).format(n);
  } catch {
    return String(n);
  }
}

function createStatBox(
  x: number,
  y: number,
  value: string,
  label: string,
  iconSvgFn: (color: string) => string,
  valueColor: string,
  labelColor: string
) {
  return `
  <g transform="translate(${x},${y})">
    <rect x="0" y="0" width="86" height="48" rx="8" fill="transparent"/>

    <svg
      x="10"
      y="10"
      width="20"
      height="20"
      viewBox="0 0 32 32"
      aria-hidden="true"
    >
      ${iconSvgFn(valueColor)}
    </svg>

    <text x="34" y="18"
      font-family="system-ui"
      font-size="14"
      font-weight="700"
      fill="${valueColor}">
      ${value}
    </text>

    <text x="34" y="34"
      font-family="system-ui"
      font-size="11"
      fill="${labelColor}">
      ${label}
    </text>
  </g>
  `;
}

/* ---------- Icons with explicit stroke and fill ---------- */
function postsIconSvg(color: string) {
  return `
    <g transform="scale(1.3)">
      <path 
        d="M15 8H17M15 12H17M17 16H7M7 8V12H11V8H7ZM5 20H19C20.1046 20 21 19.1046 21 18V6C21 4.89543 20.1046 4 19 4H5C3.89543 4 3 4.89543 3 6V18C3 19.1046 3.89543 20 5 20Z" 
        stroke="${color}" 
        fill="transparent"
        stroke-linecap="round" 
        stroke-linejoin="round" 
        stroke-width="2"
      />
    </g>
  `;
}

function heartIconSvg(color: string) {
  return `
    <g transform="scale(1.3)">
      <path 
        d="M12 6.00019C10.2006 3.90317 7.19377 3.2551 4.93923 5.17534C2.68468 7.09558 2.36727 10.3061 4.13778 12.5772C5.60984 14.4654 10.0648 18.4479 11.5249 19.7369C11.6882 19.8811 11.7699 19.9532 11.8652 19.9815C11.9483 20.0062 12.0393 20.0062 12.1225 19.9815C12.2178 19.9532 12.2994 19.8811 12.4628 19.7369C13.9229 18.4479 18.3778 14.4654 19.8499 12.5772C21.6204 10.3061 21.3417 7.07538 19.0484 5.17534C16.7551 3.2753 13.7994 3.90317 12 6.00019Z"
        stroke="${color}"
        fill="transparent"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </g>
  `;
}

function bookmarkIconSvg(color: string) {
  return `
    <g transform="scale(1.3)">
      <path 
        d="M6.09 21.06a1 1 0 0 1-1-1L4.94 5.4a2.26 2.26 0 0 1 2.18-2.35L16.71 3a2.27 2.27 0 0 1 2.23 2.31l.14 14.66a1 1 0 0 1-.49.87 1 1 0 0 1-1 0l-5.7-3.16-5.29 3.23a1.2 1.2 0 0 1-.51.15zm5.76-5.55a1.11 1.11 0 0 1 .5.12l4.71 2.61-.12-12.95c0-.2-.13-.34-.21-.33l-9.6.09c-.08 0-.19.13-.19.33l.12 12.9 4.28-2.63a1.06 1.06 0 0 1 .51-.14z" 
        fill="${color}"
      />
    </g>
  `;
}

function userIconSvg(color: string) {
  return `
    <g transform="scale(1.3)">
      <path d="M4 21C4 17.4735 6.60771 14.5561 10 14.0709
               M16.4976 16.2119C15.7978 15.4328 14.6309 15.2232 13.7541 15.9367
               C12.8774 16.6501 12.7539 17.843 13.4425 18.6868
               C13.8312 19.1632 14.7548 19.9983 15.4854 20.6353
               C15.8319 20.9374 16.0051 21.0885 16.2147 21.1503
               C16.3934 21.203 16.6018 21.203 16.7805 21.1503
               C16.9901 21.0885 17.1633 20.9374 17.5098 20.6353
               C18.2404 19.9983 19.164 19.1632 19.5527 18.6868
               C20.2413 17.843 20.1329 16.6426 19.2411 15.9367
               C18.3492 15.2307 17.1974 15.4328 16.4976 16.2119
               M15 7C15 9.20914 13.2091 11 11 11
               C8.79086 11 7 9.20914 7 7
               C7 4.79086 8.79086 3 11 3
               C13.2091 3 15 4.79086 15 7Z"
        stroke="${color}"
        fill="transparent"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"/>
    </g>
  `;
}

/* ---------- Error SVG ---------- */
import type { Context } from "hono";

function errorSvg(c: Context, message: string, status = 500) {
  const safeMessage = escapeXml(message);

  return c.body(
    `
<svg xmlns="http://www.w3.org/2000/svg" width="420" height="80">
  <rect width="100%" height="100%" rx="12" fill="#fee2e2"/>
  <text x="20" y="46"
        font-size="14"
        fill="#991b1b"
        font-family="system-ui">
    ${safeMessage}
  </text>
</svg>
`,
    status,
    {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "no-store",
    }
  );
}
