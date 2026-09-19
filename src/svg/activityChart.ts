import { FONT_MONO } from "../config";
import type { MonthlyActivity } from "../utils/activity";

/** Height reserved below the bars for month labels. */
export const ACTIVITY_LABEL_HEIGHT = 18;

const BAR_GAP = 14;
const MIN_BAR_HEIGHT = 4;

interface ActivityChartOptions {
  data: MonthlyActivity[];
  width: number;
  barAreaHeight: number;
  barGradientId: string;
  trackColor: string;
  labelColor: string;
}

/** Renders the filled bar for one month, or nothing for a zero-post month. */
function renderBar(count: number, maxValue: number, barWidth: number, barAreaHeight: number, barGradientId: string): string {
  if (count === 0) return "";

  const barHeight = Math.max(MIN_BAR_HEIGHT, (count / maxValue) * barAreaHeight);
  const barY = barAreaHeight - barHeight;
  return `<rect y="${barY}" width="${barWidth}" height="${barHeight}" rx="4" fill="url(#${barGradientId})" />`;
}

/**
 * Renders a small monthly bar chart of real posting activity, so the card
 * visually communicates recent momentum rather than only cumulative totals.
 * Every month gets a faint full-height "track" so the timeline stays
 * visible even for quiet months; a month with zero posts shows only that
 * track (no bar), since there's nothing to plot.
 */
export function renderActivityChart({
  data,
  width,
  barAreaHeight,
  barGradientId,
  trackColor,
  labelColor,
}: ActivityChartOptions): string {
  if (data.length === 0) return "";

  const maxValue = Math.max(1, ...data.map((d) => d.count));
  const barWidth = (width - BAR_GAP * (data.length - 1)) / data.length;
  const labelY = barAreaHeight + ACTIVITY_LABEL_HEIGHT - 4;

  return data
    .map((d, i) => {
      const barX = i * (barWidth + BAR_GAP);

      return `
      <g transform="translate(${barX},0)">
        <rect y="0" width="${barWidth}" height="${barAreaHeight}" rx="4" fill="${trackColor}" />
        ${renderBar(d.count, maxValue, barWidth, barAreaHeight, barGradientId)}
        <text x="${barWidth / 2}" y="${labelY}" text-anchor="middle" font-family="${FONT_MONO}" font-size="10" fill="${labelColor}">${d.label}</text>
      </g>
      `;
    })
    .join("\n");
}
