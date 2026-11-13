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
| `republish` | **Publish Now** on an already-published distribution (after editing it or syncing it with the article) | `PUT /episodes/{episode_id}` — title, pubdate, summary, media, entitlements, rating/explicit/type updated in place; no duplicate episode. If Spotify no longer has the episode (404), it is created again and the new id recorded |
| `delete` | **Delete** on the distribution in the admin | `DELETE /episodes/{episode_id}`, run by the platform **before** the distribution row is removed. If Spotify refuses, the run fails, the delete is refused and the distribution stays with the error — the episode is never orphaned. An episode already gone from Spotify (404) counts as deleted |

Checking on an episode after publish is a separate manual workflow,
[`spotify/episode-status`](../episode-status/), installed with the package. It
attaches itself to this channel (`channel: spotify` in its blueprint), so the
admin's distribution panel gets a *Check status* button that reports Spotify's
processing status and failure reasons and marks a rejected episode as
**Error**. This workflow also runs it once on its own, a while after every
publish (see [Status after a publish](#status-after-a-publish)).

Steps, in order:

| Step | Action | Purpose |
|---|---|---|
| `load` | `distribution.get` | Load the episode metadata the editor collected |
| `existing` | `set-output` | `context.spotify_episode_id` from a previous publish, or `""` |
| `teardown` | `if trigger.action == "delete"` | recipe `spotify/delete-episode` for the recorded episode (nothing to do if none), then `workflow.exit` |
| `no-media` | `workflow.fail` | Stop with a plain reason when the distribution has no media file |
| `render` | `distribution.render` | Render the template into the episode summary |
| `media` | `asset.get` (`link: true`, `application: spotify`) | Resolve the enclosure asset to a URL signed with the Spotify app's feed token |
| `unsupported-media` | `workflow.fail` | Stop when the file is plainly not audio or video (its type is set and is neither `audio/*` nor `video/*`) |
| `app` | `application.get` | Load the Spotify application (if installed) for its open categories |
| `audience` | `audience.get` | Read the audience's categories |
| `entitlements` | `set-output` | Apply the podcast-feed rule: slugs, or `[]` if a category is open |
| `update` | `if existing != ""` | recipe `spotify/update-episode` (`clear_entitlements: true`, so an episode can go from gated to open; `missing_ok: true`, so a 404 falls through to a create) |
| `target` | `set-output` | `create` is true when nothing was published yet or the update answered 404 |
| `publish` | `if target.create` | recipe `spotify/create-episode` + `distribution.update` (`remember`) recording the episode in `context` |
| `schedule-status` | `workflow.run` (async, `run_at`) | Run the status workflow for this distribution after `status_check_after` |

## Failure handling

- **No duplicate episodes.** The create call is made once, with no automatic
  retry: Spotify's create is not idempotent on `guid`, and a retry of a request
  Spotify had already accepted would publish the episode twice. If the create
  fails, the publish fails and can be run again.
- **No unrecorded episodes.** If the episode is created but its id can't be
  saved on the distribution (`remember`), the workflow deletes the episode from
  Spotify again and fails the publish with a reason that names it. Publishing
  again starts clean.
- **Episodes removed on Spotify.** A republish of an episode Spotify no longer
  has creates it again; a delete of one succeeds.
- **Missing or wrong media.** A distribution without a file, or with a file that
  is not audio or video, fails the publish with a reason the admin shows on the
  distribution, before anything is sent to Spotify.

## Status after a publish

Spotify fetches and processes the media after the publish call returns, so a
file it rejects is only known later. After each publish or republish the
workflow schedules one run of the status workflow (`status_workflow`, by default
the package's **Spotify Episode Status**) for `status_check_after` later (10
minutes by default). That run writes `channel_status` and any failures to the
distribution, and the admin lists a rejected episode as **Error** without anyone
pressing *Check status*.

The scheduling never fails a publish: if the status workflow is missing,
renamed or disabled, the step is skipped over. Clear `status_check_after` to
turn it off. A long video may still be `pending` at the first check — press
*Check status* later, or raise the delay.

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
| `status_check_after` | no | `10m` | How long after a publish to check Spotify's processing status (`10m`, `1h`). Empty turns the automatic check off |
| `status_workflow` | no | `spotify-episode-status` | Slug or id of the status workflow. Change it only if that workflow was renamed |

**Allowed HTTP hosts** (Workflows → Settings → Allowed HTTP hosts)

```
accounts.spotify.com
distribution.spotify.com
```

**Media** — MP3, M4A, MP4 or MOV; MP4/MOV are published as video. The publish
stops early if the distribution has no file or the file is not audio or video.
The asset URL must be publicly reachable by Spotify.

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
