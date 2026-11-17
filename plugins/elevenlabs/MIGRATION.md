# ElevenLabs: v1 to v2

Converted 14 November 2026 from `passport-actions` `master` at commit
`d55677d` (PR 8, audio-narration):

- `packages/elevenlabs/package.yml`
- `blueprints/elevenlabs/narrate-article/blueprint.yml`
- `blueprints/elevenlabs/list-voices/blueprint.yml`

If v1 changes after `d55677d`, diff those files against that commit and
carry the change over.

**16 November 2026: narration is an extension, not a channel** (PSPT-1013,
epic PSPT-940). The first conversion made v1's `on: distribution` blueprint
a channel, `channels/narration.yaml`. Narration does not publish a
distribution anywhere: it makes an asset that a channel can then use. So it
is now `automations/narrate.yaml`, an automation with `extension:` that a
person runs on one article. The channel file and its test are gone. The
`blocks` step (every pattern and cleanup rule), the voice-tag sets and the
text pipeline (rewrite, compose, render, text, speech, pronounce, cleanup,
tags, measure, pieces, generate, join) are carried over from the channel,
which had them from v1, with the renames below.

**What has been run.** `passport-plugin check` (built from atomic `develop`)
reports nothing, and every case in `tests/narrate.yaml` passes as a dry run.
In a dry run the expressions and functions (`htmlText`, `replaceEach`,
`chunkText`, the patterns) run for real; `template.render`, the ElevenLabs
requests and `asset.concat` are answered from samples. Nothing has been run
against a Passport site or ElevenLabs.

## What became what

| v1 | v2 |
|---|---|
| package `elevenlabs` | `plugin.yaml` (`id: elevenlabs`) |
| secret `ELEVENLABS_API_KEY` | plugin setting `api_key` (secret), read as `secrets.api_key` |
| "api.elevenlabs.io must be on the instance's HTTP allowlist" | `allowed_hosts` in `plugin.yaml` |
| blueprint `narrate-article`, `on: distribution` | `automations/narrate.yaml`, `extension: { on: article }` |
| the "narration" entry in an article's Add Distribution menu | **Create Audio Narration** on the article's Extensions menu |
| the distribution trigger's `ui:` editor hints | `ui.paragraphs` on the `script` input |
| the distribution's body, edited in the narration editor | input `script` (`format: html`, `widget: paragraphs`), which starts as the article's body and is remembered from the last run on the article |
| the distribution's audience | input `audience` (`format: passport.audience`, required) |
| blueprint inputs filled in at install | the extension's `settings` |
| `package.yml` `settings:` sections | `settings.ui.layout`, same three sections |
| `ui.choice` (Voice menu, saved in `context.voice`) | input `voice`, read as `inputs.voice` |
| input `listen` (`runtime: true`) | `trigger.preview.sample`, set by a paragraph's play button |
| `trigger.preview.body` (the editor's unsaved body) | `inputs.script` as it is on screen |
| the `load` step (`distribution.get`) | removed; the run has the record as `article` |
| `distribution.render` with `as_audience` | `template.render` with `body`, `article_id`, `audience_id` |
| the rendered title (`steps.render.outputs.title`) | `article.title` |
| publish and republish | a run (`trigger.action` `run`); a second run for the same article and audience replaces the MP3 |
| delete (removes the MP3) | nothing: see "What an extension cannot do yet" |
| what was recorded in the distribution's `context` | the run's outputs (`asset_id`, `filename`, `characters`, `characters_billed`, `requests`) and the asset's `metadata.narration` |
| the `tts` step's `http.post` | action `elevenlabs/speech.create` |
| the `sample` step's `http.post` | action `elevenlabs/speech.sample` |
| blueprint `list-voices` | `automations/list-voices.yaml`, on actions `voices.list` and `usage.get` |
| (none) | `automations/ping.yaml`, the plugin's Test connection |

### Where each v1 input went

| v1 input | v2 | Change |
|---|---|---|
| `voice_id` | setting `voice_id` | A menu of the account's voices (`ui.options` from `voices.list`); falls back to a text box if the call fails |
| `voice_name` | setting `voice_name` | |
| `voices` (list: label, voice_id) | setting `voices`, array of objects | Both columns required per row; the voice is picked from a menu of the account's voices |
| `model_id` | setting `model_id`, `enum` with labels | Values unchanged |
| `max_characters` | setting `max_characters`, integer, minimum 0 | |
| `template` | setting `template`, `format: template` | The placeholder is `{{ .script }}`; v1's `{{ .distribution.body }}` is still recognised, so a template carried over works. Code editor instead of a single-line box |
| `fallback_text` | setting `fallback_text`, textarea | Also the starting value of each restricted section's "Read instead" line (`section_line`) |
| `skip_parts` (comma-separated string) | setting `skip_parts`, **array of strings** | The steps join it with `", "` before `htmlText`, which is what v1 passed |
| `pronunciations` (list: term, say_as) | setting `pronunciations`, array of objects | |
| `text_cleanup` | setting `text_cleanup`, boolean | |
| `listen` (per run) | `trigger.preview.sample` | Not a field; never stored |

## Decisions that change behaviour or naming

1. **One narration per run, for one audience.** The form asks for the
   audience; the narration is rendered as a member of it. A publisher who
   wants a free and a paid version runs it twice.
2. **The file is named after the article and the audience**:
   `narration-<article id>-<audience id>.mp3`, pieces
   `…-part-<n>.mp3`. v1 named it from the first three words of the title
   and the distribution's number (`Fishing_the_Ozarks-887.mp3`) and kept
   the chosen name in the distribution's `context`. An extension has nowhere
   to keep a chosen name, and a name with the title in it would stop a
   second run replacing the first after the title changed. The title is in
   the asset's description.
3. **The unchanged-text check is gone.** v1 skipped ElevenLabs on a
   republish when the spoken text, voice and model were unchanged, because
   a republish can happen for reasons that have nothing to do with the
   audio. A run of an extension is a person asking for a narration, perhaps
   because the last take sounded wrong, so every run reads again and is
   billed. The hash is still written to `metadata.narration.text_hash`.
4. **Not `multiple`.** The channel could be added more than once (a second
   language or show). Two of this extension would write the same file name
   for the same article and audience and replace each other's MP3. Telling
   them apart needs the added automation's own name in the file name, and
   the guide does not list one among what a run can read. Until it does, the
   extension is added once.
5. **The restricted-section rewrite is kept in the steps.** A section an
   editor gave its own line carries it in the text (`data-text="instead"`)
   and it is read. The guide does not say that the editor writes anything
   for a section nobody edited, so for those the steps still put the
   "Spoken note for restricted sections" setting in the else branch before
   rendering, read it once however many sections are hidden, and collapse
   `isChannel "web"` blocks, as v1 did. If the editor does write the
   starting line into every section, this step finds nothing to do.
6. **The wrapper template is applied by the steps, not shown in the
   editor.** "Read around the article" goes around the form's text before
   the render. "Spoken text" shows it; the paragraph list does not.
7. **Preview results are set by the preview steps**, with step-level
   `outputs:` and `workflow.exit`, as the channel did. The declared
   `outputs`/`returns` describe a run only (`asset_id` is required there).
8. **A missing audience fails a run with a plain reason.** The form
   requires it; the `no-audience` step covers a run started some other way.
   A preview may come before the audience is chosen, and then renders with
   no audience.
9. **Offered when the article has a body** (`extension.if`), published or
   not.
10. **The Voice menu.** The form lists the choice equal to the field's
    default first and marks it "(default)" (guide 2.8). The default voice
    is not one of the "Other voices" rows, so `ui.options.items` adds it in
    front of them, named by "Default voice name". With no other voices the
    list is empty and the menu is hidden, as in v1.
11. **`previous` / `next` of the first and last piece are `nil`**, as in
    v1. A nil `with:` value is an absent input, and `speech.create` passes
    an absent one to ElevenLabs as `null`.
12. **Asset metadata** is the typed `narration` object of `speech.create`
    without `distribution_id`: article, audience, voice, model, hash,
    requests.
13. **Lead-in silence stays hardcoded** at 0.5 seconds in the `join` step,
    and the pause lengths in the `blocks` step's tag rules, as in v1.
14. **`category: audio`** for the plugin (v1 package: `integrations`).
15. **The YAML anchor** `&expressive_tags` is kept so eleven_v3 and
    eleven_v4 share one tag set.
16. **`list-voices` is a tool.** Manual, no settings: it is listed under
    Tools with a Run button and is never added (guide 5.4).

## Next step: the narration as a protected asset a channel uses

Not available yet, and not used here:

- **Audiences on asset steps** (PSPT-1056): the MP3 saved as a protected
  asset for its audience, in place of a private one.
- **A built-in that makes a virtual asset from several** (PSPT-1058): one
  narration with a variant per audience, so a podcast distribution names one
  asset and each member hears their audience's version.

Until then this version makes one narration per run, for the chosen
audience, as a private asset, and the publisher picks that asset on a
podcast distribution by hand.

## What an extension cannot do yet, that v1's narration did

- **Clean up.** Deleting the v1 distribution deleted its MP3. Nothing runs
  when an article is deleted or a narration is no longer wanted; the MP3
  stays under Assets until someone deletes it.
- **Follow the article.** A v1 narration was republished with its
  distribution, and could be scheduled. An extension runs only when a
  person runs it, so an edited article keeps its old narration until
  someone runs it again.
- **Reach members by itself.** The v1 distribution carried the audio
  (`context.asset_id`) to its audience. Now a second, manual step puts the
  asset on a podcast distribution. See "Next step".
- **Be added twice.** See decision 4.

## Needs Jon

- v1 narrations are distributions on channel `narration`, with the MP3 in
  `context.asset_id` and the Voice pick in `context.voice`. Nothing here
  reads them. Decide whether they are left as they are, or their assets
  renamed to the new file names so a first run of the extension replaces
  them in place.
- A v1 "What is read" template still works (its `{{ .distribution.body }}`
  is recognised), but anything else it reads from `.distribution` is not
  there: the render is given the article and the audience only.
- The default wrapper says "was published on" with
  `.article.published_at`. The extension is offered for an unpublished
  article too. What `timeFormat` gives for an article with no publish date
  has not been tried; either the default or `extension.if` may need to
  change.
- The admin's narration editor lives on the admin app's `audio-narration`
  branch and reads v1 names. It must read the hints from the `script`
  input's `ui.paragraphs`; `skip_parts` as a list; the audience from the
  form's `audience` field. It must send a paragraph's sample as
  `trigger.preview.sample`, and the pronunciation dialog's unsaved list as
  unsaved settings for that preview (guide 5.7).
- Whether `list-voices` is still worth shipping now that both voice
  settings are menus. It remains the only place that shows a voice id and
  the quota.
- `list-voices`, `ping` and the four actions have no test cases.

## What v2 still expresses awkwardly or not at all

- **Preview results are undeclared.** The guide says a preview returns
  `audio` and `audio_type`, or `text`, `characters`, `limit` and `note`, as
  outputs, but an automation's `outputs`/`returns` describe one result, and
  a preview has none of a run's. They are set with step-level `outputs:`
  before `workflow.exit`, and nothing checks their shape.
- **The default voice has to be added to its own menu by an expression.**
  See decision 10.
- **The name of an added automation is not among what a run can read**
  (guide, "What a run can read"), so two added from one definition cannot
  name what they make apart. See decision 4.
- **The guide does not say what the editor writes for a restricted section
  nobody edited** (whether `section_line`'s starting value is put in the
  text). See decision 5.
