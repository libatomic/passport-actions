# Spotify — Episode Status

A manual workflow that reports Spotify's **processing status** for an episode
published by the Spotify channel, with the failure events and reasons when
processing did not succeed.

Built on the [`spotify/get-episode-status`](../../../recipes/spotify/get-episode-status/)
recipe. Installed by the `spotify` package alongside the channel workflow.

## How it is used

- **From the admin.** A Spotify-channel distribution shows a *Spotify episode*
  panel below its editor once it has been published. *Check status* runs this
  workflow with the distribution's id, waits for the run, and renders the
  result: the status, when Spotify last updated it, and each failure event.
- **Manually.** Run it from the Workflows page with a distribution id.

## Inputs

| Input | Required | Description |
|---|---|---|
| `spotify_client_id` | yes | Spotify application client id (workflow default, set at install) |
| `distribution_id` | yes | The Spotify-channel distribution to check |

The episode id is not an input: the channel workflow records it on the
distribution as `context.spotify_episode_id` when it publishes, and this
workflow reads it from there. A distribution that has not been published to
Spotify exits cleanly with a reason.

## Outputs

Read from the run's `outputs`:

| Output | Description |
|---|---|
| `episode_id` / `episode_uri` | The episode, from the distribution's context |
| `processing_status` | `success`, `pending`, `failed`, `removed`, `no_content`, `unknown` |
| `status_updated_at` | When Spotify last updated the status |
| `failure_events` | Most recent first; each has `type`, `occurred_at`, and `details` (`error_message` or `issues[]`) |

Spotify's status can lag: an episode may be playable before the status reads
`success`, and failure events can appear after a delay.
