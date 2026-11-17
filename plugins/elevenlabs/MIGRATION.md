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

**16 November 2026: one narration, a version per audience** (PSPT-1013,
PSPT-1058, epic PSPT-1050). A run now reads the article once for each
audience chosen, saves each MP3 as a protected asset for its audience, and
files them as the variants of one virtual asset, which is what the run hands
back. The text pipeline from `render` to `pieces` moved, unchanged, into
action `narration.text`, and the generate and join steps into action
`narration.create`, so the extension can run them once per audience. The
extension had not been released, so `narrate.yaml` was changed in place and
is still 1.0.0; had it been, the change to its inputs would have been a new
major file.

**17 November 2026: flows, and steps that say what they do** (PSPT-940).
An extension no longer has top-level `steps:` and `returns:` with
`extension.preview: true`; it has a `run:` flow and, to answer previews, a
`preview:` flow, each with its own `steps` and `returns`. `narrate.yaml`
was rewritten that way: the run flow lost the `mode` step and the two
preview branches, the preview flow has the steps a preview needs and no
`workflow.exit`, and its `returns` is Passport's fixed preview result
(`text`, `characters`, `limit`, `note`, or `audio` with `audio_type`; the
`requests` count a text preview used to return is not a key of it and was
dropped, the note still says when a text takes several requests). Every
step in the plugin now has a `name`, and a `description` where the action
does not say enough; the comments that explained steps moved into those
descriptions. Nothing a run does changed. Still 1.0.0, as the extension has
not been released.

**What has been run.** `passport-plugin check` (built from atomic `develop`)
reports nothing, and every case in `tests/narrate.yaml`,
`tests/narration.text.yaml` and `tests/narration.create.yaml` passes as a
dry run. In a dry run the expressions and functions (`htmlText`,
`replaceEach`, `chunkText`, the patterns), the loops and the plugin actions'
own steps run for real; `audience.get`, `template.render`, the ElevenLabs
requests, `asset.concat` and `asset.virtual` are answered from samples. So
that an MP3 is stored protected, that the virtual asset accepts the MP3s as
variants and keeps its id on a second run, and who is answered with which
version, are the engine's documented behaviour and have not been seen
working here. Nothing has been run against a Passport site or ElevenLabs.

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
| the distribution's audience | input `audiences` (a list of `passport.audience`, at least one): the audiences read for. Input `preview_audience` is the one the editor marks sections for |
| blueprint inputs filled in at install | the extension's `settings` |
| `package.yml` `settings:` sections | `settings.ui.layout`, same three sections |
| `ui.choice` (Voice menu, saved in `context.voice`) | input `voice`, read as `inputs.voice` |
| input `listen` (`runtime: true`) | `trigger.preview.sample`, set by a paragraph's play button |
| `trigger.preview.body` (the editor's unsaved body) | `inputs.script` as it is on screen |
| the `load` step (`distribution.get`) | removed; the run has the record as `article` |
| `distribution.render` with `as_audience` | `template.render` with `body`, `article_id`, `audience_id`, once per audience, in action `narration.text` |
| the rendered title (`steps.render.outputs.title`) | `article.title` |
| publish and republish | a run (`trigger.action` `run`); a second run for the same article replaces each audience's MP3 and keeps the narration's id |
| one MP3, private | one protected MP3 per audience (`audiences` on `response_asset` and `asset.concat`), filed as the variants of one virtual asset (`asset.virtual`) |
| delete (removes the MP3) | nothing: see "What an extension cannot do yet" |
| what was recorded in the distribution's `context` | the run's outputs (`asset_id`, `filename`, `versions`, `characters`, `characters_billed`, `requests`) and each MP3's `metadata.narration` |
| the steps from `render` to `pieces` | action `elevenlabs/narration.text` |
| the `generate` and `join` steps | action `elevenlabs/narration.create` |
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

1. **One narration per article, with a version per audience.** The form
   asks who to make audio for; the text is rendered once for each audience,
   as a member of it and of every audience ranked below it, and each
   version is a protected MP3. The run hands back one virtual asset whose
   variants they are. (The first conversion made one private MP3 per run,
   for one audience.)
2. **Files are named after the article, and the audience**: the virtual
   asset `narration-<article id>.mp3`, each audience's MP3
   `narration-<article id>-<audience id>.mp3`, pieces `…-part-<n>.mp3`. v1
   named the MP3 from the first three words of the title and the
   distribution's number (`Fishing_the_Ozarks-887.mp3`) and kept the chosen
   name in the distribution's `context`. An extension has nowhere to keep a
   chosen name, and a name with the title in it would stop a second run
   replacing the first after the title changed. The title is in the
   assets' descriptions.
3. **The unchanged-text check is gone.** v1 skipped ElevenLabs on a
   republish when the spoken text, voice and model were unchanged, because
   a republish can happen for reasons that have nothing to do with the
   audio. A run of an extension is a person asking for a narration, perhaps
   because the last take sounded wrong, so every run reads again and is
   billed. The hash is still written to `metadata.narration.text_hash`.
4. **Not `multiple`.** The channel could be added more than once (a second
   language or show). Two of this extension would write the same file names
   for the same article and replace each other's narration. Telling
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
7. **A preview is its own flow.** `preview:` has its own steps, which name
   the result with step-level `outputs:`, and its own `returns`, held to
   `passport/schemas/extension.preview.result@1`. The declared `outputs`
   and `run.returns` describe a run only (`asset_id` is required there).
   (Until 17 November 2026 the preview was two branches of one list of
   steps, each ended by `workflow.exit`.)
8. **A run needs at least one audience; a preview does not.** The form
   requires "Make audio for", and inputs supplied any other way are held to
   the same schema (the dry run refuses a run without it before any step),
   so there is no step for it. A preview may come before an audience is
   chosen, and then renders for nobody in particular.
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
    requests. It is on each audience's MP3; the virtual asset has none of
    its own (a read of it shows the answering variant's).
13. **Lead-in silence stays hardcoded** at 0.5 seconds in
    `narration.create`'s `join` step, and the pause lengths in
    `narration.text`'s tag rules, as in v1.
14. **`category: audio`** for the plugin (v1 package: `integrations`).
15. **The YAML anchor** `&expressive_tags` is kept so eleven_v3 and
    eleven_v4 share one tag set.
16. **`list-voices` is a tool.** Manual, no settings: it is listed under
    Tools with a Run button and is never added (guide 5.4).
17. **"Preview as" is its own, optional field.** The paragraph editor
    marks restricted sections for one audience, named by a
    `passport.audience` field of the same form (guide 2.6); it cannot name
    the "Make audio for" list. A default in an extension's form is worked
    out when the form opens, from the record and the settings (guide 2.10),
    so it cannot follow the first audience chosen. The field is therefore
    not required and has no default. Left empty, the editor shows
    restricted sections unmarked, and "Spoken text" is rendered for the
    first audience chosen (the `who` step).
18. **No default version, and no setting for one.** A member in none of the
    chosen audiences gets no audio. A virtual asset's default is checked
    like any asset when it answers, so naming one audience's MP3 as the
    default would give nothing to the people a default is for: they are not
    in that audience. A default that works would be another, private or
    public, copy of some version, which is a decision about giving audio
    away and not one a setting should make quietly. A publisher who wants
    everyone to hear something adds their widest audience.
19. **An audience left out of a later run keeps its MP3.** `asset.virtual`
    replaces the variant set, so the audience's version is no longer part
    of the narration, and the engine would then allow `asset.delete` on it.
    The run does not delete it: it does not know what the narration held
    before (it would have to read the virtual asset's variants first), and
    the MP3 may have been picked directly somewhere. It stays a protected
    asset for that audience; the README says so.
20. **Every audience is checked before any is read.** The texts are
    prepared for all the audiences first, and a run that would fail for one
    (nothing to read, or over "Longest article to read") fails naming it
    with nothing sent to ElevenLabs. The limit is per version, as before,
    so a run for three audiences can cost three times the limit.
21. **The pieces are protected too.** `speech.create` takes `audiences` and
    stores each `…-part-<n>.mp3` for the same audience as the MP3 it
    becomes, so a piece is no easier to fetch while a run is going.
22. **The audience's name is looked up** (`audience.get`) for the failure
    reasons and the MP3s' descriptions, one read per audience per run.

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
  narration on a podcast distribution. One distribution is enough: the
  narration answers each reader with their audience's MP3.
- **Remove a version it no longer makes.** See decision 19.
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
  form's `preview_audience` field ("Preview as"), which may be empty. It
  must send a paragraph's sample as
  `trigger.preview.sample`, and the pronunciation dialog's unsaved list as
  unsaved settings for that preview (guide 5.7).
- Whether `list-voices` is still worth shipping now that both voice
  settings are menus. It remains the only place that shows a voice id and
  the quota.
- `list-voices`, `ping` and the actions `speech.create`, `speech.sample`,
  `voices.list` and `usage.get` have no test cases of their own
  (`speech.create`'s steps run inside the `narration.create` and `narrate`
  cases).
- A run on a sandbox, which is the first time any of this meets a real
  site: two ranked audiences and an article with a restricted section;
  check that each MP3 is listed as protected, that the narration is listed
  as virtual with two variants, that a member of each audience and of both
  hears the right one, that a member of neither gets a 404, and that a
  second run keeps the narration's id.
- The admin: the run's result shows `asset_id` as a player (for an admin, the
  best-ranked version), and `versions` is a list of objects, which the
  guide's "anything else as text" does not make readable. The asset picker
  on a podcast distribution must offer the virtual asset, and ideally tell
  it apart from the per-audience MP3s beside it.
- Whether the editor's marks for the "Preview as" audience follow the rank
  order as the render now does (as Paid, a Free section is read). The guide
  (2.6) does not say.
- The form's two audience fields. "Preview as" cannot default to the first
  audience chosen (see decision 17); if the editor could take its audience
  from a list field, or a default could follow another field, it would be
  one field fewer.

## What v2 still expresses awkwardly or not at all

- **The default voice has to be added to its own menu by an expression.**
  See decision 10.
- **The name of an added automation is not among what a run can read**
  (guide, "What a run can read"), so two added from one definition cannot
  name what they make apart. See decision 4.
- **The guide does not say what the editor writes for a restricted section
  nobody edited** (whether `section_line`'s starting value is put in the
  text). See decision 5.
