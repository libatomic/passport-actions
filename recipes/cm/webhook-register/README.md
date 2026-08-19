# cm-webhook-register

Registers a webhook on a Campaign Monitor list via the
[CM webhooks API](https://www.campaignmonitor.com/api/v3-3/webhooks/).
Idempotent: it first lists the webhooks already registered on the list and
skips creation when the target URL is already present, so re-running is safe.

Campaign Monitor has no UI for list webhooks — the API is the only way to
register one. This recipe wraps that call so blueprints (e.g.
[optout-webhook-register](../../../blueprints/cm/optout-webhook-register/))
can offer registration as a one-click manual workflow instead of a `curl`
instruction.

## Inputs

| Input | Required | Default | Description |
|---|---|---|---|
| `api_key` | yes | — | Campaign Monitor API key (secret) |
| `list_id` | yes | — | CM list ID to register the webhook on |
| `url` | yes | — | Destination URL CM should POST events to |
| `events` | no | `["Deactivate"]` | CM event types: `Subscribe`, `Update`, `Deactivate` |
| `payload_format` | no | `json` | `json` or `xml` |

## Outputs

| Step | Output | Description |
|---|---|---|
| `existing` | `body` | Array of webhooks already registered on the list (`WebhookID`, `Events`, `Url`, `Status`, `PayloadFormat`) |
| `register` | `body` | The new webhook's ID (quoted string), when created |
| `register` | `status` | `"skipped"` when the URL was already registered |

## Usage

```yaml
steps:
  - id: webhook
    includes: libatomic/passport-actions/recipes/cm/webhook-register
    with:
      api_key: ${{ secrets.CM_API_KEY }}
      list_id: ${{ inputs.list_id }}
      url: ${{ inputs.webhook_url }}
      events: ["Deactivate"]
```

## API details

- `GET /api/v3.3/lists/{listid}/webhooks.json` — list existing webhooks (200)
- `POST /api/v3.3/lists/{listid}/webhooks.json` — create webhook (201)
- Basic auth: API key as username, any string as password
- Requires `api.createsend.com` on the instance's allowed HTTP hosts list
