import type { Theme } from "../config";

// Qiita user IDs only ever contain alphanumerics, underscores and hyphens.
// Validating this up front rejects malformed/oversized input before it is
// ever interpolated into an upstream API URL, closing off request
// smuggling/SSRF-style tricks via unexpected path or query characters.
const USER_ID_PATTERN = /^[a-zA-Z0-9_-]{1,64}$/;

export function isValidUserId(userId: string): boolean {
  return USER_ID_PATTERN.test(userId);
}

/** Normalizes the `theme` query parameter to a known, safe value. */
export function parseTheme(value: string | undefined): Theme {
  return value === "dark" ? "dark" : "light";
}
