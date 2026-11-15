# ElevenLabs: v1 to v2

Converted 14 November 2026 from `passport-actions` `master` at commit
`d55677d` (PR 8, audio-narration):

- `packages/elevenlabs/package.yml`
- `blueprints/elevenlabs/narrate-article/blueprint.yml`
- `blueprints/elevenlabs/list-voices/blueprint.yml`

**Nothing here has been run.** The v2 engine does not exist yet, so the files
have only been parsed as YAML and compared with v1 by script: the `blocks`
step (every pattern and cleanup rule) and the voice-tag sets are identical to
v1, and every step expression is identical apart from the renames listed
below. If v1 changes after `d55677d`, diff those files against that commit
and carry the change over.

## What became what

| v1 | v2 |
|---|---|
| package `elevenlabs` | `plugin.yaml` (`id: elevenlabs`) |
| secret `ELEVENLABS_API_KEY` | plugin setting `api_key` (secret), read as `secrets.api_key` |
| "api.elevenlabs.io must be on the instance's HTTP allowlist" | `allowed_hosts` in `plugin.yaml` |
| blueprint `narrate-article`, `on: distribution` | `channels/narration.yaml` |
| the distribution trigger's fields | the `channel` block |
| blueprint inputs filled in at install | the channel's `settings` |
| `package.yml` `settings:` sections | `settings.ui.layout`, same three sections and titles |
| `ui.choice` (Voice menu, saved in `context.voice`) | `distribution` form field `voice`, read as `fields.voice` |
| input `listen` (`runtime: true`) | `trigger.preview.sample`, set by a paragraph's play button |
| `trigger.preview.context.voice` | `fields.voice` (in a preview, the form as it is on screen) |
| the `load` step (`distribution.get`) and `steps.load.outputs.distribution.*` | removed; `distribution.*` is the whole record in every channel run (`distribution["_id"]`, `distribution.article_id`, `distribution.context`, `distribution.body`) |
| the `load` step's named outputs `asset_id`, `text_hash` | named outputs of the `mode` step, same names |
| the `tts` step's `http.post` | action `elevenlabs/speech.create` |
| the `sample` step's `http.post` | action `elevenlabs/speech.sample` |
| blueprint `list-voices` | `automations/list-voices.yaml`, on actions `voices.list` and `usage.get` |
| (none) | `automations/ping.yaml`, the plugin's Test connection |

### Where each v1 input went

| v1 input | v2 | Change |
|---|---|---|
| `voice_id` | channel setting `voice_id` | Now a menu of the account's voices (`ui.options` from `voices.list`); falls back to a text box if the call fails |
| `voice_name` | channel setting `voice_name` | |
| `voices` (list: label, voice_id) | channel setting `voices`, array of objects | Both columns now required per row; the voice is picked from a menu of the account's voices (`ui.options` on the row's `voice_id`) |
| `model_id` | channel setting `model_id`, `enum` with labels | Values unchanged |
| `max_characters` | channel setting `max_characters`, integer, minimum 0 | |
| `template` | channel setting `template`, `format: template` | Code editor instead of a single-line box |
| `fallback_text` | channel setting `fallback_text`, textarea | |
| `skip_parts` (comma-separated string) | channel setting `skip_parts`, **array of strings** | The steps join it with `", "` before `htmlText`, which is what v1 passed |
| `pronunciations` (list: term, say_as) | channel setting `pronunciations`, array of objects | |
| `text_cleanup` | channel setting `text_cleanup`, boolean | |
| `listen` (per run) | `trigger.preview.sample` | Not a field; never stored |

## Decisions that change behaviour or naming

1. **`multiple: true`.** v1 allowed one narration channel. v2 lets a
   publisher add several (a second language or show). Consequence: an added
   channel of a `multiple` definition is always named
   `narration-<short name>`, even when only one is added (guide 6.3).
   Existing v1 distributions are on channel `narration`. If they cannot be
   moved to the new name, set `multiple: false`.
2. **The Voice pick moved from `context.voice` to the distribution form.**
   A distribution published under v1 keeps its pick in `context.voice`, which
   v2 no longer reads. Because `voice` follows the channel's default until
   edited, there is no way inside the steps to tell "never picked" from
   "picked the default", so the steps cannot fall back to `context.voice`.
   Existing picks need a one-time data migration into the form's stored
   value, or they revert to the default voice.
3. **The Voice menu.** The form lists the choice equal to the field's default
   first and marks it "(default)" (guide 2.8), so the label no longer carries
   that text. The default voice is not one of the "Other voices" rows, so
   `ui.options.items` still adds it in front of them, named by "Default
   voice name". With no other voices the expression yields an empty list and
   the menu is hidden, as in v1.
4. **"Other voices" rows pick from a menu** of the account's voices, like the
   default voice. v1 took a typed voice id.
5. **`previous` / `next` of the first and last piece are `nil`**, as in v1.
   A nil `with:` value is an absent input (guide 2.11, rule 5a), and
   `speech.create` passes an absent one to ElevenLabs as `null`.
6. **Asset metadata on the part files** is passed to `speech.create` as a
   typed `narration` object and its ids are converted with `toString`. The
   joined MP3's metadata is the same object. In v1 `requests` and the ids
   were whatever type the engine produced; they are now strings, with
   `requests` an integer. A free-form `additionalProperties: true` object is
   now allowed (guide 2.3) and was not used: the seven keys are fixed, and
   typing them documents what the asset carries.
7. **`inputs.x ?? default` guards are gone** where the setting has a default
   (`text_cleanup`, `max_characters`, `model_id`). Guards remain on settings
   a publisher can leave out (`voice_name`, `voices`, `pronunciations`,
   `fallback_text`, `template`).
8. **Lead-in silence stays hardcoded** at 0.5 seconds in the `join` step, and
   the pause lengths in the `blocks` step's tag rules, as in v1. Neither is
   a setting.
9. **`category: audio`** for the plugin (v1 package: `integrations`).
10. **The YAML anchor** `&expressive_tags` is kept so eleven_v3 and eleven_v4
    share one tag set.
11. **`list-voices` is a tool.** Manual, no settings: it is listed under
    Tools with a Run button and is never added (guide 5.4).

## Needs Jon

- Confirm `multiple` (1) and how existing `narration` distributions and
  their `context.voice` picks are carried over (2).
- The admin's narration editor lives on the admin app's `audio-narration`
  branch and reads v1 names. It must read: `channel.ui.skip_setting`,
  `section_line.setting`, `term_list.setting`, `tags.setting` (v1: `…input`);
  `skip_parts` as a list; the Voice pick from the distribution form. It must
  send a paragraph's sample as `trigger.preview.sample` (v1:
  `inputs.listen`), and the pronunciation dialog's unsaved list as unsaved
  channel settings for that preview (guide 6.5), where v1 passed it as an
  input.
- Whether `list-voices` is still worth shipping now that both voice settings
  are menus. It remains the only place that shows a voice id and the quota.
- A test case for "republish with nothing changed" (needs the real
  `sha256` of the spoken text, which needs a dry run).
- The expected spoken text in the Publish test assumes `htmlText` separates
  paragraphs with a blank line. Unverified until a dry run exists.

## What v2 still expresses awkwardly or not at all

- **A text setting with a default cannot be set to empty.** "Spoken note for
  restricted sections" says "leave empty to skip those sections silently",
  and "What is read" says an empty template reads the body alone. But an
  empty text box is an absent value (guide 2.11, rule 5b) and an absent
  value takes the default (rule 4), so clearing either box brings the
  default back. v1 could store `""`. Until the guide says how a publisher
  clears a defaulted text field, those two behaviours are unreachable from
  the form. The steps still handle an empty value.
- **Preview results are undeclared.** A channel file has no `outputs` or
  `returns`; the preview's `text`, `characters`, `limit`, `requests`, `note`,
  `audio` and `audio_type` are set with step-level `outputs:` (guide 6.5,
  7.5) and nothing checks their shape.
- **The default voice has to be added to its own menu by an expression.**
  See decision 3. A field whose default is not among its listed choices has
  no defined presentation.
