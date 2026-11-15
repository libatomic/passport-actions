# 7. Steps and expressions

Automations, channels and plugin actions all have `steps:`. A step runs an
action, or controls which steps run.

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
| `id` | Required. Lowercase letters, digits, hyphens and underscores; unique among the steps of the file. Results are at `steps.<id>`: `.outputs`, and `.status`, which is `ok`, `skipped` or `error` |
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
- id: by-action
  if: "${{ trigger.action == 'republish' }}"
  then:
    - id: update
      action: acme/post.update
      with: { … }
  else:
    - id: create
      action: acme/post.create
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
the file, and their results are at `steps.<id>` like any other.

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
| `foreach` | A list. The steps run once per element, in order |
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
  with: { post_id: "${{ distribution.context.post_id }}" }
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
| `workflow.exit` | Ends the run now, as a success. Anywhere in an automation or channel, including inside a branch or a loop; not inside a plugin action |
| `workflow.fail` | Ends the run now, as failed, with `reason`. Not caught by `on_error` or `continue-on-error`. A channel's publish fails with that reason |
| `sleep` | Pauses in place, up to 90 seconds |
| `wait` | Suspends the run and resumes it later, up to 90 days. Top level of an automation only; not in a channel, a loop, a branch or a plugin action |

## 7.5 Named outputs

`outputs:` on a step adds named values to the run's `outputs` map, readable
by later steps as `outputs.<name>`. It works in automations, channels and
plugin actions alike, and is the handy way to name a result once and reuse
it in several `if:` conditions.

The run's `outputs` map is also what a caller receives when the definition
declares no `outputs` schema: a channel's preview and status results are
read from it, and so is the result of a manual run. A definition that does
declare `outputs` and `returns` hands back exactly what `returns` says
instead.

```yaml
- id: answer
  if: "${{ trigger.action == 'preview' }}"
  action: workflow.exit
  outputs:
    text: "${{ steps.text.outputs.text }}"
    characters: "${{ len(steps.text.outputs.text) }}"
    limit: "${{ channel.settings.max_characters }}"
```

## 7.6 What a run can read

| Name | Holds |
|---|---|
| `settings`, `secrets` | The plugin's settings and secrets |
| `automation.settings`, `automation.secrets` | This automation's own (automations) |
| `channel.name`, `.label`, `.settings`, `.secrets` | This channel (channels) |
| `fields` | The distribution form's values (channels) |
| `distribution`, `article` | The distribution being published and its article (channels; [6.5](06-channels.md#65-what-a-channel-must-answer)) |
| `inputs` | What was supplied for this run. Inside a plugin action: the action's inputs |
| `trigger` | What started the run ([5.3](05-automations.md#53-triggers), [6.5](06-channels.md#65-what-a-channel-must-answer)) |
| `steps.<id>.outputs`, `.status`, `.error` | An earlier step's result |
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
    ${{ merge({'post_id': steps.post.outputs.post_id},
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
- **`len` counts bytes**, not characters.
- **`title` upper-cases everything.** Use `titleCase`.
- **No silent conversion.** `"5" == 5` is false. Use `toInt`, `toFloat`,
  `toBool`, `toString`.
- **`distribution.update` replaces `context`.** Merge the old map back in.
- **`http.*` `retries` is total attempts**, not extra ones.
- **No binary in outputs or a body string.** See [chapter 9](09-files-and-binary.md).
- **A preview must not have side effects.** Gate them.
