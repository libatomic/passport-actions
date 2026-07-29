# Subscription Updated (Campaign Monitor)

Keeps a subscriber's **renewal state** current on a Campaign Monitor list:
whenever a subscription changes, the `AutoRenew` and `SubscriptionCancelsAt`
custom fields are updated — so segments like "auto-renew off" or "cancels this
month" stay accurate without touching list membership.

Built on the
[`cm/subscriber-update`](../../../recipes/cm/subscriber-update/)
recipe. See the [Campaign Monitor overview](../README.md) for shared setup.

## When it fires

`user.subscription.updated` — on **every** subscription change (renewal
toggles, scheduled cancellations, plan/quantity/date changes). The event body
is the full updated subscription, so the sync is stateless and idempotent.

## What it does

| Step | Action | Purpose |
|---|---|---|
| `load-user` | `user.get` | Load the email address and name |
| `update-fields` | recipe `cm/subscriber-update` | Set `AutoRenew`, set/clear `SubscriptionCancelsAt` |

| Field | Value |
|---|---|
| `AutoRenew` | `"true"` / `"false"` from the subscription's `auto_renew` flag |
| `SubscriptionCancelsAt` | The scheduled cancellation date (`cancel_at`), `YYYY/MM/DD` — **cleared** when there's no scheduled cancellation, so turning auto-renew back on removes the stale date |

## Expect a harmless 400

If the user was never added to the list, CM returns a **404** for the update.
The step is `continue-on-error: true`, so the run still succeeds.

## Requirements

| What | Value |
|---|---|
| Secret | `CM_API_KEY` |
| Input | `list_id` — the CM list holding the subscription custom fields |
| Host | `api.createsend.com` |

Create the fields on the list first: `AutoRenew` as **Text**,
`SubscriptionCancelsAt` as a **Date** field (CM silently drops undefined
fields).

## Works with

- [`new-subscriber`](../new-subscriber/) — adds the subscriber and the plan
  fields when they first become active.
- [`subscription-canceled`](../subscription-canceled/) — clears the
  subscription fields (including `AutoRenew`) and stamps
  `SubscriptionExpiredAt` when the subscription ends.
