# Spotify Episode (Distribution)

Defines a custom **`spotify` distribution channel** that publishes episodes to a
Spotify show via the **Spotify Distribution API** (Api-Version 2026-04-01). Once installed and enabled,
"Spotify" appears in an article's **Add Distribution** menu next to Email, RSS
and Podcast.

> The Spotify Distribution API is private documentation and requires an
> agreement with Spotify covering the license, distribution and monetization of
> your content. Expect occasional breaking changes.

Built on the [`spotify/create-episode`](../../../recipes/spotify/create-episode/),
[`spotify/update-episode`](../../../recipes/spotify/update-episode/) and
[`spotify/delete-episode`](../../../recipes/spotify/delete-episode/) recipes. The
`includes:` refs are pinned `@spotify` until those recipes are on the default
branch — unpinned includes fetch GitHub `HEAD` (`master`).

## What it does

The workflow owns the whole life of the episode. Every run is told why it is
running through `trigger.action`:

| `trigger.action` | Triggered by | Result |
|---|---|---|
| `publish` | first **Publish Now** / scheduled publish | `POST /shows/{show_id}/episodes`; the new `episode_id` is stored on the distribution as `context.spotify_episode_id` (with `spotify_episode_uri`, `spotify_show_id`), plus `context.channel_link` — the episode's open.spotify.com URL, which the admin shows as *Open on Spotify* |
| `republish` | **Publish Now** on an already-published distribution (after editing it or syncing it with the article) | `PUT /episodes/{episode_id}` — title, pubdate, summary, media, entitlements, rating/explicit/type updated in place; no duplicate episode |
| `delete` | **Delete** on the distribution in the admin | `DELETE /episodes/{episode_id}`, run by the platform **before** the distribution row is removed. If Spotify refuses, the run fails, the delete is refused and the distribution stays with the error — the episode is never orphaned |

Checking on an episode after publish is a separate manual workflow,
[`spotify/episode-status`](../episode-status/), installed with the package. It
attaches itself to this channel (`channel: spotify` in its blueprint), so the
admin's distribution panel gets a *Check status* button that reports Spotify's
processing status and failure reasons and marks a rejected episode as
**Error**. This workflow does not need to know it exists.

Steps, in order:

| Step | Action | Purpose |
|---|---|---|
| `load` | `distribution.get` | Load the episode metadata the editor collected |
| `existing` | `set-output` | `context.spotify_episode_id` from a previous publish, or `""` |
| `teardown` | `if trigger.action == "delete"` | recipe `spotify/delete-episode` for the recorded episode (nothing to do if none), then `workflow.exit` |
| `render` | `distribution.render` | Render the template into the episode summary |
| `media` | `asset.get` (`link: true`, `application: spotify`) | Resolve the enclosure asset to a URL signed with the Spotify app's feed token |
| `app` | `application.get` | Load the Spotify application (if installed) for its open categories |
| `audience` | `audience.get` | Read the audience's categories |
| `entitlements` | `set-output` | Apply the podcast-feed rule: slugs, or `[]` if a category is open |
| `publish` | `if existing == ""` | **then** recipe `spotify/create-episode` + `distribution.update` recording the episode in `context`; **else** recipe `spotify/update-episode` (`clear_entitlements: true`, so an episode can go from gated to open) |

Spotify's create is not idempotent on `guid`, so the recorded `episode_id`, not
the guid, is what keeps a republish from creating a second episode. A
distribution published before this version of the blueprint has no
`spotify_episode_id`; its next republish will therefore **create** a new
episode and record that id — delete the old one in Spotify (or set
`context.spotify_episode_id` on the distribution first).

Field mapping:

| Spotify field | Comes from |
|---|---|
| `title` | `distribution.title` |
| `pubdate` | `distribution.published_at` |
| `summary` | the rendered template body |
| `media_file_url` | the enclosure asset's public URL |
| `guid` | `trigger.distribution_id` (create only) |
| `entitlements` | the audience's category slugs, or `[]` if one is an open category of the Spotify application |
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
      application: spotify
```

**`base_type: podcast`** — the Add Distribution editor shows the familiar
podcast form (title, summary, and an **audio/video file picker**) rather than a
plain body box. The chosen media file arrives on the distribution as `asset_id`.

**`requires_audience: true` on a broadcast channel** — this is the unusual bit.
The episode is posted **once**, not per member, but you must still select an
audience: Spotify Open Access gates playback by **entitlements**, and this
workflow passes the audience's category slugs as those entitlements. The
audience decides *who can play the episode*, not who receives it. An audience
with no category filter publishes an ungated episode, and so does one whose
categories include an **open category** of the Spotify application — exactly
the rule the Spotify podcast feed applies to its items.

**`application: spotify`** — the admin picker offers only the Spotify
application's audiences for this channel. Those audiences are the entitlements
Spotify's account linking was set up with, so nothing else would resolve on
Spotify's side. (A UI hint — the API does not enforce it.)

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
