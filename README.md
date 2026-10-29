# ZapZap SDK for Node.js

Official TypeScript/Node SDK for the [ZapZap API](https://zapzapapi.com) — connect and automate WhatsApp instances from your own backend. Create instances, show QR codes, send text, media, buttons, lists and polls, react to messages, manage groups, and configure webhooks, all through one fully typed client.

- Zero runtime dependencies (uses native `fetch`, Node 18+).
- Full TypeScript types for every request and response.
- A single `ZapZapError` for every failure, carrying the HTTP status and the backend message.
- Credentials are always passed in by you, never read from the environment.

## Installation

```bash
npm install @zapzapapi/sdk
```

Requires Node.js 18 or newer (for native `fetch`).

## Quickstart

```ts
import { ZapZapClient } from "@zapzapapi/sdk";

const client = new ZapZapClient({
  apiKey: process.env.ZAPZAP_API_KEY!,
  apiSecret: process.env.ZAPZAP_API_SECRET!,
});

// Check the account balance and status.
const account = await client.account.get();
console.log(`Balance: ${account.balance} (${account.status})`);

// Create an instance and show its QR code.
const { instance } = await client.instances.create({
  name: "customer-joe",
  metadata: { customerId: "123" },
});

const qr = await client.instances.qrcode(instance.id);
if (!qr.connected) {
  console.log("Scan this QR:", qr.instance.qrcode);
}

// Once connected, send a message.
await client.instance(instance.id).sendText({
  number: "5511999999999",
  text: "Hello from the ZapZap SDK!",
});
```

Get your `apiKey` and `apiSecret` from the ZapZap panel at https://app.zapzapapi.com under Settings. Keep them on your backend; never ship them to a browser.

## Configuration

```ts
const client = new ZapZapClient({
  apiKey: "...",
  apiSecret: "...",
  baseUrl: "https://api.zapzapapi.com/api/v1", // default
  timeoutMs: 15000, // per-request timeout, default 15s
  maxRetries: 2, // automatic retries on HTTP 429, default 2
  fetch: customFetch, // optional custom fetch implementation
});
```

## API

### Account

```ts
await client.account.get(); // GET /account
```

### Instances

```ts
await client.instances.list();                       // GET    /instances
await client.instances.create({ name, systemName?, metadata? }); // POST /instances
await client.instances.get(id);                      // GET    /instances/{id}
await client.instances.update(id, { webhook_url?, metadata? });  // PUT /instances/{id}
await client.instances.delete(id);                   // DELETE /instances/{id}
await client.instances.qrcode(id);                   // GET    /instances/{id}/qrcode
await client.instances.cost();                       // GET    /instances/cost
```

### Webhook

```ts
await client.webhook.get(instanceId);                             // GET /instances/{id}/webhook
await client.webhook.set(instanceId, {                            // PUT /instances/{id}/webhook
  webhook_url: "https://yourapp.com/api/webhooks/zapzap",
  events: ["messages", "connection"],
  excludeMessages: false,
});
```

### Per-instance messaging and groups

`client.instance(id)` returns a scope for everything you do against a connected instance.

```ts
const wa = client.instance(instanceId);

await wa.status(); // GET /{id}/instance/status

await wa.sendText({ number: "5511999999999", text: "Hi!" });

await wa.sendMedia({
  number: "5511999999999",
  type: "image", // image | video | audio | document
  file: "https://yoursite.com/photo.jpg",
  text: "Product photo",
});

await wa.sendButtons({
  number: "5511999999999",
  text: "Pick one",
  buttons: [{ id: "1", text: "Yes" }, { id: "2", text: "No" }],
});

await wa.sendList({
  number: "5511999999999",
  text: "Our menu",
  choices: [{ title: "Drinks", rows: [{ id: "d1", title: "Water" }] }],
  listButton: "Open menu",
});

await wa.sendPoll({
  number: "5511999999999",
  text: "Best day?",
  choices: ["Monday", "Friday"],
  selectableCount: 1,
});

await wa.react({ number: "5511999999999", id: "MESSAGE_ID", emoji: "👍" });
await wa.markRead({ id: "MESSAGE_ID" });
```

Groups:

```ts
const groups = client.instance(instanceId).groups;

await groups.list({ getParticipants: true });
await groups.create({ name: "My group", participants: ["5511999999999"] });
await groups.info({ groupjid: "123@g.us", getInviteLink: true });
await groups.addMembers("123@g.us", ["5511888888888"]);
await groups.removeMembers("123@g.us", ["5511888888888"]);
await groups.promote("123@g.us", ["5511888888888"]);
await groups.demote("123@g.us", ["5511888888888"]);
await groups.leave("123@g.us");
```

### Raw proxy calls

For any instance proxy endpoint the SDK does not wrap yet:

```ts
await client.instance(instanceId).raw("POST", "/send/location", {
  number: "5511999999999",
  lat: -23.5,
  lng: -46.6,
});
```

## Error handling

Every non-2xx response and every transport failure throws a `ZapZapError`.

```ts
import { ZapZapError } from "@zapzapapi/sdk";

try {
  await client.instances.create({ name: "taken-name" });
} catch (err) {
  if (err instanceof ZapZapError) {
    console.error(err.status); // e.g. 409
    console.error(err.message); // backend message
    console.error(err.body); // parsed response body

    if (err.isInsufficientBalance) {
      // HTTP 402: top up the account balance.
    }
    if (err.isConflict) {
      // HTTP 409: instance name already taken.
    }
  }
}
```

Helpers on `ZapZapError`: `isInsufficientBalance` (402), `isConflict` (409), `isRateLimited` (429), `isUnauthorized` (401/403). A `status` of `0` means the request never reached the server (network error or timeout).

## Webhooks

When something happens on WhatsApp (an incoming message, a connection change) the ZapZap API POSTs an event to the URL you configured with `client.webhook.set(...)`. Respond `200` immediately; the API disables a webhook after repeated failures. Event names: `messages`, `messages_update`, `connection`, `contacts`, `presence`, `groups`, `chats`.

## License

MIT (c) GM Solutions Hub LTDA. See [LICENSE](./LICENSE).
