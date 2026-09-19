/** One bucket of the monthly posting-activity chart. */
export interface MonthlyActivity {
  label: string;
  count: number;
}

interface DatedItem {
  created_at: string;
}

const MONTH_ABBREVIATIONS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

function monthKey(d: Date): string {
  return `${d.getUTCFullYear()}-${d.getUTCMonth()}`;
}

/**
 * Buckets items into per-calendar-month post counts for the last `months`
 * months (oldest first, inclusive of the current month). Used to drive the
 * activity chart on the profile card.
 */
export function bucketByMonth(
  items: readonly DatedItem[],
  months: number,
  now: Date = new Date()
): MonthlyActivity[] {
  const anchor = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

  const keys: string[] = [];
  for (let i = months - 1; i >= 0; i--) {
    keys.push(monthKey(new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth() - i, 1))));
  }

  const counts = new Map<string, number>(keys.map((key) => [key, 0]));

  for (const item of items) {
    const created = new Date(item.created_at);
    if (Number.isNaN(created.getTime())) continue;

    const key = monthKey(new Date(Date.UTC(created.getUTCFullYear(), created.getUTCMonth(), 1)));
    const current = counts.get(key);
    if (current !== undefined) {
      counts.set(key, current + 1);
    }
  }

  return keys.map((key) => ({
    label: MONTH_ABBREVIATIONS[Number(key.split("-")[1])],
    count: counts.get(key) ?? 0,
  }));
}
