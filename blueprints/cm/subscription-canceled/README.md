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

`user.subscription.deleted` — the **Stripe path**: the
`customer.subscription.deleted` webhook deletes the subscription outright.
Stripe-billed subscriptions never pass through a `canceled` status, so
`user.subscription.status.canceled` does not fire for them; this is the event
that actually happens. Its body is the full serialized subscription.

## What it does

| Step | Action | Purpose |
|---|---|---|
| `load-user` | `user.get` | Load the email address and name (via `trigger.user_id`) |
| `update-fields` | recipe `cm/subscriber-update` | Clear subscription fields, stamp `SubscriptionExpiredAt` |

There's deliberately **no** `subscription.get`: the row is already gone when
the event fires and the lookup would fail. `SubscriptionExpiredAt` is stamped
with the time the deletion event fired — not the body's `ends_at`/`cancel_at`,
which reflect scheduled period dates rather than when the subscription
actually ended.

Fields **cleared** (via CM's `Clear: true` flag): `PassportSubscriptionID`,
`PassportPlanID`, `SubscriptionInterval`, `AutoRenew`,
`SubscriptionCancelsAt` (the scheduled date is moot once the subscription is
gone — `SubscriptionExpiredAt` takes over as the terminal date).

Field **set**: `SubscriptionExpiredAt` — the time the deletion event fired,
formatted `YYYY/MM/DD` for a CM **Date** field.

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

- **Non-Stripe cancellations**: if your instance also ends subscriptions
  through flows that explicitly transition the status to `canceled`, add a
  second trigger on `user.subscription.status.canceled` (its body carries only
  the subscription id — the steps here work unchanged since they only use
  `trigger.user_id` and fall back to the run time for the date).
- To also remove the user from the list on cancellation (a separate-lists
  model instead of segments), add a
  [`cm/subscriber-delete`](../../../recipes/cm/subscriber-delete/) step.
- **Multiple subscriptions per user**: this clears the fields when *any*
  subscription ends. If your users can hold several concurrent subscriptions,
  the next `status.active` event (via [`new-subscriber`](../new-subscriber/))
  re-fills the fields; a brief window of "not paid" state is possible.
