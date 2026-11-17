# ElevenLabs Narration

Reads articles aloud with an ElevenLabs voice: a premade voice, or a clone of
your own writer or host created (and consent-verified) in the ElevenLabs
dashboard.

## What you get

- **Create Audio Narration**, on an article's **Extensions** menu. Running it
  reads the article aloud as one audience sees it and saves the result as a
  private MP3 in the site's assets. Restricted sections the audience cannot
  access are replaced by a short spoken note.
- **A narration editor** in its form: the article's body as the paragraphs
  that will be read, each editable or switched off; restricted sections
  marked as read or not read for the chosen audience; "Spoken text" to see
  exactly what will be read; a play button to hear a paragraph in the voice;
  right-click a word to set its pronunciation; a list of the voice tags the
  model understands.
- **A Voice menu** in the form, when more than one voice is listed.
- **List ElevenLabs voices**, a tool that lists your voices with their ids
  and shows the characters left this month. It has nothing to set up, so it
  is not added: it sits under **Tools** on the plugin's Automations tab with
  a **Run** button.

Narration is not a channel. It makes an asset; a channel then publishes it
(see [Publishing a narration](#publishing-a-narration)).

## What you need from ElevenLabs

- An account on a plan with enough characters for what you narrate. Every
  request is billed, paragraphs played from the form included.
- An API key restricted to Text to Speech (Access), Voices (Read) and User
  (Read). It goes in the plugin's Settings.
- A voice. A professional voice clone cannot be used until ElevenLabs has
  finished training it.

## Setting up

1. Install the plugin and save the API key under **Settings**. **Test
   connection** shows your plan and the characters left.
2. On **Automations**, add **Create audio narration**. Pick the default voice
   from the menu, choose the model, and adjust what is read.
3. Enable it. **Create Audio Narration** appears on the Extensions menu of
   every article that has a body.

## Creating a narration

1. Open the article and choose **Extensions, Create Audio Narration**.
2. Pick the **Audience** the narration is for, and the **Voice** if there is
   a menu.
3. Under **What is read**, change a paragraph's wording, switch paragraphs
   off, give a restricted section its own "Read instead" line, play a
   paragraph, or open **Spoken text**.
4. Run it. The page shows the run's progress and then the narration as a
   player. The article's page keeps a list of the narrations made for it.

**One narration per audience.** Run it once for each audience that should
get its own version. Each audience keeps its own MP3.

**Running it again** for the same article and audience replaces that MP3 in
place: it keeps its id and link, so whatever already uses it plays the new
audio. The form opens with what was read last time; **Start from the
record** goes back to the article's current body. A run always reads again
and is always billed, even when nothing changed.

A run fails, with the reason shown, when there is nothing to read for the
audience or the text is longer than "Longest article to read".

The MP3 is named `narration-<article id>-<audience id>.mp3`. The name has
nothing in it that can change, which is what lets a later run replace it.
Its description is "Narration of" and the article's title.

## Publishing a narration

For now the publisher does this by hand: create a podcast distribution for
the article and its audience and pick the narration's asset as its audio.
The asset is private, and there is one per audience: pick the one made for
the distribution's audience.

Nothing publishes or withdraws a narration automatically, and deleting an
article does not delete its narrations: remove them under Assets.

## Settings

| Section | Setting | What it does |
|---|---|---|
| Voice | Default voice | The voice that reads unless another is picked in the form |
| | Default voice name | What the Voice menu calls the default voice |
| | Other voices | Voices the form offers instead, each chosen from your account's voices and given a name. With none, the form has no Voice menu |
| | Model | Quality, cost and which voice tags work. Each request carries at most 40,000 characters on Flash v2.5 and Turbo v2.5, 10,000 on Multilingual v2 and v4, 5,000 on v3; a longer article is read in several requests and joined |
| | Longest article to read | A run fails above this many characters. 0 reads any length |
| What is read | Read around the article | A template around the text from the form. `{{ .script }}` is where that text goes. It is not shown in the editor; "Spoken text" includes it |
| | Spoken note for restricted sections | Read once in place of sections the audience cannot access. Empty skips them silently |
| | Page parts to skip | CSS selectors that are not read |
| Pronunciation and cleanup | Pronunciations | Term and Say as pairs, whole words, same capitalization |
| | Clean up numbers and symbols | $5M becomes "5 million dollars", 112-108 becomes "112 to 108" |

## What a run and a preview do

| Request | Result |
|---|---|
| Run | Renders the form's text for the audience, generates the MP3 (in several requests for a long article, joined), saves it as a private asset and hands back the asset, its file name, the characters read and billed, and the number of requests |
| Spoken text (preview) | Returns the text that would be read, its length and the limit. Changes nothing; not billed |
| A paragraph's play button (preview) | Reads that paragraph, at most 2,000 characters, and returns the audio. Saves nothing; billed |

The asset's metadata (`metadata.narration`) records the article, audience,
voice, model, number of requests and a hash of the spoken text.

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
| `automations/narrate.yaml` | The Create Audio Narration extension: settings, the form, the steps |
| `actions/speech.create.yaml` | One text-to-speech request, stored as an MP3 asset |
| `actions/speech.sample.yaml` | A short sample returned as base64, for previews |
| `actions/voices.list.yaml` | The account's voices |
| `actions/usage.get.yaml` | Plan and characters used |
| `automations/list-voices.yaml` | The List ElevenLabs voices tool (under Tools; never added) |
| `automations/ping.yaml` | Test connection |
| `tests/narrate.yaml` | Dry-run cases |

Converted from v1; see [MIGRATION.md](MIGRATION.md).
