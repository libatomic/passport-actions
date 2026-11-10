# ElevenLabs — Audio Narration (Distribution)

Defines a custom **`narration` distribution channel**. Publishing a narration
distribution reads its body aloud with an ElevenLabs voice and stores the MP3
as a private asset named `narration-<distribution id>.mp3`. Once installed and
enabled, "Audio Narration" appears in an article's **Add Distribution** menu.

v1 stops at the MP3 asset. Publishing it to a podcast feed, Spotify or a
WordPress player is a later step.

## What it does

| `trigger.action` | Triggered by | Result |
|---|---|---|
| `publish` | first **Publish Now** / scheduled publish | Renders the body for the audience, generates the MP3, records it in the distribution's `context` |
| `republish` | **Publish Now** on an already-published distribution | Same as publish, but if the spoken text, voice and model are unchanged and the MP3 still exists, ElevenLabs isn't called. Otherwise the MP3 is replaced in place: the asset keeps its id |
| `delete` | **Delete** on the distribution | Deletes the MP3 (a missing MP3 doesn't block the delete) |

After the article is edited, the admin shows the usual *"The article has been
updated since this distribution was last published"* warning. Press **Update
Distribution** to copy the new body in, then **Publish Now**.

### One version per audience

The body is rendered **as a member of the distribution's audience**
(`distribution.render` with `as_audience: true`). Restricted-content blocks
(`{{ if hasAnyAudience "…" }}…{{ else }}…{{ end }}`) the audience can see are
read; for blocks it can't see, the web call to action in the `{{ else }}`
branch is replaced by `fallback_text`, read in the same voice. If several
blocks are hidden, the fallback is read once. An empty `fallback_text` skips
hidden blocks silently.

Add one narration distribution per audience that should get its own version,
for example one for free readers and one for paid subscribers.

### What is read

`htmlText` turns the rendered HTML into paragraphs. It always skips scripts,
images, figures, captions, tables, code, forms, navigation, anything with
`class="no-audio"` and anything marked `data-narration="skip"`. The
`skip_selectors` input adds more; its default skips WordPress buttons, the
post title, date, categories, author and share/related blocks.

Leave the distribution's **template empty**: a template's header and footer
would be read aloud. Editors can trim the distribution's body in the editor to
change what is read without touching the article.

### Length

Each model has a per-request limit, checked before ElevenLabs is called
(ElevenLabs doesn't reliably reject longer text, it bills it):

| Model | Limit (characters) | Notes |
|---|---|---|
| `eleven_flash_v2_5` (default) | 40,000 | Fast; covers every article seen so far |
| `eleven_turbo_v2_5` | 40,000 | |
| `eleven_multilingual_v2` | 10,000 | Most natural, but most articles are longer |
| `eleven_v3` | 5,000 | |

The count is in bytes, so accented letters and curly quotes count more than
once. Text over the limit stops the run and records the reason on the
distribution as `context.narration_error`.

> The run currently *exits* rather than *fails* in that case, so the
> distribution still shows as published. Check `narration_error` (or the run)
> if no MP3 appears.

A long article takes several minutes to generate; the request allows 15
minutes.

## Inputs

| Input | Default | Description |
|---|---|---|
| `voice_id` | — (required) | ElevenLabs voice id. Run **List ElevenLabs Voices** to find it |
| `model_id` | `eleven_flash_v2_5` | See Length |
| `fallback_text` | "The rest of this section is for subscribers. Subscribe to hear the full article." | Read in place of hidden restricted sections |
| `intro` | `""` | Optional sentence read first, e.g. an AI-voice disclosure |
| `read_title` | `true` | Read the distribution's title first |
| `skip_selectors` | WordPress chrome (see above) | Comma-separated CSS selectors not to read |

## Recorded on the distribution (`context`)

| Key | Meaning |
|---|---|
| `asset_id` | The MP3 asset |
| `text_hash` | sha256 of the text, voice and model; decides whether a republish regenerates |
| `characters` | Length of the text sent |
| `characters_billed` | ElevenLabs' `character-cost` header for the request |
| `voice_id`, `model_id` | What generated the audio |
| `generated_at` | When |
| `narration_error` | Why the last run stopped without audio; empty after a successful run |

The asset's `metadata.narration` carries the distribution, article, audience,
voice, model and text hash too, and its duration is read from the MP3.

## Requirements

- Secret `ELEVENLABS_API_KEY`: a restricted key with **Text to Speech**
  access. Give it a credit limit in ElevenLabs to cap spending.
- `api.elevenlabs.io` on the instance's HTTP allowlist.
- Atomic with `http.*` `response_asset`, `asset.delete`, `htmlText`, `sha256`
  and `distribution.render` `as_audience`/`body`.

## Restricted-block rewrite

The rewrite is a `regexReplace` in the `blocks`/`rewrite` steps. It matches an
`if hasAnyAudience` or `if audiences` block with no other template action
nested inside it, with or without an `{{ else }}`, and replaces the else
branch. Other blocks (e.g. legacy `isChannel`) are left alone. A block that
nests another template action keeps its original else branch, so its web
call to action would be read. The expressions are pinned by
`pkg/atomic/workflow_expr_narration_test.go` in atomic; keep the two in sync.
