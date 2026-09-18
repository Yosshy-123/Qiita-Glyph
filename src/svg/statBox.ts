import type { IconRenderer } from "./icons";

interface StatBoxOptions {
  x: number;
  value: string;
  label: string;
  icon: IconRenderer;
  valueColor: string;
  labelColor: string;
}

/** Renders one "icon + value + label" stat cell of the profile card. */
export function renderStatBox({ x, value, label, icon, valueColor, labelColor }: StatBoxOptions): string {
  return `
  <g transform="translate(${x},0)">
    <svg x="10" y="10" width="20" height="20" viewBox="0 0 32 32" aria-hidden="true">
      ${icon(valueColor)}
    </svg>
    <text x="34" y="18" font-family="system-ui" font-size="14" font-weight="700" fill="${valueColor}">${value}</text>
    <text x="34" y="34" font-family="system-ui" font-size="11" fill="${labelColor}">${label}</text>
  </g>
  `;
}
