/** Formats a count for display, falling back to a plain string on failure. */
export function formatNumber(value: number): string {
  try {
    return new Intl.NumberFormat("ja-JP", { maximumFractionDigits: 0 }).format(value);
  } catch {
    return String(value);
  }
}
