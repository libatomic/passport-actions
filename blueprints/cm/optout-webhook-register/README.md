# Register Opt-Out Webhook (Campaign Monitor)

One-time setup companion for the [Opt-Out Webhook](../optout-webhook/)
blueprint. Campaign Monitor has **no UI for list webhooks** — the only way to
register one is through the CM API. This workflow makes that a "Run Now" button
instead of a `curl` command.

## Setup

**Via the Campaign Monitor package (recommended):** nothing to do. The package
installer generates a webhook URL for the Opt-Out Webhook workflow it just
created, bakes it into this workflow's `webhook_url` input, and starts the
registration run automatically. Check this workflow's run history for the
result. For additional CM lists, run it again with a different List ID.

**Standalone install:**

1. Import the [Opt-Out Webhook](../optout-webhook/) blueprint and save it.
2. On that workflow's detail page, generate a webhook URL (Webhook URLs
   section) and copy it.
3. Import **this** blueprint, then run it manually with:
   - **List ID** — the CM list to watch
   - **Webhook URL** — the URL you copied in step 2
4. Repeat step 3 for each additional CM list.

The registration is idempotent: if the URL is already registered on the list,
the create call is skipped and the run logs "nothing to do" — re-running is
always safe.

## Actions

The `action` input selects what a run does:

- **`register`** (default) — register the webhook URL on the list (idempotent).
- **`unregister`** — remove it from the list (idempotent). The admin UI runs
  this automatically when the Opt-Out Webhook workflow is deleted, so CM stops
  posting to a dead URL — the pair cleans up after itself.
- **`list`** — log every webhook registered on the list (`WebhookID`, `Events`,
  `Url`, `Status`), for auditing what CM will actually send you. The webhook
  URL input isn't needed for this action.

## What it does

| Step | Purpose |
|---|---|
| `webhook` | Includes the [cm/webhook-register](../../../recipes/cm/webhook-register/) recipe: lists the CM list's existing webhooks, then registers or unregisters the URL per the `action` input. |
| `report-*` | Logs the outcome for the selected action (registered / already present, unregistered / wasn't registered, or the full webhook inventory). |

Two event types are registered, matching what the Opt-Out Webhook workflow
acts on: `Deactivate` (unsubscribes, spam complaints, hard bounces, and
deletes) and `Subscribe` (subscriber added, re-added, or restored — used to
opt the Passport user back in).

Note the register action is idempotent **by URL**: it will not change the
event set of a webhook that's already registered. If the URL was previously
registered with `Deactivate` only, run `action: unregister` then
`action: register` to pick up `Subscribe`.

## Requirements

| | |
|---|---|
| Secret | `CM_API_KEY` — Campaign Monitor API key |
| HTTP hosts | `api.createsend.com` must be on the instance's allowed hosts list |
| Trigger | Manual only ("Run Now") |
