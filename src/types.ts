/**
 * Request and response types for the ZapZap API.
 *
 * These mirror the public API surface documented at
 * https://api.zapzapapi.com/llms.txt and the endpoint catalog shipped with the
 * ZapZap platform. WhatsApp proxy responses (anything under `/{instanceId}/...`)
 * pass through from the underlying WhatsApp engine and can vary by event, so
 * those are typed permissively with an index signature.
 */

/** Free-form metadata you attach to an instance to link it back to your own system. */
export type Metadata = Record<string, unknown>;

/** Catch-all for pass-through WhatsApp responses whose exact shape is engine-defined. */
export interface RawResponse {
  [key: string]: unknown;
}

// ---- Account ----

export type AccountStatus = "ACTIVE" | "SUSPENDED" | "CANCELED";

export interface Account {
  id: string;
  name: string;
  email: string;
  /** Current prepaid balance, returned as a decimal string (e.g. "150.00"). */
  balance: string;
  billing_day: number;
  status: AccountStatus;
  [key: string]: unknown;
}

// ---- Instances ----

export type InstanceStatus =
  | "CONNECTED"
  | "DISCONNECTED"
  | "PENDING"
  | "BLOCKED"
  | "SUSPENDED_PROXY";

export interface Instance {
  id: string;
  name: string;
  status: InstanceStatus;
  phone_number?: string | null;
  metadata?: Metadata | null;
  [key: string]: unknown;
}

export interface CreateInstanceParams {
  /** Required. Letters, numbers, `_` and `-` only. */
  name: string;
  /** Optional display/system name for the instance. */
  systemName?: string;
  /** Optional free-form metadata to link the instance to your own records. */
  metadata?: Metadata;
}

export interface CreateInstanceResult {
  instance: Instance;
  billing: {
    charged: number;
    activationFee: number;
    prorate: number;
  };
  [key: string]: unknown;
}

export interface UpdateInstanceParams {
  /** Public URL the ZapZap API will POST WhatsApp events to. */
  webhook_url?: string;
  /** Replace the instance metadata. */
  metadata?: Metadata;
}

export interface InstanceCost {
  activationFee: number;
  prorate: number;
  total: number;
  instancePrice: number;
  currentBalance: number;
  hasWaiver: boolean;
  [key: string]: unknown;
}

export interface QrCodeResult {
  connected: boolean;
  loggedIn: boolean;
  instance: {
    /** data:image/png;base64,... — present while not yet connected. */
    qrcode?: string;
    status?: string;
    profileName?: string;
    owner?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

// ---- Webhook ----

/** WhatsApp event names the API can deliver to your webhook URL. */
export type WebhookEvent =
  | "messages"
  | "messages_update"
  | "connection"
  | "contacts"
  | "presence"
  | "groups"
  | "chats";

export interface WebhookConfig {
  webhook_url?: string;
  events?: WebhookEvent[] | string[];
  excludeMessages?: boolean;
  [key: string]: unknown;
}

export interface SetWebhookParams {
  /** Required. Public URL to receive events. */
  webhook_url: string;
  /** Optional subset of events to subscribe to. Defaults to all when omitted. */
  events?: WebhookEvent[] | string[];
  /** Optionally exclude message bodies from delivered payloads. */
  excludeMessages?: boolean;
}

// ---- Sending ----

/** Typing/recording indicator shown before a message is delivered. */
export type TypingIndicator = "none" | "composing" | "recording";

export interface SendTextParams {
  /** Destination, digits only: country code + area code + number (e.g. "5511999999999"). */
  number: string;
  text: string;
  /** Mention group members. "all" mentions everyone (use with care). */
  mentions?: string;
  /** Delay in milliseconds before sending. */
  delay?: number;
  /** Message id to reply to. */
  replyid?: string;
  /** Show a typing/recording indicator before sending. */
  digitando?: TypingIndicator;
}

export type MediaType = "image" | "video" | "audio" | "document";

export interface SendMediaParams {
  number: string;
  /** Kind of media being sent. */
  type: MediaType;
  /** Public URL or base64 payload of the media file. */
  file: string;
  /** Caption / accompanying text. */
  text?: string;
  mentions?: string;
  /** File name shown to the recipient for documents. */
  docName?: string;
  delay?: number;
  digitando?: TypingIndicator;
}

export interface SendButtonsParams {
  number: string;
  text: string;
  /** Button definitions (engine-specific JSON shape). */
  buttons: unknown[];
  /** Optional header image URL. */
  image?: string;
  footer?: string;
  delay?: number;
  digitando?: TypingIndicator;
}

export interface SendListParams {
  number: string;
  text: string;
  /** List section/choice definitions (engine-specific JSON shape). */
  choices: unknown[];
  listButton?: string;
  footerText?: string;
  digitando?: TypingIndicator;
}

export interface SendPollParams {
  number: string;
  text: string;
  /** Poll options. */
  choices: string[];
  /** How many options the recipient may select. */
  selectableCount?: number | string;
  digitando?: TypingIndicator;
}

// ---- Messages ----

export interface ReactParams {
  /** Chat the message belongs to. */
  number: string;
  /** Target message id. */
  id: string;
  /** Emoji to react with. Pass an empty string to remove a reaction. */
  emoji: string;
}

export interface MarkReadParams {
  /** Message id (or array of ids) to mark as read. */
  id: string | string[];
}

// ---- Groups ----

export type GroupParticipantAction = "add" | "remove" | "promote" | "demote";

export interface CreateGroupParams {
  name: string;
  /** Participant numbers (digits only) or JIDs. */
  participants: string[];
}

export interface GroupInfoParams {
  groupjid: string;
  getInviteLink?: boolean;
}

export interface UpdateParticipantsParams {
  groupjid: string;
  action: GroupParticipantAction;
  participants: string[];
}

export interface ListGroupsParams {
  /** Include the participant list for each group. */
  getParticipants?: boolean;
}
