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
| `overwrite` | `true`: replace an existing asset of that name and **keep its id and link**. Use it for anything published again |
| `public`, `type`, `description`, `categories`, `metadata` | As for `asset.create` |
| `audiences` | A list of audience ids: the asset is **protected**, for members of those audiences and admins only ([9.7](#97-protected-and-virtual-assets)). Not with `public: true` |
| `max_size` | Bytes. Default 200 MiB |

The asset is written only once the whole response has arrived, so a failed
download never leaves half a file.

**Downloads often redirect.** Many vendors answer a request for a file with
a redirect to a storage or CDN host. The step follows it only when that host
is in `allowed_hosts` too, and sends it none of the step's `headers` but
`Content-Type` and `Accept`
([1.2](01-project-and-manifest.md#where-http-may-connect)). So: list the
file host beside the API host; and if the file host needs the credential,
the redirect will not carry it. Where the vendor's API can hand back the
file's address instead of redirecting to it, ask for the address in one
step, then fetch it in a second step with the headers it needs and
`response_asset`.

## 9.2 Sending bytes

| `http.*` input | Sends | Since |
|---|---|---|
| `body` (a map or list) | JSON, with `Content-Type: application/json` | |
| `body` (text) | The text as it is; set `Content-Type` yourself | |
| `form` (a map) | `application/x-www-form-urlencoded` | 2.3.0 |
| `body_base64` | The decoded bytes; set `Content-Type` yourself | 2.3.0 |
| `multipart` | `multipart/form-data`: fields and files | 2.3.0 |
| `body_asset` | An asset's bytes as the whole body | 2.3.0 |

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

Only one of `body`, `form`, `body_base64`, `multipart` and `body_asset` may
be given. A file in `multipart` is always an asset; it is streamed from
storage and never enters the run's state.

- `http.get` and `http.delete` send no body: `form`, `body_base64` and
  `multipart` there are an error.
- `body_base64` with no `Content-Type` is sent as `application/octet-stream`.
  For `form` and `body_base64` a `Content-Type` you set wins; for
  `multipart` it is always Passport's, since it carries the boundary.
- In `form` and in multipart `fields`, a list repeats the field, a map is
  sent as JSON text, and a null is left out.
- A multipart file's `filename` and `content_type` default to the asset's.
  The asset must be one of this site's.

### An asset as the whole body

Many destinations hand back an upload address and
expect the file itself as the body of a `PUT` or `POST`. `body_asset` sends
an asset that way, streamed from storage like a multipart file:

```yaml
- id: upload
  action: http.put
  with:
    url: "${{ steps.session.outputs.body.upload_url }}"
    body_asset:
      asset_id: "${{ fields.media }}"
      content_type: video/mp4
```

| Key | Required | Meaning |
|---|---|---|
| `asset_id` | yes | The asset to send. It must be one of this site's |
| `content_type` | no | The `Content-Type` sent. The asset's own when left out; a `Content-Type` header on the step wins over both |

`Content-Length` is the asset's size. Use `multipart` when the destination
wants a form upload, and `body_asset` when it wants the bytes alone.

### Compressing what is sent

`content_encoding: gzip` compresses the request
body as it is sent and sets the `Content-Encoding` header:

```yaml
- id: send
  action: http.post
  with:
    url: https://api.acme.example/v1/import
    body: "${{ vars.rows }}"
    content_encoding: gzip
```

- It works with `body`, `form`, `body_base64` and `body_asset`. With
  `multipart` it is an error, as is setting a `Content-Encoding` header
  yourself.
- `gzip` is the only value.
- A compressed `body_asset` is sent without a `Content-Length`, which signed
  upload addresses usually refuse. The other bodies keep theirs. Audio, video and images are compressed
  already and gain nothing; use it for JSON, CSV and text.
- Use this, not `gzip()` with `body_base64`: the function stops at 1 MiB.

Responses need nothing: Passport asks for gzip and unpacks what comes back,
and `max_response_size` counts the unpacked bytes. Leave `Accept-Encoding`
out of a step's headers. A step that sets it still gets a gzip response
unpacked, and fails when the response comes back in an encoding Passport
does not read, such as `br`.

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
| `asset.create` | From `url`, `payload` (text) or `payload_base64` (bytes, 2.3.0). Only one of `url` and `payload_base64`. `audiences` makes it protected ([9.7](#97-protected-and-virtual-assets)) |
| `asset.update` | Metadata, and with `url` a new source address for the file |
| `asset.delete` | Removes the asset and its file. Refused while the asset is a variant or the default of a virtual asset |
| `asset.concat` | Joins assets in order into one. MP3s are joined frame by frame. `overwrite: true` keeps the final asset's id; `delete_sources: true` removes the parts; `audiences` makes the joined asset protected |
| `asset.virtual` | Builds a virtual asset: one id and address, answered by a different file for each audience ([9.7](#97-protected-and-virtual-assets)) |

**A `url` is fetched by the server, under the rules of an `http.*` step.**
The `url` of `asset.create` and `asset.update` must be on one of the
plugin's `allowed_hosts`, at a public address, on port 80 or 443, with no
user name or password in it, and every redirect on the way to the file is
held to the same
([1.2](01-project-and-manifest.md#where-http-may-connect)). An address a
vendor hands back for a file (a signed link on a storage host, say) is
therefore only usable when that host is listed. It cannot carry headers: a
file that needs a credential is fetched with `http.get` and
`response_asset` instead.

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

This is the channel's own record, written in the `publish` and `update`
flows; the remote id and link are not kept this way, they are returned
([6.5.10](06-channels.md#6510-what-passport-keeps)). In the `delete` flow,
remove the asset with `asset.delete` and `continue-on-error: true`.

## 9.6 Doing the expensive thing once

Hash what the result depends on, return the hash in the result's `data`,
and in the `update` flow skip the call when the hash is unchanged and the
asset is still there:

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
    ${{ published.data.narration_hash == steps.sig.outputs.hash
        && steps.have.status == 'ok' }}
  action: workflow.exit
```

These are steps of the `update` flow. After `workflow.exit` the flow's
`returns` is still evaluated, so it ends the same way either way:

```yaml
  returns:
    status: published
    data: "${{ merge({'narration_hash': steps.sig.outputs.hash}, published.data) }}"
```

The `publish` flow has the `sig` step too and returns the same `data`, so
the first `update` has a hash to compare.

## 9.7 Protected and virtual assets

### Who may fetch an asset

An asset is in one of three states:

| State | How it is made | Who gets the file |
|---|---|---|
| Public | `public: true` | Anyone, signed in or not |
| Private | Neither `public` nor `audiences`. What a step makes by default | Anyone signed in to the site |
| Protected | `audiences`: a list of audience ids | Members of at least one of those audiences, and admins |

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
| Admins, and application or site tokens | The first variant, the best-ranked audience's. With `?as_audience=<audience id>` on the address, that audience's variant |

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
`audience_id`, or in a channel `distribution.render` with `as_audience`
(the distribution must have an audience, so not on a channel with
`audience: none`; [6.2](06-channels.md#62-the-channel-block)). A
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

Every number the engine holds a run and a package to, files or not. The
rows that matter for files are `http_response_size` (a response returned in
`body`), `http_response_asset_size` (`response_asset`), the three
`asset_concat_…` rows, `asset_audiences`, `virtual_asset_variants` (one
variant per audience), `gzip_size`, `webhook_multipart_field_size` and
`package_asset_size`. The two response sizes and `asset_concat_size` are
defaults a step may change (`max_response_size`, `max_size`).
`http_redirects` is fixed: a chain longer than that fails the step. This
table is
generated from the engine (`passport-plugin reference`; do not edit it by
hand):

<!-- reference:begin limits -->
| Limit | Value | What it bounds |
|---|---|---|
| `loop_passes` | 1000 | The most times a while or until loop repeats, whatever its max says. |
| `foreach_items` | 10000 | The longest list a foreach walks. |
| `action_depth` | 8 | How deeply plugin actions may call one another. |
| `package_asset_size` | 256 KiB | The largest file a plugin may ship under assets/. |
| `runs_per_hour` | 500 | The runs a site starts in an hour, all its workflows together, unless the site's policy says otherwise. |
| `http_timeout` | 30 seconds | How long an http step waits when it gives no timeout. |
| `http_redirects` | 5 | The most redirects an http step follows, each to an allowed host on port 80 or 443; so too the url of asset.create and asset.update. |
| `http_response_size` | 10 MiB | The largest response an http step reads into outputs.body when it gives no max_response_size. |
| `http_response_asset_size` | 200 MiB | The largest response an http step stores with response_asset when it gives no max_size. |
| `asset_concat_parts` | 500 | The most assets one asset.concat joins. |
| `asset_concat_size` | 200 MiB | The largest file asset.concat writes when it gives no max_size. |
| `asset_concat_lead_in` | 10 seconds | The longest silence asset.concat puts before an MP3 with lead_in. |
| `asset_audiences` | 64 | The most audiences one protected asset names. |
| `virtual_asset_variants` | 64 | The most variants one virtual asset has (asset.virtual). |
| `sendmail_audience_recipients` | 25 | The most members a sendmail step sends to when it names an audience (to_audience, audience_id). |
| `sleep_duration` | 90 seconds | The longest a sleep step pauses; a longer duration is cut to it. |
| `wait_duration` | 90 days | The furthest ahead a wait step may resume the run; a longer wait fails the step. |
| `schedule_interval` | 1 minute | The shortest interval a schedule trigger may ask for. |
| `run_retention` | 180 days | The longest an automation's retention may keep its run history. |
| `package_size` | 1 MiB | The largest package a site installs, all its files together. |
| `audience_view_members` | 10000 | The most members audience.view returns when it gives no max. |
| `list_action_records` | 500 | The most records audience.list, category.list, plan.list or template.list returns in one step; a larger limit is cut to it. |
| `gzip_size` | 1 MiB | The most uncompressed text gzip takes and gunzip gives back. |
| `random_string_length` | 1024 characters | The longest text randomString makes. |
| `webhook_multipart_field_size` | 1 MiB | The largest value of one field of a multipart webhook call. |
| `added_name_length` | 32 characters | The longest short name a publisher gives an automation or channel they add. |
| `added_label_length` | 128 characters | The longest label a publisher gives an automation or channel they add. |
| `channel_name_length` | 32 characters | The longest name a plugin's channel may have on a site. |
<!-- reference:end limits -->
