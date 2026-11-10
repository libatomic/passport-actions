# ElevenLabs — List Voices

A manual workflow that lists the voices on your ElevenLabs account and how much
of this month's character quota is left. Installed by the `elevenlabs`
package alongside the Audio Narration channel. Run it from the Workflows page
and copy a `voice_id` into the narration workflow's `voice_id` input.

## Outputs

| Output | Description |
|---|---|
| `voices` | `[{voice_id, name, category, models}]`. `models` lists the models the voice is ready on; a professional clone shows none until ElevenLabs has finished training it, and can't be used before then |
| `tier` | ElevenLabs plan, e.g. `creator` |
| `characters_used` | Characters billed this period |
| `characters_limit` | The period's quota |
| `characters_reset_at` | When the quota resets (RFC3339) |

## Requirements

- Secret `ELEVENLABS_API_KEY` with **Voices** read and **User** read.
- `api.elevenlabs.io` on the instance's HTTP allowlist.
