# 4. Actions

An action is one operation with declared inputs and outputs. A step runs an
action. The engine provides the **built-in** actions; a plugin adds its own
**plugin actions**, each made of steps.

## 4.1 Running an action

```yaml
- id: load
  action: user.get
  with:
    user_id: "${{ trigger.user_id }}"

- id: add
  action: campaign-monitor/subscriber.add@^1
  with:
    list_id: "${{ automation.settings.list_id }}"
    email: "${{ steps.load.outputs.user.login }}"
    name: "${{ steps.load.outputs.user.profile.name }}"
```

`with:` supplies the action's inputs. What the action returns is at
`steps.<id>.outputs`. All the other things a step can carry (`if`, `timeout`,
`on_error`, loops) are in [chapter 7](07-steps-and-expressions.md).

## 4.2 Built-in actions

Complete inputs and outputs for each are in
[reference/BUILTINS.md](../reference/BUILTINS.md). Every built-in has an
**effect class**, which says what kind of thing it does:

| Effect | Meaning | Built-ins |
|---|---|---|
| `control` | Shapes the run; touches nothing | `set-output`, `vars.set`, `log`, `sleep`, `wait`, `transmute`, `workflow.exit`, `workflow.fail` |
| `read` | Reads Passport data | `user.get`, `plan.get`, `option.get`, `subscription.get`, `credit.get`, `distribution.get`, `distribution.render`, `asset.get`, `application.get`, `article.get`, `entitlement.get`, `job.get`, `audience.get`, `audience.view`, `template.render` |
| `write` | Creates or changes Passport data | `user.create`, `user.update`, `user.audienceRefresh`, `user.feed.invalidate`, `instance.cache.flush`, `feed.item.create`, `credit.invite.create`, `distribution.create`, `distribution.update`, `asset.create`, `asset.update`, `asset.concat`, `entitlement.create`, `entitlement.update`, `event.emit`, `workflow.run`, `job.create` |
| `notify` | Sends a message to a person | `sendmail`, `sendsms` |
| `external` | Calls another system | `http.get`, `http.post`, `http.put`, `http.patch`, `http.delete` |
| `destructive` | Removes Passport data | `entitlement.delete`, `asset.delete` |

A **plugin action's** effect is worked out from its steps: the strongest of
them, in the order `control`, `read`, `external`, `notify`, `write`,
`destructive`. An action that only calls `http.get` is `external`; one that
also calls `user.update` is `write`.

A plugin may use every built-in. The effect class is used in three places:
the registry shows what a plugin does ("sends email, calls api.example.com");
a form's [loaded choices](02-field-schema.md#28-choices-loaded-from-an-action)
may only run `read` and `external` actions; and automations that publishers
write themselves are limited to a subset (see the Passport Automations
Guide). None of those limits apply to a plugin's own automations and
channels.

The ones you will use most:

| Need | Action | Notes |
|---|---|---|
| Call a vendor's API | `http.*` | Hosts must be in `allowed_hosts`. `retries` is total attempts. A non-2xx status fails the step unless listed in `expect_status` |
| Save a file a vendor returns | `http.*` with `response_asset` | See [chapter 9](09-files-and-binary.md) |
| Look up the member an event is about | `user.get` | |
| Read the distribution being published | `distribution.get` | |
| Render the body for a channel | `distribution.render` | `as_audience: true` renders once as a member of the distribution's audience |
| Record what was published | `distribution.update` | Only `context`, and it **replaces** the map: merge the old keys back in |
| Stop early, successfully | `workflow.exit` | |
| Stop as failed, with a reason the publisher sees | `workflow.fail` | Not caught by `on_error` or `continue-on-error` |
| Keep a value for later steps | `set-output`, `vars.set` | |

## 4.3 A plugin action

Write an action when the same vendor call, or the same few steps, is needed
in more than one place, or when a call deserves a name and a contract. The
usual shape of an integration is one action per API method the plugin uses,
and automations and channels that call them.

```yaml
# actions/subscriber.add.yaml  (from plugins/campaign-monitor)
name: subscriber.add
version: 1.0.1
title: Add a subscriber
description: Adds an address to a Campaign Monitor list, or updates it if it is already there.
inputs:
  type: object
  required: [list_id, email]
  properties:
    list_id:
      type: string
      title: List
      description: The Campaign Monitor list id.
      pattern: "^[0-9a-f]{32}$"
    email:
      type: string
      format: email
      title: Email address
    name:
      type: string
      title: Name
      description: The subscriber's display name. Left out, the name is sent empty, as v1 did.
    custom_fields:
      type: array
      title: Custom fields
      description: Fields to set or clear on the subscriber.
      default: []
      items: { $ref: campaign-monitor/schemas/custom-field }
    resubscribe:
      type: boolean
      title: Resubscribe
      description: Make the address active again even if it unsubscribed before.
      default: true
    consent_to_track:
      type: string
      title: Consent to track
      description: Whether opens and clicks may be tracked for this subscriber.
      enum: ["yes", "no", "unchanged"]
      default: "yes"
      ui:
        labels: { "yes": "Yes", "no": "No", unchanged: Leave as it is }
outputs:
  type: object
  required: [email]
  properties:
    email: { type: string, format: email, title: Address added }
    created:
      type: boolean
      title: New subscriber
      description: False when Campaign Monitor answered that the address was already on the list.
returns:
  email: "${{ steps.add.outputs.body }}"
  created: "${{ steps.add.outputs.status == 201 }}"
steps:
  - id: add
    action: http.post
    with:
      url: "https://api.createsend.com/api/v3.3/subscribers/${{ inputs.list_id }}.json"
      headers:
        Authorization: "Basic ${{ base64Encode(secrets.api_key + ':x') }}"
        Content-Type: application/json
      body:
        EmailAddress: "${{ inputs.email }}"
        Name: "${{ inputs.name ?? '' }}"
        CustomFields: "${{ inputs.custom_fields }}"
        Resubscribe: "${{ inputs.resubscribe }}"
        ConsentToTrack: "${{ inputs.consent_to_track }}"
      expect_status: [200, 201]
```

| Key | Required | Meaning |
|---|---|---|
| `name` | yes | The action's name; equals the file name without `_N` and `.yaml` |
| `version` | yes | Semver ([1.3](01-project-and-manifest.md#13-versions)) |
| `title` | yes | Shown in the Toolbox |
| `description` | yes | One sentence: what it does. Shown in the Toolbox and the step's Properties |
| `help` | no | Longer guidance, Markdown |
| `icon`, `category` | no | Toolbox presentation. `category` is any short text; actions with the same one are grouped together under the plugin |
| `inputs` | no | A [form schema](02-field-schema.md): what `with:` must supply |
| `outputs` | no | A data schema: what the action returns |
| `returns` | when there are `outputs` | One value per output, or a single expression for the whole result ([2.12](02-field-schema.md#212-outputs)) |
| `steps` | yes | What it does |
| `vars` | no | Starting values for `vars` inside the action |
| `requires` | no | [1.5](01-project-and-manifest.md#15-requires) |

## 4.4 How a plugin action runs

- **Its own scope.** Inside the action, `inputs` is the action's inputs,
  after defaults and validation. `steps`, `vars` and `outputs` are the
  action's own, empty at the start. The action cannot see the caller's steps
  or variables, and its step ids cannot collide with the caller's, so the
  same action can be used many times in one run.
- **What it shares with the caller:** `settings`, `secrets`, and the
  automation's or channel's own settings, `fields`, `distribution`,
  `article`, `trigger`, `user` and `instance`. These are copies: a `user.get`
  inside the action changes the action's `user`, not the caller's.
  An action meant to be used from *other* plugins should not read `settings`
  or `secrets`; take them as inputs ([1.6](01-project-and-manifest.md#16-depending-on-another-plugin)).
- **Inputs are checked.** `with:` is validated against `inputs`. Literal
  values are checked when the plugin is built; values from expressions are
  checked when the step runs ([rule 10](02-field-schema.md#211-rules-that-apply-to-every-form)).
- **Returns.** After the last step, each `returns` expression is evaluated
  and the result is checked against `outputs`. The caller gets exactly those
  values. An action with no `outputs` returns nothing, and reading
  `steps.<id>.outputs.<x>` of it, or an `<x>` it does not declare, is a check
  error. When `returns` is a single expression whose value is not a map, the
  caller reads it as `steps.<id>.outputs.result`.
- **Failure.** A step that fails inside the action, and is not handled inside
  it, fails the calling step with the same error. The caller handles it like
  any failed step (`on_error`, `continue-on-error`).
  `steps.<id>.error.detail` carries an HTTP error's status and body.
- **Actions may call actions**, to a depth of 8 (the action a step of the
  run calls is level 1). An action that calls itself is refused when the
  plugin is checked; a longer cycle is refused when it runs.
- **Not allowed inside an action:** `wait` (a run can only pause at its top
  level), and `workflow.exit` (use an `if:` to skip the remaining steps).
  `workflow.fail` is allowed and fails the whole run. In an automation or a
  channel, `workflow.exit` may be used anywhere, including inside a branch or
  a loop.
- **Timeout.** A `timeout:` on the calling step covers the whole action.

## 4.5 Writing a good action

- **Name it for what it does to the vendor's thing:** `subscriber.add`,
  `episode.create`, `lists.get`. Group with a dot.
- **One call, one action** is the usual grain. Compose them in automations.
- **Translate at the edge.** Take inputs in plain names (`email`) and build
  the vendor's body inside. Return plain names from `returns`. The vendor's
  shapes stay in the action and its schemas.
- **Declare what callers will read.** If automations need the new record's
  id, it is an output. Do not make callers reach into
  `steps.x.outputs.body…` of your HTTP call; they cannot.
- **Let failures fail.** Do not swallow an HTTP error to return
  `ok: false`. A failed step is something the caller can branch on, see in
  the run history, and retry.
- **Say which statuses are fine** with `expect_status`. A 404 on a delete is
  usually success.
- **Mark secret inputs** `secret: true`, so their values are masked in the
  run log.
