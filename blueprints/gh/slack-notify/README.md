# Slack Notification (GitHub Action)

Posts a Slack message when a distribution is published — a lightweight "we just
shipped" notice for your team channel.

Uses the published GitHub Action `slackapi/slack-github-action@v2`. See the
[GitHub Action blueprints overview](../README.md) for how `uses:` steps work.

## When it fires

`distribution.published` — emitted once per published distribution (email, RSS,
podcast, or a custom channel).

## What it does

| Step | Action | Purpose |
|---|---|---|
| `notify` | `slackapi/slack-github-action@v2` | `chat.postMessage` to your channel |

The message includes the distribution id and channel from the event body.

## Requirements

**Secret**

| Name | Value |
|---|---|
| `SLACK_BOT_TOKEN` | A Slack **bot** token (`xoxb-…`) with `chat:write` |

**Input**

| Input | Required | Description |
|---|---|---|
| `channel` | yes | Slack channel **id**, e.g. `C0123456789` (not `#general`) |

## Setup

1. Create a Slack app, add the **`chat:write`** bot scope, install it to your
   workspace, and copy the bot token (`xoxb-…`) into `SLACK_BOT_TOKEN`.
2. **Invite the bot to the channel** — `/invite @YourApp`. Posting to a channel
   the bot isn't in fails with `not_in_channel`.
3. Get the channel id: channel name → **View channel details** → the id at the
   bottom.
4. Install the blueprint, set `channel`, save, and **enable**.

## Customizing

- **Richer messages** — swap the text for Block Kit blocks in the step's `with:`.
- **Other events** — point the trigger at `job.failed`, `charge.failed`, or any
  event you want to be paged on.
- **Filter the noise** — add a trigger `if:` such as
  `body.channel == "email"` to notify only for certain channels.
