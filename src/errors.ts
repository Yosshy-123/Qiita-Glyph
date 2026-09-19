/** Error raised for any failed Qiita REST API call. Carries the HTTP status
 * so the route handler can decide how to present it (e.g. 404 vs 429). */
export class QiitaRequestError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "QiitaRequestError";
    this.status = status;
  }
}

/** Error raised when fetching/validating a user's avatar image fails. */
export class IconFetchError extends Error {
  readonly status: number;

  constructor(message: string, status = 502) {
    super(message);
    this.name = "IconFetchError";
    this.status = status;
  }
}

/** Maps a caught error to the HTTP status that should be returned. */
export function getErrorStatus(err: unknown): number {
  if (err instanceof QiitaRequestError || err instanceof IconFetchError) {
    return err.status;
  }
  return 500;
}

// The only error statuses this worker ever produces. Narrowing to this
// known set (rather than trusting an arbitrary upstream number) keeps the
// response status both type-safe and predictable for callers.
const KNOWN_ERROR_STATUSES = new Set([400, 404, 429, 500, 502]);

export type ErrorStatus = 400 | 404 | 429 | 500 | 502;

export function toKnownErrorStatus(status: number): ErrorStatus {
  return KNOWN_ERROR_STATUSES.has(status) ? (status as ErrorStatus) : 500;
}

/**
 * Maps a caught error to a message that is safe to show to the client.
 * Only messages we generated ourselves (or that Qiita's API explicitly
 * returned) are surfaced; anything else (network errors, timeouts, bugs)
 * is logged server-side and replaced with a generic message so internal
 * details are never leaked to callers.
 */
export function getErrorMessage(err: unknown): string {
  if (err instanceof QiitaRequestError || err instanceof IconFetchError) {
    return err.message;
  }

  console.error("Unhandled Qiita Glyph error:", err);
  return "Internal server error";
}
