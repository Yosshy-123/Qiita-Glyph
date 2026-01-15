import { Hono } from "hono";

const app = new Hono();

/* -----------------------------
 * 型定義
 * ---------------------------- */

type QiitaItem = {
  id: string;
  title: string;
  likes_count: number;
};

type QiitaUser = {
  id: string;
  name: string | null;
  profile_image_url: string;
};

/* -----------------------------
 * Utility
 * ---------------------------- */

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/* -----------------------------
 * Qiita API
 * ---------------------------- */

async function fetchQiitaUser(userId: string): Promise<QiitaUser> {
  const res = await fetch(`https://qiita.com/api/v2/users/${userId}`);
  if (!res.ok) {
    throw new Error("Failed to fetch user");
  }
  return res.json();
}

async function fetchQiitaItems(userId: string): Promise<QiitaItem[]> {
  const res = await fetch(
    `https://qiita.com/api/v2/users/${userId}/items?per_page=100`
  );
  if (!res.ok) {
    throw new Error("Failed to fetch items");
  }
  return res.json();
}

/* -----------------------------
 * SVG Generator
 * ---------------------------- */

function generateSvg(params: {
  displayName: string;
  userId: string;
  totalItems: number;
  totalLikes: number;
}): string {
  const { displayName, userId, totalItems, totalLikes } = params;

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="480" height="120">
  <style>
    .title { font: bold 18px system-ui, -apple-system, BlinkMacSystemFont; fill: #111; }
    .meta  { font: 14px system-ui, -apple-system, BlinkMacSystemFont; fill: #333; }
    .label { font: 12px system-ui, -apple-system, BlinkMacSystemFont; fill: #666; }
  </style>

  <rect x="0" y="0" width="100%" height="100%" rx="12" fill="#ffffff" stroke="#e5e7eb"/>

  <text x="24" y="34" class="title">
    ${escapeXml(displayName)}
  </text>

  <text x="24" y="56" class="label">
    Qiita User ID: ${escapeXml(userId)}
  </text>

  <text x="24" y="86" class="meta">
    📄 Articles: ${totalItems} ❤️ Likes: ${totalLikes}
  </text>
</svg>
`.trim();
}

/* -----------------------------
 * Routes
 * ---------------------------- */

app.get("/api/:userId/qiita.svg", async (c) => {
  const userId = c.req.param("userId");

  let displayName = userId;
  let totalItems = 0;
  let totalLikes = 0;

  try {
    const [user, items] = await Promise.all([
      fetchQiitaUser(userId),
      fetchQiitaItems(userId),
    ]);

    if (user.name && user.name.trim() !== "") {
      displayName = user.name;
    }

    totalItems = items.length;
    totalLikes = items.reduce(
      (sum, item) => sum + item.likes_count,
      0
    );
  } catch {
    // 失敗しても SVG は返す（userId のみ表示）
  }

  const svg = generateSvg({
    displayName,
    userId,
    totalItems,
    totalLikes,
  });

  return c.body(svg, 200, {
    "Content-Type": "image/svg+xml; charset=utf-8",
    "Cache-Control": "no-store",
  });
});

/* -----------------------------
 * Fallback
 * ---------------------------- */

app.get("/", (c) => {
  return c.text("QiitaGlyph is running");
});

export default app;
