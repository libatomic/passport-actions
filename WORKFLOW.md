# Workflows — a plain-language guide

A **workflow** is an automation you build in Passport: *"when this happens, do these
things."* It runs a list of **steps**, in order, whenever a **trigger** fires — for
example, email a subscriber when their subscription is about to expire, or add a new
user to a mailing list.

You build workflows in the admin (a visual editor and a YAML source view). This guide
explains how they *think* — how the steps flow, how conditions and branches and loops
work, and what happens when something is skipped or fails. You don't need to be a
developer to follow it.

> Looking for the deep technical reference (internals, APIs, the Go engine)? See
> [`atomic/docs/WORKFLOW.md`](https://github.com/libatomic/atomic/blob/master/docs/WORKFLOW.md).
> This document is the friendly version.

## Contents

- [The big picture](#the-big-picture)
- [Triggers — when a workflow runs](#triggers--when-a-workflow-runs)
- [Steps — the building blocks](#steps--the-building-blocks)
- [The run context — the data you can use](#the-run-context--the-data-you-can-use)
- [Expressions — the `${{ }}` bits](#expressions--the--bits)
- [Conditions — skipping a step (not stopping the workflow)](#conditions--skipping-a-step-not-stopping-the-workflow)
- [Branches — choosing a path](#branches--choosing-a-path)
- [Loops — repeating steps](#loops--repeating-steps)
- [Stopping early on purpose](#stopping-early-on-purpose)
- [When a step fails](#when-a-step-fails)
- [Inputs — values you provide](#inputs--values-you-provide)
- [Named outputs — reuse a computed value](#named-outputs--reuse-a-computed-value)
- [Secrets](#secrets)
- [A full example, annotated](#a-full-example-annotated)
- [Quick reference](#quick-reference)

---

## The big picture

Every workflow has three parts:

1. **A trigger** (`on:`) — *when* it runs (an event happened, a schedule ticked, you
   pressed Run).
2. **Steps** (`steps:`) — *what* it does, one after another, top to bottom.
3. Optional **inputs** — values you can set when configuring or testing it.

When a workflow runs, the engine starts at the first step and works **down the list, one
step at a time**. Each step can use the results of the steps before it. When it reaches
the bottom, the run is finished.

A single run is recorded so you can see what happened — which steps ran, what they
produced, and whether it succeeded. Open a workflow's run history in the admin to
inspect any run.

**One important rule up front:** skipping a step is *not* the same as stopping the
workflow. Most of this guide comes back to that idea — a condition that isn't met
usually just **bypasses one step** and keeps going.

---

## Triggers — when a workflow runs

A workflow can start in four ways. You declare them in the `on:` block.

| Trigger | Runs when… | Typical use |
|---|---|---|
| **Event** | Something happens in Passport (a user is created, a subscription is canceled, …) | The most common — react to activity |
| **Manual** | You press **Run** in the admin | Testing, or one-off jobs |
| **Schedule** | A timer elapses (every hour, every day, …) | Recurring housekeeping |
| **Webhook** | An outside service calls a URL | Receiving events from Stripe, Twilio, etc. |

### Event triggers

```yaml
on:
  - event: user.subscription.expiring
```

Now the workflow runs every time that event fires. The event's details arrive as
**`trigger.body`** (see [the run context](#the-run-context--the-data-you-can-use)).

**Filtering which events count.** Add an `if:` to react only to *some* events:

```yaml
on:
  - event: user.subscription.status.canceled
    if: body.prev_status == "active"     # only when it was active before
```

This filter is checked *before the workflow even starts* — if it doesn't match, no run
is created at all (nothing is wasted).

**Wildcards.** An event name can contain `*` to match a whole family of events:

```yaml
on:
  - event: user.subscription.status.*    # active, past_due, canceled, paused, …
```

So one workflow can cover every subscription-status change without you editing it when a
new status is added.

### Manual, schedule, and webhook

```yaml
on:
  - manual: true                 # adds a Run button

  - schedule: 24h                # every 24 hours (also "1h", "30m", …)

  - webhook: true                # gives you a URL to paste into a third-party
    validate: false              # webhooks require a validator or an explicit opt-out
```

---

## Steps — the building blocks

Each step **does one thing** and has a unique `id`. The two you'll use most:

```yaml
steps:
  - id: load-user                # an ACTION — a built-in operation
    action: user.get
    with:
      user_id: ${{ trigger.user_id }}

  - id: add-to-list              # a RECIPE — a pre-packaged set of steps
    includes: libatomic/passport-actions/recipes/cm/subscriber-add@v1
    with:
      api_key: ${{ secrets.CM_API_KEY }}
      list_id: ${{ inputs.list_id }}
      email: ${{ steps.load-user.outputs.user.profile.email }}
```

- **`action:`** runs a built-in operation (send an email, look up a user, log a message,
  call an HTTP endpoint…). See [`BUILTINS.md`](BUILTINS.md) for the full list.
- **`includes:`** pulls in a **recipe** — a reusable mini-workflow (e.g. the Campaign
  Monitor recipes) so you don't rebuild the same steps every time.
- **`with:`** are the values you hand the step. They can be fixed text or
  `${{ expressions }}` that pull in live data.

Steps run **in order**, and a later step can read an earlier step's result via
`${{ steps.<id>.outputs.* }}` — that's how data flows through a workflow. There's no
separate "pass this along" instruction; a step's result simply *is* its output.

---

## The run context — the data you can use

While a workflow runs, a bag of data is available to your expressions. These are the
"roots" you'll see in autocomplete:

| Root | What it holds |
|---|---|
| `trigger` | The thing that started the run — `trigger.body` (the event details), `trigger.user_id` (the user, when the event has one) |
| `steps` | Every step's result so far — `steps.<id>.outputs.*`, `steps.<id>.status` |
| `inputs` | Values you configured/provided (see [Inputs](#inputs--values-you-provide)) |
| `user` | The current user object, once you've loaded it with `user.get` |
| `instance` | Your instance — `instance.name`, `instance.id` |
| `secrets` | Stored credentials — `secrets.CM_API_KEY` (see [Secrets](#secrets)) |
| `vars` | Scratch values you set during the run |
| `outputs` | Named computed values you defined (see [Named outputs](#named-outputs--reuse-a-computed-value)) |
| `loop` | Inside a loop — the current item and its index |

You don't have to memorize these — the editor autocompletes them after `${{`.

---

## Expressions — the `${{ }}` bits

Anywhere you see `${{ ... }}`, Passport fills in a live value when the workflow runs. So
`${{ trigger.user_id }}` becomes the actual user id, and
`${{ steps.load-user.outputs.user.profile.email }}` becomes that user's email.

Expressions can also *compute* things using helper functions — check if a value is
empty, format a date, build a string, and so on:

```yaml
subject: "Hi ${{ steps.load-user.outputs.user.profile.name }}, your plan ends ${{ fromNow(trigger.body.ends_at) }}"
# → "Hi Sam, your plan ends in 7 days"
```

The full list of helpers (strings, math, dates, logic) is in
[`BUILTINS.md` → Expression Functions](BUILTINS.md#expression-functions). A few you'll
reach for often:

- `empty(x)` / `!empty(x)` — is a value missing / present?
- `coalesce(inputs.list_id, "fallback")` — use the first non-empty value (great for a
  default that's still overridable on a test run).
- `fromNow(date)` — "in 7 days", "3 days ago".
- `isEmail(x)` — does it look like an email address?

> In condition fields (`if:`) you can usually write the expression with or without the
> `${{ }}` wrapper — both work. In text fields (like an email `subject`), use `${{ }}`
> so Passport knows which part is a live value.

---

## Conditions — skipping a step (not stopping the workflow)

Put an **`if:`** on any step to make it run only when a condition is true.

```yaml
steps:
  - id: load-subscription
    action: subscription.get
    with:
      subscription_id: ${{ trigger.body.subscription_id }}

  - id: notify
    if: ${{ !empty(steps.load-subscription.outputs.subscription.plan_id) }}
    action: sendmail
    with:
      user_id: ${{ trigger.body.user_id }}
      template: plan-ending

  - id: log-done
    action: log
    with:
      message: "finished"
```

**This is the part people most often misunderstand, so here it is plainly:**

> **If the condition is *false*, that one step is skipped — and the workflow keeps
> going to the next step. It does *not* stop or fail.**

In the example above, if there's no `plan_id`, the `notify` step is **bypassed**, and
`log-done` **still runs**. The run is recorded as successful; `notify` simply shows a
status of *skipped*.

Use a step `if:` when the meaning is *"only do this bit when it applies."* If you instead
want to **stop the whole workflow**, that's a different tool —
see [Stopping early on purpose](#stopping-early-on-purpose).

Here's the whole family at a glance:

| You want to… | Use | What happens to the rest of the workflow |
|---|---|---|
| Do a step only sometimes | **`if:` on the step** | Skipped when false — **everything after still runs** |
| Do one thing *or* another | **`if / then / else`** | One path runs; both rejoin and continue |
| Pick among several cases | **`switch`** | First matching case runs; then continue |
| Repeat steps for each item | **`foreach`** | The inner steps run once per item, then continue |
| Stop the whole workflow (successfully) | **`workflow.exit`** | Nothing after it runs |
| Keep going even if a step errors | **`continue-on-error: true`** | Error recorded; next step still runs |

---

## Branches — choosing a path

Branches route the workflow down one of several paths. After the branch, the paths
**rejoin** and the workflow continues with the next step.

### If / Then / Else

```yaml
steps:
  - id: enterprise-check
    if: ${{ hasSuffix(steps.load-user.outputs.user.login, "@bigco.com") }}
    then:
      - id: welcome-enterprise
        action: sendmail
        with:
          template: enterprise-welcome
          user_id: ${{ trigger.user_id }}
    else:
      - id: welcome-standard
        action: sendmail
        with:
          template: standard-welcome
          user_id: ${{ trigger.user_id }}

  - id: after
    action: log
    with:
      message: "welcome sent — this runs no matter which path was taken"
```

- `if:` decides which way to go.
- `then:` runs when it's true; `else:` (optional) runs when it's false.
- If you leave out `else:` and the condition is false, the branch simply does nothing —
  and, as always, the workflow **continues** to `after`.

### Switch — many cases

When there are several possibilities, `switch` reads them **in order** and runs the
**first** one that matches:

```yaml
steps:
  - id: by-country
    switch:
      - when: ${{ steps.load-user.outputs.user.profile.country == "US" }}
        steps:
          - id: us
            action: sendmail
            with: { template: us-welcome, user_id: ${{ trigger.user_id }} }
      - when: ${{ steps.load-user.outputs.user.profile.country == "UK" }}
        steps:
          - id: uk
            action: sendmail
            with: { template: uk-welcome, user_id: ${{ trigger.user_id }} }
      - default: true
        steps:
          - id: other
            action: sendmail
            with: { template: general-welcome, user_id: ${{ trigger.user_id }} }
```

- Cases are checked top to bottom; the first `when:` that's true wins.
- A `default: true` case (put it last) runs if nothing else matched.
- If nothing matches and there's no default, the switch does nothing — and the workflow
  continues.

---

## Loops — repeating steps

### `foreach` — once per item

Run a set of steps for **every item in a list**:

```yaml
steps:
  - id: members
    action: audience.view          # produces a list of users
    with:
      audience: newsletter

  - id: sync-each
    foreach: ${{ steps.members.outputs.users }}
    as: member                     # each item is called "member" inside the loop
    steps:
      - id: add
        continue-on-error: true    # one failure won't stop the rest
        includes: libatomic/passport-actions/recipes/cm/subscriber-add@v1
        with:
          api_key: ${{ secrets.CM_API_KEY }}
          list_id: ${{ inputs.list_id }}
          email: ${{ loop.member.profile.email }}
```

- `foreach:` is the list to walk.
- `as:` names the current item — reference it as `${{ loop.member }}`. You also get
  `${{ loop.index }}` (0, 1, 2, …).
- Set `max:` to cap the number of iterations. There's a hard ceiling of **1000** no
  matter what.

### `while` / `until` — repeat on a condition

```yaml
- id: retry-loop
  until: ${{ steps.check.outputs.ready == true }}   # stop once this is true
  max: 5
  steps:
    - id: check
      action: http.get
      with: { url: "https://example.com/status" }
    - id: wait
      action: sleep
      with: { duration: 10s }
```

- `while:` repeats **as long as** the condition is true; `until:` repeats **until** it
  becomes true.
- Always set a sensible `max:` — loops are bounded, but you want your own limit too.

---

## Stopping early on purpose

Sometimes you genuinely want to **end the whole workflow**, not just skip a step. Use the
built-in **`workflow.exit`** action:

```yaml
- id: only-paid
  if: ${{ empty(steps.load-subscription.outputs.subscription.plan_id) }}
  then:
    - id: stop
      action: workflow.exit
      with:
        reason: "not a paid subscription — nothing to do"
```

- `workflow.exit` stops the run cleanly. **Nothing after it runs.**
- This is **not** a failure — the run is recorded as **successful** (you chose to stop).

Compare:

- **Skip a step** → `if:` on the step. The rest continues.
- **Stop everything on purpose** → `workflow.exit`. Recorded as success.
- **Something broke** → an error. See below.

---

## When a step fails

If a step hits a real error (a service is down, a required value is missing), then **by
default the workflow stops there and the run is marked failed.** That's usually what you
want — you don't silently carry on after something broke.

You have two ways to change that when a failure is expected or recoverable:

**1. Keep going — `continue-on-error: true`.** The error is recorded, but the next step
still runs. Handy for "try this, then decide what to do":

```yaml
- id: lookup
  action: user.get
  continue-on-error: true
  with: { login: ${{ trigger.body.email }} }

- id: create-if-missing
  if: ${{ steps.lookup.error.code == "not_found" }}   # only if lookup failed this way
  action: user.create
  with: { login: ${{ trigger.body.email }} }
```

Every failure has a simple **code** you can check: `not_found`, `conflict`, `invalid`,
`not_implemented`, or `internal`.

**2. Handle it — `on_error:`.** Attach clean-up steps that run only if the step fails;
afterward the workflow continues:

```yaml
- id: charge
  action: http.post
  with: { url: "https://api.example.com/charge" }
  on_error:
    - id: alert
      action: sendmail
      with: { template: charge-failed, user_id: ${{ trigger.user_id }} }
```

So, to summarize the difference between *skip* and *fail*:

- A **skipped** step (false `if:`) is normal and expected — the run stays successful.
- A **failed** step is a problem — it stops the run unless you opted into
  `continue-on-error` or `on_error`.

---

## Inputs — values you provide

Inputs are settings for a workflow — like the Campaign Monitor **list id** to add people
to. You declare them once; they show up as a form when you press **Run**, and you
reference them as `${{ inputs.<name> }}`.

```yaml
inputs:
  list_id:
    type: string          # string | integer | number | bool | array | object
    required: true        # the Run form makes you fill it in
    default: "abc123"     # used if you don't provide one (and by event-triggered runs)
    validate: isEmail(value)   # optional: a rule checked before the run starts
```

- **`required`** — a required input must have a value (either provided, or a non-empty
  default). Otherwise the run is refused with a clear message.
- **`type`** — controls the form field (a number box, a switch for `bool`, a dropdown for
  `enum`) and is checked when the run starts.
- **`validate`** — a rule that must pass, e.g. `isEmail(value)` (here `value` is what was
  entered). If it fails, the run is refused.

**Configuring a fixed value that's still testable.** Set the input's `default` to your
real value — event-triggered runs use it automatically, and you can still override it on
a manual test run. (Or use `${{ coalesce(inputs.list_id, "abc123") }}` in a step for a
built-in fallback.)

---

## Named outputs — reuse a computed value

If the same longish condition shows up in several steps, name it once. Add an `outputs:`
block to a step; each entry is computed after that step runs and becomes
`${{ outputs.<name> }}` everywhere after it.

```yaml
- id: load-subscription
  action: subscription.get
  with:
    subscription_id: ${{ trigger.body.subscription_id }}
  outputs:
    is_paid: ${{ !empty(steps.load-subscription.outputs.subscription.plan_id) && !empty(steps.load-subscription.outputs.subscription.price_id) }}

- id: add-to-list
  if: ${{ outputs.is_paid }}          # much easier to read than repeating the whole condition
  includes: libatomic/passport-actions/recipes/cm/subscriber-add@v1
  with: { ... }
```

In the visual editor, open the step's config panel and use the **Outputs** section to add
these.

---

## Secrets

Never paste API keys or passwords directly into a workflow. Store them once as **secrets**
(Workflows → Secrets in the admin) and reference them as `${{ secrets.NAME }}`:

```yaml
with:
  api_key: ${{ secrets.CM_API_KEY }}
```

Secrets are resolved privately at run time and never appear in logs or run output.

---

## A full example, annotated

Add paying new subscribers to a Campaign Monitor list, and skip free/planless ones —
without stopping the workflow:

```yaml
name: New Paid Subscriber → Campaign Monitor

on:
  - event: user.subscription.created      # runs on every new subscription

inputs:
  list_id:
    type: string
    required: true                        # you must set the target list

steps:
  # 1. Load the subscription so we can see the plan/price and the user.
  - id: load-subscription
    action: subscription.get
    with:
      subscription_id: ${{ trigger.body.subscription_id }}
    outputs:
      # name the "is this a paid, plan-backed subscription?" check once
      is_subscriber: ${{ !empty(steps.load-subscription.outputs.subscription.plan_id) && !empty(steps.load-subscription.outputs.subscription.price_id) }}

  # 2. Only for paid subscribers — otherwise this step is skipped and we move on.
  - id: load-user
    if: ${{ outputs.is_subscriber }}
    action: user.get
    with:
      user_id: ${{ steps.load-subscription.outputs.subscription.user_id }}

  # 3. Also only for paid subscribers. Free subs simply never reach the list —
  #    and the run still finishes successfully.
  - id: add-to-list
    if: ${{ outputs.is_subscriber }}
    includes: libatomic/passport-actions/recipes/cm/subscriber-add@v1
    with:
      api_key: ${{ secrets.CM_API_KEY }}
      list_id: ${{ inputs.list_id }}
      email: ${{ steps.load-user.outputs.user.profile.email }}
      name: ${{ steps.load-user.outputs.user.profile.name }}
```

For a *free* subscription, steps 2 and 3 are **skipped**, step 1 already ran, and the
run is recorded as a success. Nothing broke — those steps just didn't apply.

---

## Quick reference

| Concept | Field | Remember |
|---|---|---|
| When it runs | `on:` | event / manual / schedule / webhook |
| A step | `action:` or `includes:` + `with:` | runs one operation |
| Use live data | `${{ ... }}` | trigger, steps, inputs, user, instance, secrets, outputs, loop |
| Run a step only sometimes | `if:` on the step | **false → skip that step, keep going** |
| One path or another | `if / then / else` | paths rejoin afterward |
| Many cases | `switch` | first match wins; `default:` last |
| Repeat per item | `foreach:` + `as:` | `${{ loop.<as> }}`, `${{ loop.index }}` |
| Repeat on a condition | `while:` / `until:` + `max:` | always cap it |
| Stop on purpose (success) | `action: workflow.exit` | nothing after runs |
| A failure | (default) | stops the run, unless… |
| Tolerate a failure | `continue-on-error: true` | error recorded, next step runs |
| Handle a failure | `on_error:` | clean-up steps, then continue |
| Provide a value | `inputs:` | required / type / validate |
| Reuse a computed value | `outputs:` on a step | `${{ outputs.<name> }}` |
| Credentials | `secrets:` | `${{ secrets.NAME }}` |

**The one thing to take away:** a condition that isn't met **skips a step and continues**
— it doesn't stop the workflow. When you truly want to stop, use `workflow.exit`.
