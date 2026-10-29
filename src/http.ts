import { ZapZapError } from "./errors.js";

export interface HttpConfig {
  apiKey: string;
  apiSecret: string;
  baseUrl: string;
  /** Per-request timeout in milliseconds. */
  timeoutMs: number;
  /** How many times to retry on HTTP 429 (rate limit) before giving up. */
  maxRetries: number;
  /** Custom fetch implementation (defaults to the global `fetch`, Node 18+). */
  fetch: typeof fetch;
}

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Low-level request helper shared by every resource. Attaches auth headers,
 * serializes the JSON body, enforces a timeout, parses the response, and
 * normalizes every failure into a {@link ZapZapError}.
 */
export async function request<T>(
  config: HttpConfig,
  method: HttpMethod,
  path: string,
  body?: unknown,
): Promise<T> {
  const url = `${config.baseUrl}${path}`;
  const headers: Record<string, string> = {
    "x-api-key": config.apiKey,
    "x-api-secret": config.apiSecret,
    Accept: "application/json",
  };

  const init: RequestInit = { method, headers };
  if (body !== undefined && method !== "GET") {
    headers["Content-Type"] = "application/json";
    init.body = JSON.stringify(body);
  }

  let lastError: ZapZapError | undefined;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), config.timeoutMs);

    let response: Response;
    try {
      response = await config.fetch(url, { ...init, signal: controller.signal });
    } catch (err) {
      clearTimeout(timer);
      const aborted = err instanceof Error && err.name === "AbortError";
      throw new ZapZapError(
        aborted
          ? `Request to ${method} ${path} timed out after ${config.timeoutMs}ms`
          : `Network error on ${method} ${path}: ${(err as Error).message}`,
        { status: 0, method, path, body: err },
      );
    } finally {
      clearTimeout(timer);
    }

    const payload = await parseBody(response);

    if (response.ok) {
      return payload as T;
    }

    const error = new ZapZapError(extractMessage(payload, response), {
      status: response.status,
      body: payload,
      method,
      path,
    });

    // Retry on rate limit with linear backoff, if retries remain.
    if (response.status === 429 && attempt < config.maxRetries) {
      lastError = error;
      const retryAfter = retryAfterMs(response, attempt);
      await sleep(retryAfter);
      continue;
    }

    throw error;
  }

  // Exhausted retries on 429.
  throw lastError ?? new ZapZapError(`Request to ${method} ${path} failed`, { status: 0, method, path });
}

async function parseBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return undefined;
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }
  // Some endpoints may not set content-type; try JSON, fall back to raw text.
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function extractMessage(payload: unknown, response: Response): string {
  if (payload && typeof payload === "object") {
    const obj = payload as Record<string, unknown>;
    const candidate = obj.error ?? obj.message ?? obj.detail;
    if (typeof candidate === "string" && candidate.length > 0) {
      return candidate;
    }
  }
  if (typeof payload === "string" && payload.length > 0) {
    return payload;
  }
  return `ZapZap API request failed with status ${response.status} ${response.statusText}`.trim();
}

function retryAfterMs(response: Response, attempt: number): number {
  const header = response.headers.get("retry-after");
  if (header) {
    const seconds = Number(header);
    if (!Number.isNaN(seconds)) return Math.min(seconds * 1000, 10_000);
  }
  return (attempt + 1) * 1000;
}
