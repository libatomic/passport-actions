# 7. Steps and expressions

Automations and plugin actions have `steps:`, and so does each flow of a
channel ([6.5](06-channels.md#65-the-flows)) and of an extension
([5.7](05-automations.md#the-flows)). A step runs an action, or
controls which steps run.

## 7.1 A step

```yaml
- id: add
  action: campaign-monitor/subscriber.add
  if: "${{ steps.user.outputs.user.login != '' }}"
  with:
    list_id: "${{ automation.settings.list_id }}"
    email: "${{ steps.user.outputs.user.login }}"
  timeout: 30s
  continue-on-error: true
  outputs:
    added: "${{ steps.add.outputs.created }}"
```

| Key | Meaning |
|---|---|
| `id` | Required. Lowercase letters, digits, hyphens and underscores; unique among the steps of the file; in a channel or an extension, among the steps of its flow. Results are at `steps.<id>`: `.outputs`, and `.status`, which is `ok`, `skipped` or `error`. A run's record lists each step by its id, with the step's `name` beside it when it has one (`steps.<id>.name`) |
| `name` | A short title in plain words, up to 80 characters: "Work out what is read". Shown with the id wherever a person sees the step: Passport Studio, a dry run's list of steps, a run's record and the admin |
| `description` | What the step does and why, in Markdown, up to 2,000 characters. Never evaluated: `${{ }}` in it is text. Shown in Passport Studio; not copied to a run's record |
| `action` | The action to run ([chapter 4](04-actions.md)) |
| `with` | The action's inputs |
| `if` | Run the step only when true. A skipped step has `steps.<id>.status == "skipped"` |
| `timeout` | A limit on the step, `30s`, `2m` |
| `continue-on-error` | `true`: a failure is recorded and the run goes on |
| `on_error` | Steps to run if this one fails. If they succeed the run goes on |
| `outputs` | Named values for the run's `outputs` map ([7.5](#75-named-outputs)) |
| `then`, `else` | With `if`: a branch ([7.2](#72-branches)) |
| `expression`, `switch` | A choice among several ([7.2](#72-branches)) |
| `foreach`, `as`, `while`, `until`, `max`, `steps` | A loop ([7.3](#73-loops)) |

**Say what each step is for.** A step's id and action rarely tell the next
person what it does. Give every step a `name`, and a `description` wherever
the reason is not plain from the action: what it works out, what it expects,
why it is done here. They change nothing in a run. Passport Studio shows
them on the step, the run's step list shows the name, and the checker
advises it for any definition with more than five steps and none documented.
A YAML comment above a step is still fine for a note to whoever edits the
source (why a pattern is written as it is), and Passport Studio shows it on
the step too; but a comment is not seen in a run or by the admin, so what a
step does belongs in `description`.

```yaml
- id: mode
  name: Work out which preview was asked for
  description: >-
    A preview of the whole text, or of one paragraph (its play button, which
    sends the paragraph as `trigger.preview.sample`). Later steps branch on
    `steps.mode.outputs.mode`.
  action: set-output
  with:
    mode: "${{ trim(trigger.preview?.sample ?? '') != '' ? 'listen' : 'text' }}"
```

A flow of a channel may say the same of itself, with a `description` beside
its `steps` and `returns` ([6.5.1](06-channels.md#651-a-flow)). An
extension's flows may not ([5.7](05-automations.md#the-flows)).

A step has an `action`, or is a branch, or is a loop. Unknown keys are an
error.

v2 steps have no `uses:` (Node actions are gone) and no `includes:` (a recipe
is now a plugin action, run with `action:`).

## 7.2 Branches

```yaml
# skip one step
- id: note
  if: "${{ fields.note != '' }}"
  action: log
  with: { message: "${{ fields.note }}" }

# then / else
- id: by-contact
  if: "${{ steps.find.outputs.found }}"
  then:
    - id: update
      action: acme/contact.update
      with: { … }
  else:
    - id: create
      action: acme/contact.create
      with: { … }

# switch
- id: by-type
  expression: "${{ trigger.body.Type }}"
  switch:
    - when: Deactivate
      steps:
        - id: off
          action: user.update
          with: { … }
    - when: Subscribe
      steps: [ … ]
    - default: true
      steps:
        - id: ignore
          action: log
          with: { message: "ignored ${{ trigger.body.Type }}" }
```

`expression` is evaluated once; the first case whose `when` equals it runs,
or the case marked `default: true` when none does.

Steps inside a branch are ordinary steps. Their ids must still be unique in
the file (in a channel, in the flow), and their results are at `steps.<id>`
like any other.

Do not branch on `trigger.action` in a channel to tell a publish from an
update or a preview: each has its own flow.

## 7.3 Loops

```yaml
- id: pieces
  foreach: "${{ chunkText(steps.text.outputs.text, 4500) }}"
  as: piece
  steps:
    - id: speak
      action: elevenlabs/speech.create
      with:
        text: "${{ loop.piece }}"
        filename: "part-${{ loop.index }}.mp3"
```

| Key | Meaning |
|---|---|
| `foreach` | An expression that yields a list (not a list written out in YAML). The steps run once per element, in order |
| `as` | The element's name under `loop`. Default `item` |
| `while` / `until` | Repeat while true (checked before each pass) / until true (checked after each pass) |
| `max` | A limit on passes. Without it a `foreach` over more than 10,000 elements **fails before it starts**, and a `while`/`until` stops after 1,000 passes. With it, a `foreach` processes only the first `max` elements |
| `steps` | The body |

Inside a `foreach` body, `loop.<as>` is the element and `loop.index` its
position from 0. Inside `while`/`until`, only `loop.index`. After the loop,
`steps.<body step id>` holds the **last** pass. To keep something from every
pass, collect it with `vars.set`:

```yaml
- id: remember
  action: vars.set
  with:
    parts: "${{ concat(vars.parts ?? [], [steps.speak.outputs.asset_id]) }}"
```

There is no parallel loop. Passes run one after another.

## 7.4 Errors, waiting and stopping

**When a step fails**, in order: its `on_error` steps run if it has them (and
the run continues if they succeed); else if `continue-on-error: true` the run
continues; else the run fails. Either way `steps.<id>.status` is `error`
and `steps.<id>.error` holds `code` (`not_found`, `conflict`, `invalid`,
`failed`, `not_implemented` or `internal`), `message`, and `detail` when
there is any. For an HTTP failure `detail.status` and `detail.body` are the
vendor's answer.

```yaml
- id: remove
  action: acme/post.delete
  with: { post_id: "${{ published.id }}" }
  on_error:
    - id: gone
      if: "${{ steps.remove.error.detail.status != 404 }}"
      action: workflow.fail
      with: { reason: "Acme refused to delete the post: ${{ steps.remove.error.message }}" }
```

**Nothing retries by itself** except `http.*`, whose `retries` input is the
total number of attempts (default 3) for network errors and 5xx answers. Each
attempt may be billed by the vendor.

| Action | Does |
|---|---|
| `workflow.exit` | Ends the run now, as a success. Anywhere in an automation or a flow, including inside a branch or a loop; not inside a plugin action. In a channel's flow and in an extension's `preview` the `returns` is still evaluated ([6.5.1](06-channels.md#651-a-flow)); an extension's `run` ends, as an automation does, with the outputs its steps named |
| `workflow.fail` | Ends the run now, as failed, with `reason`. Not caught by `on_error` or `continue-on-error`. A channel's publish fails with that reason |
| `sleep` | Pauses in place, up to 90 seconds |
| `wait` | Suspends the run and resumes it later, up to 90 days. Top level of an automation, or of an extension's `run` flow, only; not in a channel, an extension's `preview`, a loop, a branch or a plugin action |

## 7.5 Named outputs

`outputs:` on a step adds named values to the run's `outputs` map, readable
by later steps as `outputs.<name>`. It works in automations, channel flows
and plugin actions alike, and is the handy way to name a result once and
reuse it in several `if:` conditions.

```yaml
- id: look
  action: acme/contact.find
  with: { email: "${{ steps.user.outputs.user.login }}" }
  outputs:
    known: "${{ steps.look.outputs.found }}"
    contact_id: "${{ steps.look.outputs.id }}"
```

The run's `outputs` map is also what a caller receives when an automation
declares no `outputs` schema: the result of a manual run is read from it. A
definition that does declare `outputs` and `returns` hands back exactly what
`returns` says instead.

A channel's flow never hands back the `outputs` map. Its result is its
`returns`, held to the shape Passport fixes for that flow
([6.5.1](06-channels.md#651-a-flow)). Named outputs in a flow are for the
flow's own later steps.

## 7.6 What a run can read

| Name | Holds |
|---|---|
| `settings`, `secrets` | The plugin's settings and secrets |
| `automation.settings`, `automation.secrets` | This automation's own (automations) |
| `channel.name`, `.label`, `.settings`, `.secrets` | This channel (channels) |
| `fields` | The distribution form's values (channels) |
| `distribution`, `article` | The distribution being published and its article (channels; [6.5.2](06-channels.md#652-what-a-flow-reads)) |
| `published` | What Passport kept from the last successful `publish` or `update` of the distribution: `id`, `url`, `data`, `status`, `at` (channels; [6.5.10](06-channels.md#6510-what-passport-keeps)) |
| `article`, `user`, `subscription`, … | The record an extension was run on, under the name of its kind (extensions; [5.7](05-automations.md#57-extensions)) |
| `inputs` | What was supplied for this run. Inside a plugin action: the action's inputs |
| `trigger` | What started the run ([5.3](05-automations.md#53-triggers), [6.5.2](06-channels.md#652-what-a-flow-reads)). In a channel or an extension `trigger.action` is the flow that is running |
| `steps.<id>.outputs`, `.status`, `.error` | An earlier step's result. In a channel or an extension: an earlier step of the same flow |
| `vars` | Values set with `vars.set`, or declared under `vars:` |
| `outputs` | Named outputs so far |
| `loop` | The current loop pass |
| `user` | The member most recently loaded by `user.get`, `user.create` or `user.update` in this run. Empty until one of them runs; the trigger's member is `trigger.user_id` |
| `instance` | The site: `id`, `name`, `title`, and `description`, `metadata`, `parent_id` when set |

`secrets` are special: a secret is fetched only where an expression names it,
is never stored in the run, and is masked wherever its value would appear in
a log or in the run history.

## 7.7 Expressions

An expression is written `${{ … }}` inside a string.

- **A value that is one whole expression keeps its type.**
  `count: "${{ len(vars.parts) }}"` is a number, and
  `body: "${{ steps.x.outputs.body }}"` is whatever that was: a map, a list.
- **An expression inside other text becomes text.**
  `"part-${{ loop.index }}.mp3"`.
- **Always quote.** `"${{ … }}"`. An unquoted `${{` is not valid YAML in most
  positions. For a long expression use a folded block:

  ```yaml
  context: >-
    ${{ merge({'narrated_at': now()},
              distribution.context) }}
  ```

The language is [expr](https://expr-lang.org). The essentials:

| | |
|---|---|
| Members | `steps.user.outputs.user.login`, `trigger.body["Email Address"]` |
| A step id with a hyphen | `steps.load-user.outputs` works as written |
| Missing values | `a?.b` is nil when `a` is nil; `a ?? "fallback"` |
| Comparison, logic | `==`, `!=`, `<`, `<=`, `>`, `>=`, `&&`, `\|\|`, `!`, `in`, `not in` |
| Text | `+` joins; `contains`, `startsWith`, `endsWith`, `matches` (regex) |
| Choice | `cond ? a : b` |
| Lists and maps | `[1, 2]`, `{"a": 1}`, `list[0]`, `list[1:3]` |
| Over a list | `map(list, #.id)`, `filter(list, #.active)`, `find`, `all`, `any`, `count`, `sum`, `sortBy`, `groupBy`, `reduce` (`#` is the element) |
| A local name | `let n = len(x); n > 3 ? "many" : "few"` |

Every function is in [chapter 8](08-functions.md).

## 7.8 Things that catch people

- **`}}` ends an expression.** A literal `{{ else }}`, or a regex with
  `\}\}`, cannot appear inside one. Put such text in a `set-output` step as a
  plain value and refer to it.
- **`: ` in an unquoted YAML value** breaks parsing, and a ternary has one.
  Quote the string or use a folded block (`>-`).
- **A map literal inside `map(…)`** is read as a closure.
  Write `map(list, ({"a": #.x}))`, with the extra parentheses.
- **`$` in a replacement.** `regexReplace` expands `$1`. Double a literal
  `$`, or use `replaceEach` with `literal: true`.
- **`merge` keeps the first.** `merge(new, old)` keeps your new keys.
- **`default` takes the fallback first.** `default("none", value)`.
- **`coalesce` cannot fall back to something empty.** `coalesce(x, list())`
  is nil when `x` is missing, and the next function fails on it. Write
  `x ?? []`.
- **`len` counts bytes**, not characters.
- **`title` upper-cases everything.** Use `titleCase`.
- **No silent conversion.** `"5" == 5` is false. Use `toInt`, `toFloat`,
  `toBool`, `toString`.
- **`distribution.update` replaces `context`.** Merge the old map back in.
- **`http.*` `retries` is total attempts**, not extra ones.
- **No binary in outputs or a body string.** See [chapter 9](09-files-and-binary.md).
- **A preview must not have side effects.** A `preview` flow, of a channel
  or of an extension, cannot run a step that writes
  ([6.5.3](06-channels.md#653-what-a-flow-may-do),
  [5.7](05-automations.md#the-preview-flow)); what its calls do at the
  vendor is still yours to keep harmless.
- **A redirect is not followed off the list.** `http.*` follows a redirect
  only to a host in `allowed_hosts`, and drops the step's headers when the
  redirect goes to another host. A download that worked in a browser and
  fails here with "redirected the request to …, which was not followed"
  needs the second host listed; one that then answers 401 needs a step of
  its own that calls the second host with the credential
  ([1.2](01-project-and-manifest.md#where-http-may-connect)).
