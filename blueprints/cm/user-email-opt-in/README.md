# User Email Opt-In (Campaign Monitor)

The counterpart to [`user-email-opt-out`](../user-email-opt-out/): when a user
turns the email channel **back on** in their Passport preferences, they're
**re-subscribed** on the Campaign Monitor list — removed from CM's unsubscribed
pool and made Active again.

Built on the [`cm/subscriber-add`](../../../recipes/cm/subscriber-add/) recipe.
See the [Campaign Monitor overview](../README.md) for shared setup.

## When it fires

`user.email.opt_in` — when `preferences.channels.email.opt_out` flips back to
false (the user re-enables email delivery, or an admin does it for them).

## What it does

| Step | Action | Purpose |
|---|---|---|
| `load-user` | `user.get` | Load the email address and name |
| `resubscribe` | recipe `cm/subscriber-add` | Add with `Resubscribe: true` — reactivates an unsubscribed member |

**Why `resubscribe: true` is correct here (and only here):** CM will not
reactivate an unsubscribed member unless the add passes `Resubscribe: true`.
Most automated adds shouldn't override a person's unsubscribe — but an explicit
opt-in in their own preferences *is* the fresh consent signal that justifies
it. If the user was never on the list, the add simply creates them as a new
Active subscriber.

## Requirements

| What | Value |
|---|---|
| Secret | `CM_API_KEY` |
| Input | `list_id` — the CM list to re-subscribe the user on |
| Host | `api.createsend.com` |

## Customizing

- Running several CM lists? Install once **per list**, mirroring your
  [`user-email-opt-out`](../user-email-opt-out/) installs, so the two stay
  symmetric.
- Pair with [`optout-webhook`](../optout-webhook/) for the inbound direction
  (CM-side unsubscribes flowing back into Passport).
