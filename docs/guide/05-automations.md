# 5. Automations

An automation is a trigger and the steps to run when it fires.

## 5.1 An automation file

```yaml
# automations/new-subscriber.yaml
version: 1.0.0
name: Add new subscribers to a list
description: When a member's subscription becomes active, add them to a Campaign Monitor list.
multiple: true
settings:
  type: object
  required: [list_id]
  properties:
    list_id:
      type: string
      title: Subscriber list
      ui:
        options:
          action: campaign-monitor/lists.get
          items: "${{ outputs.lists }}"
          value: "${{ item.ListID }}"
          label: "${{ item.Name }}"
    resubscribe:
      type: boolean
      title: Resubscribe people who unsubscribed before
      default: true
on:
  - event: user.subscription.status.active
    schema: { $ref: passport/schemas/user.subscription.status.active@^1 }
steps:
  - id: user
    action: user.get
    with: { user_id: "${{ trigger.user_id }}" }
  - id: add
    action: campaign-monitor/subscriber.add
    with:
      list_id: "${{ automation.settings.list_id }}"
      email: "${{ steps.user.outputs.user.login }}"
      name: "${{ steps.user.outputs.user.profile.name }}"
      resubscribe: "${{ automation.settings.resubscribe }}"
```

| Key | Required | Meaning |
|---|---|---|
| `version` | yes | Semver ([1.3](01-project-and-manifest.md#13-versions)) |
| `name` | yes | What the publisher sees in the plugin's Automations tab. Say what it does: "Add new subscribers to a list" |
| `description` | yes | One or two sentences |
| `help` | no | Longer guidance for the publisher, Markdown; may link to pages in `docs/` |
| `icon` | no | A file in `assets/`, or an https URL ([1.1](01-project-and-manifest.md#11-a-plugin-project)) |
| `multiple` | no | `true` if a publisher may add it more than once (one per list, say). Default `false` |
| `settings` | no | This automation's own settings, a [form schema](02-field-schema.md), filled in when the publisher adds it. Read as `automation.settings.<name>` and `automation.secrets.<name>` |
| `inputs` | no | What a manual run, or a caller using `workflow.run`, supplies. A form schema. Read as `inputs.<name>` |
| `outputs`, `returns` | no | What a manual run or a synchronous `workflow.run` gets back ([2.12](02-field-schema.md#212-outputs)). An extension declares `outputs` here and writes its `returns` under `run:` |
| `on` | yes, unless `extension` | One or more triggers ([5.3](#53-triggers)) |
| `extension` | no | Makes this an extension: run by a person on one Passport record, from that record's page ([5.7](#57-extensions)). In place of `on` |
| `vars` | no | Starting values for `vars` |
| `steps` | yes, unless `extension` | [Chapter 7](07-steps-and-expressions.md). An extension has none at the top level: its steps are in its flows |
| `run`, `preview` | only with `extension` | An extension's flows, each with its own `steps` and `returns` ([5.7](#57-extensions)). `run` is required there; an automation with `on` has neither |
| `schemas` | no | Shapes used only in this file ([3.3](03-schemas.md#33-schemas-inside-an-automation-or-channel)) |
| `retention` | no | How long runs are kept, `72h` (default) to `4320h` |
| `requires` | no | [1.5](01-project-and-manifest.md#15-requires) |

The file's name without `.yaml` and `_N` is the automation's **key**.

## 5.2 Settings or inputs?

| | `settings` | `inputs` |
|---|---|---|
| Answers | "how is this automation set up?" | "what is this run about?" |
| Filled in | once, when the publisher adds the automation | each manual run, or by the caller |
| Used by | every run, whatever started it | only runs that are given inputs: manual runs and `workflow.run` |
| Example | which list to add people to | which member to re-send to |

An event, webhook or schedule run has no inputs. If a value is needed by
those runs, it is a setting. The check warns about `inputs` on an automation
with no manual trigger, and about required inputs on one that also has other
triggers.

In v1 both were "inputs" with defaults. When converting, an input the
installer filled in is a setting; an input marked `runtime: true` is an
input.

## 5.3 Triggers

`on:` is a list. An automation runs when any one of them fires.

A trigger's `if:` is evaluated before the run starts, so it can read only
`trigger`. To decide on a setting, use a first step with `workflow.exit`.

(`on` is an ordinary key here. Some YAML tools read a bare `on` as "true";
Passport's do not, and it does not need quotes.)

### Event

```yaml
on:
  - event: user.subscription.status.active
    schema: { $ref: passport/schemas/user.subscription.status.active@^1 }
    if: "${{ trigger.body.plan_id != '' }}"
```

| Key | Meaning |
|---|---|
| `event` | The event's name. `*` matches one or more segments: `user.subscription.status.*` |
| `schema` | The body's shape ([3.4](03-schemas.md#34-event-schemas)). Defaults to Passport's own for a built-in event |
| `if` | Run only when true |
| `source` | Who emitted it. Default `atomic`, Passport itself. An event a plugin emits with `event.emit` has the source given there |

The run reads `trigger.type` (the event's name), `trigger.body` (its body),
`trigger.user_id` (the member it is about, when there is one), `trigger.id`
and `trigger.source`.

The events and their bodies are in
[reference/EVENTS.md](../reference/EVENTS.md).

Event runs start at once and inline, and the same event can arrive twice
([how the engine runs an event](../PLUGIN-DEVELOPMENT-GUIDE.md#an-event)).
Keep them short and safe to repeat.

### Manual

```yaml
on:
  - manual: true
```

Run from the plugin's Automations tab ("Run"), from the API, or by another
automation with `workflow.run`. If the automation declares `inputs`, the
admin shows their form first. `trigger.type` is `manual`.

### Webhook

```yaml
on:
  - webhook: true
    name: Acme events
    validate:
      signature:
        header: X-Acme-Signature
        algorithm: hmac-sha256
        encoding: base64
        secret: "${{ automation.secrets.webhook_secret }}"
        payload: "{body}"
    foreach: events
    schema: { $ref: "#/schemas/event" }
    if: "${{ trigger.body.type == 'unsubscribed' }}"
    response_status: 200
```

| Key | Meaning |
|---|---|
| `webhook` | `true` |
| `name` | Label for the address in the admin |
| `validate` | Required. `signature:` (below), or `false` to accept any request that has the token. Prefer a signature whenever the vendor offers one |
| `ip_allowlist` | Addresses or CIDR ranges allowed to call |
| `foreach` | A path to a list in the body. One run per element, with that element as `trigger.body` |
| `schema` | The shape of `trigger.body` |
| `if` | Run only when true (per element with `foreach`) |
| `response_status` | What the vendor gets back. Default `200` |

When the publisher adds the automation, Passport gives it an address with a
secret token in it, shown on the automation's page to paste into the vendor's
settings. A request with the right token gets the response at once; the run
happens afterwards. The run reads `trigger.body`, `trigger.remote_ip` and
`trigger.token_label`. Any step of the automation can read its own address
as `automation.webhook_url`, to register it with the vendor.

Not every vendor signs its webhooks (Campaign Monitor does not). Then
`validate: false` is the only choice; the token in the address is the
protection, so treat the address as a secret.

**Signature check**

| Key | Required | Meaning |
|---|---|---|
| `header` | yes | The request header that carries the signature |
| `algorithm` | yes | `hmac-sha1`, `hmac-sha256` or `hmac-sha512` |
| `encoding` | yes | `hex` (either case) or `base64` (standard, with or without padding) |
| `secret` | yes | Exactly one secret reference, such as `"${{ automation.secrets.webhook_secret }}"`. A literal, or text built around a reference, is refused |
| `payload` | yes | What is signed, as a template: `{body}` (the raw body, byte for byte), `{timestamp}`, `{url}` (the full address called), `{form_sorted}` (form fields sorted by name, each written as name then value; a repeated field's values sorted) |
| `fields` | no | For a header of the form `t=…,v1=…`: which part is the timestamp and which the signature, `{ timestamp: t, signature: v1 }`. `signature` is required when `fields` is given. If the header carries several signatures under that key, any one may match |
| `timestamp_header` | no | A separate header that carries the timestamp, for vendors that send it apart from the signature |
| `prefix` | no | Text before the signature in the header, such as `sha256=`. A signature without it is refused |
| `tolerance` | no | Seconds the timestamp may be off. Default `300` when the payload uses `{timestamp}`; `0` turns the age check off |

A payload that uses `{timestamp}` needs exactly one source for it:
`fields.timestamp` or `timestamp_header`. The timestamp is seconds since
1970.

| Vendor | Settings |
|---|---|
| Stripe | `header: Stripe-Signature`, `hmac-sha256`, `hex`, `payload: "{timestamp}.{body}"`, `fields: { timestamp: t, signature: v1 }` |
| GitHub | `header: X-Hub-Signature-256`, `hmac-sha256`, `hex`, `payload: "{body}"`, `prefix: "sha256="` |
| Slack | `header: X-Slack-Signature`, `hmac-sha256`, `hex`, `payload: "v0:{timestamp}:{body}"`, `timestamp_header: X-Slack-Request-Timestamp`, `prefix: "v0="` |
| Twilio | `header: X-Twilio-Signature`, `hmac-sha1`, `base64`, `payload: "{url}{form_sorted}"` |

Only HMAC signatures are covered. A vendor that signs with a public key
(RSA, Ed25519) or a JWT cannot be checked this way yet; use `validate: false`
and the token, and say so in the plugin's README.

A request that fails the check is answered 403 and starts nothing.

### Schedule

```yaml
on:
  - schedule: 24h
```

A duration (`15m`, `1h`, `24h`; at least `1m`). The first run is one interval
after the automation is enabled. There are no inputs; `trigger.type` is
`schedule`.

## 5.4 What the publisher sees

On the plugin's **Automations** tab, each definition is listed with its name
and description and an **Add** button (hidden once a non-`multiple` one has
been added). Adding one asks for a label and shows the `settings` form.

Each added automation then shows its label, an enable switch, its settings,
its webhook address if it has one, its recent runs, and **Run** if it has a
manual trigger.

**Tools.** An automation that has only a manual trigger and no `settings`
has nothing to configure and nothing to switch on. It is not added: it is
listed under "Tools" on the same tab with a **Run** button (and its inputs
form, if it has one). A "list my voices" or "register the webhook" helper is
written this way.

**Extensions** are run from a record's page, not from this tab
([5.7](#57-extensions)).

Write `name`, `description` and every setting's `title` and `description`
for that reader. They do not see steps, triggers or YAML.

## 5.5 The connection test

`test:` in `plugin.yaml` names an automation the admin runs for "Test
connection" on the plugin's Settings tab:

```yaml
# automations/ping.yaml
version: 1.0.0
name: Test connection
description: Checks that the API key and client id are accepted.
on:
  - manual: true
outputs:
  type: object
  properties:
    account: { type: string, title: Account name }
returns:
  account: "${{ steps.clients.outputs.body[0].Name }}"
steps:
  - id: clients
    action: http.get
    with:
      url: https://api.createsend.com/api/v3.3/clients.json
      headers:
        Authorization: "Basic ${{ base64Encode(secrets.api_key + ':x') }}"
```

It must have a manual trigger, no settings and no required inputs, and must
change nothing. If it succeeds the settings work; if it fails the admin shows
the step's error. It is not listed among the automations a publisher can
add, nor under Tools; it appears only as the "Test connection" button.

## 5.6 Patterns

**Guard, then act.** Load what you need, exit early when there is nothing to
do, then make the call:

```yaml
steps:
  - id: sub
    action: subscription.get
    with: { subscription_id: "${{ trigger.body.subscription_id }}" }
  - id: skip
    if: "${{ empty(steps.sub.outputs.subscription.plan_id) }}"
    action: workflow.exit
  - id: add
    action: campaign-monitor/subscriber.add
    with: { … }
```

**Safe to repeat.** Prefer calls that set a state ("make sure this address is
on the list") over calls that add ("append a row"). An event can arrive
twice.

**Long work off the event path.** From an event automation, hand anything
slow to a manual automation in the same plugin:

```yaml
- id: later
  action: workflow.run
  with:
    automation: rebuild-list
    async: true
    inputs: { since: "${{ trigger.body.changed_at }}" }
```

`automation` names an automation of this plugin by its key. A tool runs as
itself. When the publisher has added the automation once, that one runs.
When they have added it several times, say which with `name:`, the short
name they gave it; without it the step fails, and nothing is guessed.

**One automation per thing a publisher would switch off.** "Add new
subscribers" and "Remove canceled subscribers" are two automations, even if
they share every action.

## 5.7 Extensions

An **extension** is an automation a person runs on one Passport record, from
that record's page in the admin. It does something *to* or *from* that
record: makes an audio narration of an article, sends a member's details to a
CRM, grants a member a trial. It has no triggers; nothing starts it but a
person.

```yaml
# automations/narrate.yaml
version: 1.0.0
name: Create audio narration
description: Reads the article aloud with an ElevenLabs voice and saves it as an MP3.
extension:
  on: article
  label: Create Audio Narration
  if: "${{ trim(article.body ?? '') != '' }}"
settings:
  type: object
  required: [voice_id]
  properties:
    voice_id: { type: string, title: Default voice }
    model_id: { type: string, title: Model, enum: [eleven_multilingual_v2, eleven_v4], default: eleven_v4 }
inputs:
  type: object
  properties:
    script:
      type: string
      format: html
      title: Text to read
      default: "${{ article.body }}"
      ui: { widget: paragraphs, paragraphs: { sample: audio, preview_label: Spoken text } }
outputs:
  type: object
  required: [asset_id]
  properties:
    asset_id: { type: string, format: passport.asset, title: Narration }

run:                      # required: what a person starts
  steps:
    - id: speak
      name: Read the text into an MP3
      action: elevenlabs/speech.create
      with:
        text: "${{ htmlText(inputs.script) }}"
        voice_id: "${{ automation.settings.voice_id }}"
        model_id: "${{ automation.settings.model_id }}"
        filename: "narration-${{ article.id }}.mp3"
  returns:                # the extension's outputs, declared above
    asset_id: "${{ steps.speak.outputs.asset_id }}"

preview:                  # optional: having it is what makes it answer previews
  steps:
    - id: sample
      name: Read one paragraph, saving nothing
      if: "${{ trim(trigger.preview?.sample ?? '') != '' }}"   # a play button
      action: elevenlabs/speech.sample
      with:
        text: "${{ trigger.preview.sample }}"
        voice_id: "${{ automation.settings.voice_id }}"
        model_id: "${{ automation.settings.model_id }}"
  returns:                # Passport's shape, the same for every extension
    text: "${{ trim(trigger.preview?.sample ?? '') != '' ? trigger.preview.sample : htmlText(inputs.script) }}"
    audio: "${{ steps.sample.outputs?.audio }}"            # nothing when the step
    audio_type: "${{ steps.sample.outputs?.audio_type }}"  # was skipped: left out
```

That is the shape of `plugins/elevenlabs/automations/narrate.yaml`, cut
down. The real file reads the article once for each audience chosen, and
its preview answers both of the paragraph editor's buttons; read it as the
model of an extension.

| `extension` key | Required | Meaning |
|---|---|---|
| `on` | yes | The kind of record it is run on: `article`, `user`, `subscription`, `distribution`, `template`, `asset`, `plan`, `audience` or `category` |
| `label` | no | What the menu item says. Defaults to the automation's `name`. Write it as the thing to do: "Create Audio Narration" |
| `if` | no | Offer it only when true. It reads only the record: `"${{ subscription.status == 'active' }}"` |

An automation has `extension` or `on`, never both. An extension cannot be
started by an event, a webhook, a schedule or `workflow.run`. When the same
work must also happen on an event, put the steps in an action and call it
from the extension and from an event automation.

### The flows

An extension has no top-level `steps:`. Like a channel
([6.5](06-channels.md#65-the-flows)), it has a named flow for each request
it answers. One request is one run, and one run is one flow.

| Flow | Required | Runs when | Its result | May run |
|---|---|---|---|---|
| `run` | yes | A person runs the extension on a record | The extension's own `outputs`: `run.returns` gives one value per output ([2.12](02-field-schema.md#212-outputs)). With no `outputs`, leave `returns` out | Every action the plugin may use |
| `preview` | no | A preview is asked for: a [paragraph editor](02-field-schema.md#the-paragraph-editor)'s play buttons and its preview button | Passport's, the same for every extension ([below](#the-preview-flow)) | Only `control`, `read` and `external` actions |

| Key of a flow | Required | Meaning |
|---|---|---|
| `steps` | yes | The flow's steps, at least one ([chapter 7](07-steps-and-expressions.md)) |
| `returns` | in `preview`; in `run` when the extension has `outputs` | The flow's result: one value per key, or a single expression for the whole result |

A flow has no other keys.

- **Each flow has its own steps.** Step ids are unique within a flow, and
  the two flows may use the same id. `steps.<id>` holds only the steps of
  the flow that is running, so `preview` cannot read a step of `run`. What
  both need (preparing the text, say) goes in a plugin action that each
  flow calls.
- **Say what each step is for** with its `name` and `description`
  ([7.1](07-steps-and-expressions.md#71-a-step)), in both flows. A
  channel's flow may also carry a `description` of its own
  ([6.5.1](06-channels.md#651-a-flow)); an extension's flow may not, so say
  what a flow is for in a comment above it and in the automation's `help`.
- **`trigger.action`** is `run` or `preview`: the flow that is running. A
  flow never needs to test it. A plugin action that both flows call may.
- **`run` behaves as an automation's steps do.** `wait` is allowed at its
  top level. `workflow.exit` ends it as a success with the outputs its
  steps named ([7.5](07-steps-and-expressions.md#75-named-outputs)); its
  `returns` is then not worked out.
- **There is no other form.** The checker refuses a top-level `steps:`
  ("an extension's steps are in its flows; put them under run:"), a
  top-level `returns:` (it goes under `run:`) and `extension.preview`
  ("an extension answers previews because it has a preview: flow").
  `run:` or `preview:` in an automation that has `on:` is refused too.

**What a flow reads.** The record, under the name of its kind (`article`,
`user`, `subscription`, …), as it was when the run started and with the
fields the matching `get` action returns. `trigger.type` is `extension`,
`trigger.record.kind` and `trigger.record.id` say what it was run on, and
`trigger.user_id` is the member when the record is a user or a subscription.
`inputs`, `automation.settings` and the plugin's `settings` are as in any
automation.

**The form.** `inputs` is the form shown each time it is run; leave it out
and the extension runs at one click, after a confirmation. A `default` in
this form may be an expression over the record, `automation.settings` and
`settings`, as in a channel's distribution form
([2.10](02-field-schema.md#210-defaults-that-follow-another-value)). It is
worked out when the form opens, and the person may type over it.

**The form remembers the last run on the record.** When the extension has
run on this record before, the form opens with the values of that last run,
so text edited for one narration is still there for the next. **Start from
the record** sets every field back to its default. A field the last run did
not have (added in a newer version) takes its default; a value the form no
longer accepts is dropped.

### The preview flow

A preview shows a person what a run would do before they run it. The
paragraph editor asks for one when its preview button (`preview_label`) or a
paragraph's play button (`sample: audio`) is pressed; both hints need the
extension to have a `preview` flow, and the checker says so when it has
none.

**Reads.** What a run reads, as things stand on screen:

| Name | In a preview |
|---|---|
| The record (`article`, `user`, …) | As saved |
| `inputs` | The form as it is on screen, defaults worked out. Not held to the form's `required` list, so a paragraph can be played before every field is filled; what is given is still checked |
| `automation.settings` | The saved settings, with any the editor is changing laid over them for this preview only (a pronunciation being edited, say). A secret is never taken from the screen |
| `trigger.preview.sample` | The text of the paragraph whose play button was pressed. Absent for the preview button. `trigger.preview` is read in the `preview` flow only: naming it in `run` is an error |
| `settings`, `secrets`, `instance` | As in a run |

**May do.** Only `control`, `read` and `external` actions
([4.2](04-actions.md#42-built-in-actions)): work things out, read Passport data, call the
vendor. Not `notify`, `write` or `destructive` actions, no `http.*` step
with `response_asset`, and no `wait`. The same holds for every plugin
action the flow calls, and the actions those call. The checker refuses a
plugin that breaks this, naming the flow, the step and the action, and the
engine refuses the step again when it runs. What a call does at the vendor
is still yours to keep harmless: a preview must make nothing there either,
though it may cost (ElevenLabs bills a paragraph played).

**Returns** (`passport/schemas/extension.preview.result@1`):

| Key | Type | Required | Meaning |
|---|---|---|---|
| `text` | string | one of `text` and `audio` | The text that would be worked on, paragraphs separated by blank lines. The editor shows it |
| `audio` | string, base64 | one of the two | Audio, played in place. Needs `audio_type` |
| `audio_type` | string | with `audio` | The audio's media type, `audio/mpeg` for example |
| `characters` | integer | no | The length of the text |
| `limit` | integer | no | The limit the text is held to, shown against `characters`. `0` or left out: no limit |
| `note` | string | no | A short line under the preview |

It is a channel preview's result ([6.5.7](06-channels.md#657-preview))
without `html` and `url`. At least one of `text` and `audio` must be there;
both may be. A key the result does not have (`requests`, say) is an error
when the plugin is checked. A key whose expression yields nothing is left
out, so a flow that answers two buttons can list every key and let the
branch that did not run yield nothing. The result is held to the schema
when the flow runs, on a live site as on a sandbox, and a result that does
not fit fails the preview with a message naming the key
(`returns.characters: …`). After `workflow.exit` the `returns` is still
worked out.

**How it runs.** At once, while the person waits, for at most 60 seconds.
Nothing of it is recorded: no run, no log, and it is not among the record's
runs or what the form remembers.

The ElevenLabs preview answers both buttons with one flow. Its first step
tells them apart, each branch names what it found with step-level
`outputs:`, and `returns` hands those back:

```yaml
preview:
  steps:
    - id: mode
      name: Work out which preview was asked for
      action: set-output
      with:
        mode: "${{ trim(trigger.preview?.sample ?? '') != '' ? 'listen' : 'text' }}"
    # … the steps that prepare the text …
    - id: preview-text
      name: "Preview: return the text a run would read"
      if: "${{ steps.mode.outputs.mode == 'text' }}"
      then:
        - id: preview-spoken
          action: elevenlabs/narration.text      # reads only
          with: { … }
        - id: previewed
          action: set-output
          with: { done: true }
          outputs:
            text: "${{ steps.preview-spoken.outputs.text }}"
            characters: "${{ steps.preview-spoken.outputs.characters }}"
            limit: "${{ automation.settings.max_characters }}"
    - id: preview-listen
      name: "Preview: read one paragraph aloud"
      if: "${{ steps.mode.outputs.mode == 'listen' }}"
      then:
        - id: sample
          action: elevenlabs/speech.sample       # http.post, the MP3 as base64
          with: { … }
          outputs:
            audio: "${{ steps.sample.outputs.audio }}"
            audio_type: "${{ steps.sample.outputs.audio_type }}"
  returns:
    text: "${{ outputs.text }}"
    characters: "${{ outputs.characters }}"
    limit: "${{ outputs.limit }}"
    note: "${{ outputs.note }}"
    audio: "${{ outputs.audio }}"
    audio_type: "${{ outputs.audio_type }}"
```

### The text, and what a run hands back

**Reading a `paragraphs` field.** Render it as an audience, then take the
text:

```yaml
- id: script
  action: template.render
  with:
    body: "${{ inputs.script }}"
    article_id: "${{ article.id }}"
    audience_id: "${{ inputs.audience }}"
- id: text
  action: vars.set
  with:
    text: "${{ htmlText(steps.script.outputs.body) }}"
```

Restricted sections then resolve as they would for a member of that
audience, a replacement line is kept where a section is not read, and what
was switched off is dropped by `htmlText`.

"As an audience" means that audience **and every audience ranked below it**
in the site's audience rank order, so what a lower tier may read is in what
a higher tier gets. Unranked audiences are below every ranked one. An
unranked audience has nothing below it and renders as itself alone, and an
audience ranked above is never included. With Founding, Paid and Free ranked
1, 2 and 3, a render as Paid shows the sections for Paid and for Free, and
not the one for Founding. On a site that has ranked nothing, a render as an
audience is that audience only.

To make one result per audience and hand members a single file, render once
for each audience and file the results as the variants of a virtual asset
([9.7](09-files-and-binary.md#97-protected-and-virtual-assets)).

**What it hands back.** Declare `outputs`, and give `run` a `returns`. The
admin shows the result when the run ends, each output by its `title` and drawn by its
`format`: a `passport.asset` as a player or a download link, another
`passport.*` id as a link to that record, anything else as text. The
record's page lists the extension's recent runs with what each produced, so
a narration made last week is still found on its article.

**What the publisher sees.** On the page of a record of that kind, an
**Extensions** menu lists each extension that applies, by its label. Choosing
one shows its form, then the run's progress and result.

Extensions are kept apart from automations and channels wherever a person
meets them. The file is an automation file, but what it is for is different:
it works on one record, for the person looking at it, and runs nowhere else.
The plugin's page has its own **Extensions** tab, beside Automations and
Channels, listing each extension with the kind of record it runs on; an
extension is never listed under Automations. Passport Studio shows them
under their own **Extensions** heading, and the registry lists what a plugin
provides as automations, channels and extensions.

- With no `settings`, the extension is on the menu as soon as the plugin is
  enabled.
- With `settings`, the publisher adds it first, on the Extensions tab, and it
  is on the menu while it is enabled. With `multiple: true` each one added
  is its own menu item, under the label the publisher gave it.

A person needs permission to change the record to run an extension on it.
The run is recorded with who ran it.

**Writing one.**

- Make it safe to run twice on the same record: name what it creates after
  the record (`narration-${{ article.id }}.mp3`, with `overwrite: true`) so
  a second run replaces the first.
- Long work is fine: the run is a job, and the admin shows it running.
- An extension is not a channel. A channel publishes a distribution
  somewhere; an extension makes or changes something in Passport that a
  channel, or a person, may then use.
