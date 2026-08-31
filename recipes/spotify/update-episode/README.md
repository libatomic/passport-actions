# Spotify — Update Episode

Updates an existing episode via the **Spotify Distribution API**
(`PUT https://distribution.spotify.com/episodes/{episode_id}`), pinned to
**Api-Version 2026-04-01**.

The update is a **partial write**: every body field is optional and the recipe
sends only the inputs you provide — empty inputs are omitted from the request
entirely (including `entitlements`, so an update without them doesn't clear the
episode's Open Access gating). `episode_number` / `season_number` are sent as
integers.

Primary use case: **backfilling video** onto an existing audio episode by
setting `media_file_url` to an MP4/MOV URL.

## Reference

```
libatomic/passport-actions/recipes/spotify/update-episode
```

## Inputs

| Input | Required | Default | Description |
|---|---|---|---|
| `api_version` | no | `2026-04-01` | CalVer `Api-Version` header sent to the API |
| `client_id` | yes | — | Spotify app client id |
| `client_secret` | yes | — | Spotify app client **secret** |
| `episode_id` | yes | — | Base-62 episode id (from `spotify:episode:<id>`) |
| `media_file_url` | no | `""` | New media URL (MP4/MOV publish as video) |
| `title`, `pubdate`, `summary`, `link`, `image_file_url` | no | `""` | Sent only when set |
| `explicit` | no | `""` | `no`, `yes`, or `clean` |
| `content_rating` | no | `""` | `unspecified` or `eighteen_plus` |
| `episode_type` | no | `""` | `full`, `bonus`, or `trailer` |
| `episode_number`, `season_number` | no | `""` | Integers; sent as numbers, omitted when empty |
| `entitlements` | no | `[]` | Open Access entitlement ids; omitted when empty |

## Outputs

The full updated episode is returned:
`steps.<id>.outputs.episode.outputs.body.*` (`episode_id`, `episode_uri`,
`updated_at`, and the echoed fields).

## Usage

```yaml
- id: backfill-video
  includes: libatomic/passport-actions/recipes/spotify/update-episode
  with:
    client_id: ${{ inputs.spotify_client_id }}
    client_secret: ${{ secrets.SPOTIFY_CLIENT_SECRET }}
    episode_id: ${{ inputs.episode_id }}
    media_file_url: ${{ steps.media.outputs.asset.link }}
```

Both `accounts.spotify.com` and `distribution.spotify.com` must be on the
instance's HTTP allowlist. See `recipes/spotify/get-episode-status` to poll
media processing after an update.
