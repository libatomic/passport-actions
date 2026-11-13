# Spotify — Delete Episode

Deletes an episode via the **Spotify Distribution API**
(`DELETE https://distribution.spotify.com/episodes/{episode_id}`), pinned to
**Api-Version 2026-04-01**. Succeeds with **204 No Content** — there is no
response body.

A **404** also succeeds: the episode is already gone from Spotify, which is the
state the caller asked for, so a delete can be run again safely. To tell the two
apart, read `steps.<id>.outputs.episode.outputs.status` (`204` or `404`).

## Reference

```
libatomic/passport-actions/recipes/spotify/delete-episode
```

## Inputs

| Input | Required | Default | Description |
|---|---|---|---|
| `api_version` | no | `2026-04-01` | CalVer `Api-Version` header sent to the API |
| `client_id` | yes | — | Spotify app client id |
| `client_secret` | yes | — | Spotify app client **secret** |
| `episode_id` | yes | — | Base-62 episode id (from `spotify:episode:<id>`) |

## Usage

```yaml
- id: remove
  includes: libatomic/passport-actions/recipes/spotify/delete-episode
  with:
    client_id: ${{ inputs.spotify_client_id }}
    client_secret: ${{ secrets.SPOTIFY_CLIENT_SECRET }}
    episode_id: ${{ inputs.episode_id }}
```

Both `accounts.spotify.com` and `distribution.spotify.com` must be on the
instance's HTTP allowlist.
