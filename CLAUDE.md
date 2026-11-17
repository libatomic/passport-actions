# Working in this repository

This is the `v2` branch of `passport-actions`: the Passport plugin registry
and the guide to building plugins. It is unrelated to the `master` branch
(v1 blueprints, recipes and Node actions), which is frozen. Never copy v1
syntax into this branch.

## Read first

1. `docs/PLUGIN-DEVELOPMENT-GUIDE.md`: concepts, how the engine runs things.
2. The chapter for what you are writing, under `docs/guide/`:
   - any form or schema: `02-field-schema.md` (always)
   - `plugin.yaml`, versions, references: `01-project-and-manifest.md`
   - an action: `04-actions.md`
   - an automation: `05-automations.md`
   - a channel: `06-channels.md`
   - steps, expressions, functions: `07-…`, `08-functions.md`
   - files, audio, uploads: `09-files-and-binary.md`
   - tests: `10-testing-review-release.md`
3. `plugins/campaign-monitor/` as a model of automations and actions;
   `plugins/elevenlabs/` as a model of an extension. No plugin here is a
   model of a channel yet; follow chapter 6.

## Rules

- Work only inside `plugins/<id>/` of the plugin you were asked about.
- **Never write `releases/` or `index.json`**, and never write `uuid` or
  `version` in a `plugin.yaml`. The back office writes those at release.
- Do not commit or push. Work reaches the registry by being pushed for
  review from Passport Studio.
- Every file is YAML with the extension `.yaml`. Unknown keys are errors.
- Always quote expressions: `"${{ … }}"`.
- Built-in actions and functions are a closed list: `docs/reference/BUILTINS.md`
  and `docs/guide/08-functions.md`. If it is not there, it does not exist.
  Do not invent one; say what is missing. Their tables, and those of
  `docs/reference/EVENTS.md` and `SCHEMAS.md`, are generated from the engine:
  never edit between a `<!-- reference:begin … -->` and a
  `<!-- reference:end … -->` comment. To change one, change the engine, then
  refresh every page with one command (the prose around the tables stays
  hand-written); CI runs the same command with `--check`, which exits 1 when
  a table is out of date:

  ```bash
  passport-plugin reference \
    --update docs/reference/BUILTINS.md \
    --update docs/reference/EVENTS.md \
    --update docs/reference/SCHEMAS.md \
    --update docs/guide/04-actions.md \
    --update docs/guide/08-functions.md \
    --update docs/guide/09-files-and-binary.md
  ```
- Do not guess a vendor's API. Use the documentation you were given, or ask
  for it.
- Every form field has a `title`, and a `description` unless the title is
  unmistakable. Use the narrowest type, a `format` where one fits, an `enum`
  for a fixed set of choices, an `array` for a list, `secret: true` for
  every credential.
- Three levels of settings, never mixed: shared credentials in
  `plugin.yaml`; what one automation or channel needs in its own
  `settings`; what one distribution needs in the channel's `distribution`
  form. `inputs` are only for manual runs and action calls.
- A channel has flows, not top-level `steps:`: `publish` (required),
  `update` (change what exists, never duplicate), `delete`, `preview` and
  `status`, each `{ steps, returns }` with the result chapter 6.5 fixes for
  it. Leave `update` or `delete` out only when the destination cannot do
  it. `preview` and `status` run only `control`, `read` and `external`
  actions. The remote id and link go in `returns` (`id`, `url`), never in
  `context`.
- Something a person does to one record on demand (narrate this article,
  send this member to the CRM) is an automation with `extension:`, not a
  channel and not a trigger. Safe to run twice on the same record.
- Binary is an asset or base64 text, never a raw string.
- One file per major version. A breaking change is a new file
  (`name_2.yaml`); the old one stays.
- Never put a real API key in `tests/`.

## Before you stop

1. `passport-plugin check plugins/<id>` reports nothing.
2. Each automation, channel and action has a test case in `tests/` and
   `passport-plugin run` passes it.
3. `README.md` in the plugin says what the publisher gets, what they must
   have from the vendor, and what each automation and channel does. Help a
   publisher needs to set it up or fix it goes in pages under `docs/`;
   icons go in `assets/`.
4. Say plainly what you could not verify: anything that needs the real
   vendor has only been dry-run.

## Words

- A plugin provides automation and channel **definitions**. A publisher
  **adds** an automation or a channel from one. Do not call these
  "instances": an instance is a Passport instance, a publisher's site.
- "Publisher" is the customer. "Member" is the publisher's reader.
  "Operator" is a person who works for Passport. Do not write "staff": the people who run a publisher's site are admins.
