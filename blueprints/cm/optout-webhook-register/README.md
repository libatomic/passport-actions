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

## What it does

| Step | Purpose |
|---|---|
| `webhook` | Includes the [cm/webhook-register](../../../recipes/cm/webhook-register/) recipe: lists the CM list's existing webhooks, and registers the URL for `Deactivate` events if not already present. |
| `report` | Logs whether the webhook was registered or already present. |

`Deactivate` is the only event type registered — it's what CM fires for
unsubscribes, spam complaints, and hard bounces, and it's the only type the
Opt-Out Webhook workflow acts on.

## Requirements

| | |
|---|---|
| Secret | `CM_API_KEY` — Campaign Monitor API key |
| HTTP hosts | `api.createsend.com` must be on the instance's allowed hosts list |
| Trigger | Manual only ("Run Now") |
