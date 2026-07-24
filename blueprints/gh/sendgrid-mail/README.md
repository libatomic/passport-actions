# SendGrid Email (GitHub Action)

Sends an email through SendGrid when a user is created — an example of using an
external ESP for a transactional message.

Uses the published GitHub Action `mmichailidis/sendgrid-mail-action@v1.2`. See
the [GitHub Action blueprints overview](../README.md) for how `uses:` steps work.

## When it fires

`user.created`.

## What it does

| Step | Action | Purpose |
|---|---|---|
| `load-user` | `user.get` | Load the new user's email address |
| `send-mail` | `mmichailidis/sendgrid-mail-action@v1.2` | Send via SendGrid |

## Requirements

**Secret**

| Name | Value |
|---|---|
| `SENDGRID_API_KEY` | A SendGrid API key with **Mail Send** permission |

**Inputs**

| Input | Required | Default | Description |
|---|---|---|---|
| `from` | yes | — | A **verified** SendGrid sender address |
| `subject` | no | `Welcome` | Email subject |

The `from` address must pass SendGrid's Sender Verification (or belong to an
authenticated domain), or sends are rejected.

## Consider `sendmail` instead

Passport's built-in **`sendmail`** action is the better default: it renders your
templates, honors per-user email preferences and opt-outs, respects the
approved-sender policy, and records delivery stats and bounces. Use this
blueprint when you specifically need mail to originate from SendGrid — for
example to keep a separate sending reputation or reuse SendGrid templates.

## Setup

1. Create a SendGrid API key with Mail Send and store it as `SENDGRID_API_KEY`.
2. Verify the sender address (or authenticate its domain) in SendGrid.
3. Install the blueprint, set `from` and `subject`, save, and **enable**.

## Customizing

- **Body/template** — edit the step's `with:` to send HTML or a SendGrid
  template id with dynamic data.
- **Other triggers** — any event works; load whatever you need with `user.get`
  or `subscription.get` first.
