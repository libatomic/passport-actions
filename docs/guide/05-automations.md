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
| `outputs`, `returns` | no | What a manual run or a synchronous `workflow.run` gets back ([2.12](02-field-schema.md#212-outputs)) |
| `on` | yes, unless `extension` | One or more triggers ([5.3](#53-triggers)) |
| `extension` | no | Makes this an extension: run by a person on one Passport record, from that record's page ([5.7](#57-extensions)). In place of `on` |
| `vars` | no | Starting values for `vars` |
| `steps` | yes | [Chapter 7](07-steps-and-expressions.md) |
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
  if: "${{ article.published_at != nil }}"
settings:
  type: object
  properties:
    model_id: { type: string, title: Model, enum: [eleven_multilingual_v2, eleven_turbo_v2_5], default: eleven_multilingual_v2 }
inputs:
  type: object
  required: [voice]
  properties:
    voice:
      type: string
      title: Voice
      ui: { options: { action: elevenlabs/voices.list, items: "${{ outputs.voices }}", value: "${{ item.voice_id }}", label: "${{ item.name }}" } }
    intro:
      type: string
      title: Spoken introduction
      default: "${{ article.title }}, by ${{ article.author }}"
outputs:
  type: object
  required: [asset_id]
  properties:
    asset_id: { type: string, format: passport.asset, title: Narration }
returns:
  asset_id: "${{ steps.join.outputs.asset_id }}"
steps:
  - id: speak
    action: elevenlabs/speech.create
    with:
      text: "${{ inputs.intro + '. ' + htmlText(article.body) }}"
      voice: "${{ inputs.voice }}"
      model_id: "${{ automation.settings.model_id }}"
      filename: "narration-${{ article.id }}.mp3"
  # …
```

| `extension` key | Required | Meaning |
|---|---|---|
| `on` | yes | The kind of record it is run on: `article`, `user`, `subscription`, `distribution`, `template`, `asset`, `plan`, `audience` or `category` |
| `label` | no | What the menu item says. Defaults to the automation's `name`. Write it as the thing to do: "Create Audio Narration" |
| `if` | no | Offer it only when true. It reads only the record: `"${{ subscription.status == 'active' }}"` |
| `preview` | no | `true`: the extension answers previews, for a [paragraph editor](02-field-schema.md#the-paragraph-editor)'s play buttons. Default `false` |

An automation has `extension` or `on`, never both. An extension cannot be
started by an event, a webhook, a schedule or `workflow.run`. When the same
work must also happen on an event, put the steps in an action and call it
from the extension and from an event automation.

**What the run reads.** The record, under the name of its kind (`article`,
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

**Previews.** With `preview: true`, a preview runs the same steps with
`trigger.action` `preview` (it is `run` otherwise), `inputs` as they are on
screen, and `trigger.preview.sample` set to the text of the paragraph being
played. A preview makes nothing: no assets, no records, no calls that change
anything at the vendor. Return what to play as outputs `audio` (base64) and
`audio_type`. Previews are not listed with the record's runs.

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

**What it hands back.** Declare `outputs` and `returns`. The admin shows the
result when the run ends, each output by its `title` and drawn by its
`format`: a `passport.asset` as a player or a download link, another
`passport.*` id as a link to that record, anything else as text. The
record's page lists the extension's recent runs with what each produced, so
a narration made last week is still found on its article.

**What the publisher sees.** On the page of a record of that kind, an
**Extensions** menu lists each extension that applies, by its label. Choosing
one shows its form, then the run's progress and result. On the plugin's
Automations tab an extension is listed with the kind it runs on.

- With no `settings`, the extension is on the menu as soon as the plugin is
  enabled.
- With `settings`, the publisher adds it first, like any automation, and it
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

