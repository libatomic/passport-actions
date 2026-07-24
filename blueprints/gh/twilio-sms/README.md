# Twilio SMS Alert (GitHub Action)

Sends an SMS via Twilio when a subscription is canceled — an operational alert
to a fixed number (not to the customer).

Uses the published GitHub Action `twilio-labs/actions-sms@2.0.0`. See the
[GitHub Action blueprints overview](../README.md) for how `uses:` steps work.

## When it fires

`user.subscription.status.canceled`.

## What it does

| Step | Action | Purpose |
|---|---|---|
| `send-sms` | `twilio-labs/actions-sms@2.0.0` | Send the alert |

## Requirements

**Secrets**

| Name | Value |
|---|---|
| `TWILIO_ACCOUNT_SID` | Your Twilio Account SID (`AC…`) |
| `TWILIO_AUTH_TOKEN` | The matching auth token |

**Inputs**

| Input | Required | Description |
|---|---|---|
| `from_number` | yes | A Twilio number in your account, E.164 (e.g. `+15551230000`) |
| `to_number` | yes | Destination number to alert, E.164 |

Both numbers must be **E.164** (leading `+`, country code, no spaces or dashes).

## Setup

1. Copy the Account SID and auth token from the Twilio console into secrets.
2. Confirm `from_number` is a number you own in that account and is SMS-capable.
3. On a Twilio **trial** account, `to_number` must be a *verified* number.
4. Install the blueprint, set both numbers, save, and **enable**.

## Customizing

- **Message customer instead of ops** — load the user with `user.get` and send to
  their phone. For that, prefer the built-in **`sendsms`** action: it uses the
  instance's messaging config, honors the user's SMS preferences and opt-outs,
  and records delivery — none of which this Action does.
- **Other alerts** — repoint the trigger at `job.failed` or `charge.failed`.
