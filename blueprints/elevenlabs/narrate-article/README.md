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
| `preview` | the admin's narration editor (**Spoken text**, **Listen**) | Returns the text that would be read, or reads a short sample; changes nothing (see Preview) |

After the article is edited, the admin shows the usual *"The article has been
updated since this distribution was last published"* warning. Press **Update
Distribution** to copy the new body in, then **Publish Now**.

A publish **fails**, with the reason shown on the distribution, when there is
nothing to read for the audience or the text is longer than the model allows
(`workflow.fail`). Fix the body or the model and publish again.

### One version per audience

The body is rendered **as a member of the distribution's audience**
(`distribution.render` with `as_audience: true`). Restricted-content blocks
(`{{ if hasAnyAudience "…" }}…{{ else }}…{{ end }}`) the audience can see are
read; for blocks it can't see, the web call to action in the `{{ else }}`
branch is replaced by `fallback_text`, read in the same voice. If several
blocks are hidden, the fallback is read once. An empty `fallback_text` skips
hidden blocks silently.

When a restricted block has a distribution view, passport-wp syncs its
subscriber branch as `{{ if isChannel "web" }}` web view `{{ else }}`
distribution view `{{ end }}`. Narration reads the **web view**: the full
text, not the shorter email version. The admin's paragraph editor
(`ui.channel_view: web`) reduces each such block to its web view when the body
is copied from the article or opened, so you edit the web paragraphs, and a
restricted block nested inside the web view stays one. The workflow also
collapses any left in the body (a body that never went through the editor),
but only when nothing is nested in the web view.

A restricted block with another one nested inside it can't take
`fallback_text`: audiences without access hear its own call to action, unless
you give it its own line in the editor.

A section can have its own line instead of `fallback_text`: in the admin's
narration editor, edit the section's **Read instead** line. It is stored as
`<p data-text="instead">…</p>` right after the section's `{{ else }}` (the
editor adds an else branch if there is none), and the rest of the else branch
is marked `data-text="skip"`. The workflow keeps such a section as it is, so
audiences without access hear that line; sections without one still get
`fallback_text`, read once. Emptying the line (or the reset button) goes back
to `fallback_text`. The older `data-narration="spoken"` marker still works.

Add one narration distribution per audience that should get its own version,
for example one for free readers and one for paid subscribers.

### What is read

`htmlText` turns the rendered HTML into paragraphs. It always skips markup
that isn't content (scripts, styles, forms, embeds) and anything marked
`data-text="skip"`. The `skip_parts` input says what else isn't read; its
default skips images, media, figures, tables, code, navigation, anything with
`class="no-audio"` or `data-narration="skip"`, and WordPress chrome (buttons,
post title, date, categories, author, share and related blocks).

### The template input

What is read is set by the workflow's `template` input, not a template record.
It is filled in at install and can be changed under **Settings → Workflows →
ElevenLabs Narration**. The default reads the title and publish date, then a
long pause (a voice tag: a 2-second break, or `[long pause]` on `eleven_v3`;
see Voice tags), then the body:

```
<p>{{ .article.title }} was published on {{ timeFormat .article.published_at "dddd, MMMM D, YYYY" "America/New_York" }}. [long pause]</p>{{ .distribution.body }}
```

`{{ .distribution.body }}` marks where the body goes. The workflow puts the
body (after the restricted-block rewrite) into the template and renders the
two together for the audience, so template actions in both run. A template
without the placeholder is read before the body; an empty template reads the
body alone. Write it as HTML on one line: the input field is single-line, and
each `<p>` becomes its own paragraph.

### Editing what is read

The channel's `ui:` hints (`body_editor: paragraphs` and the rest) make the
admin show a narration distribution's body as the list of paragraphs that
will be read. Each can be edited (as plain text) or switched off, which marks
it `data-text="skip"`. Restricted-content tags appear as markers that can't be
edited, and each paragraph says whether it is read for the distribution's
audience or replaced. "Edit HTML" opens the source. None of this changes the
article.

An edited body is flagged as `context.body_edited`. **Update Distribution**
(after the article changes) then asks before replacing the edits with the
article's current text.

### Preview

The trigger declares `preview: true`, so the editor can run this workflow as a
preview (`trigger.action: "preview"`, no side effects):

- **Spoken text**: exactly what would be read for the distribution's audience,
  using the unsaved body (`trigger.preview.body`): template, fallback, skipped
  paragraphs, pronunciations, cleanup and voice tags applied (as sent: breaks on
  models other than eleven_v3), with the character count
  (against `max_characters` when it is set) and, for a long article, how many
  requests it takes. Outputs `text`, `characters`, `limit` (`max_characters`,
  0 for none), `requests` and `note`. Nothing is sent to ElevenLabs.
- **Listen** (the play button on a paragraph, and in the pronunciation
  dialog): reads the `listen` input in the voice, with pronunciations and
  cleanup applied (the dialog passes its unsaved list as `pronunciations`).
  The `with-timestamps` request returns the MP3 as base64 at 32 kbps, as the
  `audio` output; no asset is saved. Each sample uses ElevenLabs characters
  and is capped at 2,000 characters.

### Pronunciations

In the narration editor, right-click a word (or a selected phrase) in a
paragraph and choose **Add pronunciation** to add it to this list without
leaving the distribution; the dialog plays the sentence with the new Say as
before saving. Rules that apply to a paragraph show as chips under it (click
one to edit or remove it). Shift + right-click keeps the browser's own menu.
This is the channel's `ui.term_list` hint.

The `pronunciations` input is a list of **Term** → **Say as** pairs, applied
to the text just before it is read (`replaceEach` with `literal` and `word`):
`Wemby` → `Wem-bee`, `NBA` → `N B A`, `Dr.` → `Doctor`, `$5M` →
`5 million dollars`. A term matches with the same capitalization, as a whole
word (so `US` → `U S` leaves "us" and "USA" alone), and characters such as
`.`, `+` and `$` are matched literally. Rules apply in order, each to the
result of the ones before it.

Changing the list changes the text, so the next **Publish Now** of an
affected article regenerates its audio; articles the change doesn't touch
are skipped as unchanged.

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
The rules are the `cleanup` list in the `blocks` step, applied with
`replaceEach`. An AI rewrite for the long tail is planned; the blueprint
marks where it goes.

Turning the cleanup on or off, or changing a rule, changes the text of the
articles it touches, so their next **Publish Now** regenerates the audio.

### Voices

`voice_id` is the default voice, and `voice_name` what the menu calls it.
List others in `voices` (Name, Voice id) and the distribution form shows a
**Voice** menu: the default first ("Jon (default)"), then the list.
The pick is saved on the distribution (`context.voice`); a pick that is no
longer listed falls back to the default. The voice is part of the change
hash, so a new pick regenerates the audio on the next **Publish Now**. Listen
and the pronunciation dialog's sample use the pick, even before it is saved.
With no other voices there is no menu.

### Voice tags

Editors type tags into the body's text (the **Voice tags** button in the
editor lists them for the channel's model and inserts one at the cursor):

| Tag | `eleven_v3` | Other models |
|---|---|---|
| `[short pause]`, `[pause]`, `[long pause]` | Read as tags | `<break time="0.5s" />`, `1s`, `2s` |
| `[pause 1.5s]` | `[pause]` | `<break time="1.5s" />` (at most 3s) |
| `[whispers]`, `[sighs]`, `[laughs]`, `[chuckles]`, `[clears throat]`, … | Read as tags | Left out |
| Emotions: `[excited]`, `[sad]`, `[curious]`, `[sarcastic]`, `[deadpan]`, … | Read as tags | Left out |
| Sounds: `[applause]`, `[clapping]`, `[gulps]` | Read as tags | Left out |
| `[strong British accent]` (any accent), `[sings]` | Experimental | Left out |

The `tags` step applies the blocks step's `tags_v3` / `tags_other` rules after
the cleanup. Only the listed tag words are left out on other models, so other
bracketed text in an article (`[sic]`, an editor's insertion) is still read.
ElevenLabs notes that tags work best when they suit the voice, that many
breaks in one request can make the voice speed up or add noise, and that
professional voice clones aren't fully tuned for `eleven_v3`.

### Length

Each model takes a limited amount of text per request (per ElevenLabs'
`/v1/models`):

| Model | Per request (characters) | Notes |
|---|---|---|
| `eleven_flash_v2_5` (default) | 40,000 | Fast; one request covers nearly every article |
| `eleven_turbo_v2_5` | 40,000 | |
| `eleven_multilingual_v2` | 10,000 | Most natural |
| `eleven_v3` | 5,000 | Most expressive |

Longer text is split by `chunkText` into pieces of at most 95% of that (some
headroom in case ElevenLabs counts characters differently), breaking between
paragraphs, then sentences, then words. Each piece is one request, written as
`narration-<distribution id>-part-<n>.mp3`; `asset.concat` then joins them
frame by frame into `narration-<distribution id>.mp3` (overwriting it, so the
asset keeps its id) and deletes the parts. Text that fits in one request is
written straight to the narration, as before.

- **Joins**: each request also gets the text before and after its piece
  (`previous_text`/`next_text`), so the voice carries on naturally across a
  join. `eleven_v3` supports neither that nor ElevenLabs' request stitching,
  so its pieces are read on their own; a join on v3 can sound like a fresh
  start.
- **Failures**: the published MP3 is only replaced after every piece has
  been read and joined. A run that fails partway leaves it as it was, and can
  leave part assets behind; the next successful publish overwrites and
  deletes them.
- **Cost**: ElevenLabs bills the text of every request. `characters_billed`
  adds up the requests' `character-cost` headers.
- **Time**: requests run one after another; each allows 15 minutes.

`max_characters` (0 by default, no limit) caps the length of article a
publish will read, to cap what one article can cost. The count is in bytes,
so accented letters and curly quotes count more than once. Text over it, or
no text at all, fails the publish with the reason.

## Inputs

All of these are set under **Settings → Workflows → ElevenLabs Narration**.

| Input | Default | Description |
|---|---|---|
| `voice_id` | — (required) | The default voice: an ElevenLabs voice id. Run **List ElevenLabs Voices** to find it |
| `voice_name` | none | What the Voice menu calls the default voice (e.g. the narrator's name) |
| `voices` | none | Other voices a distribution can pick (Name, Voice id); see Voices |
| `model_id` | `eleven_flash_v2_5` | See Length |
| `fallback_text` | "The rest of this section is for subscribers. Subscribe to hear the full article." | Read in place of hidden restricted sections |
| `template` | Title and publish date, then the body (see above) | What is read around the body |
| `skip_parts` | Media, figures, tables, code, navigation, `.no-audio`, WordPress chrome | Comma-separated CSS selectors not to read. Was `skip_selectors`, which only listed what `htmlText` didn't already skip; renamed so a reinstall doesn't keep an old value |
| `pronunciations` | none | Term → Say as replacements (see Pronunciations) |
| `text_cleanup` | on | Rewrite numbers, symbols and abbreviations (see Numbers and symbols) |
| `max_characters` | 0 (no limit) | Longest text a publish will read (see Length) |
| `listen` | — (runtime) | Set by the editor for a Listen preview; not configured |

## Recorded on the distribution (`context`)

| Key | Meaning |
|---|---|
| `asset_id` | The MP3 asset. The admin plays it under the distribution |
| `text_hash` | sha256 of the text, voice and model; decides whether a republish regenerates |
| `characters` | Length of the text sent |
| `characters_billed` | ElevenLabs' `character-cost` headers, summed across the requests |
| `requests` | How many requests read it (more than 1 for a long article; see Length) |
| `voice` | The distribution's Voice pick, set by the admin (see Voices) |
| `voice_id`, `model_id` | What generated the audio |
| `generated_at` | When |
| `channel_error` | Cleared on a successful publish (older versions recorded stops here; failures are now the publish's own error) |
| `body_edited` | Set by the admin when the body was edited for narration |

The asset's `metadata.narration` carries the distribution, article, audience,
voice, model, text hash and number of requests too, and its duration is read
from the MP3 (the joined one, for a long article).

## Requirements

- Secret `ELEVENLABS_API_KEY`: a restricted key with **Text to Speech**
  access. Give it a credit limit in ElevenLabs to cap spending.
- `api.elevenlabs.io` on the instance's HTTP allowlist.
- Atomic with `http.*` `response_asset`, `asset.delete`, `asset.concat`,
  `htmlText`, `sha256`, `replaceEach`, `chunkText`, `workflow.fail`, `distribution.render` `as_audience`/`body`,
  distribution-trigger `preview`/`ui`, and template-less distributions
  rendering their own body.

## Restricted-block rewrite

The rewrite is a `regexReplace` in the `blocks`/`rewrite` steps. It matches an
`if hasAnyAudience` or `if audiences` block with no other template action
nested inside it, with or without an `{{ else }}`, and replaces the else
branch. A section whose else tag is followed (past closing tags and
whitespace) by `<p data-text="instead">` (or `data-narration="spoken"`) is
protected first: its else tag is swapped for `custom_open`, which the pattern
doesn't match, and swapped back afterwards. Other blocks (e.g. legacy
`isChannel "email"`) are left alone. A block that nests another template action keeps
its original else branch, so its web call to action would be read. The
web view nested in a restricted block is handled first: `web_pattern` collapses
each `if isChannel "web"` block (with the `<template-content>` wrapper
passport-wp puts around its opening tag, and `"` or `&#34;` quotes) to its web
branch, so the restricted block no longer nests an action and the rewrite
above matches it. A web view that itself contains a template action isn't
collapsed, and the distribution view is read instead. The
expressions are pinned by `pkg/atomic/workflow_expr_narration_test.go` in
atomic; keep the two in sync.
