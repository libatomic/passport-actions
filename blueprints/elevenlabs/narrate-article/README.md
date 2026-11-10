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

### The template input

What is read is set by the workflow's `template` input, not a template record.
It is filled in at install and can be changed by editing the workflow. The
default reads the title and publish date, then the body:

```
<p>{{ .article.title }} was published on {{ timeFormat .article.published_at "dddd, MMMM D, YYYY" "America/New_York" }}.</p>{{ .distribution.body }}
```

`{{ .distribution.body }}` marks where the body goes. The workflow puts the
body (after the restricted-block rewrite) into the template and renders the
two together for the audience, so template actions in both run. A template
without the placeholder is read before the body; an empty template reads the
body alone. Write it as HTML on one line: the input field is single-line, and
each `<p>` becomes its own paragraph.

### Editing what is read

The admin shows a narration distribution's body as the list of paragraphs that
will be read. Each can be edited (as plain text) or switched off, which marks
it `data-narration="skip"`. Restricted-content tags appear as markers that
can't be edited, and each paragraph says whether it is read for the
distribution's audience or replaced by the spoken fallback. "Edit HTML" opens
the source. None of this changes the article.

An edited body is flagged as `context.body_edited`. **Update Distribution**
(after the article changes) then asks before replacing the edits with the
article's current text.

With **Narration Preview** installed (it comes with the package), the editor
also offers:

- **Spoken text**: exactly what will be read for the distribution's audience,
  using the unsaved body: template, spoken fallback, skipped paragraphs and
  pronunciations applied, with the character count against the model's
  limit. Nothing is sent to ElevenLabs.
- **Listen** (the play button on a paragraph): reads that paragraph in the
  voice, with the pronunciations and cleanup applied. Each sample uses
  ElevenLabs characters (about the paragraph's length). The audio comes back
  in the preview run itself, at a lower bitrate; no asset is saved. Samples
  are capped at 2,000 characters.

### Pronunciations

The `pronunciations` input is a list of **Term** → **Say as** pairs, applied
to the text just before it is read: `Wemby` → `Wem-bee`, `NBA` → `N B A`,
`Dr.` → `Doctor`, `$5M` → `5 million dollars`. A term matches with the same
capitalization, as a whole word (so `US` → `U S` leaves "us" and "USA"
alone), and characters such as `.`, `+` and `$` are matched literally. Rules
apply in order, each to the result of the ones before it.

### Numbers and symbols

With `text_cleanup` on (the default), a built-in set of rules rewrites what
the voice tends to misread, after the pronunciations (so a pronunciation for
the same text wins):

| Written | Read as |
|---|---|
| `$5M`, `$1.2 billion`, `$250K` | 5 million dollars, 1.2 billion dollars, 250 thousand dollars |
| `45%` | 45 percent |
| `No. 1`, `#3` | number 1, number 3 |
| `6'9"`, `5’11”` | 6 foot 9, 5 foot 11 |
| `2025-26` (seasons) | 2025 26 |
| `112-108`, `3 – 2` (scores, records, ranges) | 112 to 108, 3 to 2 |
| `vs.`, `vs`, ` & ` | versus, and |
| `e.g.`, `i.e.`, `etc.`, `Jr.`, `Sr.` | for example, that is, et cetera, Junior, Senior |

`21-year-old`, `3-pointer`, `6-foot-9` and `AT&T` are left alone. A date
written `11-10-2026` would be misread ("11 to 10-2026"); write dates out.
The rules are the `cleanup` list in the `blocks` step. An AI rewrite for the
long tail is planned; the blueprint marks where it goes.

Turning the cleanup on or off, or changing a rule, changes the text of the
articles it touches, so their next **Publish Now** regenerates the audio.

Changing the list changes the text, so the next **Publish Now** of an
affected article regenerates its audio; articles the change doesn't touch
are skipped as unchanged. Narration Preview has its own copy of the
inputs: keep the two the same (the package installer fills both).

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
distribution as `context.channel_error`, which the admin shows under the
distribution. An empty text (nothing readable for the audience) is recorded the
same way.

> The run *exits* rather than *fails* in these cases, so the distribution
> still shows as published; the error under it says why there is no audio.

A long article takes several minutes to generate; the request allows 15
minutes.

## Inputs

| Input | Default | Description |
|---|---|---|
| `voice_id` | — (required) | ElevenLabs voice id. Run **List ElevenLabs Voices** to find it |
| `model_id` | `eleven_flash_v2_5` | See Length |
| `fallback_text` | "The rest of this section is for subscribers. Subscribe to hear the full article." | Read in place of hidden restricted sections |
| `template` | Title and publish date, then the body (see above) | What is read around the body |
| `skip_selectors` | WordPress chrome (see above) | Comma-separated CSS selectors not to read |
| `pronunciations` | none | Term → Say as replacements (see Pronunciations) |
| `text_cleanup` | on | Rewrite numbers, symbols and abbreviations (see Numbers and symbols) |

## Recorded on the distribution (`context`)

| Key | Meaning |
|---|---|
| `asset_id` | The MP3 asset. The admin plays it under the distribution |
| `text_hash` | sha256 of the text, voice and model; decides whether a republish regenerates |
| `characters` | Length of the text sent |
| `characters_billed` | ElevenLabs' `character-cost` header for the request |
| `voice_id`, `model_id` | What generated the audio |
| `generated_at` | When |
| `channel_error` | Why the last run stopped without audio; empty after a successful run. The admin shows it under the distribution |
| `body_edited` | Set by the admin when the body was edited for narration |

The asset's `metadata.narration` carries the distribution, article, audience,
voice, model and text hash too, and its duration is read from the MP3.

## Requirements

- Secret `ELEVENLABS_API_KEY`: a restricted key with **Text to Speech**
  access. Give it a credit limit in ElevenLabs to cap spending.
- `api.elevenlabs.io` on the instance's HTTP allowlist.
- Atomic with `http.*` `response_asset`, `asset.delete`, `htmlText`, `sha256`,
  `distribution.render` `as_audience`/`body`, and template-less distributions
  rendering their own body (earlier builds panic on them).

## Restricted-block rewrite

The rewrite is a `regexReplace` in the `blocks`/`rewrite` steps. It matches an
`if hasAnyAudience` or `if audiences` block with no other template action
nested inside it, with or without an `{{ else }}`, and replaces the else
branch. Other blocks (e.g. legacy `isChannel`) are left alone. A block that
nests another template action keeps its original else branch, so its web
call to action would be read. The expressions (and the pronunciation and cleanup steps)
are pinned by `pkg/atomic/workflow_expr_narration_test.go` in atomic and
copied into `elevenlabs/narration-preview`; keep all three in sync.
