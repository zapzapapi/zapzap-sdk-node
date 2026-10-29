import type { Requester } from "./requester.js";
import type {
  RawResponse,
  SendTextParams,
  SendMediaParams,
  SendButtonsParams,
  SendListParams,
  SendPollParams,
  ReactParams,
  MarkReadParams,
  CreateGroupParams,
  GroupInfoParams,
  UpdateParticipantsParams,
  ListGroupsParams,
} from "../types.js";

/**
 * Group operations scoped to a single instance. Reached via
 * `client.instance(id).groups`.
 */
export class GroupScope {
  constructor(
    private readonly req: Requester,
    private readonly instanceId: string,
  ) {}

  private path(suffix: string): string {
    return `/${encodeURIComponent(this.instanceId)}${suffix}`;
  }

  /** POST /{id}/group/list — groups the instance belongs to. */
  list(params: ListGroupsParams = {}): Promise<RawResponse> {
    return this.req<RawResponse>("POST", this.path("/group/list"), params);
  }

  /** POST /{id}/group/create — create a group with the given participants. */
  create(params: CreateGroupParams): Promise<RawResponse> {
    return this.req<RawResponse>("POST", this.path("/group/create"), params);
  }

  /** POST /{id}/group/info — metadata (and optionally the invite link) for a group. */
  info(params: GroupInfoParams): Promise<RawResponse> {
    return this.req<RawResponse>("POST", this.path("/group/info"), params);
  }

  /** POST /{id}/group/leave — leave a group. */
  leave(groupjid: string): Promise<RawResponse> {
    return this.req<RawResponse>("POST", this.path("/group/leave"), { groupjid });
  }

  /** POST /{id}/group/updateParticipants — add/remove/promote/demote members. */
  updateParticipants(params: UpdateParticipantsParams): Promise<RawResponse> {
    return this.req<RawResponse>("POST", this.path("/group/updateParticipants"), params);
  }

  /** Convenience over updateParticipants with action="add". */
  addMembers(groupjid: string, participants: string[]): Promise<RawResponse> {
    return this.updateParticipants({ groupjid, action: "add", participants });
  }

  /** Convenience over updateParticipants with action="remove". */
  removeMembers(groupjid: string, participants: string[]): Promise<RawResponse> {
    return this.updateParticipants({ groupjid, action: "remove", participants });
  }

  /** Convenience over updateParticipants with action="promote". */
  promote(groupjid: string, participants: string[]): Promise<RawResponse> {
    return this.updateParticipants({ groupjid, action: "promote", participants });
  }

  /** Convenience over updateParticipants with action="demote". */
  demote(groupjid: string, participants: string[]): Promise<RawResponse> {
    return this.updateParticipants({ groupjid, action: "demote", participants });
  }
}

/**
 * Everything you do against a connected instance: send messages, media, and
 * interactive content, react, mark read, check status, and manage groups.
 * Reached via `client.instance(id)`.
 */
export class InstanceScope {
  /** Group operations for this instance. */
  readonly groups: GroupScope;

  constructor(
    private readonly req: Requester,
    readonly id: string,
  ) {
    this.groups = new GroupScope(req, id);
  }

  private path(suffix: string): string {
    return `/${encodeURIComponent(this.id)}${suffix}`;
  }

  /** GET /{id}/instance/status — live WhatsApp connection status. */
  status(): Promise<RawResponse> {
    return this.req<RawResponse>("GET", this.path("/instance/status"));
  }

  /** POST /{id}/send/text — send a text message. */
  sendText(params: SendTextParams): Promise<RawResponse> {
    return this.req<RawResponse>("POST", this.path("/send/text"), params);
  }

  /** POST /{id}/send/media — send an image, video, audio or document. */
  sendMedia(params: SendMediaParams): Promise<RawResponse> {
    return this.req<RawResponse>("POST", this.path("/send/media"), params);
  }

  /** POST /{id}/send/buttons — send an interactive button message. */
  sendButtons(params: SendButtonsParams): Promise<RawResponse> {
    return this.req<RawResponse>("POST", this.path("/send/buttons"), params);
  }

  /** POST /{id}/send/list — send an interactive list (menu) message. */
  sendList(params: SendListParams): Promise<RawResponse> {
    return this.req<RawResponse>("POST", this.path("/send/list"), params);
  }

  /** POST /{id}/send/poll — send a poll. */
  sendPoll(params: SendPollParams): Promise<RawResponse> {
    return this.req<RawResponse>("POST", this.path("/send/poll"), params);
  }

  /** POST /{id}/message/react — react to a message with an emoji. */
  react(params: ReactParams): Promise<RawResponse> {
    return this.req<RawResponse>("POST", this.path("/message/react"), params);
  }

  /** POST /{id}/message/markread — mark one or more messages as read. */
  markRead(params: MarkReadParams): Promise<RawResponse> {
    return this.req<RawResponse>("POST", this.path("/message/markread"), params);
  }

  /**
   * Escape hatch: call any proxy endpoint on this instance that the SDK does
   * not wrap yet. `suffix` is appended to `/{instanceId}` (include the leading
   * slash), e.g. `raw("POST", "/send/location", { ... })`.
   */
  raw<T = RawResponse>(
    method: "GET" | "POST" | "PUT" | "DELETE",
    suffix: string,
    body?: unknown,
  ): Promise<T> {
    return this.req<T>(method, this.path(suffix), body);
  }
}
