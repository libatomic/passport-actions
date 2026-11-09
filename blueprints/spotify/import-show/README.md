# Spotify Import Show (RSS → API)

Manual helper that moves an **RSS-distributed** Spotify show under
**Distribution API** management (Api-Version 2026-04-01) so the
[`spotify/create-episode`](../create-episode/) channel can publish to it.

Built on the [`spotify/import-show`](../../../recipes/spotify/import-show/)
recipe. The `includes:` ref is pinned `@spotify` until that recipe is on the
default branch — unpinned includes fetch GitHub `HEAD` (`master`).

## When to use it

A show that Passport has been distributing through the built-in **Podcast
(RSS)** channel already exists on Spotify with a `spotify:show:<id>` URI, but
the Spotify application's client id cannot see it — `GET /shows/{id}` returns
404 and publishing through the Spotify channel fails. Importing the show brings
it under the client id; **the show id stays the same**, followers and analytics
are preserved.

> After the import Spotify **stops polling the RSS feed**. All further changes
> to the show and its episodes must go through the API (which is what the
> Spotify channel does). Keep publishing to the Podcast channel for other
> platforms; Spotify simply no longer reads it.

## What it does

1. **Check** — is the show already managed by this client? If so, log and stop.
2. **Preflight** — ask Spotify whether the show can be imported. This also reports
   the **feed URL Spotify is polling**, so you can confirm it's the right show.
3. **Import** — start the import only when preflight says it is eligible.
4. **Wait** (optional) — poll until Spotify finishes (about 10 minutes max).
5. **Verify & report** — confirm the show is readable and log the outcome.

Outcomes that are *not* a completed import end the run through `workflow.exit`
so the reason shows on the run detail:

| Outcome | Meaning | What to do |
|---|---|---|
| already managed | Nothing to import | — |
| imported | Done; Spotify stopped polling the feed | Publish via the Spotify channel |
| pending | Import accepted, not finished | Re-run later (reports "already managed" when done) |
| not eligible | Usually `DOMAIN_NOT_AUTHORIZED` | Feed must be on an RSS domain your Spotify partner manager authorized for the account; after repointing a feed allow up to ~3h, then re-run |
| conflict | Already imported / owned by another client id, or an import is running | Check which client id manages the show |
| failed | Spotify's import failed | Re-run to retry; escalate to distribution-api@spotify.com |

## Inputs

| Input | Required | Description |
|---|---|---|
| `spotify_client_id` | yes | Spotify application client id |
| `spotify_show_id` | yes | Base-62 id from `spotify:show:<id>` |
| `wait_for_import` | no (`"true"`) | `"false"` returns as soon as Spotify accepts the import |

## Requirements

- Secret **`SPOTIFY_CLIENT_SECRET`**.
- `accounts.spotify.com` and `distribution.spotify.com` on the instance's HTTP
  allowlist (Workflows → Settings → Allowed HTTP hosts).
- The client id must be allow-listed by Spotify for the Distribution API *and*
  for import access (a 403 from the preflight means it is not).
