# New User (Campaign Monitor)

Adds a new user to a Campaign Monitor list **once they verify their email
address** — your top-of-funnel list, regardless of whether they ever subscribe.

Built on the [`cm/subscriber-add`](../../../recipes/cm/subscriber-add/) recipe.
See the [Campaign Monitor overview](../README.md) for shared setup (API key,
allowed hosts, and the **custom-fields gotcha**).

## When it fires

`user.email.verified` — when a user confirms their email address. Triggering on
verification (rather than `user.created`) keeps typos, bots, and abandoned
signups off the list — only confirmed addresses are synced.

## What it does

| Step | Action | Purpose |
|---|---|---|
| `load-user` | `user.get` | Load the user's email and name |
| `add-to-list` | recipe `cm/subscriber-add` | Add them to the list |

Custom fields sent: `InstanceName`, `PassportUserID`, `CreatedAt` (the user's
account creation date, formatted `YYYY/MM/DD` for a CM **Date** field).

## Requirements

| What | Value |
|---|---|
| Secret | `CM_API_KEY` |
| Input | `list_id` — the CM list to add new users to |
| Host | `api.createsend.com` |

Create `InstanceName` and `PassportUserID` (Text) and `CreatedAt` (**Date**) as
custom fields on the list first — CM drops undefined fields without erroring.

## Customizing

- Add more `custom_fields` rows (e.g. signup source from `trigger.body`).
- To add **every** account regardless of verification, trigger on
  `user.created` instead — note it fires for typos, bots, and abandoned
  signups that never verify.
- **Tracking consent**: the recipe defaults `ConsentToTrack` to `yes`. If your
  users haven't explicitly consented to open/click tracking (e.g. under GDPR),
  set `consent_to_track: "unchanged"` (or `"no"`) on the add step.
