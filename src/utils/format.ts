/** Formats a count for display, falling back to a plain string on failure. */
export function formatNumber(value: number): string {
  try {
    return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
  } catch {
    return String(value);
  }
}

/** Truncates text to a maximum character count, appending an ellipsis when cut. */
export function truncateText(value: string, maxChars: number): string {
  if (value.length <= maxChars) return value;
  return `${value.slice(0, Math.max(0, maxChars - 1))}…`;
}
