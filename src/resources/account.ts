import type { Requester } from "./requester.js";
import type { Account } from "../types.js";

/** Account-level operations. */
export class AccountResource {
  constructor(private readonly req: Requester) {}

  /** GET /account — balance, status and profile of the authenticated account. */
  get(): Promise<Account> {
    return this.req<Account>("GET", "/account");
  }
}
