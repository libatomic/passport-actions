# Spotify — Create Episode

Publishes an episode to a Spotify show via the **SOA Video Distribution API**
(`POST https://distribution.spotify.com/shows/{show_id}/episodes`).

> The SOA Video Distribution API is a pre-release beta and requires an agreement
> with Spotify for the license, distribution and monetization of content. Expect
> occasional breaking changes.

## Reference

```
libatomic/passport-actions/recipes/spotify/create-episode
```

## Inputs

| Input | Required | Default | Description |
|---|---|---|---|
| `client_id` | yes | — | Spotify app client id |
| `client_secret` | yes | — | Spotify app client **secret** |
| `show_id` | yes | — | Base-62 show id (from `spotify:show:<id>`) |
| `title` | yes | — | Episode name |
| `pubdate` | yes | — | ISO8601 publish date |
| `media_file_url` | yes | — | Public URL to MP3/M4A/MP4/MOV media |
| `content_rating` | yes | `unspecified` | `unspecified` or `eighteen_plus` |
| `explicit` | no | `no` | `no`, `yes`, or `clean` |
| `summary` | no | `""` | Plain text or HTML |
| `guid` | no | `""` | Stable unique id — use the distribution id |
| `link` | no | `""` | Episode webpage |
| `image_file_url` | no | `""` | Episode art (3000x3000 JPEG/PNG) |
| `episode_type` | no | `full` | `full`, `bonus`, or `trailer` |
| `episode_number` | no | `""` | Optional; omit to order by publish date |
| `season_number` | no | `""` | Optional |
| `entitlements` | no | `[]` | Open Access entitlement ids (category slugs) |

## Auth — client credentials

The recipe performs the OAuth2 **client-credentials** exchange itself: step
`token` posts to `https://accounts.spotify.com/api/token` with HTTP Basic auth
(`base64(client_id:client_secret)`) and `grant_type=client_credentials`, then
step `episode` uses the resulting bearer token. You only supply the id/secret —
store the secret as `SPOTIFY_CLIENT_SECRET`.

## Entitlements — gating with Open Access

`entitlements` is an array of [Spotify Open Access](https://developer.spotify.com/documentation/open-access/concepts#entitlements)
identifiers. In a Passport distribution workflow these come from the
**audience's categories**: call the `audience.get` builtin and pass its
`category_slugs` output. That is why the Spotify channel requires an audience
even though it publishes once (broadcast) — the audience defines who can play
the episode, not who receives it.

## Media

`media_file_url` must be a public URL Spotify can fetch. In a distribution
workflow, resolve it from the distribution's enclosure asset with
`asset.get` (`link: true`) and use `asset.link`. MP4/MOV are published as video;
MP3/M4A as audio.

Both `accounts.spotify.com` and `distribution.spotify.com` must be on the
instance's HTTP allowlist (Workflows → Settings → Allowed HTTP hosts).

## Outputs

Step outputs are available at `steps.<id>.outputs.episode.outputs.body.*` and
include `episode_uri`, `guid`, `created_at`, and the echoed episode fields.

## Usage

```yaml
- id: publish
  includes: libatomic/passport-actions/recipes/spotify/create-episode
  with:
    client_id: ${{ inputs.spotify_client_id }}
    client_secret: ${{ secrets.SPOTIFY_CLIENT_SECRET }}
    show_id: ${{ inputs.spotify_show_id }}
    title: ${{ steps.load.outputs.distribution.title }}
    pubdate: ${{ steps.load.outputs.distribution.published_at }}
    media_file_url: ${{ steps.media.outputs.asset.link }}
    summary: ${{ steps.render.outputs.body }}
    guid: ${{ trigger.distribution_id }}
    entitlements: ${{ steps.audience.outputs.category_slugs }}
```

See `blueprints/spotify/create-episode` for the complete distribution-channel
workflow, and `recipes/spotify/update-episode` for backfilling video onto an
existing audio episode.
