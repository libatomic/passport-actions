# New Subscriber (Campaign Monitor)

Adds a user to a Campaign Monitor list when their subscription becomes
**active** (payment succeeded) or **trialing** (trials and gifts — a gift is a
real subscription issued in a trialing state). Use this for your
subscriber list.

Built on the [`cm/subscriber-add`](../../../recipes/cm/subscriber-add/) recipe.
See the [Campaign Monitor overview](../README.md) for shared setup (API key,
allowed hosts, and the **custom-fields gotcha**).

## When it fires

`user.subscription.status.active` and `user.subscription.status.trialing` —
same body shape, same steps.

**Why not `user.subscription.created`?** At creation the subscription is still
`incomplete` — payment hasn't been confirmed yet. The status events fire once
it's a real subscription (confirmed payment, or a started trial/gift), so
incomplete checkouts never land on the list.

Only want *paying* subscribers? Remove the `status.trialing` trigger.

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
`PassportPlanID`, `SubscriptionInterval` — plus `SubscriptionExpiredAt` is
**cleared**: a new active subscription supersedes any previous expiry, so
win-back segments stop matching a returning customer.

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
