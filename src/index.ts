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

const app = new Hono();

async function fetchAllItems(userId: string): Promise<QiitaItem[]> {
  let items: QiitaItem[] = [];
  let page = 1;

  while (true) {
    const res = await fetch(
      `https://qiita.com/api/v2/users/${userId}/items?per_page=100&page=${page}`
    );

    if (!res.ok) break;

    const data: QiitaItem[] = await res.json();

    if (data.length === 0) break;

    items = items.concat(data);
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
  const theme = c.req.query("theme") ?? "light";

  try {
    // --- User ---
    const userRes = await fetch(
      `https://qiita.com/api/v2/users/${userId}`
    );

    if (!userRes.ok) {
      return errorSvg(c, `User "${userId}" not found`);
    }

    const user: QiitaUser = await userRes.json();

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
  } catch {
    return errorSvg(c, "Qiita API error");
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

  const bg = dark ? "#020617" : "#ffffff";
  const fg = dark ? "#e5e7eb" : "#020617";
  const sub = dark ? "#94a3b8" : "#475569";

  const usernameEsc = escapeXml(data.username);
  const userIdEsc = escapeXml(data.userId);

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="420" height="160">
  <style>
    .title { font: 700 16px system-ui; fill: ${fg}; }
    .label { font: 12px system-ui; fill: ${sub}; }
    .value { font: 700 14px system-ui; fill: ${fg}; }
  </style>

  <defs>
    <clipPath id="${data.clipId}" clipPathUnits="userSpaceOnUse">
      <circle cx="44" cy="44" r="24" />
    </clipPath>
  </defs>

  <rect width="100%" height="100%" rx="12" fill="${bg}" />

  <image
    href="${data.icon}"
    x="20"
    y="20"
    width="48"
    height="48"
    clip-path="url(#${data.clipId})"
  />

  <text x="80" y="40" class="title">${usernameEsc}</text>
  <text x="80" y="58" class="label">@${userIdEsc}</text>

  <g transform="translate(20,96)">
    <text class="label">Posts</text>
    <text class="value" y="20">${data.posts}</text>
  </g>

  <g transform="translate(120,96)">
    <text class="label">LGTM</text>
    <text class="value" y="20">${data.likes}</text>
  </g>

  <g transform="translate(220,96)">
    <text class="label">Stocks</text>
    <text class="value" y="20">${data.stocks}</text>
  </g>

  <g transform="translate(320,96)">
    <text class="label">Followers</text>
    <text class="value" y="20">${data.followers}</text>
  </g>
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
