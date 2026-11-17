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
| `audiences` | A list of audience ids: the asset is **protected**, for members of those audiences and staff only ([9.7](#97-protected-and-virtual-assets)). Not with `public: true` |
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

- `http.get` and `http.delete` send no body: `form`, `body_base64` and
  `multipart` there are an error.
- `body_base64` with no `Content-Type` is sent as `application/octet-stream`.
  For `form` and `body_base64` a `Content-Type` you set wins; for
  `multipart` it is always Passport's, since it carries the boundary.
- In `form` and in multipart `fields`, a list repeats the field, a map is
  sent as JSON text, and a null is left out.
- A multipart file's `filename` and `content_type` default to the asset's.
  The asset must be one of this site's.

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

With `response_encoding: base64`, an error response is still read as JSON or
text, so `steps.<id>.error.detail.body` stays readable. A response over
`max_response_size` fails the step without a retry and returns none of the
body.

Many vendors offer a JSON variant that already returns base64 (ElevenLabs'
`with-timestamps`, for one). Prefer that when it exists.

Keep base64 out of the run history when you can: it is stored with the run.
A few hundred kilobytes for a preview is fine; a whole file is not.

## 9.4 Working with assets

| Action | Does |
|---|---|
| `asset.get` | Metadata, and with `link: true` an address a vendor can fetch the file from |
| `asset.create` | From `url` (fetched by the server, which may reach only the plugin's `allowed_hosts`), `payload` (text) or `payload_base64` (bytes, 2.3.0). Only one of `url` and `payload_base64`. `audiences` makes it protected ([9.7](#97-protected-and-virtual-assets)) |
| `asset.update` | Metadata |
| `asset.delete` | Removes the asset and its file. Refused while the asset is a variant or the default of a virtual asset |
| `asset.concat` | Joins assets in order into one. MP3s are joined frame by frame. `overwrite: true` keeps the final asset's id; `delete_sources: true` removes the parts; `audiences` makes the joined asset protected |
| `asset.virtual` | Builds a virtual asset: one id and address, answered by a different file for each audience ([9.7](#97-protected-and-virtual-assets)) |

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

## 9.7 Protected and virtual assets

### Who may fetch an asset

An asset is in one of three states:

| State | How it is made | Who gets the file |
|---|---|---|
| Public | `public: true` | Anyone, signed in or not |
| Private | Neither `public` nor `audiences`. What a step makes by default | Anyone signed in to the site |
| Protected | `audiences`: a list of audience ids | Members of at least one of those audiences, and staff |

Everyone else who asks for a protected asset is answered exactly as if it
did not exist. Membership is read on every request, so a member who leaves
the audience loses the file on their next request, and a protected file is
never kept in a shared cache. Application and site tokens (a vendor fetching
a link from `asset.get`, say) are held to their own scope, not to audiences.

The three ways a step creates an asset all take `audiences`:

```yaml
- id: speak
  action: http.post
  with:
    url: …
    response_asset:
      filename: "narration-${{ article.id }}-${{ inputs.audience }}.mp3"
      overwrite: true
      audiences: ["${{ inputs.audience }}"]     # protected

- id: notes
  action: asset.create
  with:
    filename: "notes-${{ article.id }}.txt"
    payload: "${{ steps.text.outputs.text }}"
    audiences: "${{ automation.settings.audiences }}"

- id: join
  action: asset.concat
  with:
    asset_ids: "${{ vars.parts }}"
    filename: "narration-${{ article.id }}-${{ inputs.audience }}.mp3"
    overwrite: true
    audiences: ["${{ inputs.audience }}"]
```

- `audiences` with `public: true` is an error and fails the step: a public
  asset is not protected by anything, so the step would publish what it was
  told to confine.
- Each id must be one of the site's audiences.
- An `overwrite` that names no audiences keeps the ones the asset has, so
  replacing a file never widens who may have it.
- An audience that protects an asset cannot be deleted until the asset is
  deleted or given other audiences.

Make a file protected when it holds what only some members may have: the
audio of an article with restricted sections, read for paying members.

### One asset, a file per audience

A **virtual asset** has no file of its own. It has **variants**: each one a
protected asset, for one audience. It has one id, one filename and one
address, and they stay the same when variants are added, replaced or
removed. A feed, a page or a distribution names the virtual asset once, and
each reader is answered with the file for their audience.

| Who asks | Gets |
|---|---|
| A member | The variant of the best-ranked audience they are in: variants are tried in the site's audience rank order, unranked audiences last. Membership is read on every request |
| A member in none of the variants' audiences | The **default**, when the virtual asset has one. Otherwise exactly what a missing asset answers |
| Nobody signed in | The default, when there is one and it is public. Otherwise the same missing-asset answer |
| Staff, and application or site tokens | The first variant, the best-ranked audience's. With `?as_audience=<audience id>` on the address, that audience's variant |

The default is optional and is any asset with a file. It is checked like
any asset when it answers, so a protected default is still refused to
someone outside its audiences; a private asset is the usual choice. A
variant is still a protected asset in its own right: fetched by its own id
or filename, it answers only its audience.

**Variant ids are not handed to members.** Nothing a member receives (the
address, a feed, the answer's headers) carries a variant's id or says that
the asset is virtual. Give members the virtual asset's id or address, never
a variant's.

### `asset.virtual`

Make one protected file per audience, then name them in one `asset.virtual`
step. Here an article is read aloud once for each audience the publisher
chose, rendered as that audience ([5.7](05-automations.md#57-extensions)),
and the readings are filed as one asset:

```yaml
- id: each
  foreach: "${{ inputs.audiences }}"        # a list of passport.audience ids
  as: audience
  steps:
    - id: render
      action: template.render
      with:
        body: "${{ inputs.script }}"
        article_id: "${{ article.id }}"
        audience_id: "${{ loop.audience }}"
    - id: speak
      action: http.post
      with:
        url: "https://api.acme.example/v1/speech"
        headers: { Authorization: "Bearer ${{ secrets.token }}" }
        body: { text: "${{ htmlText(steps.render.outputs.body) }}" }
        response_asset:
          filename: "narration-${{ article.id }}-${{ loop.audience }}.mp3"
          mime_type: audio/mpeg
          overwrite: true
          audiences: ["${{ loop.audience }}"]
    - id: keep
      action: vars.set
      with:
        variants: >-
          ${{ concat(vars.variants ?? [],
              [({"asset_id": steps.speak.outputs.asset_id, "audience_id": loop.audience})]) }}
- id: narration
  action: asset.virtual
  with:
    filename: "narration-${{ article.id }}.mp3"
    variants: "${{ vars.variants }}"
    # default: an asset id, for members in none of the audiences (optional)
```

| Input | Meaning |
|---|---|
| `filename` | Required. The virtual asset's filename, which is its address (`/assets/<filename>`) |
| `variants` | A list of `{ asset_id, audience_id }`: a protected asset and the audience it is for |
| `default` | An asset id: what a member in none of the variants' audiences gets |
| `description` | |
| `mime_type` | Not needed: the content type is the variants'. Given, it must be theirs |

At least one variant, or a default, is required. The outputs are `asset_id`
(the virtual asset's id), `url` (its address, without a token: each reader
fetches it with their own) and `asset` (the asset, with `virtual: true` and
its `variants`).

**Safe to run twice.** A virtual asset that already has the filename is
given the step's variants and default, which replace the ones it had, and
keeps its id, so a link or a distribution that names it keeps working. Name
each variant's file after the record and the audience, with
`overwrite: true`, and the whole sequence can run again on the same record.
A filename that an ordinary asset has is refused (`conflict`): the step
never turns a file into a virtual asset.

**What a variant must be.** A protected asset of the site whose `audiences`
include the variant's `audience_id`; one variant per audience, each asset
once, at most 64; every variant, and the default, of one content type;
none of them a virtual asset. A set that breaks a rule fails the step
(`invalid`) and leaves the virtual asset as it was.

**While an asset is a variant** (or a default), `asset.delete` refuses it
(`conflict`), and it cannot be made public, lose its variant's audience or
change content type. Replacing its file with `overwrite: true` is allowed:
that audience gets the new file at the same address. A variant left out of
a later `asset.virtual` is no longer part of the virtual asset; its file
stays, as a protected asset, until a step deletes it. To remove one, run
`asset.virtual` with the new set first, then `asset.delete`. Deleting the
virtual asset leaves its variants' files as they are. An audience a variant
is for cannot be deleted until the variant is taken out.

**Render each variant as its audience.** Use `template.render` with
`audience_id`, or in a channel `distribution.render` with `as_audience`. A
render as an audience is that audience and every audience ranked below it,
which matches who is answered with that variant: a member of two audiences
gets the better-ranked one's file, and it holds what the lower one's does.

### A virtual asset as a podcast enclosure

A podcast distribution's audio may be a virtual asset. Every reader's feed
carries the same enclosure address, signed with that reader's own feed
token, and each fetch is answered with the variant that reader gets at that
moment.

One limit. A feed item states the enclosure's size and duration (`length`,
`itunes:duration`) and its chapters, and they are those of **one** variant,
chosen when the item is written: for an item written for an audience, the
variant for that audience (else the default, else the first variant). The
item is not rewritten afterwards. A reader of that audience who is also in a
better-ranked audience fetches another variant, so for them the stated size
and duration are not those of the file they get. Podcast apps treat both as
hints. A reader with no variant and no default still sees the item; their
fetch of the audio is answered as a missing file.

## 9.8 Limits

| | Limit |
|---|---|
| `response_asset`, `asset.concat` | 200 MiB by default (`max_size`); `asset.concat` up to 500 parts |
| A response returned in `body` | 10 MiB by default (`max_response_size`) |
| A virtual asset | 64 variants, one per audience |
| `gzip` / `gunzip` | 1 MiB of text |
| A webhook's multipart field | 1 MiB |
