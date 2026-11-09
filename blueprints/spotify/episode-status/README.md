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

This is the reference implementation of the admin's **channel status
contract** (see `docs/DISTRO.md`, *Destination status*): the Spotify shape is
normalized so the admin never has to know Spotify.

| Output | Description |
|---|---|
| `episode_id` / `episode_uri` | The episode, from the distribution's context |
| `spotify_status` | Spotify's raw `processing_status` |
| `status` | Contract status: `success`, `pending`, `failed`, `removed` (`no_content`/`unknown` → `pending`) |
| `status_updated_at` | When Spotify last updated the status |
| `failures` | `[{type, occurred_at, messages: [..]}]` — each Spotify failure event's `error_message` or `issues[]` as its messages |

The result is also written to the distribution's `context` as
`channel_status`, `channel_status_updated_at`, `channel_failures` and
`channel_status_checked_at`, so the admin shows the last known state without
re-running the check and lists a `failed` episode as **Error**. A failed
episode is fixed by either deleting the distribution (which removes the
episode from Spotify) or correcting the media and publishing again (which
updates the episode in place). This blueprint attaches itself to the channel
with its top-level `channel: spotify` (recorded as
`metadata.channel_status_for` on install); the channel workflow only has to
record `context.channel_link` on publish.

`distribution_id` is a **run-time** input (`runtime: true`): the installer does
not ask for it; the admin panel or the run form supplies it.

Spotify's status can lag: an episode may be playable before the status reads
`success`, and failure events can appear after a delay.
