import { Hono } from "hono";

/* ---------- Types ---------- */

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

/**
 * GET /api/{user_id}/qiita.svg
 */
app.get("/api/:user_id/qiita.svg", async (c) => {
  const userId = c.req.param("user_id");
  const theme = c.req.query("theme") ?? "light";

  try {
    /* ---------- User ---------- */

    const userRes = await fetch(
      `https://qiita.com/api/v2/users/${userId}`
    );

    if (!userRes.ok) {
      return errorSvg(c, `User "${userId}" not found`);
    }

    const user: QiitaUser = await userRes.json();

    const displayName =
      user.name && user.name.trim() !== ""
        ? user.name
        : user.id;

    /* ---------- Items ---------- */

    const itemsRes = await fetch(
      `https://qiita.com/api/v2/users/${userId}/items?per_page=100`
    );

    const items: QiitaItem[] = itemsRes.ok
      ? await itemsRes.json()
      : [];

    const posts = items.length;
    const likes = items.reduce((a, b) => a + b.likes_count, 0);
    const stocks = items.reduce((a, b) => a + b.stocks_count, 0);

    /* ---------- SVG ---------- */

    const svg = generateSvg({
      userId: displayName,
      icon: user.profile_image_url,
      posts,
      likes,
      stocks,
      followers: user.followers_count,
      theme,
    });

    return c.body(svg, 200, {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "no-store",
    });
  } catch {
    return errorSvg(c, "Qiita API error");
  }
});

export default app;

/* ---------- SVG ---------- */

function generateSvg(data: {
  userId: string;
  icon: string;
  posts: number;
  likes: number;
  stocks: number;
  followers: number;
  theme: string;
}) {
  const dark = data.theme === "dark";

  const bg = dark ? "#020617" : "#ffffff";
  const fg = dark ? "#e5e7eb" : "#020617";
  const sub = dark ? "#94a3b8" : "#475569";

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="420" height="160">
  <style>
    .title { font: 700 16px system-ui; fill: ${fg}; }
    .label { font: 12px system-ui; fill: ${sub}; }
    .value { font: 700 14px system-ui; fill: ${fg}; }
  </style>

  <defs>
    <clipPath id="avatar">
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
    clip-path="url(#avatar)"
  />

  <text x="80" y="40" class="title">${escapeXml(data.userId)}</text>
  <text x="80" y="58" class="label">Qiita Activity</text>
  …
</svg>
`;
}

/* ---------- Error SVG ---------- */

function errorSvg(c: any, message: string) {
  return c.body(
    `
<svg xmlns="http://www.w3.org/2000/svg" width="420" height="80">
  <rect width="100%" height="100%" rx="12" fill="#fee2e2"/>
  <text x="20" y="46" font-size="14" fill="#991b1b"
    font-family="system-ui">
    ${escapeXml(message)}
  </text>
</svg>
`,
    200,
    { "Content-Type": "image/svg+xml; charset=utf-8" }
  );
}

/* ---------- Utils ---------- */

function escapeXml(str: string) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
