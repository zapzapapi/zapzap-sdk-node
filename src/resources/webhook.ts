import type { Requester } from "./requester.js";
import type { WebhookConfig, SetWebhookParams } from "../types.js";

/** Per-instance webhook configuration. */
export class WebhookResource {
  constructor(private readonly req: Requester) {}

  /** GET /instances/{id}/webhook — current webhook configuration for the instance. */
  get(instanceId: string): Promise<WebhookConfig> {
    return this.req<WebhookConfig>("GET", `/instances/${encodeURIComponent(instanceId)}/webhook`);
  }

  /** PUT /instances/{id}/webhook — set the webhook URL, events and options for the instance. */
  set(instanceId: string, params: SetWebhookParams): Promise<WebhookConfig> {
    return this.req<WebhookConfig>(
      "PUT",
      `/instances/${encodeURIComponent(instanceId)}/webhook`,
      params,
    );
  }
}
