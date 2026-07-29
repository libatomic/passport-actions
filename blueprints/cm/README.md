# Campaign Monitor blueprints

Keep a Campaign Monitor list in sync with Passport's subscriber lifecycle. Each
blueprint here reacts to one Passport event and adds, updates or removes a
subscriber on a CM list.

| Blueprint | Fires on | Effect |
|---|---|---|
| [`new-user`](new-user/) | `user.email.verified` | **Add** users to a list once verified |
| [`new-subscriber`](new-subscriber/) | `user.subscription.status.active` | **Add** paid, plan-backed subscribers |
| [`subscription-updated`](subscription-updated/) | `user.subscription.updated` | **Sync** `AutoRenew` / `SubscriptionCancelsAt` fields |
| [`subscription-canceled`](subscription-canceled/) | `user.subscription.status.canceled` | **Clear** subscription fields, stamp `SubscriptionExpiredAt` |
| [`user-email-opt-out`](user-email-opt-out/) | `user.email.opt_out` | **Unsubscribe** users who opted out |
| [`user-email-opt-in`](user-email-opt-in/) | `user.email.opt_in` | **Re-subscribe** users who opted back in |
| [`preferences-updated`](preferences-updated/) | `user.preferences.updated` | **Sync** per-category opt-out fields (`opt_out_*`) |
| [`user-deleted`](user-deleted/) | `user.deleted` | **Delete** erased accounts from a list (GDPR) |
| [`optout-webhook`](optout-webhook/) | inbound CM webhook (`Deactivate`) | **Opt the Passport user out** of email (CM → Passport) |

Install as many as you need — they're independent, and each targets its own
list (except `optout-webhook`, which is channel-wide). A typical setup is a
single list: `new-user` adds members, `new-subscriber` + `subscription-updated`
+ `subscription-canceled` keep the subscription custom fields current (CM
segments do the rest — paid, auto-renew off, expired, win-back), with
`user-email-opt-out` / `user-email-opt-in` / `optout-webhook` for two-way
consent sync and `user-deleted` for erasure.

## Shared requirements

**Secret** — every blueprint that calls the CM API uses the same one
(`optout-webhook` is inbound-only and needs none):

| Name | Value |
|---|---|
| `CM_API_KEY` | Your Campaign Monitor API key (Account settings → API keys) |

**Input** — each outbound blueprint takes a single `list_id`: the CM list to
act on. Find it in the CM UI under **Lists & Subscribers → (list) → Settings**,
or via `GET /api/v3.3/clients/{clientid}/lists.json`.

**Allowed HTTP hosts**

```
api.createsend.com
```

## Custom fields — read this first

> **Campaign Monitor silently drops custom fields that aren't already defined on
> the list.** The API still returns `201 Created`, so a subscriber appears with
> blank fields and nothing looks wrong.

Before enabling any of these blueprints, create every field they touch on the
target list under **Lists & Subscribers → (list) → Custom Fields**, matching
the **exact** key names below (the key is the personalization tag without
brackets). Date fields must be created with the **Date** type — the blueprints
send dates as `YYYY/MM/DD` to match; anything else CM drops silently.

### Field reference

| Field | CM type | Set by | Cleared by | Value |
|---|---|---|---|---|
| `InstanceName` | Text | `new-user`, `new-subscriber` | — | The Passport instance name |
| `PassportUserID` | Text | `new-user`, `new-subscriber` | — | The user's Passport ID |
| `CreatedAt` | **Date** | `new-user` | — | Account creation date |
| `PassportSubscriptionID` | Text | `new-subscriber` | `subscription-canceled` | The subscription's Passport ID |
| `PassportPlanID` | Text | `new-subscriber` | `subscription-canceled` | The plan's Passport ID |
| `SubscriptionInterval` | Text | `new-subscriber` | `subscription-canceled` | Billing interval (`month` / `year`) |
| `EndsAt` | **Date** | `new-subscriber` | `subscription-canceled` | Current period end |
| `EndsAtPretty` | Text | `new-subscriber` | `subscription-canceled` | Friendly form, e.g. `"in 48 weeks"` |
| `AutoRenew` | Text | `subscription-updated` | `subscription-canceled` | `"true"` / `"false"` |
| `SubscriptionCancelsAt` | **Date** | `subscription-updated` (when a cancellation is scheduled) | `subscription-updated` (when it isn't) | Scheduled cancellation date |
| `SubscriptionExpiredAt` | **Date** | `subscription-canceled` | — | When the subscription ended |
| *(operator-defined)* `opt_out_*` | Text | `preferences-updated` | — (set to `"false"` on opt back in) | `"true"` when opted out of that category on email |

"Cleared by" uses CM's `Clear: true` flag — the field is emptied, not the
subscriber removed. The lifecycle reads left to right: `new-user` establishes
the member, `new-subscriber` fills the subscription fields when they go paid,
`subscription-updated` keeps the renewal fields current, and
`subscription-canceled` clears everything subscription-scoped and stamps
`SubscriptionExpiredAt`.

Segments then derive membership from field state, e.g.:

- **Paid**: `[PassportPlanID]` is provided
- **Auto-renew off**: `[AutoRenew]` equals `false`
- **Cancels soon**: `[SubscriptionCancelsAt]` is in the next 30 days
- **Win-back**: `[SubscriptionExpiredAt]` is in the last 90 days

A field only needs to exist on the list if a blueprint you install touches it —
but since `subscription-canceled` clears fields that `new-subscriber` and
`subscription-updated` set, treat those three as one unit and create all of
their fields together. Drop any fields you don't want from the blueprint's
`custom_fields` block instead of leaving them undefined in CM.

## Resubscribe behavior

The [`cm/subscriber-add`](../../recipes/cm/subscriber-add/) recipe defaults to
`Resubscribe: true`: adding an email that previously unsubscribed from the
list reactivates them. The add blueprints fire on real consent-adjacent
signals — a verified signup (`new-user`), a new paid subscription
(`new-subscriber`), an explicit opt-in (`user-email-opt-in`) — so re-adding is
treated as re-consent. If you'd rather a previous unsubscribe always win on a
particular list, set `resubscribe: "false"` on that blueprint's add step; CM
then accepts the call but leaves the member unsubscribed.

Consent syncs **both ways**: `user-email-opt-out` pushes Passport opt-outs to
CM, [`optout-webhook`](optout-webhook/) pulls CM unsubscribes back into
Passport, and [`user-email-opt-in`](user-email-opt-in/) reactivates the CM
member when the user opts back in.

## Deleting vs unsubscribing

The removal blueprints deliberately use **two different CM operations**:

- **Unsubscribe** ([`cm/subscriber-unsubscribe`](../../recipes/cm/subscriber-unsubscribe/))
  records a **consent** state: the member stays on the list, suppressed, until
  something with fresh consent behind it re-adds them (see
  [Resubscribe behavior](#resubscribe-behavior)). Used by
  `user-email-opt-out` only.
- **Delete** ([`cm/subscriber-delete`](../../recipes/cm/subscriber-delete/))
  removes the list **membership** and the subscriber's record. Used by
  `user-deleted` (account erasure). Note that `subscription-canceled` does
  **neither** — a cancellation only clears the subscription custom fields and
  stamps `SubscriptionExpiredAt`; the user stays on the list.

Notes on both:

- Campaign Monitor returns **`400` with code `203`** ("Subscriber not in list or
  has already been removed") when the person isn't on the list. That's a
  harmless no-op, so these blueprints mark the step `continue-on-error: true`
  and the run still succeeds. You'll see the 400 in the run detail — it's
  expected, not a failure.
- Neither endpoint accepts custom fields — only the email address.

## Recipes used

- [`cm/subscriber-add`](../../recipes/cm/subscriber-add/) — add/update a subscriber
- [`cm/subscriber-unsubscribe`](../../recipes/cm/subscriber-unsubscribe/) — unsubscribe (consent)
- [`cm/subscriber-delete`](../../recipes/cm/subscriber-delete/) — delete (membership)
- Also available: [`cm/subscriber-get`](../../recipes/cm/subscriber-get/),
  [`cm/subscriber-update`](../../recipes/cm/subscriber-update/)
