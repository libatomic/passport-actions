# Subscription Canceled (Campaign Monitor)

**Removes** a user from a Campaign Monitor list when their subscription is
canceled — typically your paid-subscriber list, so it stays accurate.

Built on the
[`cm/subscriber-unsubscribe`](../../../recipes/cm/subscriber-unsubscribe/)
recipe. See the [Campaign Monitor overview](../README.md) for shared setup.

## When it fires

`user.subscription.status.canceled`.

## What it does

| Step | Action | Purpose |
|---|---|---|
| `load-subscription` | `subscription.get` | Resolve the subscription's user |
| `load-user` | `user.get` | Load the email address |
| `remove-from-list` | recipe `cm/subscriber-unsubscribe` | Unsubscribe them |

## Expect a harmless 400

Campaign Monitor returns **`400` / code `203`** — *"Subscriber not in list or has
already been removed"* — when the person isn't on the list. The unsubscribe step
is marked `continue-on-error: true`, so the run still **succeeds**; you'll just
see the 400 in the run detail. That's expected, not a failure.

## Requirements

| What | Value |
|---|---|
| Secret | `CM_API_KEY` |
| Input | `list_id` — the CM list to remove canceled subscribers from |
| Host | `api.createsend.com` |

No custom fields — CM's unsubscribe endpoint accepts only the email address.

## Customizing

- **Move rather than remove**: add a `cm/subscriber-add` step targeting a
  win-back list after the unsubscribe step.
- **`canceled` vs `deleted`**: this fires when a subscription is *marked*
  canceled. `user.subscription.deleted` fires when it's fully removed — and its
  body is the whole subscription object (use `trigger.body.user_id`; don't call
  `subscription.get`, the row is already gone).
