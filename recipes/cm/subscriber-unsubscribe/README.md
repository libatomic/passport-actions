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

Process Campaign Monitor deactivation webhooks to sync opt-outs back to your
user records:

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
  - id: lookup
    action: user.get
    continue-on-error: true
    with:
      login: ${{ trigger.body.EmailAddress }}
    outputs:
      # nil-guarded: a user who never set preferences has preferences: nil
      channels: '${{ fromJSON(toJSON(steps.lookup.outputs.user.preferences?.channels ?? {})) }}'

  # user.update replaces the whole preferences object, so round-trip the
  # user's current channels with only email.opt_out overridden.
  - id: optout
    if: ${{ steps.lookup.status == "ok" }}
    action: user.update
    with:
      user_id: ${{ steps.lookup.outputs.user.id }}
      preferences:
        channels: '${{ merge({email: merge({opt_out: true}, outputs.channels.email ?? {})}, outputs.channels) }}'
```

This pattern ships ready-made as the
[`cm/optout-webhook`](../../../blueprints/cm/optout-webhook/) blueprint.

## API details

- **Endpoint**: `POST https://api.createsend.com/api/v3.3/subscribers/{list_id}/unsubscribe.json`
- **Auth**: HTTP Basic (API key as username, `x` as password)
- **Expected status**: 200
