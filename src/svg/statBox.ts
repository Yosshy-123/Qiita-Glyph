import type { IconRenderer } from "./icons";

const BADGE_SIZE = 34;
const BADGE_RADIUS = 10;
const TEXT_GAP = 14;
const TEXT_X = BADGE_SIZE + TEXT_GAP;

interface StatChipOptions {
  x: number;
  value: string;
  label: string;
  icon: IconRenderer;
  iconColor: string;
  chipBg: string;
  valueColor: string;
  labelColor: string;
  fontMono: string;
  fontSans: string;
}

/**
 * Renders one "icon badge + value + label" stat cell of the profile card.
 * The value uses the monospace/data typeface; the label uses the sans
 * typeface, which is both narrower per character (helping longer words
 * like "Followers" fit comfortably) and reads as a caption rather than data.
 */
export function renderStatBox({
  x,
  value,
  label,
  icon,
  iconColor,
  chipBg,
  valueColor,
  labelColor,
  fontMono,
  fontSans,
}: StatChipOptions): string {
  return `
  <g transform="translate(${x},0)">
    <rect width="${BADGE_SIZE}" height="${BADGE_SIZE}" rx="${BADGE_RADIUS}" fill="${chipBg}" />
    <svg x="7" y="7" width="20" height="20" viewBox="0 0 32 32" aria-hidden="true">
      ${icon(iconColor)}
    </svg>

    <text x="${TEXT_X}" y="16" font-family="${fontMono}" font-size="17" font-weight="700" fill="${valueColor}">${value}</text>
    <text x="${TEXT_X}" y="31" font-family="${fontSans}" font-size="11" fill="${labelColor}">${label}</text>
  </g>
  `;
}
