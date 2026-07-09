# Campaign Monitor — Unsubscribe

Unsubscribes a subscriber from a Campaign Monitor list by email address. The subscriber is marked as `Unsubscribed` and will no longer receive campaigns from this list.

## Reference

```
libatomic/passport-actions/recipes/cm/subscriber-unsubscribe
```

## Inputs

| Input | Required | Description |
|---|---|---|
| `api_key` | yes | Campaign Monitor API key |
| `list_id` | yes | Target list ID |
| `email` | yes | Subscriber email address to unsubscribe |

## Usage

```yaml
steps:
  - id: unsub
    includes: libatomic/passport-actions/recipes/cm/subscriber-unsubscribe
    with:
      api_key: ${{ secrets.CM_API_KEY }}
      list_id: ${{ secrets.CM_LIST_ID }}
      email: ${{ trigger.body.EmailAddress }}
```

### Webhook-triggered unsubscribe

Process Campaign Monitor deactivation webhooks to sync opt-outs back to your user records:

```yaml
name: cm-optout-sync
version: 1

on:
  - webhook: true
    name: campaign-monitor
    validate: false
    foreach: Events
    if: body.Type == "Deactivate"

steps:
  - id: update-user
    action: user.update
    continue-on-error: true
    with:
      login: ${{ trigger.body.EmailAddress }}
      preferences:
        email_opt_out: true
```

## API details

- **Endpoint**: `POST https://api.createsend.com/api/v3.3/subscribers/{list_id}/unsubscribe.json`
- **Auth**: HTTP Basic (API key as username, `x` as password)
- **Expected status**: 200
