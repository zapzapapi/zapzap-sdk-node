/**
 * Error thrown for any non-2xx response from the ZapZap API, or for a
 * transport/network failure. Carries the HTTP status and the parsed response
 * body so callers can branch on specific conditions (402 insufficient balance,
 * 409 name already taken, 429 rate limit, etc.).
 */
export class ZapZapError extends Error {
  /** HTTP status code. `0` when the request never reached the server (network error, timeout). */
  readonly status: number;
  /** Parsed response body, when the server returned one. */
  readonly body: unknown;
  /** HTTP method of the failed request. */
  readonly method?: string;
  /** Request path of the failed request. */
  readonly path?: string;

  constructor(
    message: string,
    options: { status: number; body?: unknown; method?: string; path?: string } = { status: 0 },
  ) {
    super(message);
    this.name = "ZapZapError";
    this.status = options.status;
    this.body = options.body;
    this.method = options.method;
    this.path = options.path;
    Object.setPrototypeOf(this, ZapZapError.prototype);
  }

  /** True when the server reported insufficient balance (HTTP 402). */
  get isInsufficientBalance(): boolean {
    return this.status === 402;
  }

  /** True when the server reported a conflict, e.g. instance name already taken (HTTP 409). */
  get isConflict(): boolean {
    return this.status === 409;
  }

  /** True when the server rate-limited the request (HTTP 429). */
  get isRateLimited(): boolean {
    return this.status === 429;
  }

  /** True when credentials were rejected (HTTP 401/403). */
  get isUnauthorized(): boolean {
    return this.status === 401 || this.status === 403;
  }
}
