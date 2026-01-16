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
  const cacheKey = new Request(c.req.url, { method: 'GET' });

  const cachedResponse = await cache.match(cacheKey);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const user = await fetchQiita<QiitaUser>(
      `https://qiita.com/api/v2/users/${userId}`
    );

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
  } catch (err: any) {
    if (err?.status === 404) {
      return errorSvg(c, `User "${userId}" not found`);
    }
    if (err?.status === 429) {
      return errorSvg(c, "Rate limit exceeded");
    }
    return errorSvg(c, err?.message ?? "Qiita API error");
  }
});

export default {
  fetch: app.fetch,
};

/* ---------- XML escape ---------- */

function escapeXml(str: string) {
  return str.replace(/[<>&"]/g, (c) =>
    ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" }[c]!)
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

  if (typeof (globalThis as any).Buffer !== "undefined") {
    const base64 = (globalThis as any).Buffer.from(buffer).toString("base64");
    return `data:${contentType};base64,${base64}`;
  }

  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000; // 32KB per chunk
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
  const cardShadowId = `cardShadow-${uid}`;
  const panelGlossId = `panelGloss-${uid}`;
  const clipId = data.clipId;

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="420" height="160" viewBox="0 0 420 160" role="img" aria-label="Qiita profile card for ${usernameEsc}">
  <defs>
    <stop offset="0%" stop-color="${bgTop}" stop-opacity="1"/>
    <stop offset="100%" stop-color="${bgBottom}" stop-opacity="1"/>

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
      ${createStatBox(0, 0, postsStr, "Posts", postsIconSvg(), fg, sub)}
      ${createStatBox(98, 0, likesStr, "LGTM", heartIconSvg(), fg, sub)}
      ${createStatBox(196, 0, stocksStr, "Stocks", bookmarkIconSvg(), fg, sub)}
      ${createStatBox(294, 0, followersStr, "Followers", userIconSvg(), fg, sub)}
    </g>
  </g>
</svg>
`;
}

function formatNumber(n: number) {
  try {
    return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n);
  } catch {
    return String(n);
  }
}

function createStatBox(
  x: number,
  y: number,
  value: string,
  label: string,
  iconPath: string,
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
      style="color: ${valueColor}"
      aria-hidden="true"
    >
      ${iconPath}
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

function postsIconSvg() {
  return `
    <g transform="translate(0,3)">
      <rect x="1" y="4" width="22" height="16" rx="2" stroke="currentColor" stroke-width="1.4" fill="none" />
      <path d="M5 8h14" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
    </g>
  `;
}

function heartIconSvg() {
  return `
    <g transform="translate(0,-4)">
      <path d="M14.1154 28.1838C15.103 29.0961 16.8963 29.1091 17.8839 28.2098L17.9624 28.1383C24.7406 21.9617 29.1759 17.9201 28.9946 12.8825C28.9167 10.6668 27.7861 8.54237 25.9538 7.29116C23.1657 5.37395 19.8454 5.92832 17.4718 7.64444C16.9248 8.03993 16.428 8.49713 15.9996 9C15.5711 8.49695 15.0742 8.04006 14.5269 7.64512C12.1533 5.93219 8.83337 5.3847 6.04547 7.29116C4.21318 8.54237 3.08261 10.6668 3.00464 12.8825C2.83571 17.9395 7.29299 21.9929 14.1154 28.1838ZM5.00346 12.9511C5.06043 11.3482 5.8858 9.82201 7.17333 8.94281L7.17442 8.94206C9.53222 7.32971 12.6568 8.16 14.4772 10.2969L15.3906 11.3693C15.7101 11.7443 16.2892 11.7443 16.6086 11.3693L17.5221 10.2969C19.3469 8.15481 22.4686 7.32185 24.8206 8.93915L24.826 8.94281C26.1139 9.82233 26.9395 11.3493 26.9959 12.9528L26.9959 12.9544C27.0625 14.8048 26.3067 16.6196 24.5072 18.858C22.6788 21.1323 19.9917 23.5832 16.5374 26.7311C16.4848 26.7789 16.3085 26.8783 16.0137 26.8762C15.7197 26.8742 15.5349 26.7723 15.4725 26.7147L15.466 26.7086L15.4594 26.7027C12.0064 23.5693 9.32251 21.1243 7.49669 18.8544C5.70024 16.621 4.94209 14.8045 5.00346 12.9511Z" fill="currentColor" />
    </g>
  `;
}

function bookmarkIconSvg() {
  return `
    <g transform="translate(0,-4)">
      <path d="M6.5 5H25.5C25.7761 5 26 5.22386 26 5.5V6.5C26 6.77614 25.7761 7 25.5 7H6.5C6.22386 7 6 6.77614 6 6.5V5.5C6 5.22386 6.22386 5 6.5 5ZM24 19V11.5C24 11.3674 23.9473 11.2402 23.8536 11.1464C23.7598 11.0527 23.6326 11 23.5 11H8.5C8.36739 11 8.24021 11.0527 8.14645 11.1464C8.05268 11.2402 8 11.3674 8 11.5V19C8 20.8565 8.7375 22.637 10.0503 23.9497C11.363 25.2625 13.1435 26 15 26H17C18.8565 26 20.637 25.2625 21.9497 23.9497C23.2625 22.637 24 20.8565 24 19ZM6.58579 9.58579C6.96086 9.21071 7.46957 9 8 9H24C24.5304 9 25.0391 9.21071 25.4142 9.58579C25.7893 9.96086 26 10.4696 26 11V19C26 21.3869 25.0518 23.6761 23.364 25.364C21.6761 27.0518 19.3869 28 17 28H15C12.6131 28 10.3239 27.0518 8.63604 25.364C6.94821 23.6761 6 21.3869 6 19V11C6 10.4696 6.21071 9.96086 6.58579 9.58579Z" fill="currentColor" />
    </g>
  `;
}

function userIconSvg() {
  return `
    <g transform="translate(0,-1)">
      <circle cx="12" cy="8" r="3" stroke="currentColor" stroke-width="1.2" fill="none"/>
      <path d="M4 20c1.5-3 5-5 8-5s6.5 2 8 5" stroke="currentColor" stroke-width="1.2" fill="none" stroke-linecap="round"/>
    </g>
  `;
}

function errorSvg(c: any, message: string) {
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
    500,
    {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "no-store",
    }
  );
}
