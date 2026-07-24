# AI Text Generation (GitHub Models)

Generates text with an LLM through **GitHub Models**. Shipped as a **manual**
workflow so you can experiment with prompts, then wire the generation step into
a real workflow.

Uses the published GitHub Action `actions/ai-inference@v2`. See the
[GitHub Action blueprints overview](../README.md) for how `uses:` steps work.

## When it fires

**Manual** — click **Run Now**. Nothing happens automatically.

## What it does

| Step | Action | Purpose |
|---|---|---|
| `generate` | `actions/ai-inference@v2` | Send the prompt, return the completion |

The model's text lands on `steps.generate.outputs.response`, ready to feed into
a later step.

## Requirements

**Secret**

| Name | Value |
|---|---|
| `GH_MODELS_TOKEN` | A GitHub PAT with the **`models: read`** permission |

**Inputs**

| Input | Required | Default | Description |
|---|---|---|---|
| `prompt` | yes | — | The prompt to send |
| `system_prompt` | no | `You are a helpful assistant for a subscription publishing platform.` | Steers tone/behavior |
| `model` | no | `openai/gpt-4o-mini` | GitHub Models catalog id |

Fine-grained PATs expose **Models → Read-only** under account permissions.

## Setup

1. Create a PAT with `models: read` and store it as `GH_MODELS_TOKEN`.
2. Install the blueprint, save, and **Run Now** with a test prompt.
3. Inspect `steps.generate.outputs.response` in the run detail.

## Using it for real

Copy the `generate` step into a workflow that has a trigger, and consume the
output — for example draft show notes from an article and attach them to a
distribution:

```yaml
- id: generate
  uses: actions/ai-inference@v2
  with:
    token: ${{ secrets.GH_MODELS_TOKEN }}
    prompt: "Write show notes for: ${{ steps.load.outputs.article.body }}"
- id: save
  action: distribution.update
  with:
    distribution_id: ${{ trigger.distribution_id }}
    summary: ${{ steps.generate.outputs.response }}
```

## Notes

- **Rate limits and cost** are governed by your GitHub account's Models access.
- **Review generated content** before publishing it to subscribers — treat the
  output as a draft, not a finished artifact.
- Swap `model` for any id in the GitHub Models catalog.
