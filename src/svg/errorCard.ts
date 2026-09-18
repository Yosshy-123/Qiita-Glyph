import type { Context } from "hono";
import type { ErrorStatus } from "../errors";
import { escapeXml } from "../utils/xml";

/** Renders a small red error SVG and sends it as the HTTP response. */
export function renderErrorCard(c: Context, message: string, status: ErrorStatus) {
  const safeMessage = escapeXml(message);

  return c.body(
    `
<svg xmlns="http://www.w3.org/2000/svg" width="420" height="80">
  <rect width="100%" height="100%" rx="12" fill="#fee2e2"/>
  <text x="20" y="46"
        font-size="14"
        fill="#991b1b"
        font-family="system-ui">
    ${safeMessage}
  </text>
</svg>
`,
    status,
    {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "no-store",
    }
  );
}
