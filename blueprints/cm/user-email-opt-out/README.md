# User Email Opt-Out (Campaign Monitor)

Honors a Passport email opt-out in your ESP: when a user opts out, they're
**unsubscribed** from the Campaign Monitor list too.

Built on the
[`cm/subscriber-unsubscribe`](../../../recipes/cm/subscriber-unsubscribe/)
recipe. See the [Campaign Monitor overview](../README.md) for shared setup.

## When it fires

`user.email.opt_out` — when a user turns off email delivery in their
preferences (or an admin does it for them).

## What it does

| Step | Action | Purpose |
|---|---|---|
| `load-user` | `user.get` | Load the email address |
| `unsubscribe` | recipe `cm/subscriber-unsubscribe` | Unsubscribe them |

## Why this matters

Passport stops sending to opted-out users automatically, but campaigns you send
**from Campaign Monitor** don't know about that preference. Without this
blueprint an opted-out user keeps receiving CM campaigns — a compliance problem
as much as a UX one. Install it on every list you campaign against.

## Expect a harmless 400

If the user was never on the list, CM returns **`400` / code `203`**
("Subscriber not in list or has already been removed"). The step is
`continue-on-error: true`, so the run still succeeds.

## Requirements

| What | Value |
|---|---|
| Secret | `CM_API_KEY` |
| Input | `list_id` — the CM list to unsubscribe the user from |
| Host | `api.createsend.com` |

## Customizing

- Running several CM lists? Install this blueprint once **per list** (each
  instance targets one `list_id`), or add extra unsubscribe steps to one
  workflow.
- To sync preferences in both directions, see
  [`journeys/preference-sync`](../../journeys/preference-sync/).
