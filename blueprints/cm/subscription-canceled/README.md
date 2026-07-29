# Subscription Canceled (Campaign Monitor)

Marks a subscriber as **no longer paid** when their subscription is canceled —
without touching their list membership or subscription state. Cancellation is
a billing event, not an unsubscribe: the user stays on the list and keeps
receiving campaigns; only the subscription **custom fields** change, and any CM
segments built on them update automatically.

Built on the
[`cm/subscriber-update`](../../../recipes/cm/subscriber-update/)
recipe. See the [Campaign Monitor overview](../README.md) for shared setup.

## When it fires

`user.subscription.status.canceled`.

## What it does

| Step | Action | Purpose |
|---|---|---|
| `load-subscription` | `subscription.get` | Resolve the subscription's user and end date |
| `load-user` | `user.get` | Load the email address and name |
| `update-fields` | recipe `cm/subscriber-update` | Clear subscription fields, stamp `SubscriptionExpiredAt` |

Fields **cleared** (via CM's `Clear: true` flag): `PassportSubscriptionID`,
`PassportPlanID`, `SubscriptionInterval`, `AutoRenew`.

Field **set**: `SubscriptionExpiredAt` — the subscription's `ends_at` (falling
back to the run time), formatted `YYYY/MM/DD` for a CM **Date** field.

A segment like `[PassportPlanID] is provided` (paid) stops matching the user
the moment the fields clear; a win-back segment can match on
`[SubscriptionExpiredAt] is after ...` instead.

## Expect a harmless 400

If the user was never added to the list, CM returns a **404** for the update.
The step is marked `continue-on-error: true`, so the run still **succeeds**;
you'll just see the 400 in the run detail. That's expected, not a failure.

## Requirements

| What | Value |
|---|---|
| Secret | `CM_API_KEY` |
| Input | `list_id` — the CM list holding the subscription custom fields |
| Host | `api.createsend.com` |

`SubscriptionExpiredAt` must exist on the list as a **Date** custom field (CM
silently drops undefined fields). The cleared fields only need to exist if
something (e.g. [`new-subscriber`](../new-subscriber/)) sets them.

## Customizing

- **`canceled` vs `deleted`**: this fires when a subscription is *marked*
  canceled. `user.subscription.deleted` fires when it's fully removed — and its
  body is the whole subscription object (use `trigger.body.user_id`; don't call
  `subscription.get`, the row is already gone).
- To also remove the user from the list on cancellation (a separate-lists
  model instead of segments), add a
  [`cm/subscriber-delete`](../../../recipes/cm/subscriber-delete/) step.
