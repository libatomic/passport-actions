# Spotify — Create Media Upload

Requests a direct media upload for an episode via the **Spotify Distribution
API** (`POST https://distribution.spotify.com/episodes/{episode_id}/media`),
pinned to **Api-Version 2026-04-01**. Spotify answers **201** with a resumable
upload session; the file is then sent to `upload_url` with `PUT`, and Spotify
starts processing when the upload completes. There is no separate request to
open the session or to commit the upload.

Your Spotify organization must be enabled for direct upload; otherwise the
request fails with **403**.

## Reference

```
libatomic/passport-actions/recipes/spotify/create-media-upload
```

## Inputs

| Input | Required | Default | Description |
|---|---|---|---|
| `api_version` | no | `2026-04-01` | CalVer `Api-Version` header sent to the API |
| `client_id` | yes | — | Spotify app client id |
| `client_secret` | yes | — | Spotify app client **secret** |
| `episode_id` | yes | — | Base-62 episode id (from `spotify:episode:<id>`) |
| `content_type` | yes | — | MIME type of the file: `audio/mpeg`, `audio/mp3`, `audio/mp4`, `audio/m4a`, `audio/x-m4a`, `video/mp4`, `video/quicktime` |

## Outputs

`steps.<id>.outputs.upload.outputs.body.*`:

| Field | Description |
|---|---|
| `upload_url` | Cloud Storage resumable session URL. **Anyone holding it can upload** for the episode until it expires — treat it as a credential |
| `upload_expires_at` | When the session expires (7 days after the request) |
| `media_id` | Identifies this upload in `GET /episodes/{id}/latest-media` and `/availability` |

Each successful request opens a new session with a new `media_id`; when several
uploads complete, the newest session's file wins. The request is made once (no
automatic retry) for that reason.

## Uploading from a browser

The session accepts cross-origin `PUT`s. Chunked uploads (every chunk but the
last a multiple of 256 KiB, `Content-Range: bytes a-b/total`) answer **308**
with a readable `Range` header, and so does a status query (`Content-Range:
bytes */*`, empty body). As tested on 2026-11-19, the response to the request
that **completes** the upload is not readable from a browser (it carries no
CORS headers), so the browser reports a network error although the file
arrived, and later requests to the session fail the same way. A browser
uploader has to treat "the completing request failed and a status query now
fails too" as done, and confirm through Spotify
(`recipes/spotify/get-episode-status`).

## Usage

```yaml
- id: session
  includes: libatomic/passport-actions/recipes/spotify/create-media-upload
  with:
    client_id: ${{ inputs.spotify_client_id }}
    client_secret: ${{ secrets.SPOTIFY_CLIENT_SECRET }}
    episode_id: ${{ steps.existing.outputs.id }}
    content_type: ${{ trigger.upload.content_type }}
```

Both `accounts.spotify.com` and `distribution.spotify.com` must be on the
instance's HTTP allowlist.
