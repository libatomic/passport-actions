# Campaign Monitor blueprints

Keep a Campaign Monitor list in sync with Passport's subscriber lifecycle. Each
blueprint here reacts to one Passport event and adds, updates or removes a
subscriber on a CM list.

| Blueprint | Fires on | Effect on the list |
|---|---|---|
| [`new-user`](new-user/) | `user.created` | **Add** every new user |
| [`new-subscriber`](new-subscriber/) | `user.subscription.status.active` | **Add** paid, plan-backed subscribers |
| [`subscription-expiring`](subscription-expiring/) | `user.subscription.expiring` | **Add** soon-to-lapse subscribers (win-back list) |
| [`subscription-canceled`](subscription-canceled/) | `user.subscription.status.canceled` | **Remove** canceled subscribers |
| [`user-email-opt-out`](user-email-opt-out/) | `user.email.opt_out` | **Remove** users who opted out |

Install as many as you need — they're independent, and each targets its own
list. A typical setup is one list for all users (`new-user`), one for paid
subscribers (`new-subscriber` + `subscription-canceled`), and optionally a
win-back list (`subscription-expiring`).

## Shared requirements

**Secret** — all five use the same one:

| Name | Value |
|---|---|
| `CM_API_KEY` | Your Campaign Monitor API key (Account settings → API keys) |

**Input** — each blueprint takes a single `list_id`: the CM list to act on. Find
it in the CM UI under **Lists & Subscribers → (list) → Settings**, or via
`GET /api/v3.3/clients/{clientid}/lists.json`.

**Allowed HTTP hosts**

```
api.createsend.com
```

## Custom fields — read this first

The add/update blueprints send **custom fields** (`InstanceName`,
`PassportUserID`, `PassportSubscriptionID`, `PassportPlanID`,
`SubscriptionInterval`, `EndsAt`, `EndsAtPretty`, `Reason`) so you can segment
in CM on Passport data.

> **Campaign Monitor silently drops custom fields that aren't already defined on
> the list.** The API still returns `201 Created`, so a subscriber appears with
> blank fields and nothing looks wrong.

Before enabling, create each field on the target list under **Lists &
Subscribers → (list) → Custom Fields**, matching the **exact** key names above
(and choosing a Date type for `EndsAt`). Drop any fields you don't want from the
blueprint's `custom_fields` block instead of leaving them undefined in CM.

## Removing vs unsubscribing

`subscription-canceled` and `user-email-opt-out` use the
[`cm/subscriber-unsubscribe`](../../recipes/cm/subscriber-unsubscribe/) recipe,
which calls CM's unsubscribe endpoint. Note:

- Campaign Monitor returns **`400` with code `203`** ("Subscriber not in list or
  has already been removed") when the person isn't on the list. That's a
  harmless no-op, so these blueprints mark the step `continue-on-error: true`
  and the run still succeeds. You'll see the 400 in the run detail — it's
  expected, not a failure.
- Unsubscribe **cannot** set custom fields; CM's unsubscribe endpoint accepts
  only the email address.

## Recipes used

- [`cm/subscriber-add`](../../recipes/cm/subscriber-add/) — add/update a subscriber
- [`cm/subscriber-unsubscribe`](../../recipes/cm/subscriber-unsubscribe/) — unsubscribe
- Also available: [`cm/subscriber-get`](../../recipes/cm/subscriber-get/),
  [`cm/subscriber-update`](../../recipes/cm/subscriber-update/)
