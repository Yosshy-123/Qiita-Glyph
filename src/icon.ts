import { ALLOWED_ICON_CONTENT_TYPES, MAX_ICON_BYTES, REQUEST_TIMEOUT_MS } from "./config";
import { IconFetchError } from "./errors";
import { fetchWithTimeout } from "./utils/http";

type AllowedIconContentType = (typeof ALLOWED_ICON_CONTENT_TYPES)[number];

function isPrivateOrLoopbackHostname(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  if (lower === "localhost" || lower.endsWith(".localhost")) return true;

  const ipv4 = lower.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4) {
    const a = Number(ipv4[1]);
    const b = Number(ipv4[2]);
    if (a === 127 || a === 10 || a === 0) return true; // loopback / private / "this network"
    if (a === 169 && b === 254) return true; // link-local (incl. cloud metadata endpoint)
    if (a === 172 && b >= 16 && b <= 31) return true; // private
    if (a === 192 && b === 168) return true; // private
    return false;
  }

  // IPv6 loopback, unique-local and link-local literals.
  if (lower === "::1" || lower.startsWith("fe80:") || lower.startsWith("fc") || lower.startsWith("fd")) {
    return true;
  }

  return false;
}

/**
 * Validates that an avatar URL is well-formed HTTPS pointing at a public
 * host. This is defense-in-depth against SSRF: even though the URL comes
 * from the Qiita API rather than directly from the caller, the worker
 * should never be usable as a proxy to fetch internal/private resources.
 */
function assertSafeIconUrl(rawUrl: string): URL {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new IconFetchError("Invalid avatar URL");
  }

  if (url.protocol !== "https:") {
    throw new IconFetchError("Avatar URL must use HTTPS");
  }

  if (isPrivateOrLoopbackHostname(url.hostname)) {
    throw new IconFetchError("Avatar URL host is not allowed");
  }

  return url;
}

function isAllowedContentType(value: string): value is AllowedIconContentType {
  return (ALLOWED_ICON_CONTENT_TYPES as readonly string[]).includes(value);
}

/**
 * Reads a response body while enforcing a hard byte cap, regardless of
 * what (or whether) a Content-Length header claims. Protects against
 * memory exhaustion from an oversized or mislabeled upstream response.
 */
async function readBodyWithLimit(res: Response, maxBytes: number): Promise<Uint8Array> {
  if (!res.body) {
    const buffer = await res.arrayBuffer();
    if (buffer.byteLength > maxBytes) {
      throw new IconFetchError("Avatar image is too large");
    }
    return new Uint8Array(buffer);
  }

  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;

    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      throw new IconFetchError("Avatar image is too large");
    }
    chunks.push(value);
  }

  const result = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
}

function bytesToBase64(bytes: Uint8Array): string {
  const CHUNK_SIZE = 0x8000;
  let binary = "";

  for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
    const chunk = bytes.subarray(i, i + CHUNK_SIZE);
    binary += String.fromCharCode(...chunk);
  }

  return btoa(binary);
}

/**
 * Downloads a user's avatar and returns it as a data URI. Applies SSRF
 * hardening (HTTPS + public hosts only), a content-type allowlist, and a
 * hard size cap so the worker can't be abused as an open proxy or have
 * its memory exhausted by an oversized/malicious response.
 */
export async function fetchIconAsDataUri(iconUrl: string): Promise<string> {
  const url = assertSafeIconUrl(iconUrl);

  const res = await fetchWithTimeout(url.toString(), REQUEST_TIMEOUT_MS);
  if (!res.ok) {
    throw new IconFetchError(`Avatar fetch failed (${res.status})`);
  }

  const contentType = res.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase() ?? "";
  if (!isAllowedContentType(contentType)) {
    throw new IconFetchError("Unsupported avatar image type");
  }

  const bytes = await readBodyWithLimit(res, MAX_ICON_BYTES);
  const base64 = bytesToBase64(bytes);

  return `data:${contentType};base64,${base64}`;
}
