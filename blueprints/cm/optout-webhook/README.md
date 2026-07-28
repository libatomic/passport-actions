# Opt-Out Webhook (Campaign Monitor)

The **inbound** half of the consent loop: when someone unsubscribes in Campaign
Monitor (e.g. clicks the unsubscribe link in a CM campaign), the matching
Passport user is **opted out of the email channel** too.

Pair it with [`user-email-opt-out`](../user-email-opt-out/) (the outbound half)
and an opt-out on either side is honored on both.

See the [Campaign Monitor overview](../README.md) for shared setup.

## When it fires

An inbound **webhook** from Campaign Monitor. CM batches events into one POST
(`{ ListID, Events: [...] }`); the trigger's `foreach: Events` runs each element
as its own run, filtered to `Type == "Deactivate" || Type == "Unsubscribe"`.

## What it does

| Step | Action | Purpose |
|---|---|---|
| `lookup` | `user.get` (`continue-on-error`) | Find the Passport user by email |
| `optout` | `user.update` | Set `preferences.channels.email.opt_out: true` |

Emails with no matching Passport user are skipped silently — people can be on
your CM list without being Passport users.

**No sync loop**: workflow runs are silent (events aren't re-queued), so the
`user.update` here does **not** fire `user.email.opt_out` /
`user.preferences.updated` workflows — the outbound opt-out blueprint won't
bounce this change back at CM.

## Setup

1. Import this blueprint and save — the workflow detail page shows the webhook
   URL (`/workflows/{id}/webhook/{token}`).
2. Create a webhook on the CM **list** pointing at that URL. CM has no UI for
   this; use the API:

   ```
   POST https://api.createsend.com/api/v3.3/lists/{listid}/webhooks.json
   Authorization: Basic <api key>
   Content-Type: application/json

   {
     "Events": ["Deactivate"],
     "Url": "<the webhook URL>",
     "PayloadFormat": "json"
   }
   ```

3. Repeat for each list you campaign against (all can share this one workflow —
   the opt-out is channel-wide, not per-list).

## Security

Campaign Monitor does **not** sign webhook payloads, so the trigger is
`validate: false` — a deliberate opt-out of signature verification. The token
in the URL is the sole authorization:

- Treat the webhook URL as a secret; revoke and re-mint the token if it leaks.
- Optionally add an `ip_allowlist` to the trigger for defense in depth.
- Worst case for a forged payload is an email opt-out (no data exposure), which
  the user can reverse in their preferences.

## Requirements

| What | Value |
|---|---|
| Secret | none (inbound only — no CM API calls) |
| Input | none (`opt_out` is channel-wide, not per-list) |
| Host | none (no outbound HTTP) |
