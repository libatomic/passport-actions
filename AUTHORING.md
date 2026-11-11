# Authoring workflows and blueprints

This is the starting point for writing a Passport workflow, blueprint, recipe or
package, whether by hand or with an AI assistant. It lists every building block
the engine and the admin offer, the patterns that combine them, and the mistakes
that are easy to make. Reach for these before asking for new engine code: most
integrations need only YAML.

| For | Read |
|---|---|
| Every builtin action's inputs and outputs, every expression function with examples | [BUILTINS.md](BUILTINS.md) |
| A plain-language tour (triggers, steps, branches, loops, inputs, secrets) | [WORKFLOW.md](WORKFLOW.md) |
| The engine's full reference (validation, run lifecycle, API, policy) | `atomic/docs/WORKFLOW.md` in the atomic repo |
| Blueprint anatomy and the directory | [blueprints/README.md](blueprints/README.md) |
| Packages (`package.yml`, the Settings page) | [packages/README.md](packages/README.md) |
| Event body schemas | [schemas/README.md](schemas/README.md) |
| Recipes (`includes:`) and external actions (`uses:`) | [README.md](README.md) |

Reference implementations worth copying:

| Blueprint | Shows |
|---|---|
| `elevenlabs/narrate-article` | A custom channel with publish / republish / delete / preview, per-audience rendering, a file output (`response_asset`), change detection (`sha256`), text processing (`htmlText`, `replaceEach`), `workflow.fail`, admin editor hints (`ui`) |
| `spotify/create-episode` + `spotify/episode-status` | A podcast-shaped, application-pinned channel; recording the destination id; a status companion |
| `fb/page-post`, `x/post` | Minimal text channels |
| `cm/*` (Campaign Monitor package) | A vendor integration as a package of event workflows with shared settings |

## Blueprint anatomy

```yaml
name: Audio Narration (ElevenLabs)        # card title
icon: https://…/account-voice.svg
description: |                             # shown before install; say what it needs
  …
category: content                          # library grouping
inputs:                                    # what the installer asks for (mirror of definition.inputs)
  voice_id: { label: Voice, type: string, required: true, default: "" }
definition:                                # the workflow itself
  name: Audio Narration (ElevenLabs)
  on: [ … ]
  inputs: { … }                            # what the workflow reads as inputs.*
  steps: [ … ]
```

- Keep the top-level `inputs` and `definition.inputs` identical (the admin merges
  them, the definition wins).
- Installed values become **input defaults** in the stored workflow: event,
  schedule and distribution runs use the defaults. Give every input a `label`,
  and a `description` or `hint`; the install wizard and the package Settings page
  show them.
- `runtime: true` marks an input supplied per run (a manual run, an admin panel, a
  preview), not configured: the installer and Settings page skip it.
- `type: list` with `items: [{name, label}]` renders a rows editor (e.g. a
  Term → Say as table); `type: bool` a switch; `enum` a dropdown.
- A blueprint that should ship with others belongs in a **package**
  (`packages/<name>/package.yml`). Installed workflows are tagged
  `metadata.package`, and the package gets a **Settings → Workflows → <label>**
  page that edits each input once across all its workflows. `settings:` in the
  manifest groups those inputs into sections.

## Triggers (`on:`)

| Kind | Declare | The run gets |
|---|---|---|
| Event | `- event: user.created` (optional `if:`, schema ref) | `trigger.body` = the event body, `trigger.user_id` |
| Manual | `- manual: true` | Run from the admin or `POST /workflows/{id}/run` with `inputs` (and `wait` for the result) |
| Schedule | `- schedule: 24h` | Runs on the interval |
| Webhook | `- webhook: true` (`name`, `validate`, `ip_allowlist`, `foreach`, `response_status`) | `trigger.body` = the parsed payload |
| Distribution | `- distribution: { channel, … }` | Defines a custom **distribution channel**; see below |

A workflow can list several triggers, except that a distribution trigger must be
its only one.

### Distribution trigger fields

| Field | Meaning |
|---|---|
| `channel` | Channel name (not a built-in) |
| `label` | Shown in the admin's Add Distribution menu |
| `mode` | `broadcast` (publish once) or `unicast` (once per audience member, with `trigger.user_id`) |
| `base_type` | `podcast` / `rss` / `email` / `sms`: reuse that channel's editor (e.g. a media file) |
| `content_type`, `max_body_length` | `html` or `text`, and a body cap; enforced by the API |
| `requires_audience` | A broadcast channel must still pick an audience (e.g. to render per audience) |
| `application` | Offer only that application's audiences in the picker |
| `address`, `connect_url` | Member identity fields and a Connect button (unicast) |
| `preview` | `true`: the workflow answers `trigger.action: "preview"` with no side effects (see Previews) |
| `ui` | Free-form hints for the admin's distribution editor (see [Admin editor hints](#admin-editor-hints-ui)) |

`trigger.action` tells the run what to do: `publish`, `republish` (update what
you published, don't duplicate it), `delete` (remove it; runs before the row is
deleted, a failure keeps the distribution), and `preview` (manual, only with
`preview: true`).

## Step kinds

| Kind | Shape | Notes |
|---|---|---|
| Action | `action: <name>` + `with:` | Builtins (below) |
| External action | `uses: owner/repo/path@ref` | Node actions in `actions/` |
| Recipe | `includes: owner/repo/recipes/x@ref` + `with:` | Reusable step fragments in `recipes/` |
| Branch | `if:` + `then:` (+ `else:`) | `if:` alone skips one step |
| Switch | `switch:` + `cases: [{when, steps}]`, `default:` | |
| Loops | `foreach:` + `steps:`; `while:` / `until:` | |
| Wait | `action: wait` (top level only) | Suspends the run; resumes later |
| Errors | `continue-on-error: true`, `on_error: [steps]`, `timeout:` | Per step; `steps.<id>.error.detail.body` has an HTTP error body |
| Named outputs | `outputs: { name: ${{ … }} }` on any step | Become `outputs.<name>` and the run's outputs (what a manual run, a status check or a preview returns) |

## Builtin actions

Full inputs and outputs: [BUILTINS.md](BUILTINS.md).

| Group | Actions |
|---|---|
| Users | `user.get`, `user.create`, `user.update`, `user.audienceRefresh`, `user.feed.invalidate` |
| Messaging | `sendmail`, `sendsms` |
| Audiences, templates, jobs | `audience.view`, `audience.get`, `application.get`, `template.render`, `transmute`, `instance.cache.flush`, `job.get`, `job.create` |
| Commerce | `plan.get`, `option.get`, `subscription.get`, `credit.get`, `credit.invite.create`, `entitlement.get` / `.create` / `.update` / `.delete` |
| Content | `article.get`, `feed.item.create`, `distribution.get`, `distribution.render` (`as_audience`, `body`), `distribution.create`, `distribution.update` |
| Files | `asset.get` (`link`), `asset.create`, `asset.update`, `asset.delete` |
| HTTP | `http.get` / `.post` / `.put` / `.patch` / `.delete` (`response_asset` saves a file response as an asset) |
| Flow | `log`, `sleep`, `set-output`, `vars.set`, `event.emit`, `workflow.run`, `workflow.exit`, `workflow.fail`, `wait` |

## Expression functions

Full list with examples: [BUILTINS.md](BUILTINS.md#expression-functions). Highlights
for content work:

| Function | Use |
|---|---|
| `htmlText(html, selectors…)` | HTML → readable paragraphs; always drops non-content markup and `data-text="skip"`, pass what else to drop |
| `replaceEach(text, rules, opts)` | Apply a list of replacements (a settings table, a cleanup list): `literal`, `word`, `ignoreCase`, custom row keys |
| `regexReplace`, `regexMatch`, `regexFind`, `regexQuote` | RE2 regexes; `regexQuote` escapes text for a pattern |
| `sha256(s)` | Detect that content changed since the last run |
| `merge(a, b)` | Combine maps (the **first** argument wins): keep a distribution's other context keys |
| `split`, `join`, `replace`, `trim`, `len`, `let x = …;` | Plain string work; `len` counts bytes |
| `map`, `filter`, `reduce`, `first`, `dig`, `keys`, `coalesce`, `default` | Collections and fallbacks |
| `date`, `now`, `fromNow`, `duration` | Time |
| `publicURL`, `tokenURL`, `isSubscriber`, `hasAudience` | Instance and user context |

Inside templates rendered by `distribution.render` / `template.render`, the
template functions apply instead (`timeFormat`, `hasAnyAudience`, `audiences`, …).

## Patterns

### A custom distribution channel

1. Load the distribution: `distribution.get` with `${{ trigger.distribution_id }}`.
2. Branch on `trigger.action`: `delete` removes what was published (exit after);
   `preview` computes and returns without side effects (see below).
3. Render: `distribution.render` (add `as_audience: true` to render once as the
   audience, `body:` to render a modified copy).
4. Publish to the destination (`http.*`, usually in a recipe), or produce a file.
5. Record what you made with `distribution.update` and `context` only (allowed
   while the distribution is publishing). `context` **replaces** the map, so merge
   the existing keys back in:
   `${{ merge({"my_id": steps.post.outputs.body.id}, steps.load.outputs.distribution.context) }}`.
6. If it can't publish, `workflow.fail` with a reason: the publish fails and the
   admin shows why.

### Files (audio, images, PDFs)

`http.*` with `response_asset: { filename, mime_type, overwrite: true }` stores
the response as an asset, written only once complete; `overwrite` keeps the
asset id and link across republishes. Record `context.asset_id` and the admin
plays or opens it under the distribution. Remove it on `delete` with
`asset.delete` (`continue-on-error: true`). Never put binary in `outputs`.

### Per-audience content

`distribution.render` with `as_audience: true` renders as a member of the
distribution's audience: `{{ if hasAnyAudience "…" }}` blocks it can see render,
the rest render their `{{ else }}` branch. One distribution per audience gives one
version per audience.

### Only redo work when something changed

Hash the inputs that matter (`sha256(text + "|" + voice)`), keep the hash in the
distribution's `context`, and on `republish` skip the expensive call when the
hash matches and the previous result still exists (`asset.get` with
`continue-on-error`).

### Previews

With `preview: true` on the trigger, the admin runs the workflow manually with
`trigger: {distribution_id, action: "preview", preview: {body}}` and `inputs`,
and reads the run's `outputs`. Compute a `mode` first
(`trigger.action != "preview" ? "run" : …`), exit with `outputs` before any side
effect, and add `if: ${{ steps.mode.outputs.mode == "run" }}` to the side-effect
steps as a backstop. A preview may return media as base64 in an output when the
API offers it (e.g. ElevenLabs' `with-timestamps`), never as a saved asset.

### Status of what was published

A separate manual blueprint with a top-level `channel: <name>` becomes the
channel's status check (*Check status* in the admin). It takes a `runtime: true`
`distribution_id` and returns `status` (`success` | `pending` | `failed` |
`removed`), `status_updated_at`, `failures`, and writes them to context as
`channel_status` etc. See `spotify/episode-status`.

## Admin contracts

Keys and settings the admin understands without knowing the channel:

| Where | Key | Admin shows |
|---|---|---|
| Distribution `context` | `channel_link` | *Open on <label>* |
| Distribution `context` | `asset_id` (+ `generated_at`, `characters_billed`) | An inline player or file link, its duration and those details |
| Distribution `context` | `channel_error` | *Last run stopped: …* (prefer `workflow.fail`) |
| Distribution `context` | `channel_status`, `channel_status_updated_at`, `channel_failures`, `channel_status_checked_at` | Status, failures, an **Error** state |
| Distribution `context` | `body_edited` | Set by the admin when the body was edited; **Update Distribution** asks before replacing it |
| Run outputs | `status`, `failures` (status companion); anything (manual runs, previews) | Shown or consumed by the caller |
| Workflow inputs | `label`, `hint`, `description`, `type`, `enum`, `items`, `runtime` | Install wizard, Settings page, Run dialog |
| `package.yml` | `settings:` sections | Settings → Workflows → <package> layout |

### Admin editor hints (`ui`)

Set on the distribution trigger; the engine ignores them. The admin reads them
from the channel's workflow.

| Hint | Effect |
|---|---|
| `body_editor: paragraphs` | Edit an HTML body as its paragraphs: edit text, switch a paragraph off (`data-text="skip"`), restricted sections shown as markers with whether they're used for the distribution's audience (an `{{ else }}` branch is used by audiences without access, unless `section_line` replaces it) |
| `preview_label: <text>` | Label of the preview button (default "Preview"); needs `preview: true` |
| `skip_input: <input>` | The input holding CSS selectors that aren't used (the editor leaves those parts out of the list) |
| `section_line: {input, label}` | The workflow replaces each restricted section's `{{ else }}` branch with a line: the editor shows an editable line per section, defaulting to the value of `input` (e.g. a shared fallback), labelled `label`. A section's own line is saved as `<p data-text="instead">` right after its `{{ else }}`; the workflow must keep such sections |
| `sample: audio` | A play button per paragraph: a preview run with `inputs.listen` set to the paragraph, expecting an `audio` output (base64, `audio_type` optional); needs `preview: true` |
| `term_list: {input, find, replace, label}` | Right-click a word to add or edit a row in that list input (e.g. pronunciations), saved across the package; chips show the rows that match a paragraph; the dialog's sample passes the unsaved list as that input |

The preview button runs a preview without `inputs.listen` and shows outputs
`text` (paragraphs separated by blank lines), and `characters`, `limit`,
`model_id` when present.

## Gotchas

- **`}}` ends an expression.** A `${{ … }}` span stops at the first `}}`, so a
  literal `{{ else }}` or a regex with `\}\}` can't appear inside one. Put such
  strings in a `set-output` step (as plain values) and reference them.
- **YAML `: ` in a plain scalar** (e.g. `a ? "x" : "y"`) breaks parsing. Use a
  folded block (`key: >-`) for long or ternary expressions.
- **Map literals in closures.** `map(list, {"a": #.x})` parses the braces as a
  closure; write `map(list, ({"a": #.x}))`.
- **`$` in replacements.** `regexReplace` expands `$1` / `${1}`; double a literal
  `$` (`replace(s, "$", "$$")`) or use `replaceEach` with `literal: true`.
- **`merge` order.** The first map wins: `merge(new, old)` keeps your new keys.
- **`len` counts bytes**, not characters.
- **`distribution.update` `context` replaces** the whole map (merge it).
- **No binary in outputs or `body`**: use `response_asset`, or a base64 JSON API.
- **`http.*` `retries` is total attempts**, and each paid attempt is billed.
- **Side effects in previews**: gate them, or a preview publishes.
- **Don't put integration-specific logic in Go.** If a missing builtin blocks a
  pattern, ask for a generic one (a function, an action option) rather than an
  integration action.

## Checklist

1. Declare every input in both `inputs` blocks, with `label` and a hint;
   `runtime: true` for per-run ones; secrets via `${{ secrets.NAME }}`.
2. Put vendor calls in a recipe if more than one blueprint makes them.
3. For a channel: handle `publish`, `republish`, `delete` (and `preview` if
   declared); record ids in `context` with `merge`; `workflow.fail` when it can't
   publish.
4. Add a README next to the blueprint (what it does, inputs, context keys,
   requirements), and a package entry if it ships with others.
5. Validate: install it from your branch (Workflows → Settings → Integration
   source branch) and run it; keep expressions that do real logic pinned by a
   test in atomic (see `pkg/atomic/workflow_expr_narration_test.go`).
