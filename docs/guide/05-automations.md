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
      default: false
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
| `help` | no | Longer guidance for the publisher, Markdown |
| `icon` | no | |
| `multiple` | no | `true` if a publisher may add it more than once (one per list, say). Default `false` |
| `settings` | no | This automation's own settings, a [form schema](02-field-schema.md), filled in when the publisher adds it. Read as `automation.settings.<name>` and `automation.secrets.<name>` |
| `inputs` | no | What a manual run, or a caller using `workflow.run`, supplies. A form schema. Read as `inputs.<name>` |
| `outputs`, `returns` | no | What a manual run or a synchronous `workflow.run` gets back ([2.12](02-field-schema.md#212-outputs)) |
| `on` | yes | One or more triggers ([5.3](#53-triggers)) |
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
those runs, it is a setting.

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

| Key | Meaning |
|---|---|
| `header` | The request header that carries the signature |
| `algorithm` | `hmac-sha1`, `hmac-sha256` or `hmac-sha512` |
| `encoding` | `hex` or `base64` |
| `secret` | The signing secret, normally one of the automation's secret settings |
| `payload` | What is signed, as a template: `{body}` (the raw body), `{timestamp}`, `{url}`, `{form_sorted}` (form fields sorted by name, each as name then value) |
| `fields` | For a header of the form `t=…,v1=…`: which part is the timestamp and which the signature, `{ timestamp: t, signature: v1 }` |
| `prefix` | Text before the signature in the header, such as `sha256=` |
| `tolerance` | Seconds a timestamp may be off. Default `300` when the payload uses `{timestamp}` |

Stripe is `header: Stripe-Signature`, `hmac-sha256`, `hex`,
`payload: "{timestamp}.{body}"`, `fields: { timestamp: t, signature: v1 }`.
GitHub is `header: X-Hub-Signature-256`, `hmac-sha256`, `hex`,
`payload: "{body}"`, `prefix: "sha256="`.

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

**One automation per thing a publisher would switch off.** "Add new
subscribers" and "Remove canceled subscribers" are two automations, even if
they share every action.
