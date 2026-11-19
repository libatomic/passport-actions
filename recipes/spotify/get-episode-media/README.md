# spotify/get-episode-media

Reads two things about an episode from the **Spotify Distribution API**
(Api-Version 2026-04-01), with one token exchange:

- `GET /episodes/{id}/latest-media` — the newest media submitted for the
  episode (by direct upload or by URL) and how far Spotify has got with it.
- `GET /episodes/{id}/availability` — whether Spotify is serving the episode,
  and what it serves.

Use it with [`spotify/get-episode-status`](../get-episode-status/): the
episode-level status can read `success` while the media is still processing
and nothing is being served.

## Usage

```yaml
- id: media
  includes: libatomic/passport-actions/recipes/spotify/get-episode-media
  with:
    client_id: ${{ inputs.spotify_client_id }}
    client_secret: ${{ secrets.SPOTIFY_CLIENT_SECRET }}
    episode_id: ${{ outputs.episode_id }}
```

## Inputs

| Input | Required | Description |
|---|---|---|
| `client_id` | yes | Spotify application client id |
| `client_secret` | yes | Spotify application client secret |
| `episode_id` | yes | Spotify episode id |
| `api_version` | no | `Api-Version` header, default `2026-04-01` |

## Outputs

| Path | Description |
|---|---|
| `steps.<id>.outputs.latest.outputs.body.latest_media` | `{media_id, content_type, submitted_at, status, failures[]}`; `status` is `processing` until Spotify accepts or rejects the file |
| `steps.<id>.outputs.availability.outputs.body.availability` | `{state, served_media_id, served_passthrough_url}`; `state` is `not_available` while nothing is served |

Both requests accept a 404 without failing the step, so read the bodies with
`?.`.
