# 9. Files and binary data

A run's state is JSON: step outputs, variables, the run history. JSON cannot
hold raw bytes, and a byte string forced into it is damaged. So:

> **Binary travels as an asset, or as base64 text. Never as a raw string.**

| The data is | Carry it as |
|---|---|
| A file a vendor returns (audio, an image, a PDF) | An **asset**, saved straight from the response |
| A file you send to a vendor | An **asset**, uploaded from its id |
| A small binary value in a JSON API (a thumbnail, a signature, a short audio sample) | **base64 text**, typed `format: byte` |
| Anything a publisher should be able to open or play | An **asset**, recorded in the distribution's `context.asset_id` |

## 9.1 Saving a response as an asset

```yaml
- id: speak
  action: http.post
  with:
    url: "https://api.elevenlabs.io/v1/text-to-speech/${{ fields.voice }}"
    headers: { xi-api-key: "${{ secrets.api_key }}" }
    body: { text: "${{ steps.text.outputs.text }}", model_id: "${{ channel.settings.model_id }}" }
    response_asset:
      filename: "narration-${{ trigger.distribution_id }}.mp3"
      mime_type: audio/mpeg
      overwrite: true
```

With `response_asset`, a 2xx response body is written to an asset instead of
being returned. The step's outputs are `asset`, `asset_id` and `size`; there
is no `body`. An error response still comes back in `body`, so
`steps.<id>.error.detail.body` works as usual.

| Key | Meaning |
|---|---|
| `filename` | Required |
| `mime_type` | Defaults to the response's content type |
| `overwrite` | `true`: replace an existing asset of that name and **keep its id and link**. Use it for anything republished |
| `public`, `type`, `description`, `categories`, `metadata` | As for `asset.create` |
| `max_size` | Bytes. Default 200 MiB |

The asset is written only once the whole response has arrived, so a failed
download never leaves half a file.

## 9.2 Sending bytes

| `http.*` input | Sends | Since |
|---|---|---|
| `body` (a map or list) | JSON, with `Content-Type: application/json` | |
| `body` (text) | The text as it is; set `Content-Type` yourself | |
| `form` (a map) | `application/x-www-form-urlencoded` | 2.3.0 |
| `body_base64` | The decoded bytes; set `Content-Type` yourself | 2.3.0 |
| `multipart` | `multipart/form-data`: fields and files | 2.3.0 |

```yaml
- id: upload
  action: http.post
  with:
    url: https://api.acme.example/v1/media
    headers: { Authorization: "Bearer ${{ secrets.token }}" }
    multipart:
      fields: { title: "${{ distribution.title }}" }
      files:
        - name: file
          asset_id: "${{ distribution.asset_id }}"
```

Only one of `body`, `form`, `body_base64` and `multipart` may be given. A
file in `multipart` is always an asset; it is streamed from storage and never
enters the run's state.

## 9.3 Receiving bytes without an asset

By default a response is returned in `body`: parsed when it is JSON, text
otherwise. A binary response read that way is damaged. When you need the
bytes themselves and an asset is wrong (a preview that must leave nothing
behind), ask for base64:

```yaml
- id: sample
  action: http.post
  with:
    url: …
    response_encoding: base64      # 2.3.0
    max_response_size: 2000000
  outputs:
    audio: "${{ steps.sample.outputs.body }}"
    audio_type: "${{ steps.sample.outputs.headers['Content-Type'] }}"
```

| Input | Meaning | Since |
|---|---|---|
| `response_encoding` | `auto` (default: JSON or text) or `base64` | 2.3.0 |
| `max_response_size` | Bytes. Default 10 MiB when no `response_asset` is given; a larger response fails the step | 2.3.0 |

Many vendors offer a JSON variant that already returns base64 (ElevenLabs'
`with-timestamps`, for one). Prefer that when it exists.

Keep base64 out of the run history when you can: it is stored with the run.
A few hundred kilobytes for a preview is fine; a whole file is not.

## 9.4 Working with assets

| Action | Does |
|---|---|
| `asset.get` | Metadata, and with `link: true` an address a vendor can fetch the file from |
| `asset.create` | From `url` (fetched by the server) or `payload` (text). `payload_base64` for bytes (2.3.0) |
| `asset.update` | Metadata |
| `asset.delete` | Removes the asset and its file |
| `asset.concat` | Joins assets in order into one. MP3s are joined frame by frame. `overwrite: true` keeps the final asset's id; `delete_sources: true` removes the parts |

**Give the vendor a link, not the bytes**, when the vendor can fetch:

```yaml
- id: media
  action: asset.get
  with: { asset_id: "${{ distribution.asset_id }}", link: true }
- id: create
  action: acme/episode.create
  with: { media_url: "${{ steps.media.outputs.link }}" }
```

**More data than one request takes.** Split it, make one request per piece,
join the parts:

```yaml
- id: pieces
  foreach: "${{ chunkText(steps.text.outputs.text, 4500) }}"
  as: piece
  steps:
    - id: speak
      action: elevenlabs/speech.create
      with: { text: "${{ loop.piece }}", filename: "part-${{ loop.index }}.mp3" }
    - id: keep
      action: vars.set
      with: { parts: "${{ concat(vars.parts ?? [], [steps.speak.outputs.asset_id]) }}" }
- id: join
  action: asset.concat
  with:
    asset_ids: "${{ vars.parts }}"
    filename: "narration-${{ trigger.distribution_id }}.mp3"
    overwrite: true
    delete_sources: true
```

The final asset is replaced only once every part exists, so a failed run
leaves the published file alone.

## 9.5 Recording a file on a distribution

Put the asset's id in the distribution's context. The admin then shows a
player or a link under the distribution:

```yaml
- id: record
  action: distribution.update
  with:
    distribution_id: "${{ trigger.distribution_id }}"
    context: >-
      ${{ merge({'asset_id': steps.join.outputs.asset_id, 'generated_at': now()},
                distribution.context) }}
```

On `delete`, remove it with `asset.delete` and `continue-on-error: true`.

## 9.6 Doing the expensive thing once

Hash what the result depends on, keep the hash in `context`, and on
`republish` skip the call when the hash is unchanged and the asset is still
there:

```yaml
- id: sig
  action: set-output
  with: { hash: "${{ sha256(steps.text.outputs.text + '|' + fields.voice) }}" }
- id: have
  action: asset.get
  continue-on-error: true
  with: { asset_id: "${{ distribution.context.asset_id }}" }
- id: unchanged
  if: >-
    ${{ trigger.action == 'republish'
        && distribution.context.narration_hash == steps.sig.outputs.hash
        && steps.have.status == 'ok' }}
  action: workflow.exit
```

## 9.7 Limits

| | Limit |
|---|---|
| `response_asset`, `asset.concat` | 200 MiB by default (`max_size`); `asset.concat` up to 500 parts |
| A response returned in `body` | 10 MiB by default (`max_response_size`) |
| `gzip` / `gunzip` | 1 MiB of text |
| A webhook's multipart field | 1 MiB |
