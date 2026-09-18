const XML_ESCAPE_MAP: Record<string, string> = {
  "<": "&lt;",
  ">": "&gt;",
  "&": "&amp;",
  '"': "&quot;",
  "'": "&apos;",
};

/** Escapes text so it is safe to embed inside SVG/XML content or attributes. */
export function escapeXml(value: string): string {
  return value.replace(/[<>&"']/g, (char) => XML_ESCAPE_MAP[char] ?? char);
}

/** Reduces a string to a safe subset of characters usable as an SVG element id. */
export function makeSafeId(value: string): string {
  const sanitized = value.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 64);
  return sanitized.length > 0 ? sanitized : "anon";
}
