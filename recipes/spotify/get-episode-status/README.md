# Spotify — Get Episode Processing Status

Fetches the media processing status for an episode via the **Spotify
Distribution API**
(`GET https://distribution.spotify.com/episodes/{episode_id}/status`), pinned
to **Api-Version 2026-04-01**.

> Spotify's status reporting can lag: an episode may already be live before the
> status reflects `success`, and `failure_events` for new episodes may appear
> after a delay.

## Reference

```
libatomic/passport-actions/recipes/spotify/get-episode-status
```

## Inputs

| Input | Required | Default | Description |
|---|---|---|---|
| `api_version` | no | `2026-04-01` | CalVer `Api-Version` header sent to the API |
| `client_id` | yes | — | Spotify app client id |
| `client_secret` | yes | — | Spotify app client **secret** |
| `episode_id` | yes | — | Base-62 episode id (from `spotify:episode:<id>`) |

## Outputs

`steps.<id>.outputs.status.outputs.body.*`:

- `processing_status` — `success`, `pending`, `failed`, `removed`,
  `no_content`, or `unknown`
- `status_updated_at` — ISO8601 timestamp of the last status change
- `failure_events` — most recent first; each has `type` (`upload_failed`,
  `validation_failed`, `processing_failed`, `transcoding_failed`,
  `content_removed`), `occurred_at`, and an optional `details` object
  (`error_message`, `issues`, or `blocked_markets` depending on the type)
- `episode_uri` — the episode's Spotify URI

## Usage

```yaml
- id: check
  includes: libatomic/passport-actions/recipes/spotify/get-episode-status
  with:
    client_id: ${{ inputs.spotify_client_id }}
    client_secret: ${{ secrets.SPOTIFY_CLIENT_SECRET }}
    episode_id: ${{ inputs.episode_id }}

- id: alert-on-failure
  if: ${{ steps.check.outputs.status.outputs.body.processing_status == "failed" }}
  action: log
  with:
    message: "episode processing failed: ${{ toJSON(steps.check.outputs.status.outputs.body.failure_events) }}"
```

Both `accounts.spotify.com` and `distribution.spotify.com` must be on the
instance's HTTP allowlist.
