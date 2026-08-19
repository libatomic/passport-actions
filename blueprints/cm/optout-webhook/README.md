# Opt-Out Webhook (Campaign Monitor)

Inbound webhook from Campaign Monitor: when a subscriber unsubscribes (or is
otherwise deactivated) in CM, the matching Passport user is opted out of the
email channel so both systems agree.

This is the **inbound half** of the consent loop:

- [user-email-opt-out](../user-email-opt-out/) / [user-email-opt-in](../user-email-opt-in/)
  push Passport preference changes **to** CM.
- This blueprint pulls CM unsubscribes **back into** Passport.

## When it fires

Campaign Monitor sends one `Deactivate` event whenever a subscriber becomes
inactive on the list — that single event type covers:

- **unsubscribes** (`State: "Unsubscribed"`)
- **spam complaints** (`State: "Unconfirmed"` / complaint states)
- **hard bounces / deletions** (`State: "Deleted"`)

All of them mean "stop emailing this address", so the workflow opts the user
out for any `Deactivate` regardless of `State`.

CM batches events into a single POST:

```json
{
  "ListID": "...",
  "Events": [
    { "Type": "Deactivate", "EmailAddress": "a@example.com", "State": "Unsubscribed", ... },
    { "Type": "Deactivate", "EmailAddress": "b@example.com", "State": "Deleted", ... }
  ]
}
```

`foreach: Events` fans each element out as its own run, so one bad element
doesn't block the rest, and the trigger `if` filters to `Deactivate` events.

## What it does

| Step | Action | Purpose |
|---|---|---|
| `lookup` | `user.get` | Find the Passport user by the event's `EmailAddress`. `continue-on-error` — addresses that only exist in CM are skipped. Publishes the user's current channel preferences as `outputs.channels`. |
| `optout` | `user.update` | Sends the user's **entire** channel-preferences structure back with only `email.opt_out` flipped to `true`. |

### Why the preferences round-trip

`user.update` **replaces** the whole `preferences` object — there is no
server-side merge. Sending just `{channels: {email: {opt_out: true}}}` would
wipe the user's SMS opt-out, alternate email address, custom channels, and
everything else. So the workflow does the read-modify-write itself:

1. `user.get` already loads the user's full preferences; the `lookup` step
   publishes them via `outputs.channels`. The `fromJSON(toJSON(...))` round-trip
   normalizes the structure to plain maps — never-configured channels come back
   as typed values that `merge()` can't consume directly.
2. `optout` rebuilds the channels map with `merge()` (first-wins): the
   `{opt_out: true}` literal overrides that one flag, and every other email
   setting and every other channel is carried over from the lookup unchanged.

### No sync loop

Workflow runs are silent: actions executed inside a workflow do not re-fire
event triggers. The `user.update` here does **not** trigger
`user.preferences.updated` workflows, so the opt-out is not pushed back to CM
(where the subscriber is already inactive anyway).

## Setup

**Via the Campaign Monitor package (recommended):** fully automatic. The
package installer generates this workflow's webhook URL, feeds it to the
[optout-webhook-register](../optout-webhook-register/) companion, and runs the
registration against the CM list — no copying, no curl. Deleting this workflow
from the admin UI is symmetric: the companion is run with `action: unregister`
first, so CM stops posting to the dead URL.

**Standalone install:**

1. Import this blueprint and save the workflow.
2. On the workflow detail page, generate a webhook URL (Webhook URLs section)
   and copy it.
3. Register it on the CM list with the
   [optout-webhook-register](../optout-webhook-register/) companion blueprint —
   CM has no UI for list webhooks. Alternatively, call the CM API yourself:

```bash
curl -u "<api key>:x" \
  -H "Content-Type: application/json" \
  -d '{"Events":["Deactivate"],"Url":"<webhook url>","PayloadFormat":"json"}' \
  https://api.createsend.com/api/v3.3/lists/<list id>/webhooks.json
```

## Security

Campaign Monitor does not sign webhook payloads, so the trigger sets
`validate: false`. The random token in the webhook URL is the sole
authorization — **treat the URL as a secret**. For defense in depth you can add
an `ip_allowlist` to the trigger with CM's sending IPs.

## Requirements

None — no secrets, no inputs, no outbound HTTP. The registration companion is
the piece that needs the `CM_API_KEY` secret.
