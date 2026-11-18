# ElevenLabs Narration

Reads articles aloud with an ElevenLabs voice: a premade voice, or a clone of
your own writer or host created (and consent-verified) in the ElevenLabs
dashboard.

## What you get

- **Create Audio Narration**, on an article's **Extensions** menu. Running it
  reads the article aloud once for each audience you choose, as that
  audience sees it: restricted sections the audience cannot access are
  replaced by a short spoken note.
- **One narration asset that gives each member their version.** Each
  audience's MP3 is protected: only that audience's members (and admins) can
  fetch it. The MP3s are filed as the versions of a single narration, with
  one id and one address. Whoever plays it gets the MP3 for their audience.
- **A narration editor** in its form: the article's body as the paragraphs
  that will be read, each editable or switched off; restricted sections
  marked as read or not read for the "Preview as" audience; "Spoken text" to see
  exactly what will be read; a play button to hear a paragraph in the voice;
  right-click a word to set its pronunciation; a list of the voice tags the
  model understands.
- **A Voice menu** in the form, when more than one voice is listed.

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
2. On **Extensions**, add **Create audio narration**. Give it a short name
   (`main`, say) and a label, pick the default voice from the menu, choose
   the model, and adjust what is read.
3. Enable it. It appears under its label on the Extensions menu of every
   article that has a body.

Add it again for another voice, model or language: each one has its own
settings and is its own item on the Extensions menu, so give each a label
that tells them apart ("Narrate in Spanish"). Each makes a narration of its
own for an article; they never replace one another's.

## Creating a narration

1. Open the article and choose **Extensions, Create Audio Narration**.
2. Under **Make audio for**, pick every audience that should get its own
   version, and the **Voice** if there is a menu. **Preview as** picks the
   one audience the editor marks restricted sections for and "Spoken text"
   is shown for; left empty, "Spoken text" uses the first audience chosen.
3. Under **What is read**, change a paragraph's wording, switch paragraphs
   off, give a restricted section its own "Read instead" line, play a
   paragraph, or open **Spoken text**.
4. Run it. The page shows the run's progress and then the narration as a
   player. The article's page keeps a list of the narrations made for it.

**Who hears which version.**

- A member of one of the audiences gets that audience's version.
- A member of several gets the version of the best-ranked one, in the order
  the site's audiences are ranked. A version read for an audience includes
  what the audiences ranked below it may see, so the better version is never
  missing anything the lower one has. An unranked audience is read as itself
  alone.
- A member in none of the audiences gets no audio: the narration answers
  them as a file that does not exist. If everyone should hear something,
  include your widest audience under **Make audio for**.
- Admins hear the best-ranked audience's version.

**Running it again** for the same article reads every chosen audience again
and replaces their MP3s. The narration keeps its id and link, so whatever
already uses it plays the new audio. The form opens with what was read last
time; **Start from the record** goes back to the article's current body. A
run always reads again and is always billed, even when nothing changed.

**Leaving an audience out of a later run** takes its version out of the
narration: its members no longer get audio from it. That audience's MP3 is
not deleted. It stays under Assets as a protected file, for that audience
only, until you delete it there.

A run fails, with the reason shown, when for one of the audiences there is
nothing to read or the text is longer than "Longest article to read". The
reason names the audience. The check is made for every audience before
anything is read, so such a run sends nothing to ElevenLabs and is not
billed. A run that fails later (ElevenLabs refuses a request, say) leaves
the narration and the versions it had not reached as they were.

Files:

| File | Name |
|---|---|
| The narration | `narration-<article id>-<short name>.mp3` |
| Each audience's MP3 | `narration-<article id>-<short name>-<audience id>.mp3` |

The short name is the one given to the extension when it was added.

The names have nothing in them that can change, which is what lets a later
run replace them. The narration's description is "Narration of" and the
article's title; each MP3's adds the audience's name.

## Publishing a narration

Create a podcast distribution for the article and pick the narration (the
asset named `narration-<article id>-<short name>.mp3`, not one of the per-audience MP3s)
as its audio. Every reader's feed carries the same address for the episode,
and each reader's podcast app is given the MP3 for their audience when it
fetches the audio. One distribution serves every audience the narration was
made for; a reader in none of them sees the episode and cannot fetch its
audio.

A feed states an episode's size and duration once, from one version, chosen
when the episode is written: for a distribution sent to an audience, that
audience's version. A reader who gets another version (they are also in a
better-ranked audience) sees that stated duration and hears a file of a
different length. Podcast apps treat both numbers as hints.

Nothing publishes or withdraws a narration automatically, and deleting an
article does not delete its narration or the MP3s: remove them under
Assets, the narration first (an MP3 cannot be deleted while it is one of a
narration's versions).

## Settings

| Section | Setting | What it does |
|---|---|---|
| Voice | Default voice | The voice that reads unless another is picked in the form |
| | Default voice name | What the Voice menu calls the default voice |
| | Other voices | Voices the form offers instead, each chosen from your account's voices and given a name. With none, the form has no Voice menu |
| | Model | Quality, cost and which voice tags work. Each request carries at most 40,000 characters on Flash v2.5 and Turbo v2.5, 10,000 on Multilingual v2 and v4, 5,000 on v3; a longer article is read in several requests and joined |
| | Longest article to read | A run fails, before anything is read, when the text for any one audience is longer than this many characters. 0 reads any length |
| What is read | Read around the article | A template around the text from the form. `{{ .script }}` is where that text goes. It is not shown in the editor; "Spoken text" includes it |
| | Spoken note for restricted sections | Read once in place of sections the audience cannot access. Empty skips them silently |
| | Page parts to skip | CSS selectors that are not read |
| Pronunciation and cleanup | Pronunciations | Term and Say as pairs, whole words, same capitalization |
| | Clean up numbers and symbols | $5M becomes "5 million dollars", 112-108 becomes "112 to 108" |

## What a run and a preview do

The extension has two flows in `automations/narrate.yaml`: `run`, which a
person starts from the article's page, and `preview`, which the form's
paragraph editor asks for. Each has its own steps; both prepare the text
with the action `narration.text`. The preview flow may only read and call
ElevenLabs, so it cannot save or change anything.

| Request | Result |
|---|---|
| Run (the `run` flow) | For each audience chosen: renders the form's text as that audience, generates the MP3 (in several requests for a long article, joined) and saves it as a protected asset. Then files the MP3s as the versions of one narration. Hands back the narration, its file name, what was read and billed for each audience, and the totals |
| Spoken text (the `preview` flow, no sample) | Returns the text that would be read for the "Preview as" audience (or the first one chosen), its length and the limit. Changes nothing; not billed |
| A paragraph's play button (the `preview` flow, with the paragraph as its sample) | Reads that paragraph, at most 2,000 characters, and returns the audio. Saves nothing; billed |

Each MP3's metadata (`metadata.narration`) records the article, audience,
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
| `automations/narrate.yaml` | The Create Audio Narration extension: settings, the form, and its two flows, `run` and `preview` |
| `actions/narration.text.yaml` | The text a voice reads for one audience: render, pronunciations, cleanup, voice tags, pieces |
| `actions/narration.create.yaml` | One audience's MP3: every piece read and joined, as a protected asset |
| `actions/speech.create.yaml` | One text-to-speech request, stored as an MP3 asset |
| `actions/speech.sample.yaml` | A short sample returned as base64, for previews |
| `actions/voices.list.yaml` | The account's voices |
| `actions/usage.get.yaml` | Plan and characters used |
| `automations/ping.yaml` | Test connection |
| `tests/narrate.yaml`, `tests/narration.text.yaml`, `tests/narration.create.yaml` | Dry-run cases |

Converted from v1; see [MIGRATION.md](MIGRATION.md).
