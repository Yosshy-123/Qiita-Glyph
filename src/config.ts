/**
 * Centralized configuration for the Qiita Glyph worker.
 * Keeping magic numbers/strings here makes limits and design tokens
 * easy to audit and change without hunting through logic files.
 */

// ---- Qiita API ----
export const QIITA_API_BASE = "https://qiita.com/api/v2";
export const ITEMS_PER_PAGE = 100;
// Applied to every outbound fetch (Qiita API + avatar image) so a slow
// or unresponsive upstream can never hang the request indefinitely.
export const REQUEST_TIMEOUT_MS = 8_000;

// ---- Avatar handling ----
export const MAX_ICON_BYTES = 2 * 1024 * 1024; // 2 MB
export const ALLOWED_ICON_CONTENT_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/gif",
  "image/webp",
] as const;

// ---- Caching ----
export const CACHE_TTL_SECONDS = 86_400;

// ---- Activity chart ----
export const ACTIVITY_MONTHS = 6;

// ---- Card layout & theme ----
// A "terminal window" motif: a titlebar with traffic-light dots and a
// path-style breadcrumb, a glowing accent divider, and a subtle dot-grid
// texture. Numbers/paths use a monospace stack to reinforce the developer
// context; the display name uses a normal UI sans.
export const CARD_WIDTH = 540;
export const CARD_HEIGHT = 340;
export const CARD_RADIUS = 20;
export const TITLEBAR_HEIGHT = 44;

export const FONT_SANS = "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
export const FONT_MONO =
  "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace";

// Classic macOS traffic-light colors. These read as "terminal window"
// regardless of theme, so they aren't themed.
export const TRAFFIC_LIGHTS = { red: "#ff5f57", yellow: "#febc2e", green: "#28c840" } as const;

export const THEMES = {
  light: {
    bgTop: "#ffffff",
    bgBottom: "#f3f6fb",
    titlebarBg: "#eef1f6",
    borderColor: "rgba(15, 23, 42, 0.10)",
    dotGrid: "rgba(15, 23, 42, 0.06)",
    chartTrack: "rgba(15, 23, 42, 0.07)",
    fg: "#0b1220",
    sub: "#5b6472",
    chipBg: "rgba(63, 174, 0, 0.12)",
    accentFrom: "#3fae00",
    accentTo: "#0891b2",
  },
  dark: {
    bgTop: "#0b1120",
    bgBottom: "#05070d",
    titlebarBg: "#111827",
    borderColor: "rgba(255, 255, 255, 0.08)",
    dotGrid: "rgba(255, 255, 255, 0.06)",
    chartTrack: "rgba(255, 255, 255, 0.08)",
    fg: "#eef2f7",
    sub: "#8b96ab",
    chipBg: "rgba(85, 197, 0, 0.18)",
    accentFrom: "#55c500",
    accentTo: "#22d3ee",
  },
} as const;

export type Theme = keyof typeof THEMES;
