# Spotify — Episode Upload

A manual workflow that lets the Spotify channel's distribution form upload an
episode's media **from the browser straight to Spotify**, so the file is never
stored in Passport. Installed by the `spotify` package alongside the channel
workflow, [`spotify/create-episode`](../create-episode/), which names it in its
trigger (`ui: {upload: {workflow: spotify-episode-upload}}`).

It is the reference implementation of the admin's direct-upload contract (see
[AUTHORING.md](../../../AUTHORING.md#direct-media-upload)). It needs no
platform support beyond running a manual workflow.

Your Spotify organization must be enabled for direct upload
(`POST /episodes/{id}/media` answers 403 until it is).

## How it is used

The distribution form runs it with `inputs`; it is not meant to be run by hand.

| `action` | When | What it does |
|---|---|---|
| `start` (default) | A media file is chosen | Creates the episode as a hidden draft if the distribution has none (`pubdate` 2099-01-01, no entitlements), opens an upload session (recipe [`spotify/create-media-upload`](../../../recipes/spotify/create-media-upload/)), records the episode and `context.channel_upload` (`status: pending`), returns `upload_url` |
| `finish` | The browser has sent the file | Sets `channel_upload.status` to `uploaded`; Publish is enabled from then on |
| `discard` | A never-published distribution is about to be deleted | Deletes the draft episode from Spotify and clears the context keys |

Any distribution that is not on the `spotify` channel is refused.

## Inputs

| Input | Required | Description |
|---|---|---|
| `spotify_client_id` | yes | Spotify application client id (set at install) |
| `spotify_show_id` | yes | Show the draft episode is created on (set at install) |
| `content_rating`, `explicit`, `episode_type` | no | Used when the draft episode is created; same meaning as on the channel workflow |
| `distribution_id` | yes | Run-time: the Spotify-channel distribution |
| `action` | no | Run-time: `start`, `finish` or `discard` |
| `content_type`, `filename`, `size` | start | Run-time: the chosen file |

The settings inputs share their keys with the channel workflow, so the
package's settings page fills both.

## Outputs

| Output | Action | Description |
|---|---|---|
| `upload_url` | start | The resumable upload session the browser sends the file to |
| `upload_id`, `upload_expires_at` | start | Spotify's media id for the upload, and when the session expires (7 days) |
| `status` | finish, discard | `uploaded` or `discarded` |

## Context keys

Written to the distribution: `spotify_episode_id`, `spotify_show_id`,
`channel_link`, and `channel_upload` (`{id, filename, content_type, size,
status, requested_at, uploaded_at}`). The channel workflow reads
`spotify_episode_id` (to update rather than create) and
`channel_upload.status` (to publish without a Passport asset).

## Things to know

- **The draft episode needs a media URL.** Spotify refuses to create an episode
  without one (422 "Passthrough url must be provided"), so the draft is created
  with a placeholder on this instance (`/spotify-upload-pending.mp3`) that
  serves no media. Spotify logs one failed fetch for it; the upload replaces it.
- **The upload URL is a bearer address.** Anyone holding it can upload to the
  episode for 7 days. It is returned as a run output, so it is stored with the
  run; it is never written to the distribution.
- **Drafts deleted outside the form.** The platform runs the channel
  workflow's delete only for a distribution that has been published. The form
  runs `discard` first for a draft; a draft deleted through the API or CLI
  leaves its hidden episode on Spotify.

## Requirements

The `SPOTIFY_CLIENT_SECRET` secret; `accounts.spotify.com` and
`distribution.spotify.com` on the instance's HTTP allowlist.
