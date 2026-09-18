import { Hono } from "hono";
import { buildCacheKey, cacheResponse, getCachedResponse, withCacheHeaders } from "./cache";
import { getErrorMessage, getErrorStatus, toKnownErrorStatus } from "./errors";
import { fetchIconAsDataUri } from "./icon";
import { fetchAllItems, fetchUser, resolveUsername } from "./qiita/client";
import { renderErrorCard } from "./svg/errorCard";
import { renderProfileCard } from "./svg/profileCard";
import type { ProfileStats } from "./types";
import { isValidUserId, parseTheme } from "./utils/validation";

const app = new Hono();

/**
 * GET /:user_id[?theme=dark|light]
 * Returns an SVG card summarizing a Qiita user's public activity.
 */
app.get("/:user_id", async (c) => {
  const userId = c.req.param("user_id");

  if (!isValidUserId(userId)) {
    return renderErrorCard(c, "Invalid Qiita user ID", 400);
  }

  const theme = parseTheme(c.req.query("theme"));
  const cacheKey = buildCacheKey(c.req.url, theme);

  const cached = await getCachedResponse(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const [user, items] = await Promise.all([fetchUser(userId), fetchAllItems(userId)]);
    const icon = await fetchIconAsDataUri(user.profile_image_url);

    const stats: ProfileStats = {
      username: resolveUsername(user),
      userId: user.id,
      icon,
      posts: items.length,
      likes: items.reduce((total, item) => total + item.likes_count, 0),
      stocks: items.reduce((total, item) => total + item.stocks_count, 0),
      followers: user.followers_count,
      theme,
    };

    const svg = renderProfileCard(stats);
    const response = withCacheHeaders(
      new Response(svg, {
        status: 200,
        headers: { "Content-Type": "image/svg+xml; charset=utf-8" },
      })
    );

    await cacheResponse(cacheKey, response);
    return response;
  } catch (err: unknown) {
    const status = toKnownErrorStatus(getErrorStatus(err));
    const message =
      status === 404
        ? `User "${userId}" not found`
        : status === 429
          ? "Rate limit exceeded"
          : getErrorMessage(err);

    return renderErrorCard(c, message, status);
  }
});

export default {
  fetch: app.fetch,
};
