# 11. Converting from v1

How to turn a v1 integration (blueprints, recipes, a package, perhaps a
vendor plugin) into a v2 plugin. Two conversions are in this branch to read
beside this chapter: `plugins/campaign-monitor/` (automations and actions)
and `plugins/elevenlabs/` (a channel). Each has a `MIGRATION.md` listing what
was moved where and what changed.

Nothing forces a conversion. A v1 workflow that is installed keeps running.
Convert an integration when you next need to change it, or when a second
publisher needs it.

## 11.1 What becomes what

| v1 | v2 | Notes |
|---|---|---|
| `packages/<name>/package.yml` | `plugin.yaml` | `label` becomes `name`. `settings:` sections become a form layout |
| `plugins/<vendor>/plugin.yml` (`base_url`, `auth`, `methods`) | actions, one per method you use | `config` becomes plugin `settings`. `plugin.call` and `data_source` are gone; a chooser is `ui.options` |
| `recipes/<v>/<name>/recipe.yml` | `actions/<name>.yaml` | Add `outputs` and `returns`; tighten `inputs` |
| `blueprints/<v>/<name>/blueprint.yml` with event, manual, webhook or schedule triggers | `automations/<name>.yaml` | The `definition:` wrapper and the duplicate `inputs` go |
| `blueprints/<v>/<name>/blueprint.yml` with `on: - distribution:` | `channels/<name>.yaml` | The trigger's fields become the `channel:` block |
| A status blueprint (`channel: <name>` at the top) | `status` in the same channel | `channel.status: true`, answer `trigger.action == 'status'` |
| `schemas/…` | `schemas/<name>.yaml`, or `passport/schemas/…` for Passport's own | Drop `$schema` and `$id`; add `name` |
| `actions/…` (Node) | nothing | Rebuild on `http.*`, or ask for a built-in |
| An input the installer filled in | a setting | Plugin settings if shared; automation or channel settings otherwise |
| An input with `runtime: true` | `inputs` (automation) or the distribution form (channel) | |
| A per-distribution pick saved in `context` (`ui.choice`) | a field of the distribution form | Read as `fields.<name>` |
| `secrets.VENDOR_API_KEY` (an instance secret) | a `secret: true` setting, `secrets.api_key` | The publisher types it into the plugin's settings |
| `includes: owner/repo/recipes/x@ref` | `action: <plugin>/<name>` | |
| `uses: owner/repo/path@ref` | nothing | Node actions are removed |
| `validate:` on an input | `format`, `pattern`, ranges; or a first step with `workflow.fail` | |
| `validate: libatomic/…/webhook-validator` | `validate: { signature: … }` | [5.3](05-automations.md#53-triggers) |
| `${{ … }}` unquoted | `"${{ … }}"` | Always quoted in v2 |

## 11.2 Order of work

1. **Inventory.** List the package's blueprints, the recipes they include,
   the secrets and hosts they use, and every input with who fills it in and
   when.
2. **`plugin.yaml`.** Id, name, description, hosts, and the settings every
   part shares: almost always just the credentials.
3. **Actions**, from the recipes. This is where most of the care goes
   ([11.3](#113-a-recipe-becomes-an-action)).
4. **Schemas**, for vendor shapes more than one file reads.
5. **Automations and channels**, from the blueprints
   ([11.4](#114-a-blueprint-becomes-an-automation),
   [11.5](#115-a-distribution-blueprint-becomes-a-channel)).
6. **A `ping` automation** for "Test connection".
7. **Test cases**, one file per automation, channel and action.
8. **`README.md` and `MIGRATION.md`.**
9. Check, dry run, sandbox, push for review.

## 11.3 A recipe becomes an action

v1, `recipes/cm/subscriber-add/recipe.yml`, abridged:

```yaml
name: cm-subscriber-add
version: "1.0.1"
description: Add a subscriber to a Campaign Monitor list
inputs:
  api_key:
    secret: true
    required: true
    type: string
    label: API Key
    description: Campaign Monitor API key (or use secrets.CM_API_KEY)
  list_id: { required: true, type: string, label: List ID }
  email:   { required: true, type: string, label: Email Address }
  name:    { default: "", type: string, label: Name }
  custom_fields:
    default: []
    type: list
    items:
      - { name: Key, label: Field }
      - { name: Value, label: Value }
  resubscribe: { default: "true", type: bool, label: Resubscribe }
  consent_to_track:
    default: "yes"
    type: string
    enum: ["yes", "no", "unchanged"]
steps:
  - id: add
    action: http.post
    with:
      url: "https://api.createsend.com/api/v3.3/subscribers/${{ inputs.list_id }}.json"
      headers:
        Authorization: "Basic ${{ base64Encode(inputs.api_key + ':x') }}"
      body:
        EmailAddress: ${{ inputs.email }}
        Name: ${{ inputs.name }}
        …
```

v2 is `plugins/campaign-monitor/actions/subscriber.add.yaml` (shown in full
in [4.3](04-actions.md#43-a-plugin-action)). What changed, and the rule
behind each change:

| Change | Rule |
|---|---|
| `api_key` is no longer an input; the step reads `secrets.api_key` | An action of the same plugin reads the plugin's settings. Only an action meant for *other* plugins takes credentials as inputs |
| `list_id` gained `pattern: "^[0-9a-f]{32}$"`; `email` gained `format: email` | Say what is valid in the schema, not in a description |
| `label` became `title`; every input has one, and most have a `description` | The Studio's Properties panel is built from them |
| `type: list` with `items: [{name, label}]` became an `array` whose items are `$ref: campaign-monitor/schemas/custom-field` | A list of rows is an array of objects; a shape used by several actions is a schema |
| `resubscribe` default `"true"` (text) became `true` | v2 does not convert types silently; a boolean's default is a boolean |
| `consent_to_track` keeps its `enum` and gains `ui.labels` | Values the vendor wants, labels a person reads |
| `required: true` on each input became the object's `required: [list_id, email]` | JSON Schema's form |
| `outputs` and `returns` added (`email`, `created`) | Callers read declared outputs. They can no longer reach the inner `http.post` |
| File and name `subscriber.add` | Named for what it does to the vendor's thing |
| Version stays `1.0.1` | Carry a recipe's version over; the contract only got stricter in ways callers already met |

Callers change from

```yaml
- id: add-to-list
  includes: libatomic/passport-actions/recipes/cm/subscriber-add
  with:
    api_key: ${{ secrets.CM_API_KEY }}
    list_id: ${{ inputs.list_id }}
    email: ${{ steps.load-user.outputs.user.profile.email }}
```

to

```yaml
- id: add-to-list
  action: campaign-monitor/subscriber.add
  with:
    list_id: "${{ automation.settings.list_id }}"
    email: "${{ steps.load-user.outputs.user.profile.email }}"
```

and anything that read `steps.add-to-list.outputs.add.body` now reads
`steps.add-to-list.outputs.email`.

## 11.4 A blueprint becomes an automation

For each blueprint:

1. **Drop the wrapper.** Keep what was under `definition:`. Delete the
   top-level `inputs` copy, `category`, and anything the installer used.
2. **Sort the inputs.** For each one ask who fills it in and when:

   | Answer | It is |
   |---|---|
   | The publisher, once, the same for everything in the plugin | a plugin setting |
   | The publisher, once, for this automation | an automation setting |
   | Whoever presses Run, each time | an input |
   | Nobody; it was a constant with a default nobody changed | a literal in the step, or a setting with `level: advanced` if someone might |

3. **Rewrite references**: `inputs.x` to `settings.x` or
   `automation.settings.x`; `secrets.VENDOR_KEY` to `secrets.<setting>`.
4. **Turn `includes:` into `action:`** and fix what reads their results.
5. **Tighten each setting** with the field schema: types, formats, enums,
   and a chooser (`ui.options`) wherever v1 had a `data_source` or asked the
   publisher to paste an id.
6. **Decide `multiple`.** If v1's advice was "install it again for another
   list", it is `multiple: true`.
7. **Name and describe it for the publisher**: what it does, in their words.
8. **State the event's schema** on the trigger.

Campaign Monitor's `new-subscriber`: `list_id` went from an input with a
`data_source` to an automation setting referencing the shared
`schemas/list-id.yaml` chooser; "edit the step to change resubscribe" became
two advanced settings; the automation is `multiple` because v1 said to
install one per list.

Things v1 did that v2 does differently:

- **A helper that needed nothing configured** (register a webhook, list
  voices) is a manual automation with no settings. It appears under Tools
  with a Run button; it is not added.
- **A filter on a setting in the trigger's `if:`** moves to a first step,
  because a trigger's `if:` can read only `trigger`.
- **Custom documentation the package manifest carried** (Campaign Monitor's
  `custom_fields:` table) moves to the plugin's README and to the `help` of
  the automations it concerns.

## 11.5 A distribution blueprint becomes a channel

1. **The trigger's fields become the `channel:` block**: `channel` becomes
   `name`; `label`, `mode`, `content_type`, `max_body_length`, `base_type`,
   `requires_audience`, `application`, `address`, `connect_url`, `preview`
   carry over.
2. **Every install-time input becomes a channel setting**, tightened: a
   comma-separated list becomes an array, a table becomes an array of
   objects, a template becomes `format: template`, a model name becomes an
   `enum`. Shared credentials go to plugin settings.
3. **Lay the settings out.** The package's `settings:` sections become
   `ui.layout` sections.
4. **Per-distribution choices move to the distribution form.** A v1
   `ui.choice` that saved to `context.<key>` becomes a field read as
   `fields.<key>`, with `ui.options` for its menu and a `default` that
   follows the channel's setting.
5. **Editor hints** stay on `channel.ui`, with each `input:` renamed
   `setting:` and pointing at a channel setting
   ([6.7](06-channels.md#67-body-editor-hints)).
6. **Remove the load step.** `distribution` and `article` are already in the
   run; delete the `distribution.get` of the channel's own distribution and
   read them directly.
7. **Previews**: an unsaved body is `trigger.preview.body`; a paragraph to
   sample is `trigger.preview.sample`; unsaved picks are simply in `fields`.
8. **A status blueprint** folds into the channel: `channel.status: true`, and
   a branch on `trigger.action == 'status'`.
9. **Keep the logic.** Change detection, piece-by-piece generation and
   `workflow.fail` reasons carry over untouched.

ElevenLabs' narration channel is the worked example; its `MIGRATION.md` has
the input-by-input table.

**Existing distributions.** A v1 channel's distributions carry its picks in
`context` and name the v1 channel. Converting the definition does not move
them. Decide per channel whether old distributions matter (for a channel
whose output is already published, usually not) and say so in
`MIGRATION.md`.

## 11.6 What has no v2 equivalent yet

Found while converting; each is recorded in the plugin's `MIGRATION.md`.

| v1 behaviour | State in v2 |
|---|---|
| The package installer registering a webhook with the vendor on install and removing it on uninstall | No add or remove hooks. The automation exposes `automation.webhook_url`; registering is a Tool the publisher runs once |
| `autofill` on a rows-editor column (one cell pre-filled from another) | None |
| `replaces: { event_type, channel }` on a blueprint (taking over a built-in notification) | None; what read it is unclear and it was dropped |
| A setup step that creates the vendor-side custom fields | Not built; documented in the README |

If a conversion needs one of these, say so in the change's note. They are
candidates for the engine, not things to work around in YAML.

## 11.7 Checklist

- No `uses:`, `includes:`, `plugin.call`, `data_source`, `validate:` on
  inputs, or unquoted `${{`.
- No instance secrets by name (`secrets.CM_API_KEY`); every credential is a
  `secret: true` setting.
- Every v1 input is accounted for in `MIGRATION.md`: setting, input,
  distribution field, or constant.
- Every changed default or behaviour is listed for the integration's owner.
- The v1 source commit is recorded.
