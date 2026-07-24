# Spotify Episode (Distribution)

Defines a custom **`spotify` distribution channel** that publishes episodes to a
Spotify show via the **SOA Video Distribution API**. Once installed and enabled,
"Spotify" appears in an article's **Add Distribution** menu next to Email, RSS
and Podcast.

> The SOA Video Distribution API is a **pre-release beta** and requires an
> agreement with Spotify covering the license, distribution and monetization of
> your content. Expect occasional breaking changes.

Built on the [`spotify/create-episode`](../../../recipes/spotify/create-episode/)
recipe.

## What it does

Publishing a distribution to the `spotify` channel runs this workflow once
(broadcast):

| Step | Action | Purpose |
|---|---|---|
| `load` | `distribution.get` | Load the episode metadata the editor collected |
| `render` | `distribution.render` | Render the template into the episode summary |
| `media` | `asset.get` (`link: true`) | Resolve the enclosure asset to a public URL |
| `audience` | `audience.get` | Read the audience's category slugs |
| `publish` | recipe `spotify/create-episode` | `POST /shows/{show_id}/episodes` |

Field mapping:

| Spotify field | Comes from |
|---|---|
| `title` | `distribution.title` |
| `pubdate` | `distribution.published_at` |
| `summary` | the rendered template body |
| `media_file_url` | the enclosure asset's public URL |
| `guid` | `trigger.distribution_id` (stable across re-publishes) |
| `entitlements` | the audience's `category_slugs` |
| `content_rating` / `explicit` / `episode_type` | blueprint inputs |

## The channel

```yaml
on:
  - distribution:
      channel: spotify
      label: Spotify
      mode: broadcast
      base_type: podcast
      content_type: html
      requires_audience: true
```

**`base_type: podcast`** — the Add Distribution editor shows the familiar
podcast form (title, summary, and an **audio/video file picker**) rather than a
plain body box. The chosen media file arrives on the distribution as `asset_id`.

**`requires_audience: true` on a broadcast channel** — this is the unusual bit.
The episode is posted **once**, not per member, but you must still select an
audience: Spotify Open Access gates playback by **entitlements**, and this
workflow passes the audience's category slugs as those entitlements. The
audience decides *who can play the episode*, not who receives it. An audience
with no category filter publishes an ungated episode.

This lines up with Passport's existing Spotify Open Access integration, which
syncs each user's entitlements using the same category slugs — so the episode's
entitlements and the listener's entitlements share one namespace.

## Requirements

**Secret**

| Name | Value |
|---|---|
| `SPOTIFY_CLIENT_SECRET` | Your Spotify application's client secret |

**Inputs**

| Input | Required | Default | Description |
|---|---|---|---|
| `spotify_client_id` | yes | — | Spotify application client id |
| `spotify_show_id` | yes | — | Base-62 show id from `spotify:show:<id>` (not the full URI) |
| `content_rating` | no | `unspecified` | `unspecified`, or `eighteen_plus` for 18+ video |
| `explicit` | no | `no` | `no`, `yes`, or `clean` |
| `episode_type` | no | `full` | `full`, `bonus`, or `trailer` |

**Allowed HTTP hosts** (Workflows → Settings → Allowed HTTP hosts)

```
accounts.spotify.com
distribution.spotify.com
```

**Media** — assets must be `audio/mpeg` or `video/mp4`; MP4/MOV are published as
video. The asset URL must be publicly reachable by Spotify.

## Setup

1. Install the blueprint and fill in the client id and show id.
2. Add the `SPOTIFY_CLIENT_SECRET` secret.
3. Add both Spotify hosts to the allowlist.
4. Save, then **enable** the workflow — this registers the channel.
5. On an article: **Add distribution → Spotify**, choose the audience whose
   categories should gate playback, upload/select the media file, pick a
   template, then publish.

## Authentication

The recipe performs the OAuth2 **client-credentials** exchange itself — HTTP
Basic auth with `base64(client_id:client_secret)` against
`accounts.spotify.com/api/token` — and uses the resulting bearer token for the
episode call. You never manage a token by hand.

## Customizing

- **Season/episode numbers** — unset by default so Spotify orders by publish
  date. Add `episode_number` / `season_number` to the `publish` step to set them.
- **Episode art** — pass `image_file_url` to the recipe (e.g. from a second
  `asset.get`).
- **Updating an episode** — use the
  [`spotify/update-episode`](../../../recipes/spotify/update-episode/) recipe;
  it's the endpoint for backfilling a video file onto an existing audio episode.
- **Show management** — `spotify/create-show` and `spotify/get-show` recipes are
  available for use in their own workflows.
