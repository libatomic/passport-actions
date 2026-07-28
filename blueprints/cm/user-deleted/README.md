# User Deleted (Campaign Monitor)

**Deletes** a user from a Campaign Monitor list when their Passport account is
permanently deleted — so PII doesn't linger in your ESP after an account
erasure (e.g. a GDPR right-to-erasure request).

Built on the [`cm/subscriber-delete`](../../../recipes/cm/subscriber-delete/)
recipe. See the [Campaign Monitor overview](../README.md) for shared setup.

## When it fires

`user.deleted` — when a user is permanently deleted from the instance.

## What it does

| Step | Action | Purpose |
|---|---|---|
| `remove-from-list` | recipe `cm/subscriber-delete` | Delete them from the list |

Just one step: the user row is **already gone** when this fires, so there's no
`user.get`. The event body is the full serialized user object, and the email is
read as `coalesce(trigger.body.profile.email, trigger.body.login)` (the login
is usually the email address).

## Expect a harmless 400

If the user was never on the list, CM returns **`400` / code `203`**
("Subscriber not in list or has already been removed"). The step is
`continue-on-error: true`, so the run still succeeds.

## Requirements

| What | Value |
|---|---|
| Secret | `CM_API_KEY` |
| Input | `list_id` — the CM list to delete the user from |
| Host | `api.createsend.com` |

## Customizing

- Running several CM lists? Install this blueprint once **per list** (each
  install targets one `list_id`) so a deleted account is erased from all of
  them — all-users, paid, and win-back alike.
- CM's delete removes the subscriber and their history from the list. If your
  retention policy prefers keeping suppression history in CM, swap the recipe
  for [`cm/subscriber-unsubscribe`](../../../recipes/cm/subscriber-unsubscribe/)
  — but note that leaves the email address stored in CM.
