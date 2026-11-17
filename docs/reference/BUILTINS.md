# Built-in actions

Every action the server carries: what it reads from `with:` and what it
leaves in `steps.<id>.outputs`. It is a closed list: an action that is not on
this page does not exist. The functions an expression may call are in
[chapter 8](../guide/08-functions.md).

> **The tables are generated from the engine.** Each action's effect line and
> its Input and Output tables sit between a pair of `reference:begin` /
> `reference:end` comments and are written by `passport-plugin reference`
> from the server's own code. Never edit between the comments: change the
> engine and refresh. The descriptions, notes and examples outside them are
> written by hand. One command refreshes every generated table of the guide
> and this folder, run at the root of the repository:
>
> ```bash
> passport-plugin reference \
>   --update docs/reference/BUILTINS.md \
>   --update docs/reference/EVENTS.md \
>   --update docs/reference/SCHEMAS.md \
>   --update docs/guide/02-field-schema.md \
>   --update docs/guide/04-actions.md \
>   --update docs/guide/08-functions.md \
>   --update docs/guide/09-files-and-binary.md
> ```
>
> The same command with `--check` changes nothing and exits 1 when a table is
> out of date; CI runs it. Use a `passport-plugin` built from the Passport
> version the guide is written for: the tables are that server's.

## Contents

- [Context Variables](#context-variables) · [Schema Definitions](#schema-definitions)
- **[Builtin Actions](#builtin-actions)**: steps you run with `action:`, with their inputs and outputs
  - [User](#user): [`user.get`](#userget) · [`user.create`](#usercreate) · [`user.update`](#userupdate) · [`user.audienceRefresh`](#useraudiencerefresh) · [`user.feed.invalidate`](#userfeedinvalidate)
  - [Messaging](#messaging): [`sendmail`](#sendmail) · [`sendsms`](#sendsms)
  - [Data & Templates](#data--templates): [`audience.view`](#audienceview) · [`audience.get`](#audienceget) · [`application.get`](#applicationget) · [`template.render`](#templaterender) · [`instance.cache.flush`](#instancecacheflush) · [`transmute`](#transmute) · [`job.get`](#jobget) · [`job.create`](#jobcreate)
  - [Commerce & Content](#commerce--content): [`plan.get`](#planget) · [`option.get`](#optionget) · [`subscription.get`](#subscriptionget) · [`credit.get`](#creditget) · [`credit.invite.create`](#creditinvitecreate) · [`feed.item.create`](#feeditemcreate) · [`distribution.get`](#distributionget) · [`distribution.render`](#distributionrender) · [`distribution.create`](#distributioncreate) · [`distribution.update`](#distributionupdate) · [`distribution.deliveries`](#distributiondeliveries) · [`asset.create`](#assetcreate) · [`asset.update`](#assetupdate) · [`asset.get`](#assetget) · [`asset.delete`](#assetdelete) · [`asset.concat`](#assetconcat) · [`asset.virtual`](#assetvirtual) · [`article.get`](#articleget) · [`entitlement.get`](#entitlementget) · [`entitlement.create`](#entitlementcreate) · [`entitlement.update`](#entitlementupdate) · [`entitlement.delete`](#entitlementdelete)
  - [HTTP](#http): [`http.get` / `http.post` / `http.put` / `http.patch` / `http.delete`](#httpget--httppost--httpput--httppatch--httpdelete)
  - [Utility & Flow Control](#utility--flow-control): [`log`](#log) · [`sleep`](#sleep) · [`set-output`](#set-output) · [`vars.set`](#varsset) · [`event.emit`](#eventemit) · [`workflow.run`](#workflowrun) · [`workflow.exit`](#workflowexit) · [`workflow.fail`](#workflowfail) · [`wait`](#wait)
- **[Expression Functions](#expression-functions)**: in [chapter 8](../guide/08-functions.md); the expression language's own are tabled here

## Context Variables

What an expression in a step may read (`settings`, `secrets`, `inputs`,
`trigger`, `steps.<id>.outputs`, `vars`, `outputs`, `loop`, `user`,
`instance` and, in a channel, `channel`, `fields`, `distribution` and
`article`) is listed in
[7.6](../guide/07-steps-and-expressions.md#76-what-a-run-can-read). Each
action below says what it leaves in `steps.<id>.outputs`; `user.get`,
`user.create` and `user.update` also set `user`.

---

## Schema Definitions

Where the shapes read in expressions are defined:

| What | Definition |
|---|---|
| **Event bodies**: `trigger.body.*` in a run an event started | [EVENTS.md](EVENTS.md), one schema per event, referenced as `passport/schemas/<event>@^1` |
| **Records**: `user`, `subscription`, `entitlement`, `application`, `instance`, `job`, the OpenID profile and the Stripe objects | [SCHEMAS.md](SCHEMAS.md) |
| **Built-in action inputs and outputs**: `steps.<id>.outputs.*` | The tables under [Builtin Actions](#builtin-actions). The same data is served at `GET /api/1.0.0/workflows/actions` and printed by `passport-plugin reference` |
| **Plugin actions** | Each action file declares its own `inputs` and `outputs` ([4.3](../guide/04-actions.md#43-a-plugin-action)) |

---

# Builtin Actions

Actions are the steps a run performs. Reference one with `action:` and pass parameters under `with:`:

```yaml
steps:
  - id: load-user
    action: user.get
    with:
      user_id: "${{ trigger.user_id }}"
  - id: welcome
    action: sendmail
    with:
      to: "${{ steps.load-user.outputs.user.login }}"
      template: welcome
      data:
        name: "${{ steps.load-user.outputs.user.profile.name }}"
```

Every action returns an outputs map, read downstream as `"${{ steps.<id>.outputs.<key> }}"`. Only steps that run **before** a given step are in scope.

The machine-readable version of everything below (each action's inputs and outputs) is served by the engine at `GET /api/1.0.0/workflows/actions` and printed by `passport-plugin reference`; the admin and Passport Studio build their catalog and autocomplete from it. Under each action, the line above its tables gives its effect class ([4.2](../guide/04-actions.md#42-built-in-actions)) and whether an automation a publisher writes may use it. An input "also read as" another name accepts either key; one "not offered in the step form" is read all the same.

## User

### `user.get`
Loads a user into the run context (also sets `user.*`). A missing user classifies as `not_found`.

<!-- reference:begin action:user.get -->
Effect: `read`. Automations a publisher writes: yes.

| Input | Required | Type | Description |
|---|---|---|---|
| `user_id` | no | user | The user's id. The selectors are tried in this order: user_id, login, subject, phone; the first one given is used. Takes an id. |
| `login` | no | expression | The user's login, an email address. Matched without regard to case. |
| `subject` | no | expression | The user's subject: the id an identity provider knows them by. |
| `phone` | no | expression | The user's phone number in E.164 form, such as +15551230000. |

One of `user_id`, `login`, `subject` and `phone` is required.

| Output | Type | Description |
|---|---|---|
| `user` | object | The loaded user |
| `user.id` | text | User ID |
| `user.login` | text | Login / email |
| `user.profile` | object | Profile object |
| `user.profile.name` | text | Display name |
| `user.profile.email` | text | Profile email |
| `user.profile.given_name` | text | First name |
| `user.profile.family_name` | text | Last name |
| `user.profile.picture` | text | Profile picture URL |
| `user.roles` | list | User roles |
<!-- reference:end action:user.get -->

### `user.create`
Creates a user (also sets `user.*`). A duplicate login classifies as `conflict`.

<!-- reference:begin action:user.create -->
Effect: `write`. Automations a publisher writes: no.

| Input | Required | Type | Description |
|---|---|---|---|
| `login` | yes | expression | The new user's login: an email address. One that is already taken fails the step as conflict. |
| `password` | no | text | A password to give the user. Left out, the user has none. |
| `profile` | no | json | An OpenID profile object: name, given_name, family_name, email, picture, phone_number and the like. A value that is not such an object is ignored. |
| `roles` | no | json | A list of the roles (permission names) to give the user. A value that is not a list of text is ignored. |
| `metadata` | no | json | A map kept with the user and read back as user.metadata. A value that is not a map is ignored. |

| Output | Type | Description |
|---|---|---|
| `user` | object | The created user |
| `user.id` | text | User ID |
| `user.login` | text | Login / email |
| `user.profile` | object | Profile object |
| `user.profile.name` | text | Display name |
| `user.profile.email` | text | Profile email |
| `user.profile.given_name` | text | First name |
| `user.profile.family_name` | text | Last name |
| `user.profile.picture` | text | Profile picture URL |
| `user.roles` | list | User roles |
<!-- reference:end action:user.create -->

### `user.update`
Updates a user (also sets `user.*`). Not-found classifies as `not_found`.

<!-- reference:begin action:user.update -->
Effect: `write`. Automations a publisher writes: no.

| Input | Required | Type | Description |
|---|---|---|---|
| `user_id` | no | user | The id of the user to change. Required unless subject is given. Takes an id. |
| `subject` | no | expression | The subject of the user to change, in place of user_id. |
| `login` | no | expression | A new login (an email address) for the user. It does not select the user. Left out, or the same as now, the login stays. |
| `profile` | no | json | The profile claims to change, as an OpenID profile object; the ones left out stay. A value that is not such an object is ignored. |
| `preferences` | no | json | The user's channel preferences (which channels they take email, SMS and the like on). A value of another shape fails the step as invalid. |
| `metadata` | no | json | A map of metadata to set on the user. A value that is not a map is ignored. |

One of `user_id` and `subject` is required.

| Output | Type | Description |
|---|---|---|
| `user` | object | The updated user |
| `user.id` | text | User ID |
| `user.login` | text | Login / email |
| `user.profile` | object | Profile object |
| `user.profile.name` | text | Display name |
| `user.profile.email` | text | Profile email |
| `user.profile.given_name` | text | First name |
| `user.profile.family_name` | text | Last name |
| `user.profile.picture` | text | Profile picture URL |
| `user.roles` | list | User roles |
<!-- reference:end action:user.update -->

### `user.audienceRefresh`
Schedules an audience-membership refresh for a user (deduped within a 10-minute window).

<!-- reference:begin action:user.audienceRefresh -->
Effect: `write`. Automations a publisher writes: no.

| Input | Required | Type | Description |
|---|---|---|---|
| `user_id` | yes | user | The id of the user whose audience memberships are worked out again. Takes an id. |

| Output | Type | Description |
|---|---|---|
| `job_id` | text | The refresh job ID |
<!-- reference:end action:user.audienceRefresh -->

### `user.feed.invalidate`
Invalidates CDN-cached feeds for the instance.

<!-- reference:begin action:user.feed.invalidate -->
Effect: `write`. Automations a publisher writes: no.

| Input | Required | Type | Description |
|---|---|---|---|
| `channel` | no | text | The feeds to invalidate: podcast or rss. Left out, both. Any other value fails the step as invalid. One of `podcast`, `rss`. |
| `user_id` | no | user | Narrow the invalidation to this user's personal feeds. Left out, the site's feeds. Takes an id. |
| `distribution_id` | no | expression | Narrow the invalidation to the feeds that carry this distribution. |

| Output | Type | Description |
|---|---|---|
| `invalidated` | boolean | Whether feeds were invalidated |
<!-- reference:end action:user.feed.invalidate -->

## Messaging

### `sendmail`
Sends an email using a template (by id or name) or a body given as base64 text.

<!-- reference:begin action:sendmail -->
Effect: `notify`. Automations a publisher writes: no.

| Input | Required | Type | Description |
|---|---|---|---|
| `to` | no | expression | Who the email goes to: one address, several separated by commas, a list of addresses, or a list of { address, name }. May be left out when user_id, to_audience or audience_id gives the recipients; with none of them the step fails. |
| `subject` | no | text | The subject line; it may use template syntax. A template that has a title of its own uses that instead. Left out, "New Message From" and the site's title. |
| `template` | no | template | The name of the template to send. template_id takes the template's id instead. Takes a name. Also read as `template_name`. |
| `body` | no | text | The message itself, in place of a template, as base64 text (base64Encode(...)). It is sent as it is, not rendered. Without a template or a body no message is sent. |
| `data` | no | json | A map of values the template reads. A value that is not a map is ignored. Also read as `context`. |
| `user_id` | no | user | The id of the user to send to, at their email address, and the member the template is rendered for. Takes an id. |
| `to_audience` | no | audience | Send to the members of the audience with this name. At most 25 members are sent to; for a whole audience use a distribution. Takes a name. |
| `audience_id` | no | audience | Send to the members of the audience with this id. At most 25 members are sent to; for a whole audience use a distribution. Takes an id. |
| `skip_sender_verification` | no | boolean | true: send even when the from address is not an approved sender, as Passport's own account emails do. Read only when it is true or false, not text. Default false. |
| `template_id` | no | text | The template by its id, in place of template. Not offered in the step form. |

One of `template`, `template_id` and `body` is required. One of `to`, `user_id`, `to_audience` and `audience_id` is required.

| Output | Type | Description |
|---|---|---|
| `count` | number | Number of messages sent |
| `transactional` | boolean | True when the message left through Passport's transactional email service; not set otherwise |
<!-- reference:end action:sendmail -->

`user_id` also associates the send with that user.

### `sendsms`
Sends an SMS from a template or from a body given as base64 text (SMS-channel parity with `sendmail`).

<!-- reference:begin action:sendsms -->
Effect: `notify`. Automations a publisher writes: no.

| Input | Required | Type | Description |
|---|---|---|---|
| `template` | no | template | The name of the template to send. template_id takes the template's id instead. Takes a name. Also read as `template_name`. |
| `body` | no | text | The message itself, in place of a template, as base64 text (base64Encode(...)). Without a template or a body no message is sent. |
| `user_id` | yes | user | The id of the user to text, at their mobile number. A user with no mobile number fails the step. Takes an id. |
| `context` | no | json | A map of values the template reads. A value that is not a map is ignored. Also read as `data`. |
| `template_id` | no | text | The template by its id, in place of template. Not offered in the step form. |

One of `template`, `template_id` and `body` is required.

| Output | Type | Description |
|---|---|---|
| `count` | number | Number of messages sent |
<!-- reference:end action:sendsms -->

## Data & Templates

### `audience.view`
Returns an audience's members, suitable for a `foreach` loop. Streams every page (bounded by `max`).

<!-- reference:begin action:audience.view -->
Effect: `read`. Automations a publisher writes: no.

| Input | Required | Type | Description |
|---|---|---|---|
| `audience` | no | audience | The audience's name. Read only when audience_id is not given. Takes a name. |
| `audience_id` | no | audience | The audience's id. Takes an id. |
| `created_after` | no | text | Keep only the members created after this time: RFC 3339 text, or a time before now written -24h or now-90m (a Go duration: h, m, s). Left out, every member. |
| `limit` | no | number | How many members are read from the database at a time. It does not bound the result; max does. Default `500`. |
| `max` | no | number | The most members to return. With max set, a larger audience gives the first max and truncated: true. Left out, the limit is 10,000 and a larger audience fails the step instead of returning a part of it. Default `10000`. |

One of `audience_id` and `audience` is required.

| Output | Type | Description |
|---|---|---|
| `users` | array | Audience members |
| `users.id` | text | User ID |
| `users.login` | text | Login |
| `users.email` | text | Email |
| `users.name` | text | Display name |
| `count` | number | Number of members returned |
| `truncated` | boolean | True if capped by max |
<!-- reference:end action:audience.view -->

### `audience.get`
Load an audience and the content categories it gates on. Use this when you need the audience's *definition* rather than its members — most often to tell a third-party platform who may access content (e.g. Spotify Open Access entitlements).

<!-- reference:begin action:audience.get -->
Effect: `read`. Automations a publisher writes: yes.

| Input | Required | Type | Description |
|---|---|---|---|
| `audience_id` | no | audience | One of audience_id or audience is required. Takes an id. |
| `audience` | no | text | The audience's name, in place of its id. |

One of `audience_id` and `audience` is required.

| Output | Type | Description |
|---|---|---|
| `audience` | object | The audience object |
| `id` | text | Audience ID |
| `categories` | list | Resolved categories ({id, name, slug}) |
| `category_slugs` | list | Category slugs — e.g. Spotify entitlements |
| `category_ids` | list | Category IDs |
<!-- reference:end action:audience.get -->

An audience that doesn't filter on categories returns empty arrays (i.e. ungated).

### `application.get`
Load an application with its audiences, plus only the metadata paths you ask for. Use it
to read an integration's settings from a workflow — e.g. the Spotify integration
application's `spotify.open_categories` — or to know which audiences belong to an
application.

<!-- reference:begin action:application.get -->
Effect: `read`. Automations a publisher writes: yes.

| Input | Required | Type | Description |
|---|---|---|---|
| `application_id` | no | text | One of application_id, name, client_id or integration_type is required. |
| `name` | no | text | The application's name or its slug. |
| `client_id` | no | text | The application's OAuth client id. |
| `integration_type` | no | text | e.g. spotify — the instance's integration application of that type. |
| `metadata_keys` | no | list | Dot paths to return under application.metadata (e.g. spotify.open_categories). Omit for none. Credential paths are refused. |

One of `application_id`, `name`, `client_id` and `integration_type` is required.

| Output | Type | Description |
|---|---|---|
| `application` | object | The application ({id, name, slug, client_id, integration_type, metadata, audiences}) |
| `application.metadata` | object | Only the requested metadata_keys, nested as in the application |
| `id` | text | Application ID |
| `audiences` | list | The application's audiences ({id, name}) |
| `audience_ids` | list | Audience IDs |
<!-- reference:end action:application.get -->

Credentials are never returned: the client secret, session secret and integration blob are
omitted, and metadata is an **allowlist** — only the paths listed in `metadata_keys` come
back (nested as in the application; missing paths are simply absent), and nothing when the
input is omitted. Known credential paths (`spotify.client_secret`) are refused even when
listed. A missing application is a `not_found` error — pair with `continue-on-error: true`
and optional chaining when the application is optional:

```yaml
- id: app
  action: application.get
  continue-on-error: true
  with:
    integration_type: spotify
    metadata_keys: [spotify.open_categories]

- id: audience
  action: audience.get
  with:
    audience_id: "${{ steps.load.outputs.distribution.audience_id }}"
  outputs:
    open_categories: "${{ steps.app?.outputs?.application?.metadata?.spotify?.open_categories ?? [] }}"

# Spotify podcast-feed rule: category slugs, unless a category is open.
- id: entitlements
  action: set-output
  with:
    entitlements: >-
      ${{ (len(steps.audience.outputs.category_ids) == 0
      || any(steps.audience.outputs.category_ids, # in outputs.open_categories))
      ? [] : map(filter(steps.audience.outputs.categories, !.hidden), .slug) }}
```

### `template.render`
Renders a template (by id or name) or a raw body against a context, returning the result as a string.

<!-- reference:begin action:template.render -->
Effect: `read`. Automations a publisher writes: yes.

| Input | Required | Type | Description |
|---|---|---|---|
| `template` | no | template | The name of the template to render. template_id takes the template's id instead. Takes a name. Also read as `template_name`. |
| `data` | no | json | A map of values the template reads. A value that is not a map is ignored. Also read as `context`. |
| `body` | no | text | Raw template body (instead of a template). |
| `article_id` | no | text | Render with this article as .article, as a distribution's render does. |
| `audience_id` | no | text | Render as a member of this audience and of every audience ranked below it, with no user data: hasAnyAudience/audiences blocks resolve for them. Can't be combined with user_id. |
| `user_id` | no | user | The id of the user to render as: the template's member is that user. Not with audience_id. Takes an id. |
| `channel` | no | text | The channel to render for (email, sms, rss, podcast or a plugin's channel): what the template's isChannel reads. |
| `transmute` | no | boolean | Atomicize the rendered HTML via headless Chrome (inline styles, capture embeds, tokenize links). Needed by channels that post HTML to systems that can't run scripts. |
| `template_id` | no | text | The template by its id, in place of template. In a plugin's run, also the name of one of the plugin's own templates. Takes an id or a name. Not offered in the step form. |

One of `template`, `template_id` and `body` is required. At most one of `audience_id` and `user_id` may be given.

| Output | Type | Description |
|---|---|---|
| `body` | text | The rendered output string |
<!-- reference:end action:template.render -->

`article_id` and `audience_id` need Passport 2.3.0; a render as an audience is described under [Rendering as an audience](#rendering-as-an-audience). `transmute` is off by default.

### `instance.cache.flush`
Flushes the instance cache.

<!-- reference:begin action:instance.cache.flush -->
Effect: `write`. Automations a publisher writes: no.

| Input | Required | Type | Description |
|---|---|---|---|
| `prefix` | no | text | The cache keys to remove, by what they start with, such as user: (a trailing * is allowed and means the same). Not read when all is true. |
| `all` | no | boolean | true: remove everything the site has cached. prefix is then not read. Default false. |

One of `prefix` and `all` is required.

| Output | Type | Description |
|---|---|---|
| `flushed` | text | Prefix flushed (or "all") |
<!-- reference:end action:instance.cache.flush -->

### `transmute`
Atomicize HTML — inline CSS, resolve images, etc. — via headless Chrome. The same engine `template.render` uses with `transmute: true`, exposed as a standalone step for HTML you assemble in a workflow.

<!-- reference:begin action:transmute -->
Effect: `control`. Automations a publisher writes: no.

| Input | Required | Type | Description |
|---|---|---|---|
| `body` | yes | expression | The HTML to transmute. |
| `body_only` | no | boolean | Transmute only the body fragment (no full document). |
| `no_inline` | no | boolean | Skip inlining CSS. |
| `timeout` | no | text | Go duration, e.g. "30s". |

| Output | Type | Description |
|---|---|---|
| `html` | text | The transmuted HTML |
<!-- reference:end action:transmute -->

### `job.get`
Load a background job by ID (or dedupe hash) to inspect its status/state.

<!-- reference:begin action:job.get -->
Effect: `read`. Automations a publisher writes: no.

| Input | Required | Type | Description |
|---|---|---|---|
| `job_id` | no | expression | The job's id. Required unless hash is given. |
| `hash` | no | text | The job's dedupe hash, in place of its id. Read only when job_id is not given. |

One of `job_id` and `hash` is required.

| Output | Type | Description |
|---|---|---|
| `job` | object | The job object |
| `id` | text | Job ID |
<!-- reference:end action:job.get -->

### `job.create`
Enqueue a background job of the given type.

<!-- reference:begin action:job.create -->
Effect: `write`. Automations a publisher writes: no.

| Input | Required | Type | Description |
|---|---|---|---|
| `type` | yes | text | The kind of job to start. One the server has no handler for is refused. |
| `params` | no | json | Job-type-specific parameters. |
| `group_id` | no | expression | An id to group the job under, so that jobs of one group can be found together. |
| `scheduled_at` | no | text | When to run it, as RFC 3339 text, such as 2026-12-01T09:00:00Z. Left out, as soon as a worker is free. Text that is not a time is ignored. |
| `dedupe_window` | no | text | A Go duration, such as 10m: a job of the same type and params started within it is not started again. Text that is not a duration is ignored. |
| `interval` | no | text | A Go duration, such as 24h: the job runs again each time it has passed. Left out, the job runs once. |

| Output | Type | Description |
|---|---|---|
| `job` | object | The created job |
| `id` | text | Job ID |
<!-- reference:end action:job.create -->

## Commerce & Content

### `plan.get`
Load a plan by ID, addon plan ID, or Stripe product.

<!-- reference:begin action:plan.get -->
Effect: `read`. Automations a publisher writes: yes.

| Input | Required | Type | Description |
|---|---|---|---|
| `plan_id` | no | expression | The plan's id. The selectors are tried in this order: plan_id, stripe_product, addon_plan_id. |
| `addon_plan_id` | no | expression | Load the plan whose addon_plan_id is this id. |
| `stripe_product` | no | text | The id of the plan's product in Stripe (prod_...). |

One of `plan_id`, `stripe_product` and `addon_plan_id` is required.

| Output | Type | Description |
|---|---|---|
| `plan` | object | The plan object |
<!-- reference:end action:plan.get -->

### `option.get`
Read an instance option value by name. Protected options are **not** overridden, so protected values are not exposed to a workflow.

<!-- reference:begin action:option.get -->
Effect: `read`. Automations a publisher writes: no.

| Input | Required | Type | Description |
|---|---|---|---|
| `name` | yes | text | The option's name. |

| Output | Type | Description |
|---|---|---|
| `name` | text | The option name |
| `value` | any | The decoded option value |
<!-- reference:end action:option.get -->

### `subscription.get`
Load a subscription by ID, Stripe subscription, or **a user's subscription to a plan** (`user_id` + `plan_id`, most recent match).

<!-- reference:begin action:subscription.get -->
Effect: `read`. Automations a publisher writes: yes.

| Input | Required | Type | Description |
|---|---|---|---|
| `subscription_id` | no | expression | The subscription's id. |
| `user_id` | no | user | The id of the user whose subscription is loaded: with plan_id, their most recent subscription to that plan; without it, the one with the recurring_interval given, which must then be given. Takes an id. |
| `plan_id` | no | expression | With user_id: the plan the subscription is to. |
| `stripe_subscription` | no | text | The subscription's id in Stripe (sub_...). |
| `recurring_interval` | no | text | With user_id and no plan_id: the billing interval of the subscription to load, month, year or once. |

One of `subscription_id`, `stripe_subscription` and `user_id` is required.

| Output | Type | Description |
|---|---|---|
| `subscription` | object | The subscription object |
<!-- reference:end action:subscription.get -->

### `credit.get`
Load a credit by ID, passcode, or Stripe coupon; `owner_id` only narrows the lookup to a credit that user owns.

<!-- reference:begin action:credit.get -->
Effect: `read`. Automations a publisher writes: no.

| Input | Required | Type | Description |
|---|---|---|---|
| `credit_id` | no | expression | The credit's id. The selectors are tried in this order: credit_id, stripe_coupon, passcode. |
| `owner_id` | no | user | Keep the credit only when this user owns it. It narrows a lookup by one of the other inputs and selects nothing by itself. Takes an id. |
| `passcode` | no | text | The passcode the credit is redeemed with. |
| `stripe_coupon` | no | text | The id of the credit's coupon in Stripe. |

One of `credit_id`, `stripe_coupon` and `passcode` is required.

| Output | Type | Description |
|---|---|---|
| `credit` | object | The credit object |
<!-- reference:end action:credit.get -->

### `credit.invite.create`
Create an invite to redeem a credit (e.g. a gift), optionally emailed to a recipient.

<!-- reference:begin action:credit.invite.create -->
Effect: `write`. Automations a publisher writes: no.

| Input | Required | Type | Description |
|---|---|---|---|
| `credit_id` | yes | expression | The id of the credit the invite redeems. |
| `user_id` | no | user | The id of the user who is invited. Required unless to is given. Takes an id. |
| `owner_id` | no | user | The id of the user the invite is from: the credit's owner. Takes an id. |
| `owner_email` | no | text | The email address of the user the invite is from, in place of owner_id. |
| `to` | no | expression | Who is invited, when they are not yet a user: an email address, or { address, name }. The invite is emailed there. Required unless user_id is given. |
| `message` | no | text | A note from the owner, shown in the invite. |
| `auto_accept` | no | boolean | true: the invite is accepted at once, without the invited person doing anything. Default false. |
| `passcode` | no | text | A passcode the invited person must give to redeem the invite. |

One of `user_id` and `to` is required.

| Output | Type | Description |
|---|---|---|
| `invite` | object | The credit invite object |
| `invite_code` | text | The invite code |
<!-- reference:end action:credit.invite.create -->

### `feed.item.create`
Publish a feed item for a user, audience, or distribution.

<!-- reference:begin action:feed.item.create -->
Effect: `write`. Automations a publisher writes: yes.

| Input | Required | Type | Description |
|---|---|---|---|
| `channel` | yes | text | The feed the item goes into: podcast or rss. One of `podcast`, `rss`. |
| `user_id` | no | user | Publish into this user's personal feed. Takes an id. |
| `audience_id` | no | audience | Publish into an audience feed. Takes an id. |
| `application_id` | no | expression | The id of the application whose feed the item goes into. Its feed token also signs a private enclosure when application is not given. |
| `title` | no | text | The item's title. |
| `description` | no | text | The item's description: the summary a feed reader shows. |
| `content` | no | expression | Item content/body (e.g. rendered from a template). |
| `enclosure_asset_id` | no | asset | Podcast enclosure — pick an uploaded audio/video asset. Takes an id. |
| `application` | no | text | Application whose durable feed token signs a private enclosure's URL (id, name, slug, client id or integration type). Defaults to application_id. |
| `author` | no | text | The author's name. author_email adds their address. |
| `expires_in` | no | text | Temporary item lifetime as a duration, e.g. "720h" or "30d". |
| `expires_at` | no | text | When the item leaves the feed, as RFC 3339 text, such as 2026-12-01T09:00:00Z. Read only when expires_in is not given. Text that is not a time is ignored. |
| `link` | no | text | The address the item links to. |
| `guid` | no | text | Item id; auto-generated when omitted. |
| `body` | no | json | A whole RSS item as an object, for what the other inputs cannot say. The other inputs are laid over it. A value of another shape fails the step as invalid. |
| `author_email` | no | text | The author's email address. Read only with author. Not offered in the step form. |

| Output | Type | Description |
|---|---|---|
| `feed_item` | object | The created feed item |
| `id` | text | The feed item ID |
<!-- reference:end action:feed.item.create -->

### `distribution.get`
Load a distribution by ID, or the latest published one (optionally filtered by channel).

<!-- reference:begin action:distribution.get -->
Effect: `read`. Automations a publisher writes: yes.

| Input | Required | Type | Description |
|---|---|---|---|
| `distribution_id` | unless `latest` | expression | The distribution's id. Required unless latest is given. |
| `channel` | no | text | With latest or last_published: look only at distributions of this channel. One of `podcast`, `rss`. |
| `latest` | no | boolean | true: load the most recently changed distribution that was published successfully, of channel when one is given. The step then needs no distribution_id. |
| `last_published` | no | boolean | true: load the distribution with the latest publish time that is not in the future, of channel when one is given, whatever distribution_id says. The step must still give distribution_id or latest (latest: false will do). |

`distribution_id` is required unless `latest` is given.

| Output | Type | Description |
|---|---|---|
| `distribution` | object | The distribution object |
<!-- reference:end action:distribution.get -->

### `distribution.render`
Render a distribution's template into its final title and body — the same rendering the built-in channels do at publish time. Use this in a distribution-channel workflow so you hand finished content to the destination instead of re-implementing templating.

<!-- reference:begin action:distribution.render -->
Effect: `read`. Automations a publisher writes: yes.

| Input | Required | Type | Description |
|---|---|---|---|
| `distribution_id` | yes | expression | Usually ${{ trigger.distribution_id }}. In a plugin channel's preview of a distribution that is not saved it holds nothing, and the distribution the run reads is rendered. |
| `user_id` | no | user | Personalize the render for a recipient (unicast runs). Takes an id. |
| `as_audience` | no | boolean | Render as a member of the distribution's audience and of every audience ranked below it, with no user data: hasAnyAudience/audiences blocks resolve for them. For content produced once per audience, such as narration audio. Can't be combined with user_id. The distribution must have an audience, or the step fails as invalid. |
| `body` | no | expression | Render this body instead of the distribution's saved body (nothing is saved), e.g. a rewritten copy of it. |

| Output | Type | Description |
|---|---|---|
| `title` | text | The rendered title |
| `body` | text | The rendered body |
<!-- reference:end action:distribution.render -->

The template is the distribution's own (`template_id`, chosen in the channel's template menu; guide 6.8). A distribution **without a template** renders its
own body (or the `body` override) as the template, so its template actions and
restricted-content blocks run with the article in context (`{{ .article.title }}`,
`timeFormat`, …). To put text around the body, compose it into `body` first.

#### Rendering as an audience

A render made as an audience (`as_audience` here, `audience_id` on
`template.render`) runs as that audience **and every audience ranked below
it** in the site's audience rank order: `hasAnyAudience` is true when any
listed audience is one of them, `audiences` when every listed audience is,
and there is no user data (`isSubscriber` is false).

- Ranked below is a larger rank number, or no rank: every unranked audience
  is below every ranked one.
- An unranked audience has nothing below it, the other unranked audiences
  included: it renders as itself alone.
- An audience ranked above is never included.

With Founding, Paid and Free ranked 1, 2, 3 and Newsletter unranked: as
Founding, all four; as Paid, Paid, Free and Newsletter; as Free, Free and
Newsletter; as Newsletter, Newsletter only. On a site that has ranked
nothing, a render as an audience is that audience only. A reader's own
render (`user_id`) is unchanged: it is their real memberships.

### `distribution.create`
Create a distribution — publish an article to a channel, or seed a custom-channel distribution from workflow data.

<!-- reference:begin action:distribution.create -->
Effect: `write`. Automations a publisher writes: yes.

| Input | Required | Type | Description |
|---|---|---|---|
| `channel` | yes | text | The channel to publish on: email, sms, rss, podcast, or the name of a channel a plugin added to the site. |
| `audience_id` | no | audience | The id of the audience the distribution is for. Required for Passport's own channels (email, sms, rss, podcast); a plugin's channel takes one when it says it needs it. Takes an id. |
| `title` | no | text | The title: an email's subject, a feed item's title. |
| `body` | unless `article_id` | expression | The content itself. Required unless article_id is given. |
| `article_id` | no | expression | The id of an article to publish, in place of a body. |
| `template_id` | no | template | The id of the template the distribution is rendered with. Left out, the distribution's own body is rendered as the template. Takes an id. |
| `asset_id` | no | asset | The id of the media file the distribution carries: a podcast episode's audio or video. A podcast distribution with a scheduled_at must have one. Takes an id. |
| `summary` | no | text | A short summary, shown where the channel shows one. |
| `description` | no | text | A description, shown where the channel shows one. |
| `language` | no | text | The language of the content, such as en. |
| `status` | no | text | pending or scheduled, the only values taken. scheduled queues it to be published at scheduled_at. One of `pending`, `scheduled`. |
| `scheduled_at` | no | text | When to publish, as RFC 3339 text, such as 2026-12-01T09:00:00Z. It must be in the future, and is needed when status is scheduled. Text that is not a time is ignored, as if left out. |
| `settings` | no | json | Channel-specific settings (e.g. {"channel":"email","subject":"…"}). |
| `context` | no | json | A map kept with the distribution and read back as distribution.context: where a channel records what it made. A value that is not a map is ignored. |

`body` is required unless `article_id` is given.

| Output | Type | Description |
|---|---|---|
| `distribution` | object | The created distribution |
| `id` | text | Distribution ID |
<!-- reference:end action:distribution.create -->

### `distribution.update`
Update an existing distribution — retitle, reschedule, change status, or soft-delete.

<!-- reference:begin action:distribution.update -->
Effect: `write`. Automations a publisher writes: yes.

| Input | Required | Type | Description |
|---|---|---|---|
| `distribution_id` | yes | expression | The id of the distribution to change. |
| `title` | no | text | A new title. Left out, it stays. |
| `body` | no | expression | A new body. Left out, it stays. |
| `summary` | no | text | A new summary. Left out, it stays. |
| `description` | no | text | A new description. Left out, it stays. |
| `language` | no | text | A new language, such as en. Left out, it stays. |
| `audience_id` | no | audience | The id of another audience to publish to. Left out, it stays. Takes an id. |
| `template_id` | no | template | The id of another template to render with. Left out, it stays. Takes an id. |
| `asset_id` | no | asset | The id of another media file to carry. Left out, it stays. Takes an id. |
| `article_id` | no | expression | The id of another article to publish. Left out, it stays. |
| `status` | no | text | pending or scheduled. pending cancels a publish that is queued; scheduled queues it for scheduled_at. One of `pending`, `scheduled`. |
| `scheduled_at` | no | text | A new time to publish, as RFC 3339 text, such as 2026-12-01T09:00:00Z. It must be in the future. Text that is not a time is ignored. |
| `settings` | no | json | The channel's settings for this distribution, as on distribution.create. A value of another shape fails the step as invalid. |
| `context` | no | json | A map that replaces the distribution's whole context: keys left out are removed. To change one key, merge the others back in: merge({"my_id": id}, distribution.context). A context-only update is allowed while the distribution is being published. |
| `deleted` | no | boolean | Soft-delete the distribution. |

| Output | Type | Description |
|---|---|---|
| `distribution` | object | The updated distribution |
| `id` | text | Distribution ID |
<!-- reference:end action:distribution.update -->

In the `merge(...)` that `context` asks for, the first argument wins where keys repeat.

### `distribution.deliveries`
Reads the delivery log of a distribution on a `per_member` channel: one row
for each member `publish` has run for, newest first. It is for a flow that
must act on what was sent member by member, which `update`, `delete` and
`status` otherwise never see: each of them runs once for the whole
distribution ([6.5.9](../guide/06-channels.md#659-per-member-channels)).

<!-- reference:begin action:distribution.deliveries -->
Effect: `read`. Automations a publisher writes: no.

| Input | Required | Type | Description |
|---|---|---|---|
| `distribution_id` | yes | expression | The distribution whose log to read, by id. In a channel flow this is usually ${{ trigger.distribution_id }}. |
| `status` | no | text | Only the members with this status. One of `sent`, `skipped`, `failed`. |
| `limit` | no | number | The most rows to return (default 100). |
| `offset` | no | number | How many rows to pass over, for the next page. |

| Output | Type | Description |
|---|---|---|
| `deliveries` | list | The rows: user_id, status (sent, skipped or failed), id (the message's id at the destination), note, attempts and at |
| `count` | number | How many rows were returned |
<!-- reference:end action:distribution.deliveries -->

A call returns one page of the log; read a longer one page by page with
`offset`.

```yaml
# channels/acme-mail.yaml: take back what was sent, member by member
delete:
  steps:
    - id: sent
      action: distribution.deliveries
      with:
        distribution_id: "${{ trigger.distribution_id }}"
        status: sent
    - id: recall
      foreach: "${{ steps.sent.outputs.deliveries }}"
      as: row
      steps:
        - id: one
          action: acme-mail/message.recall
          with:
            message_id: "${{ loop.row.id }}"
  returns:
    status: deleted
```

### `asset.create`
Create an asset — import from a URL (fetched server-side), store an inline payload string (e.g. generated text/JSON), or store bytes given as base64 text (`payload_base64`).

<!-- reference:begin action:asset.create -->
Effect: `write`. Automations a publisher writes: no.

| Input | Required | Type | Description |
|---|---|---|---|
| `filename` | yes | text | The asset's file name, which is its address: /assets/<filename>. |
| `mime_type` | no | text | The content type, such as image/png, audio/mpeg or application/json. Required with payload and payload_base64. |
| `url` | no | text | Import the asset from this URL, which is held to what an http step's url is: an allowed host at a public address, port 80 or 443, and the same for every redirect. |
| `payload` | no | expression | Store this string as the asset body (alternative to url). |
| `payload_base64` | no | expression | Store the decoded bytes of this base64 text as the asset body. Not with url or payload. |
| `public` | no | boolean | true: anyone may fetch the asset. Default false: a private asset. Not with audiences. |
| `audiences` | no | list | Make the asset protected: only members of at least one of these audiences, and admins, may fetch it. Not with public. This is how a variant of a virtual asset (asset.virtual) is made. |
| `description` | no | text | A description, shown in the asset library. |
| `type` | no | text | The kind of asset, such as media. |
| `size` | no | number | The size in bytes. Worked out from payload and payload_base64, so give it only with url when it is known. With none of url, payload and payload_base64 it is required, and the step then only reserves an asset that waits for an upload. |
| `content_duration` | no | text | For audio and video: how long it plays, as text. A feed shows it with the enclosure. |
| `categories` | no | list | A list of the ids of the categories the asset is filed under. |
| `expires_at` | no | text | When the asset expires, as RFC 3339 text, such as 2026-12-01T09:00:00Z. Left out, it does not. Text that is not a time is ignored. |
| `local` | no | boolean | Store the asset in the database instead of object storage. |
| `metadata` | no | json | A map kept with the asset and read back as asset.metadata. A value that is not a map is ignored. |

One of `url`, `payload` and `payload_base64` is required.

| Output | Type | Description |
|---|---|---|
| `asset` | object | The created asset |
| `id` | text | Asset ID |
<!-- reference:end action:asset.create -->

`audiences` with `public: true` fails the step as `invalid`. A variant of a virtual asset is put together with [`asset.virtual`](#assetvirtual).

### `asset.update`
Update an asset's metadata (description, filename, visibility, expiry, categories).

<!-- reference:begin action:asset.update -->
Effect: `write`. Automations a publisher writes: no.

| Input | Required | Type | Description |
|---|---|---|---|
| `asset_id` | yes | expression | The id of the asset to change. |
| `description` | no | text | A new description. Left out, it stays. |
| `filename` | no | text | A new file name. Left out, it stays. |
| `mime_type` | no | text | A new content type. Left out, it stays. |
| `type` | no | text | A new kind of asset. Left out, it stays. |
| `url` | no | text | A new source address for the asset, a full URL, held to what an http step's url is: an allowed host at a public address, port 80 or 443, and the same for every redirect. Left out, it stays. |
| `public` | no | boolean | true makes the asset public, false takes that back. Left out, it stays. |
| `size` | no | number | A new size in bytes. Left out, it stays. |
| `categories` | no | list | A list of category ids that replaces the asset's. Left out, they stay. |
| `expires_at` | no | text | A new time at which the asset expires, as RFC 3339 text, such as 2026-12-01T09:00:00Z. Text that is not a time is ignored. |
| `metadata` | no | json | A map of metadata to set on the asset. A value that is not a map is ignored. |

| Output | Type | Description |
|---|---|---|
| `asset` | object | The updated asset |
| `id` | text | Asset ID |
<!-- reference:end action:asset.update -->

### `asset.get`
Load an asset by ID (or filename), optionally resolving a public URL.

<!-- reference:begin action:asset.get -->
Effect: `read`. Automations a publisher writes: yes.

| Input | Required | Type | Description |
|---|---|---|---|
| `asset_id` | no | asset | The asset's id. Give this or filename, not both. Takes an id. |
| `filename` | no | text | The asset's file name, in place of its id. Give this or asset_id, not both. |
| `link` | no | boolean | true: put an address a third party can fetch in asset.link. A private asset's is signed with the feed token of application. Default false. |
| `application` | no | text | With link: the application (id, name, slug, client id or integration type) whose durable feed token signs a private asset's URL — as its podcast/RSS feed does. Not needed for public assets. |

Exactly one of `asset_id` and `filename` is required.

| Output | Type | Description |
|---|---|---|
| `asset` | object | The asset object |
| `id` | text | Asset ID |
<!-- reference:end action:asset.get -->

With `link: true`, `asset.link` is a URL a third party can fetch. Public assets
get a plain URL. A private asset is signed the way that application's
podcast/RSS feed signs its enclosures: with the application's non-expiring feed
token (`?access_token=…`), so the link stays valid for as long as the recipient
needs it (e.g. Spotify fetching `media_file_url`). Name the application the
destination is integrated through — `application: spotify` for the Spotify
channel. The application must already have a feed token (as it does once its
feed has been set up); no token is created. If the instance has a CDN asset
host configured, the link uses it. The step fails, rather than returning a URL
containing the feed placeholder `[[ getToken ... ]]`, when the asset is private
and no application or durable feed token is available. The `enclosure_asset_id`
input of `feed.item.create` resolves its URL the same way; there, `application`
defaults to the step's `application_id`, so a feed item published for an
application signs its enclosure with that application's token without repeating
it.

### `asset.delete`
Delete an asset and its stored file. Whether it is still referenced elsewhere is
the workflow's call; a channel's `delete` run typically removes the file it made.
The one reference that is checked: an asset that is a variant or the default of
a virtual asset is refused (`conflict`). Run [`asset.virtual`](#assetvirtual)
with the new set first, then delete what it no longer names. Deleting a virtual
asset leaves its variants' assets as they are.

<!-- reference:begin action:asset.delete -->
Effect: `destructive`. Automations a publisher writes: no.

| Input | Required | Type | Description |
|---|---|---|---|
| `asset_id` | yes | asset | The id of the asset to delete. One that is a variant or the default of a virtual asset is refused as conflict. Takes an id. |

| Output | Type | Description |
|---|---|---|
| `id` | text | The deleted asset's ID |
| `deleted` | boolean | True once deleted |
<!-- reference:end action:asset.delete -->

Add `continue-on-error: true` when a missing asset (already deleted by hand)
mustn't fail the run.

### `asset.concat`
Join several assets, in order, into one asset. MP3s (`audio/mpeg`) are joined
frame by frame: each part's ID3 tags and Xing/Info header frame are dropped, so
the result plays, seeks and reports its duration as one file. Anything else is
joined byte for byte. The joined file is written only after every part has been
read, so a failure leaves an existing asset of that name as it was. `lead_in`
puts silence before an MP3's first part (one part is fine), in the first audio
frame's format, so a player or headset that takes a moment to start doesn't clip
the first words.

<!-- reference:begin action:asset.concat -->
Effect: `write`. Automations a publisher writes: no.

| Input | Required | Type | Description |
|---|---|---|---|
| `asset_ids` | no | list | The parts, in order. Use this or filenames. |
| `filenames` | no | list | The parts by filename, in order. Use this or asset_ids. |
| `filename` | yes | text | The joined asset's filename. |
| `overwrite` | no | boolean | true: replace an existing asset with this filename, keeping its id. Default false: an existing one fails the step. |
| `delete_sources` | no | boolean | true: delete the parts once the joined asset is written. The joined asset itself is never deleted. Default false. |
| `mime_type` | no | text | Defaults to the first part's. |
| `description` | no | text | A description for the joined asset, shown in the asset library. |
| `public` | no | boolean | true: anyone may fetch the joined asset. Default false. Not with audiences. |
| `audiences` | no | list | Make the joined asset protected: only members of at least one of these audiences, and admins, may fetch it. Not with public. An overwrite that names none keeps the asset's. |
| `type` | no | text | The kind of asset, such as media. |
| `categories` | no | list | A list of the ids of the categories the joined asset is filed under. |
| `metadata` | no | json | A map kept with the joined asset. A value that is not a map is ignored. |
| `lead_in` | no | text | MP3 only: silence before the first part, in seconds (0.5) or as a duration ("500ms"), at most 10s. Works with a single part too. |
| `max_size` | no | number | Fail if the joined file is larger (default 200 MiB). Default `209715200`. |

Exactly one of `asset_ids` and `filenames` is required.

| Output | Type | Description |
|---|---|---|
| `asset` | object | The joined asset |
| `asset_id` | text | The joined asset's ID |
| `size` | number | Size in bytes |
| `parts` | number | Number of parts joined |
| `deleted` | list | IDs of the parts deleted |
<!-- reference:end action:asset.concat -->

`lead_in` is rounded up to whole frames.

At most 500 parts. MP3 parts should share a sample rate and channel layout,
e.g. pieces of one text read by one voice in one output format:

```yaml
# Read a long text in pieces, then join them (see chunkText)
- id: generate
  foreach: "${{ steps.plan.outputs.parts }}"   # [{text, filename}, ...]
  as: part
  steps:
    - id: tts
      action: http.post
      with:
        url: https://api.example.com/tts
        body: { text: "${{ loop.part.text }}" }
        response_asset: { filename: "${{ loop.part.filename }}", overwrite: true }
- id: join
  action: asset.concat
  with:
    filenames: "${{ map(steps.plan.outputs.parts, .filename) }}"
    filename: narration.mp3
    overwrite: true
    delete_sources: true
```

### `asset.virtual`
Build a virtual asset: one ID, filename and address answered by a different file
for each audience. Each variant is a protected asset (one created with
`audiences`) for one audience. A member gets the variant of the best-ranked
audience they are in (the site's audience rank order, unranked audiences last),
and the default when they are in none; with no default they are answered as for
a missing asset. Admins and application tokens get the first variant, or the one
for the audience named with `?as_audience=<audience id>` on the address. A
virtual asset that already has the filename is given the variants (they replace
what it had) and keeps its ID, so the step is safe to run twice.

<!-- reference:begin action:asset.virtual -->
Effect: `write`. Automations a publisher writes: no.

| Input | Required | Type | Description |
|---|---|---|---|
| `filename` | yes | text | The virtual asset's file name, which is its address: /assets/<filename>. Also read as `name`. |
| `variants` | no | json | A list of { asset_id, audience_id }: a protected asset and the audience it is for. One variant per audience; every asset of one content type and protected by its audience. |
| `default` | no | asset | The asset a member of none of the variants' audiences gets. It is checked as any asset is, so a private asset is the usual choice. Without one they are answered as for a missing asset. Takes an id. |
| `description` | no | text | A description, shown in the asset library. |
| `mime_type` | no | text | Not needed: the content type is the variants'. Given, it must be theirs. |

One of `variants` and `default` is required.

| Output | Type | Description |
|---|---|---|
| `asset` | object | The virtual asset, with its variants |
| `asset_id` | text | The virtual asset's ID: the same on every run for one filename |
| `url` | text | The virtual asset's address, without a token |
<!-- reference:end action:asset.virtual -->

The `asset` output has `virtual: true`. Each reader fetches `url` with their own token, as a feed's enclosure link does.

A variant must be a protected asset of the site (not public, with audiences)
that names its `audience_id` among its audiences. One variant per audience, each
asset once, at most 64; every variant, and the default, of one content type;
none of them a virtual asset. A set that breaks a rule fails the step as
`invalid` and leaves the virtual asset as it was. A filename that a plain asset
already has is refused (`conflict`): the step never turns a file into a virtual
asset.

While an asset is a variant or a default it cannot be deleted, made public,
given audiences that leave its variant's audience out, or change content type
(`conflict`); replacing its file with an overwrite is allowed. An audience a
variant is for cannot be deleted. Nothing a member is given carries a variant's
ID.

```yaml
# One file per audience, then one asset that gives each member theirs
- id: paid_audio
  action: http.post
  with:
    url: https://api.example.com/v1/speech
    body: { text: "${{ steps.paid_text.outputs.text }}" }
    response_asset:
      filename: "narration-${{ trigger.distribution_id }}-paid.mp3"
      overwrite: true
      audiences: ["${{ vars.paid_audience }}"]     # protected: Paid members and admins only
- id: free_audio
  action: http.post
  with:
    url: https://api.example.com/v1/speech
    body: { text: "${{ steps.free_text.outputs.text }}" }
    response_asset:
      filename: "narration-${{ trigger.distribution_id }}-free.mp3"
      overwrite: true
      audiences: ["${{ vars.free_audience }}"]
- id: narration
  action: asset.virtual
  with:
    filename: "narration-${{ trigger.distribution_id }}.mp3"
    variants:
      - { asset_id: "${{ steps.paid_audio.outputs.asset_id }}", audience_id: "${{ vars.paid_audience }}" }
      - { asset_id: "${{ steps.free_audio.outputs.asset_id }}", audience_id: "${{ vars.free_audience }}" }
    # default: an asset id for members of neither audience (optional)
```

### `article.get`
Load an article by ID.

<!-- reference:begin action:article.get -->
Effect: `read`. Automations a publisher writes: yes.

| Input | Required | Type | Description |
|---|---|---|---|
| `article_id` | yes | expression | The article's id. |

| Output | Type | Description |
|---|---|---|
| `article` | object | The article object |
| `id` | text | Article ID |
<!-- reference:end action:article.get -->

### `entitlement.get`
Load an entitlement by ID, by `subscription_id`, or by `user_id` + `plan_id` (most recent).

<!-- reference:begin action:entitlement.get -->
Effect: `read`. Automations a publisher writes: no.

| Input | Required | Type | Description |
|---|---|---|---|
| `entitlement_id` | no | expression | The entitlement's id. Required unless subscription_id, or user_id with plan_id, is given. |
| `subscription_id` | no | expression | Look up the subscription's entitlement. |
| `user_id` | no | user | With plan_id: the id of the user whose most recent entitlement to that plan is loaded. Without plan_id it selects nothing. Takes an id. |
| `plan_id` | no | expression | With user_id: the plan the entitlement is to. |

One of `entitlement_id`, `subscription_id` and `user_id` is required.

| Output | Type | Description |
|---|---|---|
| `entitlement` | object | The entitlement object |
| `id` | text | Entitlement ID |
<!-- reference:end action:entitlement.get -->

### `entitlement.create`
Grant an entitlement, typically tied to a user + plan, or a subscription.

<!-- reference:begin action:entitlement.create -->
Effect: `write`. Automations a publisher writes: no.

| Input | Required | Type | Description |
|---|---|---|---|
| `user_id` | no | user | The id of the user who is granted the entitlement. Required unless application_id is given. Takes an id. |
| `plan_id` | no | expression | The id of the plan the entitlement is to. |
| `price_id` | no | expression | The id of the price the entitlement was bought at, when there is one. |
| `subscription_id` | no | expression | The id of the subscription the entitlement comes from, when there is one. |
| `application_id` | no | expression | The id of the application that is granted the entitlement, in place of a user. Required unless user_id is given. |
| `stripe_invoice` | no | text | The id of the Stripe invoice that paid for it (in_...), when there is one. |
| `expires_at` | no | text | When the entitlement ends, as RFC 3339 text, such as 2026-12-01T09:00:00Z. Left out, it does not end. Text that is not a time is ignored. |
| `categories` | no | json | A list of entitlement category objects: the categories the entitlement opens. A value of another shape fails the step as invalid. |
| `metadata` | no | json | A map kept with the entitlement. A value that is not a map is ignored. |

One of `user_id` and `application_id` is required.

| Output | Type | Description |
|---|---|---|
| `entitlement` | object | The created entitlement |
| `id` | text | Entitlement ID |
<!-- reference:end action:entitlement.create -->

### `entitlement.update`
Update an entitlement — activate/deactivate, change expiry, categories, or metadata.

<!-- reference:begin action:entitlement.update -->
Effect: `write`. Automations a publisher writes: no.

| Input | Required | Type | Description |
|---|---|---|---|
| `entitlement_id` | yes | expression | The id of the entitlement to change. |
| `active` | no | boolean | Whether the entitlement is active: false turns it off, true on again. Left out, it stays. |
| `expires_at` | no | text | A new time at which the entitlement ends, as RFC 3339 text, such as 2026-12-01T09:00:00Z. Text that is not a time is ignored. |
| `categories` | no | json | A list of category objects that replaces the entitlement's. A value of another shape fails the step as invalid. |
| `metadata` | no | json | A map of metadata to set on the entitlement. A value that is not a map is ignored. |

| Output | Type | Description |
|---|---|---|
| `entitlement` | object | The updated entitlement |
| `id` | text | Entitlement ID |
<!-- reference:end action:entitlement.update -->

### `entitlement.delete`
Revoke an entitlement.

<!-- reference:begin action:entitlement.delete -->
Effect: `destructive`. Automations a publisher writes: no.

| Input | Required | Type | Description |
|---|---|---|---|
| `entitlement_id` | yes | expression | The id of the entitlement to revoke. |
| `force` | no | boolean | true: remove even an entitlement that was paid for, which is otherwise refused. Default false. |

| Output | Type | Description |
|---|---|---|
| `deleted` | boolean | Deleted |
| `id` | text | Entitlement ID |
<!-- reference:end action:entitlement.delete -->

## HTTP

### `http.get` / `http.post` / `http.put` / `http.patch` / `http.delete`
Call an external HTTP API. In a plugin the host must be one of the manifest's
`allowed_hosts` ([1.2](../guide/01-project-and-manifest.md#12-pluginyaml)); nothing else is
reachable. Put a vendor's calls in a plugin action
([4.3](../guide/04-actions.md#43-a-plugin-action)), run with `action:`. Sending and receiving files and bytes is
[chapter 9](../guide/09-files-and-binary.md).

<!-- reference:begin action:http.get -->
Effect: `external`. Automations a publisher writes: no.

| Input | Required | Type | Description |
|---|---|---|---|
| `url` | yes | expression | The address to call, http or https, on port 80 or 443, with no user name or password in it. In a plugin its host must be one of the manifest's allowed_hosts; otherwise one on the site's allow list. The host must be at a public address. A redirect is held to the same rules, and one to another host goes without the step's headers. |
| `headers` | no | json | A map of request headers, such as { Authorization: "Bearer ${{ secrets.api_token }}" }. Left out, none besides the Content-Type the body sets. They are sent to the url's host; a redirect to another host gets only Content-Type and Accept. |
| `query` | no | json | A map of query parameters, each written as text. One replaces a parameter of the same name in the url. |
| `body` | no | json | An object or list is sent as JSON; text is sent as it is (set Content-Type yourself). Ignored for GET/DELETE. Only one of body, form, body_base64 and multipart. |
| `form` | no | json | A map of fields sent as application/x-www-form-urlencoded. A list repeats the field, an object is sent as JSON text, a null value is left out. Not for GET/DELETE. |
| `body_base64` | no | expression | Base64 text; the decoded bytes are sent as the body. Content-Type defaults to application/octet-stream; set it in headers. Not for GET/DELETE. |
| `multipart` | no | json | Sent as multipart/form-data: { fields: {name: value}, files: [{ name, asset_id, filename, content_type }] }. Each file is an asset of this instance, streamed from storage; filename and content_type default to the asset's. Not for GET/DELETE. |
| `timeout` | no | text | How long one attempt may take, as a Go duration such as 45s or 15m. One longer than the default is honoured. Default `30s`. |
| `retries` | no | number | The total number of attempts, the first one counted. A further attempt is made after a transport error or a 5xx response, and each one that reaches a paid API is billed. Less than 1 is 1. Default `3`. |
| `expect_status` | no | json | A list of further status codes to treat as success, such as [404]: the step does not fail on them, and ok is true for them too. Left out, a 4xx or 5xx response fails the step. |
| `response_encoding` | no | text | How outputs.body is read: auto (JSON parsed, anything else as text) or base64 (the raw bytes as base64 text, for a small binary response). An error response is always read as auto. One of `auto`, `base64`. Default `auto`. |
| `max_response_size` | no | number | The largest response read into outputs.body (default 10 MiB); a larger one fails the step and none of it is returned. A response_asset body has its own max_size. Default `10485760`. |
| `response_asset` | no | json | Store a 2xx response body as an asset instead of returning it in outputs.body (for files such as audio or PDFs). Keys: filename (required), mime_type (defaults to the response Content-Type), public, audiences (audience ids that make the asset protected: their members and admins only; not with public), type, description, categories, metadata, overwrite (replace the asset with the same filename, keeping its id), max_size (bytes, default 200 MiB). The body is written only after it has fully arrived. Error responses are returned in outputs.body as usual. |

At most one of `body`, `form`, `body_base64` and `multipart` may be given.

| Output | Type | Description |
|---|---|---|
| `status` | number | HTTP status code |
| `body` | any | Response body: parsed JSON or text, or base64 text with response_encoding: base64; not set with response_asset |
| `headers` | object | Response headers |
| `ok` | boolean | True for a 2xx response |
| `asset` | object | With response_asset: the stored asset |
| `asset_id` | text | With response_asset: the stored asset's ID |
| `size` | number | With response_asset: the stored body size in bytes |
<!-- reference:end action:http.get -->

With `response_asset`, an `overwrite` keeps the asset's link as well as its id, and one that names no `audiences` keeps the ones the asset has; an MP3's duration is read into the asset's metadata.

A 4xx/5xx response (not in `expect_status`) fails the step; the response body is
in `steps.<id>.error.detail.body`. Binary bodies can't travel in `body` (they'd
be read as text): use `response_asset`, or an API variant that returns the file
as base64 inside JSON.

## Utility & Flow Control

### `log`
Logs a message to the run log.

<!-- reference:begin action:log -->
Effect: `control`. Automations a publisher writes: yes.

| Input | Required | Type | Description |
|---|---|---|---|
| `message` | yes | text | The text to write to the run's log. |
| `level` | no | text | Defaults to info. A debug message only appears when the run is in debug mode. One of `info`, `warn`, `error`, `debug`. Default `info`. |

| Output | Type | Description |
|---|---|---|
| `message` | text | The logged message |
<!-- reference:end action:log -->

### `sleep`
Pauses the workflow. Accepts a Go duration string; capped at 90s.

<!-- reference:begin action:sleep -->
Effect: `control`. Automations a publisher writes: yes.

| Input | Required | Type | Description |
|---|---|---|---|
| `duration` | yes | text | How long to pause, as a Go duration such as 5s or 1m30s. More than 90s is 90s; zero or less does not pause. For example `5s`. |

| Output | Type | Description |
|---|---|---|
| `slept` | text | Actual duration slept |
<!-- reference:end action:sleep -->

### `set-output`
Records its `with:` inputs as this step's outputs, exposing values downstream.

<!-- reference:begin action:set-output -->
Effect: `control`. Automations a publisher writes: yes.

Inputs: any keys. Each one is echoed as an output of the same name, with the value it was given.

Outputs: one for each key given, of the same name.
<!-- reference:end action:set-output -->

### `vars.set`
Writes its `with:` inputs into the shared run `vars` context (readable later as `${{ vars.<key> }}`).

<!-- reference:begin action:vars.set -->
Effect: `control`. Automations a publisher writes: yes.

Inputs: any keys. Each one is written to vars under the same name, and echoed as an output.

Outputs: one for each key given, of the same name.
<!-- reference:end action:vars.set -->

### `event.emit`
Emits an atomic event, enabling workflow chaining. Suppressed inside a silent run.

<!-- reference:begin action:event.emit -->
Effect: `write`. Automations a publisher writes: no.

| Input | Required | Type | Description |
|---|---|---|---|
| `name` | yes | text | The event's name, such as order.shipped. Automations that listen for it are started. |
| `source` | no | text | Who the event is from: what a trigger's source is matched against. Default `workflow`. |
| `body` | no | json | The event's body, any value: what a run it starts reads as trigger.body. |
| `user_id` | no | user | The id of the user the event is about: what a run it starts reads as trigger.user_id. Takes an id. |

| Output | Type | Description |
|---|---|---|
| `emitted` | boolean | Whether the event was emitted |
| `event_id` | text | The emitted event ID |
| `suppressed` | boolean | True if suppressed in a silent run |
<!-- reference:end action:event.emit -->

### `workflow.run`
Runs another workflow by ID or slug, passing `inputs` as its context. A workflow cannot invoke itself (circular runs are rejected). Inside a plugin's own automation or channel, `automation` names an automation of the same plugin by its key, in place of `workflow`.

**By default it waits** for the child to finish and returns the child's results (`outputs`, `steps`) — so the parent can read them. Turn on **`async`** to fire-and-forget instead; async runs may be scheduled for the future with **`run_at`**.

<!-- reference:begin action:workflow.run -->
Effect: `write`. Automations a publisher writes: no.

| Input | Required | Type | Description |
|---|---|---|---|
| `workflow` | unless `automation` | expression | The id or the slug of the workflow to run. |
| `automation` | no | string | In a plugin's own automation or channel, in place of workflow: the key of an automation of the same plugin. |
| `name` | no | string | With automation: which one, by its short name, when the definition was added more than once. |
| `inputs` | no | json | Passed to the child as its inputs (this is how you hand it context). |
| `async` | no | boolean | true: start the child and go on without waiting. Default false: wait for the child and read its outputs and steps. On = fire-and-forget. Off = wait for the child and read its outputs. |
| `run_at` | no | expression | With async: when to start the child, as RFC 3339 text or a duration from now such as 24h, 15m or 90s. Anything else fails the step as invalid. Left out, now. Async only. Schedule the child for later: a duration like 24h, 15m, 90s — or a date. Can be an expression. |

At most one of `workflow` and `automation` may be given. `workflow` is required unless `automation` is given.

| Output | Type | Description |
|---|---|---|
| `triggered` | boolean | Whether the child run started |
| `async` | boolean | Whether it ran fire-and-forget |
| `run_id` | text | Child workflow run ID |
| `workflow_id` | text | Child workflow ID |
| `outputs` | object | The child's named outputs (synchronous only) |
| `steps` | object | The child's step results (synchronous only) |
| `reason` | text | Reason if not triggered |
<!-- reference:end action:workflow.run -->

```yaml
# Wait for the child and use its result
- id: enrich
  action: workflow.run
  with:
    workflow: enrich-user
    inputs:
      user_id: "${{ trigger.user_id }}"
- id: use-result
  action: log
  with:
    message: "child said: ${{ steps.enrich.outputs.outputs.summary }}"

# Fire-and-forget, scheduled 24h out
- id: schedule-followup
  action: workflow.run
  with:
    workflow: send-followup
    async: true
    run_at: 24h                       # or an RFC3339 date, or ${{ trigger.body.ends_at }}
    inputs:
      user_id: "${{ trigger.user_id }}"
```

### `workflow.exit`
Terminates the run cleanly — records a success and stops executing further steps.

<!-- reference:begin action:workflow.exit -->
Effect: `control`. Automations a publisher writes: yes.

| Input | Required | Type | Description |
|---|---|---|---|
| `reason` | no | text | Why the run stops, written to the run's log. Default `workflow exited`. |

No outputs: the run ends at this step.
<!-- reference:end action:workflow.exit -->

### `workflow.fail`
Ends the run as **failed** with `reason` as its error. Unlike an action error,
the step's `on_error:` and `continue-on-error` don't catch it (inside a plugin action
too). For a distribution trigger the publish fails with the reason, so the admin
shows why and the distribution can be published again.

<!-- reference:begin action:workflow.fail -->
Effect: `control`. Automations a publisher writes: yes.

| Input | Required | Type | Description |
|---|---|---|---|
| `reason` | yes | text | Why the run cannot go on: the run's error, and what a failed publish shows. For example `why the run can't continue`. |

No outputs: the run ends at this step.
<!-- reference:end action:workflow.fail -->

```yaml
- id: empty
  if: "${{ steps.measure.outputs.characters == 0 }}"
  action: workflow.fail
  with:
    reason: "There is no text to read for this audience."
```

### `wait`
**Pauses the workflow and resumes it later** — the basis for multi-day journeys (onboarding
drips, dunning, trial conversion, win-back). The run is checkpointed (its status becomes
`waiting`) and a resume job continues it from the next step at the scheduled time, with all
earlier step outputs intact. Unlike `sleep` (max 90s, holds the run open), `wait` can span
days and survives restarts.

<!-- reference:begin action:wait -->
Effect: `control`. Automations a publisher writes: yes.

| Input | Required | Type | Description |
|---|---|---|---|
| `duration` | no | expression | How long to wait, such as 3d, 72h, 15m or 90s: a Go duration, or a number of days ending in d. At most 90 days. Read only when until is not given. How long to wait — e.g. 3d, 72h, 15m, 90s. Can be an expression. |
| `until` | no | expression | The time to wait until, as RFC 3339 text, such as 2026-12-01T09:00:00Z. Not more than 90 days from now; a time already past does not wait, and waited is false. Or wait until an exact time (RFC3339). Can be an expression like ${{ trigger.body.ends_at }}. |

One of `duration` and `until` is required.

| Output | Type | Description |
|---|---|---|
| `waited` | boolean | False when the time was already in the past (no wait) |
<!-- reference:end action:wait -->

```yaml
- id: send-welcome
  action: sendmail
  with: { user_id: "${{ trigger.user_id }}", template: welcome }
- id: wait-3-days
  action: wait
  with: { duration: 3d }
- id: send-tips           # runs 3 days later; steps.send-welcome.outputs still resolve
  action: sendmail
  with: { user_id: "${{ trigger.user_id }}", template: tips }
```

> `wait` is only valid as a **top-level step** (not inside a branch, loop, or `on_error`).
> Maximum wait is 90 days.

---

# Expression Functions

The functions Passport adds are not listed on this page. The function
reference is [chapter 8](../guide/08-functions.md): every function Passport
adds, by group, with its arguments, what it returns and the server that
first has it, and the names of the functions of the expression language
that remain available. Its tables are generated from the engine by the same
command as this page's.

The expression language's own functions, in full. Those that walk a list
take `#` as the element:

<!-- reference:begin language-functions -->
| Function | Returns | Description | Example |
|---|---|---|---|
| `all(list, predicate)` | boolean | Whether the predicate holds for every item. | `all([1, 2, 3], # > 0)` gives `true` |
| `any(list, predicate)` | boolean | Whether the predicate holds for at least one item. | `any([1, 2, 3], # > 2)` gives `true` |
| `bitand(a, b)` | integer | The bits set in both integers. | `bitand(6, 3)` gives `2` |
| `bitnand(a, b)` | integer | The bits of a that are not set in b. | `bitnand(6, 3)` gives `4` |
| `bitnot(a)` | integer | Every bit of the integer turned over. | `bitnot(0)` gives `-1` |
| `bitor(a, b)` | integer | The bits set in either integer. | `bitor(6, 3)` gives `7` |
| `bitshl(a, n)` | integer | a with its bits moved n places to the left. | `bitshl(1, 4)` gives `16` |
| `bitshr(a, n)` | integer | a with its bits moved n places to the right, its sign kept. | `bitshr(16, 2)` gives `4` |
| `bitushr(a, n)` | integer | a with its bits moved n places to the right, zeros coming in. | `bitushr(16, 2)` gives `4` |
| `bitxor(a, b)` | integer | The bits set in one integer and not the other. | `bitxor(6, 3)` gives `5` |
| `concat(lists…)` | list | The lists as one list, one after another. | `concat([1], [2, 3])` gives `[1,2,3]` |
| `count(list, predicate?)` | integer | How many items the predicate holds for; without one, how many are true. | `count([1, 2, 3], # > 1)` gives `2` |
| `filter(list, predicate)` | list | The items the predicate holds for. | `filter([1, 2, 3], # > 1)` gives `[2,3]` |
| `find(list, predicate)` | any | The first item the predicate holds for, or nil. | `find([1, 2, 3], # > 1)` gives `2` |
| `findIndex(list, predicate)` | integer | The position, from 0, of the first item the predicate holds for, or nil. | `findIndex([1, 2, 3], # > 1)` gives `1` |
| `findLast(list, predicate)` | any | The last item the predicate holds for, or nil. | `findLast([1, 2, 3], # > 1)` gives `3` |
| `findLastIndex(list, predicate)` | integer | The position, from 0, of the last item the predicate holds for, or nil. | `findLastIndex([1, 2, 3], # > 1)` gives `2` |
| `float(value)` | number | A number, or text that holds one, as a number with a fraction. Text that holds none is an error; toFloat gives 0 instead. | `float("1.5")` gives `1.5` |
| `fromBase64(s)` | text | The text that standard base64 holds, as base64Decode gives. | `fromBase64("aGk=")` gives `"hi"` |
| `fromPairs(list)` | map | A list of [key, value] pairs as a map. | `fromPairs([["a", 1]])` gives `{"a":1}` |
| `get(value, key)` | any | The item of a list at a position, or the value of a map under a key; nil when there is none. | `get({"a": 1}, "a")` gives `1` |
| `groupBy(list, expression)` | map | The items in lists, under what the expression gives for each. | `groupBy([{"k": "a", "n": 1}, {"k": "a", "n": 2}], #.k)` gives `{"a":[{"k":"a","n":1},{"k":"a","n":2}]}` |
| `int(value)` | integer | A number, or text that holds one, as an integer. Text that holds none is an error; toInt gives 0 instead. | `int("42")` gives `42` |
| `lastIndexOf(s, sub)` | integer | The byte position of the last sub in s, or -1. | `lastIndexOf("a-b-c", "-")` gives `3` |
| `map(list, expression)` | list | The expression worked out for each item. | `map([1, 2], # * 2)` gives `[2,4]` |
| `mean(list)` | number | The average of the numbers. | `mean([1, 2, 3])` gives `2` |
| `median(list)` | number | The middle one of the numbers. | `median([1, 5, 3])` gives `3` |
| `none(list, predicate)` | boolean | Whether the predicate holds for no item. | `none([1, 2, 3], # > 3)` gives `true` |
| `one(list, predicate)` | boolean | Whether the predicate holds for exactly one item. | `one([1, 2, 3], # > 2)` gives `true` |
| `reduce(list, expression, initial?)` | any | One value from the whole list: the expression is worked out for each item, with #acc the value so far and # the item. Without an initial value the first item starts it. | `reduce([1, 2, 3], #acc + #, 0)` gives `6` |
| `sort(list, order?)` | list | The list in ascending order, or descending with "desc". | `sort([3, 1, 2])` gives `[1,2,3]` |
| `sortBy(list, expression, order?)` | list | The list ordered by what the expression gives for each item, ascending, or descending with "desc". | `sortBy([{"n": 2}, {"n": 1}], #.n)` gives `[{"n":1},{"n":2}]` |
| `splitAfter(s, sep, n?)` | list | The pieces of s after each sep, each keeping its sep; at most n pieces when n is given. | `splitAfter("a,b", ",")` gives `["a,","b"]` |
| `string(value)` | text | The value as text. | `string(42)` gives `"42"` |
| `sum(list, expression?)` | number | The numbers added up; with an expression, what it gives for each item. | `sum([1, 2, 3])` gives `6` |
| `take(list, n)` | list | The first n items. | `take([1, 2, 3], 2)` gives `[1,2]` |
| `timezone(name)` | any | The time zone with that IANA name, for the language's own date functions. | `timezone("Europe/Paris")` gives a value such as `"Europe/Paris"` |
| `toBase64(s)` | text | s in standard base64, as base64Encode gives. | `toBase64("hi")` gives `"aGk="` |
| `toPairs(map)` | list | A map as a list of [key, value] pairs. | `toPairs({"a": 1})` gives `[["a",1]]` |
| `type(value)` | text | The kind of a value: nil, bool, int, uint, float, string, array or map. | `type("a")` gives `"string"` |
<!-- reference:end language-functions -->
