# Preferences Updated (Campaign Monitor)

Mirrors a user's **per-category email opt-outs** onto Campaign Monitor custom
fields: each Passport delivery category (newsletter) maps to a Text field like
`opt_out_newsletter1`, set to `"true"` when the user has opted out of that
category on email and `"false"` otherwise.

```
Passport delivery preferences              Campaign Monitor custom fields
─────────────────────────────              ──────────────────────────────
category X  channel_opt_out.email: true →    [opt_out_newsletter1] = true
category Y  (no entry / email: false)   →    [opt_out_newsletter2] = false
```

CM segments then exclude opted-out readers per newsletter — e.g. a campaign
segment of `[opt_out_newsletter1] not equals true` — without touching list
membership or overall subscription state.

Built on the
[`cm/subscriber-update`](../../../recipes/cm/subscriber-update/)
recipe. See the [Campaign Monitor overview](../README.md) for shared setup.

## When it fires

`user.preferences.updated` — whenever a user's per-category delivery
preferences change. The event body carries the user's **full** updated
`delivery` array (`{category, channels: {email: <bool>, ...}}`, true = opted
out), so the sync is stateless: every mapped field is rewritten on every run,
and opting back in flips the field to `"false"` — no stale flags.

Whole-channel email opt-out is a **different** event and concern — pair this
with [`user-email-opt-out`](../user-email-opt-out/) /
[`user-email-opt-in`](../user-email-opt-in/) for that.

## What it does

| Step | Action | Purpose |
|---|---|---|
| `load-user` | `user.get` | Load the email address and name |
| `opted` | `set-output` | Collect category IDs opted out on email |
| `fields` | `set-output` | Build a `{Key, Value}` row per mapping entry |
| `update-fields` | recipe `cm/subscriber-update` | One update writing every mapped field |

- Categories not in the mapping are ignored.
- Mapped categories the user has no preference entry for are `"false"`.
- Users not on the CM list get a harmless 400 (`continue-on-error`).

## Setup

1. **Create the custom fields** on the CM list — one **Text** field per
   category, keys matching your mapping exactly (CM silently drops undefined
   fields; see the [custom-fields gotcha](../README.md#custom-fields--read-this-first)).
2. **Fill in the `category_fields` mapping** — one row per category (rendered
   as a table in the editor, no JSON needed):

   | Passport Category ID | CM Opt-Out Field Key |
   |---|---|
   | `Ca4HCbj1B8JQLvw8uuZYj` | `opt_out_newsletter1` |
   | … | … |

   Category IDs are in the admin under the instance's delivery categories.
3. **Build CM segments** on the fields, e.g. exclude
   `[opt_out_newsletter1] equals true` from that newsletter's campaigns.

## Requirements

| What | Value |
|---|---|
| Secret | `CM_API_KEY` |
| Input | `list_id` — the CM list holding the opt-out fields |
| Input | `category_fields` — the category → field mapping |
| Host | `api.createsend.com` |

## Notes

- This is **event-driven** — it syncs changes going forward. Users who never
  touch their preferences keep blank fields, which is fine: blank ≠ `"true"`,
  so opt-out segments don't match them.
- New categories need a new CM field **and** a new mapping row; unmapped
  categories are silently ignored.
