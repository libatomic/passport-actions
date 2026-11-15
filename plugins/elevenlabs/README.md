# ElevenLabs Narration

Reads articles aloud with an ElevenLabs voice: a premade voice, or a clone of
your own writer or host created (and consent-verified) in the ElevenLabs
dashboard.

## What you get

- **An Audio Narration channel.** Publishing a distribution on it reads the
  body aloud as its audience sees it and stores the result as a private MP3.
  Restricted sections the audience cannot access are replaced by a short
  spoken note.
- **A narration editor** on the distribution: the body as the paragraphs that
  will be read, each editable or switched off; a preview of the exact spoken
  text; a play button to hear a paragraph in the voice; right-click a word to
  set its pronunciation; a list of the voice tags the model understands.
- **A Voice menu per distribution**, when the channel lists more than one
  voice.
- **List ElevenLabs voices**, a tool that lists your voices with their ids
  and shows the characters left this month. It has nothing to set up, so it
  is not added: it sits under **Tools** on the plugin's Automations tab with
  a **Run** button.

## What you need from ElevenLabs

- An account on a plan with enough characters for what you publish. Every
  request is billed, spoken samples included.
- An API key restricted to Text to Speech (Access), Voices (Read) and User
  (Read). It goes in the plugin's Settings.
- A voice. A professional voice clone cannot be used until ElevenLabs has
  finished training it.

## Setting up

1. Install the plugin and save the API key under **Settings**. **Test
   connection** shows your plan and the characters left.
2. On **Channels**, add **Audio Narration**. Pick the default voice from the
   menu, choose the model, and adjust what is read.
3. Enable it. "Audio Narration" (or the label you gave it) appears in an
   article's Add Distribution menu.

The channel can be added more than once, for a second language, show or
house style. Each has its own voices, model, template and pronunciations.

## The channel's settings

| Section | Setting | What it does |
|---|---|---|
| Voice | Default voice | The voice that reads unless a distribution picks another |
| | Default voice name | What the Voice menu calls the default voice |
| | Other voices | Voices a distribution can pick instead, each chosen from your account's voices and given a name. With none, a distribution has no Voice menu |
| | Model | Quality, cost and which voice tags work. Each request carries at most 40,000 characters on Flash v2.5 and Turbo v2.5, 10,000 on Multilingual v2 and v4, 5,000 on v3; a longer article is read in several requests and joined |
| | Longest article to read | A publish fails above this many characters. 0 reads any length |
| What is read | What is read | A template around the body. `{{ .distribution.body }}` is where the body goes |
| | Spoken note for restricted sections | Read once in place of sections the audience cannot access. Empty skips them silently |
| | Page parts to skip | CSS selectors that are not read |
| Pronunciation and cleanup | Pronunciations | Term and Say as pairs, whole words, same capitalization |
| | Clean up numbers and symbols | $5M becomes "5 million dollars", 112-108 becomes "112 to 108" |

## What happens on each request

| Request | Result |
|---|---|
| Publish | Renders the body for the audience, generates the MP3, records it on the distribution |
| Republish | The same, but if the spoken text, voice and model are unchanged and the MP3 still exists, ElevenLabs is not called. Otherwise the MP3 is replaced in place and keeps its id and link |
| Delete | Deletes the MP3. A missing MP3 does not block the delete |
| Preview | Returns the text that would be read, or, from a paragraph's play button (`trigger.preview.sample`), reads that paragraph, at most 2,000 characters. Changes nothing |

A publish fails, with the reason shown on the distribution, when there is
nothing to read for the audience or the text is longer than "Longest article
to read".

The MP3 is named from the first three words of the title and the
distribution's number (`Fishing_the_Ozarks-887.mp3`). The name is chosen at
the first publish and kept, so a later title change does not move the file.

## What the channel records on the distribution

In the distribution's `context`: `asset_id` (the admin plays it inline),
`generated_at`, `characters`, `characters_billed`, `requests`, `voice_id`,
`model_id`, `filename`, and `text_hash` (how a republish knows nothing
changed).

## Voice tags

Typed into the text in square brackets, just before the words they change.

| Model | Tags |
|---|---|
| Every model | `[short pause]`, `[pause]`, `[long pause]`, `[pause 1.5s]` (up to 3 seconds) |
| v3 and v4 only | `[whispers]`, `[sighs]`, `[laughs]`, emotions such as `[excited]`, a few sounds, accents |

On the other models pauses are sent as breaks and the v3-only tags are left
out. Tags are suggestions; not every voice responds to every tag.

## Files

| File | |
|---|---|
| `plugin.yaml` | Manifest; the shared API key |
| `channels/narration.yaml` | The channel: settings, the distribution form, the steps |
| `actions/speech.create.yaml` | One text-to-speech request, stored as an MP3 asset |
| `actions/speech.sample.yaml` | A short sample returned as base64, for previews |
| `actions/voices.list.yaml` | The account's voices |
| `actions/usage.get.yaml` | Plan and characters used |
| `automations/list-voices.yaml` | The List ElevenLabs voices tool (under Tools; never added) |
| `automations/ping.yaml` | Test connection |
| `tests/narration.yaml` | Dry-run cases |

Converted from v1; see [MIGRATION.md](MIGRATION.md).
