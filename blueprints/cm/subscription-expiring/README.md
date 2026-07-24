# Subscription Expiring Soon (Campaign Monitor)

Adds a user to a Campaign Monitor list when their non-renewing subscription is
about to lapse — a win-back / "renew now" list you can campaign against.

Built on the [`cm/subscriber-add`](../../../recipes/cm/subscriber-add/) recipe.
See the [Campaign Monitor overview](../README.md) for shared setup (API key,
allowed hosts, and the **custom-fields gotcha**).

## When it fires

`user.subscription.expiring`, emitted by the recurring expiring job for
subscriptions with `auto_renew = false`:

- **yearly** plans within **7 days** of `ends_at`
- **monthly** plans within **48 hours**

Both windows (and the job interval, default 12h) are configurable on the
instance policy.

## What it does

| Step | Action | Purpose |
|---|---|---|
| `load-user` | `user.get` | Load email and name |
| `add-to-list` | recipe `cm/subscriber-add` | Add them to the win-back list |

The event body carries the subscription details directly, so no
`subscription.get` is needed.

Custom fields sent: `InstanceName`, `PassportUserID`, `PassportSubscriptionID`,
`PassportPlanID`, `SubscriptionInterval`, `EndsAt`, `EndsAtPretty`, and
`Reason: expiring`.

## Requirements

| What | Value |
|---|---|
| Secret | `CM_API_KEY` |
| Input | `list_id` — the CM list for expiring subscribers |
| Host | `api.createsend.com` |

## Customizing

- `EndsAtPretty` renders as e.g. "in 5 days" — good subject-line material.
- For an in-platform sequence instead of an ESP campaign, see the
  [`journeys/win-back`](../../journeys/win-back/) blueprint.
