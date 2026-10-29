import type { HttpMethod } from "../http.js";

/** Bound request function handed to every resource. */
export type Requester = <T>(method: HttpMethod, path: string, body?: unknown) => Promise<T>;
