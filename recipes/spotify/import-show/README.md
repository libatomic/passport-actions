# Spotify — Import Show (RSS → Distribution API)

Brings an **RSS-distributed** Spotify show under **Distribution API**
management (Api-Version **2026-04-01**) so the Spotify channel can publish
episodes to it. Idempotent: it checks first, imports only when Spotify says the
show is eligible, and reports a single `outcome`.

> Once imported, **Spotify stops fetching the show's RSS feed**. Every future
> show/episode change must go through the API. The show URI, followers and
> analytics history are preserved — `spotify:show:<id>` stays the same. To go
> back to RSS later, Spotify's `POST /shows/{id}/offboard` reverts it (not part
> of this recipe).

## Reference

```
libatomic/passport-actions/recipes/spotify/import-show
```

## What it does

| Step | Call | Purpose |
|---|---|---|
| `token` | `POST accounts.spotify.com/api/token` | Client-credentials token |
| `show` | `GET /shows/{show_id}` (accepts 200 / 404) | 200 → already managed by this client, stop; 404 → continue |
| `preflight` | `GET /imports/preflight?show_uri=…` (accepts 200 / 409) | Is the show importable? Returns `feed_url`, `distribution_method`, `eligible_for_import`, `ineligibility_reason` |
| `import` | `POST /imports {show_uri}` → 202 | Only when `eligible_for_import` is true; returns `import_id` |
| `poll` | `GET /imports/{import_id}` every `poll_interval`, up to 40× | Only when `wait` is `"true"`; stops at `success` / `failed` |
| `verify` | `GET /shows/{show_id}` → 200 | After `success`, confirms the show is now readable by this client |
| `result` | `set-output` | Flat summary (below) |

Statuses that **fail the run** (Spotify's message is included in the error):
`show` 401/403, `preflight` 404 (no such show in Spotify's catalog), 403 (this
client is not authorized for import access — ask your Spotify partner manager),
422 (hosted on Megaphone or another non-RSS method), `verify` 404.

## Inputs

| Input | Required | Default | Description |
|---|---|---|---|
| `api_version` | no | `2026-04-01` | CalVer `Api-Version` header |
| `client_id` | yes | — | Spotify app client id |
| `client_secret` | yes | — | Spotify app client **secret** |
| `show_id` | yes | — | Base-62 id from `spotify:show:<id>`; must already be on Spotify via RSS |
| `wait` | no | `"true"` | `"true"` polls until the import finishes; `"false"` returns after the 202 |
| `poll_interval` | no | `15s` | Delay between status checks (Go duration, ≤ 90s) |

## Outputs

`steps.<id>.outputs.result.outputs.*`:

| Output | Description |
|---|---|
| `outcome` | `already_managed` · `success` · `pending` · `not_eligible` · `conflict` · `failed` |
| `reason` | `ineligibility_reason` (e.g. `DOMAIN_NOT_AUTHORIZED`) or Spotify's 409 message |
| `distribution_method` | `api` when already managed, else what preflight reported (`rss`) |
| `feed_url` | The RSS feed Spotify is currently polling (from preflight) |
| `title` | Show title |
| `import_id` | Import job id (when an import was started) |
| `import_status` | `pending` / `success` / `failed` (when polled) |
| `episode_count` | Episodes imported (or, pre-import, available in the feed) |

Outcome meanings:

- **`already_managed`** — `GET /shows/{id}` returned 200; nothing was changed.
- **`success`** — imported and verified. Spotify has stopped polling `feed_url`.
- **`pending`** — import accepted but not finished (either `wait: "false"`, or
  40 polls elapsed). Re-run later; it will report `already_managed` once done.
- **`not_eligible`** — preflight returned `eligible_for_import: false`. With
  `DOMAIN_NOT_AUTHORIZED`, the feed URL is not on one of this Spotify account's
  authorized RSS domains. After repointing a feed to an authorized domain,
  Spotify's crawler can take up to ~3 hours to notice; retry then.
- **`conflict`** — preflight returned 409: the show is already imported / already
  exists in this account (typically managed by another client id), or an
  import is already running.
- **`failed`** — Spotify reported the import failed. Re-submit to retry.

Raw responses remain available too, e.g. `steps.<id>.outputs.preflight.outputs.body`.

## Usage

```yaml
- id: import
  includes: libatomic/passport-actions/recipes/spotify/import-show
  with:
    client_id: ${{ inputs.spotify_client_id }}
    client_secret: ${{ secrets.SPOTIFY_CLIENT_SECRET }}
    show_id: ${{ inputs.spotify_show_id }}

- id: done
  if: ${{ steps.import.outputs.result.outputs.outcome == "success" }}
  action: log
  with:
    message: "imported ${{ steps.import.outputs.result.outputs.episode_count }} episodes"
```

Both `accounts.spotify.com` and `distribution.spotify.com` must be on the
instance's HTTP allowlist. See `blueprints/spotify/import-show` for the
manual workflow that wraps this recipe.
