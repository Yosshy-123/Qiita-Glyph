import {
  CARD_HEIGHT,
  CARD_RADIUS,
  CARD_WIDTH,
  FONT_MONO,
  FONT_SANS,
  THEMES,
  TITLEBAR_HEIGHT,
  TRAFFIC_LIGHTS,
} from "../config";
import type { ProfileStats } from "../types";
import { formatNumber, truncateText } from "../utils/format";
import { escapeXml, makeSafeId } from "../utils/xml";
import { ACTIVITY_LABEL_HEIGHT, renderActivityChart } from "./activityChart";
import { bookmarkIconSvg, heartIconSvg, postsIconSvg, userIconSvg } from "./icons";
import { renderStatBox } from "./statBox";

// ---- Spacing scale ----
// A small set of consistent gaps, rather than ad-hoc numbers, so the card
// reads as evenly-paced instead of cramped in some places and loose in
// others. Everything below is derived from these.
const CONTENT_PADDING_X = 36;
const SECTION_GAP = 28;

// ---- Titlebar ----
const TRAFFIC_LIGHT_R = 6;
const TRAFFIC_LIGHT_Y = TITLEBAR_HEIGHT / 2;
const TRAFFIC_LIGHT_START_X = 24;
const TRAFFIC_LIGHT_GAP = 22;
const TITLEBAR_TEXT_X = TRAFFIC_LIGHT_START_X + TRAFFIC_LIGHT_GAP * 2 + 24;

// ---- Header (avatar + name) ----
const AVATAR_R = 32;
const AVATAR_CX = CONTENT_PADDING_X + AVATAR_R;
const AVATAR_TOP_GAP = 32;
const AVATAR_CY = TITLEBAR_HEIGHT + AVATAR_TOP_GAP + AVATAR_R;
const HEADER_TEXT_GAP = 26;
const HEADER_TEXT_X = AVATAR_CX + AVATAR_R + HEADER_TEXT_GAP;
const HEADER_TEXT_RIGHT_MARGIN = CONTENT_PADDING_X;
const NAME_BASELINE_Y = AVATAR_CY - 10;
const HANDLE_BASELINE_Y = AVATAR_CY + 18;
const HEADER_BOTTOM = AVATAR_CY + AVATAR_R;

// Rough character budgets for the available pixel width at each text's font
// size/family, used to keep long user-supplied names/ids from overflowing
// the card. A clip-path backstops this in case the estimate is ever off.
const NAME_MAX_CHARS = 28;
const HANDLE_MAX_CHARS = 32;
const PATH_USERID_MAX_CHARS = 34;

// ---- Activity chart ----
const CHART_COMMENT_Y = HEADER_BOTTOM + SECTION_GAP;
const CHART_TOP = CHART_COMMENT_Y + 16;
const CHART_BAR_AREA_HEIGHT = 46;
const CHART_HEIGHT = CHART_BAR_AREA_HEIGHT + ACTIVITY_LABEL_HEIGHT;
const CHART_WIDTH = CARD_WIDTH - CONTENT_PADDING_X * 2;
const CHART_BOTTOM = CHART_TOP + CHART_HEIGHT;

// ---- Stats row ----
const STATS_Y = CHART_BOTTOM + SECTION_GAP;
const STAT_GAP = 20;
const STAT_COLUMN_WIDTH = (CHART_WIDTH - STAT_GAP * 3) / 4;

/** Renders the full Qiita activity profile card as an SVG string. */
export function renderProfileCard(stats: ProfileStats): string {
  const palette = THEMES[stats.theme];
  const uid = makeSafeId(stats.userId);

  const clipId = `avatarClip-${uid}`;
  const cardClipId = `cardClip-${uid}`;
  const bgGradId = `bgGrad-${uid}`;
  const accentGradId = `accentGrad-${uid}`;
  const ringGradId = `ringGrad-${uid}`;
  const chartBarGradId = `chartBarGrad-${uid}`;
  const dotGridId = `dotGrid-${uid}`;
  const glowId = `glow-${uid}`;

  const usernameEsc = escapeXml(truncateText(stats.username, NAME_MAX_CHARS));
  const handleEsc = escapeXml(truncateText(stats.userId, HANDLE_MAX_CHARS));
  const pathUserIdEsc = escapeXml(truncateText(stats.userId, PATH_USERID_MAX_CHARS));
  const fullUsernameEsc = escapeXml(stats.username);

  const postsStr = formatNumber(stats.posts);
  const likesStr = formatNumber(stats.likes);
  const stocksStr = formatNumber(stats.stocks);
  const followersStr = formatNumber(stats.followers);
  const recentPosts = stats.activity.reduce((total, month) => total + month.count, 0);

  const statColumns = [
    { label: "Posts", value: postsStr, icon: postsIconSvg },
    { label: "LGTM", value: likesStr, icon: heartIconSvg },
    { label: "Stocks", value: stocksStr, icon: bookmarkIconSvg },
    { label: "Followers", value: followersStr, icon: userIconSvg },
  ];

  const statsRow = statColumns
    .map((col, i) =>
      renderStatBox({
        x: i * (STAT_COLUMN_WIDTH + STAT_GAP),
        value: col.value,
        label: col.label,
        icon: col.icon,
        iconColor: palette.accentFrom,
        chipBg: palette.chipBg,
        valueColor: palette.fg,
        labelColor: palette.sub,
        fontMono: FONT_MONO,
        fontSans: FONT_SANS,
      })
    )
    .join("\n");

  const activityChart = renderActivityChart({
    data: stats.activity,
    width: CHART_WIDTH,
    barAreaHeight: CHART_BAR_AREA_HEIGHT,
    barGradientId: chartBarGradId,
    trackColor: palette.chartTrack,
    labelColor: palette.sub,
  });

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${CARD_WIDTH}" height="${CARD_HEIGHT}" viewBox="0 0 ${CARD_WIDTH} ${CARD_HEIGHT}" role="img" aria-labelledby="title-${uid} desc-${uid}">
  <title id="title-${uid}">Qiita profile card for ${fullUsernameEsc}</title>
  <desc id="desc-${uid}">${postsStr} posts, ${likesStr} LGTM, ${stocksStr} stocks, ${followersStr} followers. ${recentPosts} posts in the last ${stats.activity.length} months.</desc>

  <defs>
    <linearGradient id="${bgGradId}" x1="0" y1="0" x2="0.6" y2="1">
      <stop offset="0%" stop-color="${palette.bgTop}" />
      <stop offset="100%" stop-color="${palette.bgBottom}" />
    </linearGradient>

    <linearGradient id="${accentGradId}" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="${CARD_WIDTH}" y2="0">
      <stop offset="0%" stop-color="${palette.accentFrom}" />
      <stop offset="100%" stop-color="${palette.accentTo}" />
    </linearGradient>

    <linearGradient id="${ringGradId}" gradientUnits="userSpaceOnUse"
                     x1="${AVATAR_CX - AVATAR_R}" y1="${AVATAR_CY}" x2="${AVATAR_CX + AVATAR_R}" y2="${AVATAR_CY}">
      <stop offset="0%" stop-color="${palette.accentFrom}" />
      <stop offset="100%" stop-color="${palette.accentTo}" />
    </linearGradient>

    <linearGradient id="${chartBarGradId}" gradientUnits="userSpaceOnUse"
                     x1="0" y1="${CHART_BAR_AREA_HEIGHT}" x2="0" y2="0">
      <stop offset="0%" stop-color="${palette.accentFrom}" />
      <stop offset="100%" stop-color="${palette.accentTo}" />
    </linearGradient>

    <pattern id="${dotGridId}" width="18" height="18" patternUnits="userSpaceOnUse">
      <circle cx="1.5" cy="1.5" r="1.5" fill="${palette.dotGrid}" />
    </pattern>

    <clipPath id="${cardClipId}">
      <rect x="0" y="0" width="${CARD_WIDTH}" height="${CARD_HEIGHT}" rx="${CARD_RADIUS}" />
    </clipPath>

    <clipPath id="${clipId}">
      <circle cx="${AVATAR_CX}" cy="${AVATAR_CY}" r="${AVATAR_R - 4}" />
    </clipPath>

    <clipPath id="titlebarText-${uid}">
      <rect x="${TITLEBAR_TEXT_X}" y="0" width="${CARD_WIDTH - TITLEBAR_TEXT_X - CONTENT_PADDING_X}" height="${TITLEBAR_HEIGHT}" />
    </clipPath>

    <clipPath id="headerText-${uid}">
      <rect x="${HEADER_TEXT_X}" y="${TITLEBAR_HEIGHT}" width="${CARD_WIDTH - HEADER_TEXT_X - HEADER_TEXT_RIGHT_MARGIN}" height="${HEADER_BOTTOM - TITLEBAR_HEIGHT}" />
    </clipPath>

    <filter id="${glowId}" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation="3" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>

  <g clip-path="url(#${cardClipId})">
    <rect x="0" y="0" width="${CARD_WIDTH}" height="${CARD_HEIGHT}" fill="url(#${bgGradId})" />
    <rect x="0" y="${TITLEBAR_HEIGHT}" width="${CARD_WIDTH}" height="${CARD_HEIGHT - TITLEBAR_HEIGHT}" fill="url(#${dotGridId})" />

    <rect x="0" y="0" width="${CARD_WIDTH}" height="${TITLEBAR_HEIGHT}" fill="${palette.titlebarBg}" />
    <circle cx="${TRAFFIC_LIGHT_START_X}" cy="${TRAFFIC_LIGHT_Y}" r="${TRAFFIC_LIGHT_R}" fill="${TRAFFIC_LIGHTS.red}" />
    <circle cx="${TRAFFIC_LIGHT_START_X + TRAFFIC_LIGHT_GAP}" cy="${TRAFFIC_LIGHT_Y}" r="${TRAFFIC_LIGHT_R}" fill="${TRAFFIC_LIGHTS.yellow}" />
    <circle cx="${TRAFFIC_LIGHT_START_X + TRAFFIC_LIGHT_GAP * 2}" cy="${TRAFFIC_LIGHT_Y}" r="${TRAFFIC_LIGHT_R}" fill="${TRAFFIC_LIGHTS.green}" />
    <text x="${TITLEBAR_TEXT_X}" y="${TRAFFIC_LIGHT_Y + 4}" font-family="${FONT_MONO}" font-size="12" fill="${palette.sub}" clip-path="url(#titlebarText-${uid})">~/qiita/${pathUserIdEsc}</text>

    <rect x="0" y="${TITLEBAR_HEIGHT - 1}" width="${CARD_WIDTH}" height="2"
          fill="url(#${accentGradId})" filter="url(#${glowId})" />

    <rect x="0.5" y="0.5" width="${CARD_WIDTH - 1}" height="${CARD_HEIGHT - 1}" rx="${CARD_RADIUS - 0.5}"
          fill="none" stroke="${palette.borderColor}" />

    <circle cx="${AVATAR_CX}" cy="${AVATAR_CY}" r="${AVATAR_R}" fill="none"
            stroke="url(#${ringGradId})" stroke-width="3" filter="url(#${glowId})" />
    <image
      href="${stats.icon}"
      x="${AVATAR_CX - (AVATAR_R - 4)}"
      y="${AVATAR_CY - (AVATAR_R - 4)}"
      width="${(AVATAR_R - 4) * 2}"
      height="${(AVATAR_R - 4) * 2}"
      clip-path="url(#${clipId})"
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label="Avatar of ${fullUsernameEsc}"
    />

    <g clip-path="url(#headerText-${uid})">
      <text x="${HEADER_TEXT_X}" y="${NAME_BASELINE_Y}" font-family="${FONT_SANS}" font-weight="700" font-size="21" fill="${palette.fg}">${usernameEsc}</text>
      <text x="${HEADER_TEXT_X}" y="${HANDLE_BASELINE_Y}" font-family="${FONT_MONO}" font-size="13" fill="${palette.sub}">@${handleEsc}</text>
    </g>

    <text x="${CONTENT_PADDING_X}" y="${CHART_COMMENT_Y}" font-family="${FONT_MONO}" font-size="11" fill="${palette.sub}">// last ${stats.activity.length} months of posts</text>
    <g transform="translate(${CONTENT_PADDING_X},${CHART_TOP})">
      ${activityChart}
    </g>

    <g transform="translate(${CONTENT_PADDING_X},${STATS_Y})">
      ${statsRow}
    </g>
  </g>
</svg>
`;
}
