# 2. The field schema

Every place a plugin describes data uses the same vocabulary: **JSON Schema
(draft 2020-12)** plus three Passport keywords, `help`, `secret` and `ui`.

It is used for:

| Where | Key | Kind |
|---|---|---|
| A plugin's shared settings | `settings` in `plugin.yaml` | form |
| An automation's own settings | `settings` in `automations/<key>.yaml` | form |
| A channel's own settings | `settings` in `channels/<name>.yaml` | form |
| A channel's per-distribution form | `distribution` in `channels/<name>.yaml` | form |
| What a manual run or a caller supplies | `inputs` in an automation or action | form |
| What an action or automation hands back | `outputs` | data |
| A reusable shape | `schemas/<name>.yaml` | data |
| An event or webhook payload | `schema` on a trigger | data |

A **form schema** is one a person fills in. Passport builds the form from it,
so it is held to a subset that always maps to a control ([2.3](#23-the-form-subset)).
A **data schema** describes what a machine produced and may use all of JSON
Schema.

Everywhere a schema is expected you may write it inline or point at one:

```yaml
inputs:
  $ref: campaign-monitor/schemas/subscriber@^1      # see chapter 3
```

## 2.1 A complete example

```yaml
inputs:
  type: object
  required: [pin, phone, kind]
  properties:
    pin:
      type: string
      title: PIN
      description: The 4-digit code sent to the member.
      pattern: "^[0-9]{4}$"
      ui: { placeholder: "0000", input_mode: numeric }
    phone:
      type: string
      format: phone
      title: Phone number
    site:
      type: string
      format: uri
      title: Site address
      description: Without a trailing slash.
    kind:
      type: string
      title: Episode type
      enum: [full, bonus, trailer]
      default: full
      ui:
        labels: { full: Full episode, bonus: Bonus, trailer: Trailer }
    events:
      type: array
      title: Events to send
      uniqueItems: true
      items: { type: string, enum: [Subscribe, Update, Deactivate] }
      default: [Deactivate]
    summary:
      type: string
      title: Summary
      maxLength: 4000
      help: |
        Shown under the episode title in Spotify. Plain text or simple HTML.
      ui: { widget: textarea, rows: 6 }
    retries:
      type: integer
      title: Attempts
      minimum: 1
      maximum: 5
      default: 3
```

What the publisher sees: a text box that only accepts four digits; a phone
box; an address box; a dropdown with three named choices; a multiselect; a
six-line paragraph box with a help popover; and a number box limited to 1
through 5.

## 2.2 Text on every schema

Three keywords are accepted on **every node of every schema**, form or data,
including the root object:

| Keyword | Shown as | Length |
|---|---|---|
| `title` | the field's label | a few words |
| `description` | the hint under the field | one sentence |
| `help` | longer guidance behind a help icon; Markdown | a paragraph or a short list |

Write them for outputs and schema files too. The Studio shows them in the
Toolbox, in Properties and in the variable picker, and Scout reads them when
it helps a publisher fill in a form.

A field with no `title` is labelled with its name, which is rarely what you
want. `passport-plugin check` warns about a form field without a `title`.

## 2.3 The form subset

| Type | Keywords allowed |
|---|---|
| any | `title`, `description`, `help`, `default`, `examples`, `deprecated`, `$ref`, `secret`, `ui` |
| `string` | `minLength`, `maxLength`, `pattern`, `format`, `enum`, `const` |
| `integer`, `number` | `minimum`, `maximum`, `exclusiveMinimum`, `exclusiveMaximum`, `multipleOf`, `enum` |
| `boolean` | |
| `array` | `items` (one schema), `minItems`, `maxItems`, `uniqueItems` |
| `object` | `properties`, `required`, `additionalProperties` (`false`; a schema, for a key/value map; or `true`, for any JSON) |

The root of a form schema is `type: object`. Unless you say otherwise,
`additionalProperties` is `false` on a form: a value for a field that is not
declared is refused.

Further rules a form must meet:

- Every field states its `type`. A list states its `items`, which may be
  strings, integers, numbers, objects or a `$ref`; a list of booleans or of
  lists has no control and is refused.
- A nested object has `properties` (a group of fields) or
  `additionalProperties` (a map); one with neither is refused.
- A field of the form itself is named with letters, digits and underscores,
  not starting with a digit, because it is read as `settings.<name>` or
  `inputs.<name>`.
- `required` may only name fields that are declared.

An action input that only another step will ever fill in (a metadata map, a
vendor payload) can be `type: object` with `additionalProperties: true`. It
accepts any JSON and is drawn as a JSON editor.

### Why some JSON Schema keywords are left out of forms

This applies only where a form is built. Outputs, schema files and event
payloads may use everything.

A form needs every field to be exactly one control with one label, and a bad
value to produce a message that points at one field. The keywords below
describe *alternatives* or *conditions* instead of one shape. A form builder
cannot tell which control to draw for them, and a validator reports their
failures as "matches none of the 3 allowed shapes", with no field to point
at. Each has a plainer way to say the same thing that a form can draw:

| Left out | What it expresses | Why a form cannot draw it | Write instead |
|---|---|---|---|
| `oneOf` / `anyOf` of fixed values | a choice with display names | it is a dropdown said the long way | `enum` + `ui.labels` |
| `oneOf` / `anyOf` of object shapes | "basic auth **or** a token" | the form would have to invent a "which shape?" switch, and errors name no field | an `enum` field that picks the kind, and `ui.show_when` on the fields of each kind |
| `if` / `then` / `else`, `not` | "B is required when A is x" | the rule is invisible until it fails | `ui.show_when` on B; a required field is only required while it is shown |
| `allOf` | several schemas merged | the fields and their order come from several places | `$ref` to one schema, or write the properties out |
| tuples (`prefixItems`) | a list where position has meaning | positions have no labels | an object with named fields |
| `patternProperties` | keys matching a pattern | there is no control for it | `additionalProperties` (a key/value editor), with `pattern` on the value if needed |
| `null` type | "explicitly nothing" | a form cannot show the difference between empty and null | leave the field out; optional means absent |

Example, "basic auth or a token":

```yaml
properties:
  auth:
    type: string
    title: Sign in with
    enum: [basic, token]
    default: token
  username: { type: string, title: User name, ui: { show_when: { auth: basic } } }
  password: { type: string, title: Password, secret: true, ui: { show_when: { auth: basic } } }
  token:    { type: string, title: API token, secret: true, ui: { show_when: { auth: token } } }
required: [auth, username, password, token]
```

`username`, `password` and `token` are all listed as required, and each is
required only while it is shown.

This is a starting restriction. Allowing a keyword later breaks nothing;
removing one after plugins use it would. If a real plugin needs one of these
in a form, it will be added together with a defined control.

## 2.4 Formats

`format` on a string is a closed list. The server checks every one of them;
the form picks a control from it. An unknown format is an error.

| Group | Formats |
|---|---|
| Text | `email`, `uri`, `phone` (E.164, `+15551230000`), `uuid`, `hostname`, `slug`, `color` (`#rrggbb`), `language` (ISO 639-1), `country` (ISO 3166-1 alpha-2), `currency` (ISO 4217), `timezone` (IANA), `regex` (RE2) |
| Time | `date` (`2026-11-14`), `date-time` (RFC 3339), `time` (`14:30`), `duration` (`90s`, `24h`, `1h30m`; not ISO 8601's `PT90S`) |
| Long text | `html`, `markdown`, `template` (a Passport template), `json`, `yaml`, `css` |
| Binary | `byte` (base64 text; see chapter 9) |
| Passport records | `passport.user`, `passport.audience`, `passport.asset`, `passport.template`, `passport.plan`, `passport.category`, `passport.article`, `passport.application`, `passport.distribution` |
| Passport ids | `passport.id` |

What some of them accept, exactly: `uri` needs a scheme (`https://…`);
`phone` is `+` and 7 to 15 digits; `time` is `HH:MM` or `HH:MM:SS` with no
offset; `duration` is not negative; `byte` is padded standard base64; `json`
and `yaml` must parse; `html`, `markdown`, `template` and `css` are text and
are not checked.

A `passport.<record>` value is that record's id. The form shows a picker for
that kind of record, and the server checks the id exists on the site.

`passport.id` is the id of any Passport record, when which kind does not
matter or there is nothing to pick from: an id in an event's body, for
instance. Passport ids are short text such as `Ch3oep6QbWZm8q5XEjgS5`, not
UUIDs. Do not use `format: uuid` for one; `uuid` is for identifiers that
really are UUIDs, usually a vendor's.

Use a format before reaching for `pattern`. A URL is `format: uri`, not a
pattern that starts with `https`.

## 2.5 Secrets

```yaml
api_key: { type: string, title: API key, secret: true }
```

`secret: true` is allowed on a string field of a `settings` schema: a field
of the form itself, not one inside a list or a group. The value is kept in
the secrets store, is never returned by any API (the form shows only whether
one is set), has no `default`, and is masked in run logs. A blank submission
keeps the stored value.

It is also allowed on a string input of an action, where it only means "mask
this value in the run log". It is not allowed in an automation's `inputs` or
a channel's `distribution` form.

Where a run reads it:

| Declared in | Plain fields | Secret fields |
|---|---|---|
| `plugin.yaml` | `settings.<name>` | `secrets.<name>` |
| an automation | `automation.settings.<name>` | `automation.secrets.<name>` |
| a channel | `channel.settings.<name>` | `channel.secrets.<name>` |

Pass a secret into an action through `with:`, to an input the action marks
`secret: true`.

## 2.6 `ui`

`ui` says how a field is presented. It never changes what is valid. The set
of keys is closed; an unknown key is an error.

| Key | Applies to | Meaning |
|---|---|---|
| `widget` | any field | Overrides the default control ([2.7](#27-which-control-a-field-gets)) |
| `placeholder` | text, number | Greyed example in an empty box |
| `prefix`, `suffix` | text, number | Fixed text beside the box, such as `$` or `seconds` |
| `input_mode` | text | Phone keyboard hint: `numeric`, `tel`, `email`, `url` |
| `rows` | textarea, code | Visible lines |
| `language` | code | `html`, `markdown`, `template`, `json`, `yaml`, `css`; taken from `format` when omitted |
| `labels` | a field with `enum`, or a list whose `items` have one | Display text per value: `{ full: Full episode }`. A value without a label shows as itself |
| `options` | string, array of strings | Choices loaded by running an action ([2.8](#28-choices-loaded-from-an-action)) |
| `level` | settings fields | `basic` (default) or `advanced`. Advanced fields sit behind "Show advanced settings" |
| `show_when` | any field | Shown only while every named field has the given value, or one of a list of values: `{ auth: basic }`, `{ operation: [add, remove] }`. A named field must be a string, number or boolean field of the same form, and a value must be one of its `enum` when it has one |
| `expression` | action inputs | Whether the step editor offers `${{ }}` for this field. Defaults to `true` for action inputs and is always `false` for settings |
| `suggested_keys` | key/value editor | Keys offered in the editor |
| `layout` | the root object of a form | Sections, rows and columns ([2.9](#29-form-layout)) |

Values for `widget`: `text`, `textarea`, `password`, `number`, `slider`,
`switch`, `checkbox`, `select`, `radio`, `multiselect`, `checkboxes`, `tags`,
`rows`, `keyvalue`, `code`, `date`, `datetime`, `time`, `color`, `picker`,
`hidden`. A widget that cannot hold the field's type is an error (a `switch`
on a string, for example).

## 2.7 Which control a field gets

When `ui.widget` is not given:

| Schema | Control |
|---|---|
| `string` | single-line text |
| `string` with `enum` | dropdown (`radio` is the usual override for 2 to 4 choices) |
| `string` with `format: email`, `uri` or `phone` | text with the matching keyboard and check |
| `string` with `format: date`, `date-time`, `time` or `color` | the matching picker |
| `string` with `format: html`, `markdown`, `template`, `json`, `yaml` or `css` | code editor |
| `string` with a `passport.*` format | record picker |
| `string` with `secret: true` | password box |
| `integer`, `number` | number box (`slider` needs `minimum` and `maximum`) |
| `boolean` | switch |
| `array` of strings with `enum` and `uniqueItems` | multiselect (`checkboxes` is the usual override for a short list) |
| `array` of strings | tags |
| `array` of objects | rows editor, one column per property, titled by each property's `title` |
| `array` of a `passport.*` format | multi-record picker |
| `object` with `properties` | a group of fields under its `title` |
| `object` with an `additionalProperties` schema | key/value editor |
| `object` with `additionalProperties: true` | JSON editor |

A plain string is always a single line. Say `ui: { widget: textarea }` for a
paragraph; nothing is guessed from `maxLength`.

## 2.8 Choices loaded from an action

A dropdown or multiselect whose choices come from the vendor, such as the
publisher's own subscriber lists:

```yaml
list_id:
  type: string
  title: Subscriber list
  ui:
    options:
      action: campaign-monitor/lists.get
      items: "${{ outputs.lists }}"
      value: "${{ item.ListID }}"
      label: "${{ item.Name }}"
```

| Key | Meaning |
|---|---|
| `action` | A built-in or plugin action whose effect is `read` or `external` (a plugin action's effect is the strongest of its steps'; see [4.2](04-actions.md#42-built-in-actions)). Optional: without it, `items` is evaluated directly |
| `with` | Its inputs, when it has any. Expressions may read `settings`, `secrets`, and the other fields of the same form as `form.<name>`. An action of the same plugin can read `settings` itself, as `lists.get` does here, and then needs no `with` |
| `items` | An expression that yields a list: over the action's `outputs`, or, with no action, over `settings`, `channel.settings` or `automation.settings` |
| `value`, `label` | Expressions over `item` |
| `default_label` | What to call the field's default when it is not among the items |

Without an action the choices come from a list the publisher already keeps in
settings, such as the voices configured on a channel:

```yaml
voice:
  type: string
  title: Voice
  ui:
    options:
      items: "${{ channel.settings.voices }}"
      value: "${{ item.voice_id }}"
      label: "${{ item.name }}"
```

`items` and `value` are required; `label` defaults to the value. Each is
exactly one expression. `options` goes on a string or a list of strings, and
not together with `enum`.

How the menu is shown:

- When the field has a `default`, the choice equal to it is listed first and
  marked "(default)". If the default is not among the items it is added
  first; name it with `default_label` (an expression or text), or it shows as
  its value.
- When the list is empty and the field is not required, the field is hidden.
- `ui.options` may be used on a property inside an array's `items`, giving a
  menu per row.

The action runs on the publisher's site with the plugin's own settings and
secrets, when the form is opened and when a field it reads from changes. The
result is cached for a short time. If the action fails, the field becomes a
plain text box with the error under it, so a publisher is never blocked. The
stored value is the `value`; it is not re-checked against the list at run
time, because a list on the vendor's side can change.

## 2.9 Form layout

Any form can carry a designed layout: `settings` of a plugin, automation or
channel; a channel's `distribution` form; and the `inputs` form of a manually
run automation or an action. It is optional. Without it the form is one
column in the order the fields are written, which suits most manual-run
forms.

The Studio's form designer writes this block when fields are dragged on its
grid. It is plain YAML and can be edited by hand.

```yaml
settings:
  type: object
  required: [api_key]
  properties:
    api_key:   { type: string, title: API key, secret: true }
    client_id: { type: string, title: Client id, pattern: "^[0-9a-f]{32}$" }
    list_id:   { type: string, title: Default list }
    poll:      { type: string, format: duration, title: Check every, default: 24h }
    retries:   { type: integer, title: Attempts, default: 3, ui: { level: advanced } }
  ui:
    layout:
      - section: Connection
        description: Both values are under Account settings, API keys.
        rows:
          - [api_key, client_id]
          - [ { field: list_id, span: 8 }, { field: poll, span: 4 } ]
          - [ { text: "Lists are read from your account once the key is saved.", span: 8, offset: 2 } ]
      - section: Delivery
        level: advanced
        rows:
          - [retries]
          - [ { divider: true } ]
```

| Part | Keys | Meaning |
|---|---|---|
| section | `section` (heading, required), `description`, `level`, `show_when`, `rows` | A titled block. `level: advanced` (settings only) puts the whole section behind the advanced switch |
| row | a list of items | Items sit side by side on a 12-column grid |
| item | a field name, or `{ field, span, offset }` | A field. `span` is 1 to 12 columns; items without one share what is left equally. `offset` (0 to 11) leaves that many empty columns before it |
| item | `{ text, span, offset }` | A note, Markdown |
| item | `{ divider: true }` | A rule across the row. Takes no `span` or `offset` |

Rules:

1. A field appears at most once.
2. A field that is declared but not placed follows the last section, in the
   order written, so adding a field never hides it.
3. Naming a field that does not exist, or a row whose spans and offsets add
   up to more than 12, is an error.
4. On a narrow screen every item takes the full width, in reading order.
5. A section's `level` or `show_when` hides the fields in it. A field's own
   `level` and `show_when` still apply. A field hidden either way is treated
   as hidden everywhere: not required, not validated, not kept.

## 2.10 Defaults that follow another value

In a channel's `distribution` form, a `default` may be an expression:

```yaml
distribution:
  type: object
  properties:
    summary:
      type: string
      title: Summary
      maxLength: 600
      default: "${{ article.summary }}"
      ui: { widget: textarea, rows: 4 }
```

The form shows the article's summary, marked as coming from the article.

- **Left alone**, the field keeps following its source. It is resolved when
  the distribution publishes, so an edit to the article afterwards is carried
  through.
- **Typed over**, it becomes that fixed value. The form offers "use the
  article's summary again" to go back.

The expression may read `article`, `distribution`, `channel.settings` and
`settings`. See chapter 6 for the full list of what `article` and
`distribution` hold.

Everywhere else a `default` is a plain value. Only `${{ … }}` in a
distribution field's default is ever evaluated. Passport template text
(`{{ .article.title }}`) in any default is kept exactly as written; a
setting that holds a template is simply text.

## 2.11 Rules that apply to every form

1. **Order.** Without a layout, the form shows fields in the order they are
   written.
2. **Required** is the object-level `required` list, as in JSON Schema.
3. **Hidden fields.** A field hidden by `show_when` is neither required nor
   validated, and its stored value is not passed to a run.
4. **Defaults first.** Defaults are applied, then the value is validated.
5. **No silent conversion.** `"5"` is not `5`. An expression that yields text
   where a number is declared is an error; `toInt`, `toFloat` and `toBool`
   exist for that.
6. **Nil means absent.** A `with:` value whose expression yields nil is
   treated as if the key were not written: the field's default applies, and
   it is an error only if the field is required. The same holds for the
   fields of a group (an object with declared `properties`). A nil inside a
   list, a key/value map or an any-JSON object is kept, and reaches a vendor
   as JSON `null`. Reading an optional input
   that was not given (`inputs.note`) yields nil, never an error.
7. **Empty text means absent, on a form.** A text box left empty is not
   sent as `""`; the field is absent. So do not write `default: ""` to mean
   "not set": leave the default off. An empty default on a field with a
   `format` or `pattern` would fail its own check.
   The exception is a text field that **has** a non-empty default. Emptying
   it means "none", not "back to the default": it is stored as `""`, which is
   accepted whatever the field's `format` or `pattern` (unless `minLength`
   forbids it), and the form offers "use the default" to go back. That is how
   a publisher clears a fallback line or a template they do not want.
8. **Rules across fields** ("an address is required unless the operation is
   list") that `show_when` cannot express are not part of the schema. Check
   them in a first step and stop with `workflow.fail` and a plain reason.
   v1's `validate:` expression on an input is gone.
9. **What a person typed is always enforced.** Settings on save, the inputs
   of a manual run, inputs supplied over the API and a distribution form on
   save are validated, and a bad value is refused with a message naming the
   field.
10. **What a machine produced is checked where you can fix it.** Values passed
   to a plugin action, an action's outputs, and event and webhook payloads
   are errors at `passport-plugin check`, on a dry run and on a sandbox. In
   production they are a warning in the run log (2.3.0), so a vendor changing
   a response does not stop a publisher's automation. A plugin action given
   inputs that do not fit runs with them as given, its defaults filled in.
11. **Settings rules.** A `secret` has no default. An `advanced` field must
   have a default and cannot be required or secret. `show_when` cannot name a
   secret field or the field itself, and its value (each one, in a list) must
   fit the named field's type.

## 2.12 Outputs

`outputs` is a data schema. It says what an action or automation hands back;
`returns` says where each value comes from.

```yaml
outputs:
  type: object
  required: [email]
  properties:
    email:   { type: string, format: email, title: Address added }
    created: { type: boolean, title: New subscriber, description: False when the address was already on the list. }
returns:
  email:   "${{ steps.add.outputs.body }}"
  created: "${{ steps.add.outputs.status == 201 }}"
```

`returns` is evaluated after the steps, inside the definition's own scope. A
value may be an expression or a plain literal (`audio_type: audio/mpeg`). The
result is checked against `outputs`.

An output whose expression yields nothing is left out, at the top and inside
a group, as an empty field is on a form: it is a fault only if `outputs`
requires it (`outputs.contact.name: is required`). Inside a list or a value
that takes any JSON, a nil stays and reaches the caller as `null`.

When the whole result is one value you already have, such as a vendor's
response described by a schema, `returns` may be a single expression instead
of a map:

```yaml
outputs: { $ref: campaign-monitor/schemas/subscriber }
returns: "${{ steps.get.outputs.body }}"
```

Either way the caller reads the result at `steps.<id>.outputs`:
`steps.<id>.outputs.email` in the first example, `steps.<id>.outputs.State`
in the second.

Give every output a `title` and, where it is not obvious, a `description`.
They are what the next developer sees in the variable picker.

## 2.13 Checklist for a field

- A `title`, and a `description` when the label alone could be misread.
- The narrowest type: an integer is `integer`, a yes/no is `boolean`, a list
  is an `array`, never a comma-separated string.
- A `format` when one fits, then `pattern`, `minLength`/`maxLength`,
  `minimum`/`maximum`.
- An `enum` for a fixed set of choices, with `ui.labels` when the values are
  not readable.
- `ui: { widget: textarea }` for anything longer than a line.
- `secret: true` for every credential.
- A `default` for everything that has a sensible one.
