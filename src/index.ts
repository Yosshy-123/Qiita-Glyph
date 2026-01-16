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
  let items: QiitaItem[] = [];
  let page = 1;

  while (true) {
    const data = await fetchQiita<QiitaItem[]>(
      `https://qiita.com/api/v2/users/${userId}/items?per_page=100&page=${page}`
    );

    if (data.length === 0) break;

    items = items.push(...data);
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

  try {
    // --- User ---
    const user = await fetchQiita<QiitaUser>(
      `https://qiita.com/api/v2/users/${userId}`
    );

    const items = await fetchAllItems(userId);

    const posts = items.length;
    const likes = items.reduce((a, b) => a + b.likes_count, 0);
    const stocks = items.reduce((a, b) => a + b.stocks_count, 0);

    const icon = await imagetobase64(
      user.profile_image_url
    );

    // --- unique clipPath id ---
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

    return c.body(svg, 200, {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=86400, stale-while-revalidate=86400", // CDN Cache 24h
    });
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

  const bgGradId = `bgGrad-${uid}`;
  const accentGradId = `accentGrad-${uid}`;
  const cardShadowId = `cardShadow-${uid}`;
  const panelGlossId = `panelGloss-${uid}`;
  const clipId = data.clipId;

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="420" height="160" viewBox="0 0 420 160" role="img" aria-label="Qiita profile card for ${usernameEsc}">
  <defs>
    <linearGradient id="${bgGradId}" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0%" stop-color="${bgTop}" stop-opacity="1"/>
      <stop offset="100%" stop-color="${bgBottom}" stop-opacity="1"/>
    </linearGradient>

    <linearGradient id="${accentGradId}" x1="0" x2="1">
      <stop offset="0%" stop-color="${accent}" stop-opacity="1"/>
      <stop offset="100%" stop-color="#7ce24a" stop-opacity="0.95"/>
    </linearGradient>

    <filter id="${cardShadowId}" x="-50%" y="-50%" width="200%" height="200%">
      <feOffset result="off" in="SourceAlpha" dx="0" dy="6"/>
      <feGaussianBlur result="blur" in="off" stdDeviation="8"/>
      <feColorMatrix in="blur" type="matrix"
        values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.18 0"/>
      <feBlend in="SourceGraphic" in2="blur" mode="normal"/>
    </filter>

    <clipPath id="${clipId}">
      <circle cx="44" cy="44" r="22" />
    </clipPath>

    <linearGradient id="${panelGlossId}" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="${dark ? 0.02 : 0.06}"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
    </linearGradient>
  </defs>

  <rect width="100%" height="100%" rx="12" fill="url(#${bgGradId})"/>

  <g transform="translate(10,10)">
    <rect x="0" y="0" width="400" height="140" rx="12" fill="${cardBg}" filter="url(#${cardShadowId})"/>
    <rect x="0" y="0" width="400" height="140" rx="12" fill="url(#${panelGlossId})" style="mix-blend-mode: overlay"/>

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

    <text x="84" y="34" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial" font-weight="700" font-size="16" fill="${fg}">
      ${usernameEsc}
    </text>

    <text x="84" y="54" font-family="system-ui" font-size="12" fill="${sub}">
      @${userIdEsc}
    </text>

    <g transform="translate(84,64)">
      <rect x="0" y="0" rx="6" height="20" width="74" fill="none" stroke="${accent}" stroke-width="1" />
      <text x="8" y="14" font-size="11" font-weight="600" fill="${accent}" font-family="system-ui">Qiita</text>
    </g>

    <g transform="translate(16,92)">
      ${createStatBox(0, 0, postsStr, "Posts", postsIconSvg(), fg, sub)}
      ${createStatBox(98, 0, likesStr, "LGTM", heartIconSvg(), accent, sub)}
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

function createStatBox(x: number, y: number, value: string, label: string, iconSvg: string, valueColor: string, labelColor: string) {
  return `
  <g transform="translate(${x},${y})" aria-hidden="false">
    <rect x="0" y="0" width="86" height="48" rx="8" fill="transparent"/>
    <g transform="translate(10,8)" style="color: ${valueColor}">
      ${iconSvg}
    </g>
    <text x="34" y="18" font-family="system-ui" font-size="14" font-weight="700" fill="${valueColor}">${value}</text>
    <text x="34" y="34" font-family="system-ui" font-size="11" fill="${labelColor}">${label}</text>
  </g>
  `;
}

function postsIconSvg() {
  return `
  <svg x="0" y="0" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="1" y="4" width="22" height="16" rx="2" stroke="currentColor" stroke-width="1.4" fill="none" />
    <path d="M5 8h14" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
  </svg>
  `;
}

function heartIconSvg() {
  return `
  <svg x="0" y="0" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12.1 21s-7.1-4.73-9-7.13C1 9.5 5 6 8.5 8.5 10 9.8 12 11.6 12 11.6s2-1.8 3.5-3.1C19 6 23 9.5 20.9 13.87 20.1 16.27 12.1 21 12.1 21z"
      stroke="currentColor" stroke-width="1.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
  `;
}

function bookmarkIconSvg() {
  return `
  <svg x="0" y="0" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M6 2h12v18l-6-4-6 4V2z" stroke="currentColor" stroke-width="1.2" fill="none" stroke-linejoin="round"/>
  </svg>
  `;
}

function userIconSvg() {
  return `
  <svg x="0" y="0" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="8" r="3" stroke="currentColor" stroke-width="1.2" fill="none"/>
    <path d="M4 20c1.5-3 5-5 8-5s6.5 2 8 5" stroke="currentColor" stroke-width="1.2" fill="none" stroke-linecap="round"/>
  </svg>
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
    200,
    {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "no-store",
    }
  );
}
