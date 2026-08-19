# cm-webhook-register

Manages webhooks on a Campaign Monitor list via the
[CM webhooks API](https://www.campaignmonitor.com/api/v3-3/webhooks/). Three
actions:

- **`register`** (default) — register a webhook URL on the list. Idempotent:
  the create call is skipped when the URL is already registered, so re-running
  is safe.
- **`unregister`** — remove the webhook whose URL matches from the list.
  Idempotent: skipped when the URL isn't registered.
- **`list`** — just fetch what's registered (the fetch happens on every action;
  `list` performs nothing else, so callers can log or inspect the result).

Campaign Monitor has no UI for list webhooks — the API is the only way to
manage them. This recipe wraps those calls so blueprints (e.g.
[optout-webhook-register](../../../blueprints/cm/optout-webhook-register/))
can offer them as one-click manual workflows instead of `curl` instructions.

## Inputs

| Input | Required | Default | Description |
|---|---|---|---|
| `api_key` | yes | — | Campaign Monitor API key (secret) |
| `list_id` | yes | — | CM list ID to act on |
| `action` | no | `register` | `register`, `unregister`, or `list` |
| `url` | for register/unregister | `""` | Destination URL to register or unregister |
| `events` | no | `["Deactivate"]` | CM event types: `Subscribe`, `Update`, `Deactivate` |
| `payload_format` | no | `json` | `json` or `xml` |

## Outputs

| Step | Output | Description |
|---|---|---|
| `existing` | `body` | Array of webhooks registered on the list (`WebhookID`, `Events`, `Url`, `Status`, `PayloadFormat`) — always fetched, whatever the action |
| `register` | `body` | The new webhook's ID (quoted string), when created |
| `register` | `status` | `"skipped"` when not registering (wrong action, or URL already registered) |
| `unregister` | `status` | `"skipped"` when not unregistering (wrong action, or URL not registered) |

## Usage

```yaml
steps:
  - id: webhook
    includes: libatomic/passport-actions/recipes/cm/webhook-register
    with:
      api_key: ${{ secrets.CM_API_KEY }}
      list_id: ${{ inputs.list_id }}
      action: ${{ inputs.action }}   # register | unregister | list
      url: ${{ inputs.webhook_url }}
      events: ["Deactivate"]
```

## API details

- `GET /api/v3.3/lists/{listid}/webhooks.json` — list existing webhooks (200)
- `POST /api/v3.3/lists/{listid}/webhooks.json` — create webhook (201)
- `DELETE /api/v3.3/lists/{listid}/webhooks/{webhookid}.json` — delete webhook (200)
- Basic auth: API key as username, any string as password
- Requires `api.createsend.com` on the instance's allowed HTTP hosts list
