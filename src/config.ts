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

// ---- Card layout & theme ----
export const CARD_WIDTH = 420;
export const CARD_HEIGHT = 160;
export const ACCENT_COLOR = "#55c500";

export const THEMES = {
  light: {
    bgTop: "#ffffff",
    bgBottom: "#f8fafc",
    cardBg: "#fbfdff",
    fg: "#0b1220",
    sub: "#6b7280",
    avatarBg: "#f1f5f9",
    glossOpacity: 0.06,
  },
  dark: {
    bgTop: "#071018",
    bgBottom: "#04060a",
    cardBg: "#071018",
    fg: "#e6f0e0",
    sub: "#93a09a",
    avatarBg: "#071617",
    glossOpacity: 0.02,
  },
} as const;

export type Theme = keyof typeof THEMES;
