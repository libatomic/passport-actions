# ElevenLabs — Narration Preview

A manual workflow that the admin's narration editor runs to preview **Audio
Narration** (`elevenlabs/narrate-article`). There is no need to run it by hand.

It exists separately because a workflow that defines a distribution channel
can't be run manually. It repeats the narration's text steps (restricted-block
rewrite, template, render as the audience, fallback de-duplication, `htmlText`,
pronunciations, the built-in cleanup and the per-model limit) word for word.

## Modes

| Inputs (runtime) | Result in the run's `outputs` | ElevenLabs |
|---|---|---|
| `distribution_id`, optional `body` (unsaved edits; empty uses the saved body) | `text`, `characters`, `limit`, `model_id`, `mode: text` | not called |
| `listen` (up to 2,000 characters) | `text` (after pronunciations), `characters`, `asset_id` of the sample, `mode: listen` | one text-to-speech request, billed |

The sample is stored as the private asset `narration-preview.mp3` and replaced
(same asset id) by every sample. A longer `listen` text exits without calling
ElevenLabs.

## Inputs

`voice_id`, `model_id`, `fallback_text`, `template`, `skip_selectors`,
`pronunciations` and `text_cleanup` mean the same as on Audio Narration and must have the same
values, or the preview won't match what is published. The package installer
carries them from Audio Narration; after installing, change both workflows (or
reinstall the package with update in place).

## Requirements

The same as Audio Narration: the `ELEVENLABS_API_KEY` secret (Text to Speech)
and `api.elevenlabs.io` on the HTTP allowlist. The admin finds this workflow by
its `metadata.blueprint_source` (`elevenlabs/narration-preview`), so install it
from the package or the blueprint library rather than pasting the YAML.
