# New User (Campaign Monitor)

Adds **every newly created user** to a Campaign Monitor list — your top-of-funnel
list, regardless of whether they ever subscribe.

Built on the [`cm/subscriber-add`](../../../recipes/cm/subscriber-add/) recipe.
See the [Campaign Monitor overview](../README.md) for shared setup (API key,
allowed hosts, and the **custom-fields gotcha**).

## When it fires

`user.created` — once per new user account.

## What it does

| Step | Action | Purpose |
|---|---|---|
| `load-user` | `user.get` | Load the user's email and name |
| `add-to-list` | recipe `cm/subscriber-add` | Add them to the list |

Custom fields sent: `InstanceName`, `PassportUserID`.

## Requirements

| What | Value |
|---|---|
| Secret | `CM_API_KEY` |
| Input | `list_id` — the CM list to add new users to |
| Host | `api.createsend.com` |

Create `InstanceName` and `PassportUserID` as custom fields on the list first —
CM drops undefined fields without erroring.

## Customizing

- Add more `custom_fields` rows (e.g. signup source from `trigger.body`).
- To only add *verified* users, trigger on `user.email.verified` instead.
