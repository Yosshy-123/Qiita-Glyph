import type { Context } from "hono";
import { FONT_MONO, FONT_SANS } from "../config";
import type { ErrorStatus } from "../errors";
import { truncateText } from "../utils/format";
import { escapeXml, makeSafeId } from "../utils/xml";

const WIDTH = 540;
const HEIGHT = 116;
const BADGE_CX = 52;
const MESSAGE_X = 92;
const MESSAGE_RIGHT_MARGIN = 28;
const MESSAGE_MAX_CHARS = 60;

/** Renders a compact, on-brand error card and sends it as the HTTP response. */
export function renderErrorCard(c: Context, message: string, status: ErrorStatus) {
  const fullMessageEsc = escapeXml(message);
  const displayMessageEsc = escapeXml(truncateText(message, MESSAGE_MAX_CHARS));
  const uid = makeSafeId(String(status));
  const clipId = `errClip-${uid}`;
  const messageClipId = `errMsgClip-${uid}`;

  return c.body(
    `
<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" role="img" aria-label="Error: ${fullMessageEsc}">
  <defs>
    <clipPath id="${clipId}">
      <rect x="0" y="0" width="${WIDTH}" height="${HEIGHT}" rx="18" />
    </clipPath>
    <clipPath id="${messageClipId}">
      <rect x="${MESSAGE_X}" y="0" width="${WIDTH - MESSAGE_X - MESSAGE_RIGHT_MARGIN}" height="${HEIGHT}" />
    </clipPath>
  </defs>
  <g clip-path="url(#${clipId})">
    <rect x="0" y="0" width="${WIDTH}" height="${HEIGHT}" fill="#1a0f10" />
    <rect x="0" y="0" width="6" height="${HEIGHT}" fill="#ef4444" />
    <circle cx="${BADGE_CX}" cy="${HEIGHT / 2}" r="17" fill="rgba(239, 68, 68, 0.16)" />
    <text x="${BADGE_CX}" y="${HEIGHT / 2 + 7}" text-anchor="middle" font-family="${FONT_MONO}" font-size="18" font-weight="700" fill="#f87171">!</text>
    <g clip-path="url(#${messageClipId})">
      <text x="${MESSAGE_X}" y="${HEIGHT / 2 - 9}" font-family="${FONT_MONO}" font-size="12" fill="#fca5a5">qiita-glyph error · ${status}</text>
      <text x="${MESSAGE_X}" y="${HEIGHT / 2 + 17}" font-family="${FONT_SANS}" font-size="15" fill="#fee2e2">${displayMessageEsc}</text>
    </g>
  </g>
</svg>
`,
    status,
    {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "no-store",
    }
  );
}
