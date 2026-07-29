# New Subscriber (Campaign Monitor)

Adds a user to a Campaign Monitor list when their subscription becomes
**active** — i.e. payment succeeded. Use this for your paid-subscriber list.

Built on the [`cm/subscriber-add`](../../../recipes/cm/subscriber-add/) recipe.
See the [Campaign Monitor overview](../README.md) for shared setup (API key,
allowed hosts, and the **custom-fields gotcha**).

## When it fires

`user.subscription.status.active`.

**Why not `user.subscription.created`?** At creation the subscription is still
`incomplete` — payment hasn't been confirmed yet. `status.active` fires when it
is, so only *paying* subscribers land on the list.

Want trial signups too? Add a second trigger on
`user.subscription.status.trialing` — same body shape, same steps.

## What it does

| Step | Action | Purpose |
|---|---|---|
| `load-subscription` | `subscription.get` | Load plan/price/interval/end date |
| `load-user` | `user.get` | Load email and name |
| `add-to-list` | recipe `cm/subscriber-add` | Add them to the list |

Free/planless subscriptions are skipped: the `load-subscription` step declares
an `is_subscriber` output (`plan_id` **and** `price_id` present) that gates the
later steps via `if:`.

Custom fields sent: `InstanceName`, `PassportUserID`, `PassportSubscriptionID`,
`PassportPlanID`, `SubscriptionInterval`.

## Requirements

| What | Value |
|---|---|
| Secret | `CM_API_KEY` |
| Input | `list_id` — the CM list for paid subscribers |
| Host | `api.createsend.com` |

Define all five custom fields on the list first, or CM will accept the
subscriber and silently drop the values.

## Customizing

- Pair with [`subscription-canceled`](../subscription-canceled/) on the same
  list so it stays accurate on both sides, and
  [`subscription-updated`](../subscription-updated/) for renewal state
  (`AutoRenew` / `SubscriptionCancelsAt`).
