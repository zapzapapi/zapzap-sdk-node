import { request, type HttpConfig, type HttpMethod } from "./http.js";
import { AccountResource } from "./resources/account.js";
import { InstancesResource } from "./resources/instances.js";
import { WebhookResource } from "./resources/webhook.js";
import { InstanceScope } from "./resources/instance-scope.js";
import type { Requester } from "./resources/requester.js";

export const DEFAULT_BASE_URL = "https://api.zapzapapi.com/api/v1";

export interface ZapZapClientOptions {
  /** API key from the ZapZap panel (sent as the `x-api-key` header). */
  apiKey: string;
  /** API secret from the ZapZap panel (sent as the `x-api-secret` header). */
  apiSecret: string;
  /** Override the API base URL. Defaults to the public production endpoint. */
  baseUrl?: string;
  /** Per-request timeout in milliseconds. Default: 15000. */
  timeoutMs?: number;
  /** Number of automatic retries on HTTP 429 (rate limit). Default: 2. */
  maxRetries?: number;
  /** Custom fetch implementation. Defaults to the global `fetch` (Node 18+). */
  fetch?: typeof fetch;
}

/**
 * Official client for the ZapZap API.
 *
 * ```ts
 * const client = new ZapZapClient({ apiKey, apiSecret });
 * const account = await client.account.get();
 * await client.instance(instanceId).sendText({ number: "5511999999999", text: "Hi!" });
 * ```
 *
 * Credentials are always supplied by the caller and never read from the
 * environment or hardcoded.
 */
export class ZapZapClient {
  /** Account operations. */
  readonly account: AccountResource;
  /** Instance management (create, list, update, delete, qrcode, cost). */
  readonly instances: InstancesResource;
  /** Per-instance webhook configuration. */
  readonly webhook: WebhookResource;

  private readonly config: HttpConfig;
  private readonly instanceScopes = new Map<string, InstanceScope>();

  constructor(options: ZapZapClientOptions) {
    if (!options || !options.apiKey || !options.apiSecret) {
      throw new Error("ZapZapClient requires both `apiKey` and `apiSecret`.");
    }

    const resolvedFetch = options.fetch ?? globalThis.fetch;
    if (typeof resolvedFetch !== "function") {
      throw new Error(
        "No global `fetch` found. Use Node 18+ or pass a `fetch` implementation to ZapZapClient.",
      );
    }

    this.config = {
      apiKey: options.apiKey,
      apiSecret: options.apiSecret,
      baseUrl: (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, ""),
      timeoutMs: options.timeoutMs ?? 15_000,
      maxRetries: options.maxRetries ?? 2,
      fetch: resolvedFetch,
    };

    const req: Requester = <T>(method: HttpMethod, path: string, body?: unknown) =>
      request<T>(this.config, method, path, body);

    this.account = new AccountResource(req);
    this.instances = new InstancesResource(req);
    this.webhook = new WebhookResource(req);
  }

  /**
   * Scope every WhatsApp (proxy) operation to a specific instance.
   * The returned object is cached per instance id.
   */
  instance(id: string): InstanceScope {
    if (!id) throw new Error("instance(id) requires a non-empty instance id.");
    let scope = this.instanceScopes.get(id);
    if (!scope) {
      const req: Requester = <T>(method: HttpMethod, path: string, body?: unknown) =>
        request<T>(this.config, method, path, body);
      scope = new InstanceScope(req, id);
      this.instanceScopes.set(id, scope);
    }
    return scope;
  }
}
