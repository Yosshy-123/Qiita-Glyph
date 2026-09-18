import { ACCENT_COLOR, CARD_HEIGHT, CARD_WIDTH, THEMES } from "../config";
import type { ProfileStats } from "../types";
import { formatNumber } from "../utils/format";
import { escapeXml, makeSafeId } from "../utils/xml";
import { bookmarkIconSvg, heartIconSvg, postsIconSvg, userIconSvg } from "./icons";
import { renderStatBox } from "./statBox";

/** Renders the full Qiita activity profile card as an SVG string. */
export function renderProfileCard(stats: ProfileStats): string {
  const palette = THEMES[stats.theme];
  const uid = makeSafeId(stats.userId);

  const clipId = `avatar-${uid}`;
  const bgGradId = `bgGrad-${uid}`;
  const accentGradId = `accentGrad-${uid}`;
  const panelGlossId = `panelGloss-${uid}`;

  const usernameEsc = escapeXml(stats.username);
  const userIdEsc = escapeXml(stats.userId);

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${CARD_WIDTH}" height="${CARD_HEIGHT}" viewBox="0 0 ${CARD_WIDTH} ${CARD_HEIGHT}" role="img" aria-label="Qiita profile card for ${usernameEsc}">
  <defs>
    <linearGradient id="${bgGradId}" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0%" stop-color="${palette.bgTop}" stop-opacity="1"/>
      <stop offset="100%" stop-color="${palette.bgBottom}" stop-opacity="1"/>
    </linearGradient>

    <linearGradient id="${accentGradId}" x1="0" x2="1">
      <stop offset="0%" stop-color="${ACCENT_COLOR}" stop-opacity="1"/>
      <stop offset="100%" stop-color="#7ce24a" stop-opacity="0.95"/>
    </linearGradient>

    <clipPath id="${clipId}">
      <circle cx="44" cy="44" r="22" />
    </clipPath>

    <linearGradient id="${panelGlossId}" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="${palette.glossOpacity}"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
    </linearGradient>
  </defs>

  <g>
    <rect x="0" y="0" width="${CARD_WIDTH}" height="${CARD_HEIGHT}" rx="12" fill="${palette.cardBg}" />
    <rect x="0" y="0" width="${CARD_WIDTH}" height="${CARD_HEIGHT}" rx="12" fill="url(#${panelGlossId})" style="mix-blend-mode: overlay"/>

    <circle cx="44" cy="44" r="26" fill="${palette.avatarBg}"/>
    <circle cx="44" cy="44" r="26" stroke="url(#${accentGradId})" stroke-width="2" fill="none" />

    <image
      href="${stats.icon}"
      x="22"
      y="22"
      width="44"
      height="44"
      clip-path="url(#${clipId})"
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label="Avatar of ${usernameEsc}"
    />

    <text x="84" y="36" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial" font-weight="700" font-size="16" fill="${palette.fg}">
      ${usernameEsc}
    </text>

    <text x="84" y="56" font-family="system-ui" font-size="12" fill="${palette.sub}">
      @${userIdEsc}
    </text>

    <g transform="translate(16,84)">
      ${renderStatBox({ x: 0, value: formatNumber(stats.posts), label: "Posts", icon: postsIconSvg, valueColor: palette.fg, labelColor: palette.sub })}
      ${renderStatBox({ x: 98, value: formatNumber(stats.likes), label: "LGTM", icon: heartIconSvg, valueColor: palette.fg, labelColor: palette.sub })}
      ${renderStatBox({ x: 196, value: formatNumber(stats.stocks), label: "Stocks", icon: bookmarkIconSvg, valueColor: palette.fg, labelColor: palette.sub })}
      ${renderStatBox({ x: 294, value: formatNumber(stats.followers), label: "Followers", icon: userIconSvg, valueColor: palette.fg, labelColor: palette.sub })}
    </g>
  </g>
</svg>
`;
}
