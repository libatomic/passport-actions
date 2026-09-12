# Spotify — Create Episode

Publishes an episode to a Spotify show via the **Distribution API**
(`POST https://distribution.spotify.com/shows/{show_id}/episodes`), pinned to
**Api-Version 2026-04-01**.

> The Distribution API is private documentation and requires an agreement with
> Spotify for the license, distribution and monetization of content. The API
> uses CalVer versioning via the `Api-Version` header — Spotify resolves the
> header to the latest version on or before that date; without the header, the
> API defaults to the version current when your credentials were issued.

## Reference

```
libatomic/passport-actions/recipes/spotify/create-episode
```

## Inputs

| Input | Required | Default | Description |
|---|---|---|---|
| `api_version` | no | `2026-04-01` | CalVer `Api-Version` header sent to the API |
| `client_id` | yes | — | Spotify app client id |
| `client_secret` | yes | — | Spotify app client **secret** |
| `show_id` | yes | — | Base-62 show id (from `spotify:show:<id>`) |
| `title` | yes | — | Episode name |
| `pubdate` | yes | — | ISO8601 publish date |
| `media_file_url` | yes | — | Public URL to MP3/M4A/MP4/MOV media |
| `content_rating` | yes | `unspecified` | `unspecified` or `eighteen_plus` |
| `guid` | yes | — | Stable unique id — use the distribution id |
| `explicit` | no | `no` | `no`, `yes`, or `clean` |
| `summary` | no | `""` | Plain text or HTML |
| `link` | no | `""` | Episode webpage; omitted from the request when empty |
| `image_file_url` | no | `""` | Episode art (3000x3000 JPEG/PNG); omitted when empty |
| `episode_type` | no | `full` | `full`, `bonus`, or `trailer` |
| `episode_number` | no | `""` | Integer; sent as a number, omitted when empty (Spotify then orders by publish date) |
| `season_number` | no | `""` | Integer; sent as a number, omitted when empty |
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

A **403** from the episode step means Spotify rejected the bearer token for the
Distribution API (the token exchange itself succeeded). Spotify's spec maps that
to "Invalid or missing authorization token" — typically the Client ID is not
allow-listed for distribution, or the `show_id` is not owned by that app.
Contact your Spotify partner manager. The job error now includes Spotify's
response body so you can tell those cases apart from a payload problem.

## Outputs

Step outputs are available at `steps.<id>.outputs.episode.outputs.body.*` and
include `episode_id`, `episode_uri`, `guid`, `created_at`, `updated_at`, and
the echoed episode fields. The response also carries an `Api-Version` header
confirming which API version served the request.

## Usage

```yaml
- id: publish
  includes: libatomic/passport-actions/recipes/spotify/create-episode@spotify
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
