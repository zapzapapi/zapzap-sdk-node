import type { Requester } from "./requester.js";
import type {
  Instance,
  CreateInstanceParams,
  CreateInstanceResult,
  UpdateInstanceParams,
  InstanceCost,
  QrCodeResult,
} from "../types.js";

/** Instance management: create, list, read, update, delete, QR code and cost. */
export class InstancesResource {
  constructor(private readonly req: Requester) {}

  /** GET /instances — all WhatsApp instances on the account. */
  list(): Promise<Instance[]> {
    return this.req<Instance[]>("GET", "/instances");
  }

  /** POST /instances — provision a new instance. Debits the account balance. */
  create(params: CreateInstanceParams): Promise<CreateInstanceResult> {
    return this.req<CreateInstanceResult>("POST", "/instances", params);
  }

  /** GET /instances/{id} — a single instance. */
  get(id: string): Promise<Instance> {
    return this.req<Instance>("GET", `/instances/${encodeURIComponent(id)}`);
  }

  /** PUT /instances/{id} — update webhook URL and/or metadata. */
  update(id: string, params: UpdateInstanceParams): Promise<Instance> {
    return this.req<Instance>("PUT", `/instances/${encodeURIComponent(id)}`, params);
  }

  /** DELETE /instances/{id} — soft delete. Grants an activation-fee waiver on the next create. */
  delete(id: string): Promise<{ [key: string]: unknown }> {
    return this.req("DELETE", `/instances/${encodeURIComponent(id)}`);
  }

  /** GET /instances/{id}/qrcode — QR code to scan, or the connected profile if already linked. */
  qrcode(id: string): Promise<QrCodeResult> {
    return this.req<QrCodeResult>("GET", `/instances/${encodeURIComponent(id)}/qrcode`);
  }

  /** GET /instances/cost — the cost of creating a new instance right now. */
  cost(): Promise<InstanceCost> {
    return this.req<InstanceCost>("GET", "/instances/cost");
  }
}
