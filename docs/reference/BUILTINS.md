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
  - [Commerce & Content](#commerce--content): [`plan.get`](#planget) · [`option.get`](#optionget) · [`subscription.get`](#subscriptionget) · [`credit.get`](#creditget) · [`credit.invite.create`](#creditinvitecreate) · [`feed.item.create`](#feeditemcreate) · [`distribution.get`](#distributionget) · [`distribution.render`](#distributionrender) · [`distribution.create`](#distributioncreate) · [`distribution.update`](#distributionupdate) · [`asset.create`](#assetcreate) · [`asset.update`](#assetupdate) · [`asset.get`](#assetget) · [`asset.delete`](#assetdelete) · [`asset.concat`](#assetconcat) · [`asset.virtual`](#assetvirtual) · [`article.get`](#articleget) · [`entitlement.get`](#entitlementget) · [`entitlement.create`](#entitlementcreate) · [`entitlement.update`](#entitlementupdate) · [`entitlement.delete`](#entitlementdelete)
  - [HTTP](#http): [`http.get` / `http.post` / `http.put` / `http.patch` / `http.delete`](#httpget--httppost--httpput--httppatch--httpdelete)
  - [Utility & Flow Control](#utility--flow-control): [`log`](#log) · [`sleep`](#sleep) · [`set-output`](#set-output) · [`vars.set`](#varsset) · [`event.emit`](#eventemit) · [`workflow.run`](#workflowrun) · [`workflow.exit`](#workflowexit) · [`workflow.fail`](#workflowfail) · [`wait`](#wait)
- **[Expression Functions](#expression-functions)**: in [chapter 8](../guide/08-functions.md)

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
| `user_id` | no | user | One selector is required. |
| `login` | no | expression | Login (email) |
| `subject` | no | expression | Subject (external ID) |
| `phone` | no | expression | Phone number. |

| Output | Type | Description |
|---|---|---|
| `user` | object | The loaded user |
| `user.id` |  | User ID |
| `user.login` |  | Login / email |
| `user.profile` |  | Profile object |
| `user.profile.name` |  | Display name |
| `user.profile.email` |  | Profile email |
| `user.profile.given_name` |  | First name |
| `user.profile.family_name` |  | Last name |
| `user.profile.picture` |  | Profile picture URL |
| `user.roles` |  | User roles |
<!-- reference:end action:user.get -->

One of `user_id`, `login`, `subject` and `phone` is required.

### `user.create`
Creates a user (also sets `user.*`). A duplicate login classifies as `conflict`.

<!-- reference:begin action:user.create -->
Effect: `write`. Automations a publisher writes: no.

| Input | Required | Type | Description |
|---|---|---|---|
| `login` | yes | expression | Login (email) |
| `password` | no | text | Password. |
| `profile` | no | json | Profile. |
| `roles` | no | json | Roles. |
| `metadata` | no | json | Metadata. |

| Output | Type | Description |
|---|---|---|
| `user` | object | The created user |
| `user.id` |  | User ID |
| `user.login` |  | Login / email |
| `user.profile` |  | Profile object |
| `user.profile.name` |  | Display name |
| `user.profile.email` |  | Profile email |
| `user.profile.given_name` |  | First name |
| `user.profile.family_name` |  | Last name |
| `user.profile.picture` |  | Profile picture URL |
| `user.roles` |  | User roles |
<!-- reference:end action:user.create -->

`profile` is an OpenID profile object and `roles` a list of permissions.

### `user.update`
Updates a user (also sets `user.*`). Not-found classifies as `not_found`.

<!-- reference:begin action:user.update -->
Effect: `write`. Automations a publisher writes: no.

| Input | Required | Type | Description |
|---|---|---|---|
| `user_id` | no | user | One selector is required. |
| `subject` | no | expression | Subject. |
| `login` | no | expression | Login (email) |
| `profile` | no | json | Profile Updates. |
| `preferences` | no | json | Channel Preferences. |
| `metadata` | no | json | Metadata. |

| Output | Type | Description |
|---|---|---|
| `user` | object | The updated user |
| `user.id` |  | User ID |
| `user.login` |  | Login / email |
| `user.profile` |  | Profile object |
| `user.profile.name` |  | Display name |
| `user.profile.email` |  | Profile email |
| `user.profile.given_name` |  | First name |
| `user.profile.family_name` |  | Last name |
| `user.profile.picture` |  | Profile picture URL |
| `user.roles` |  | User roles |
<!-- reference:end action:user.update -->

One of `user_id`, `subject` and `login` is required: it selects the user.

### `user.audienceRefresh`
Schedules an audience-membership refresh for a user (deduped within a 10-minute window).

<!-- reference:begin action:user.audienceRefresh -->
Effect: `write`. Automations a publisher writes: no.

| Input | Required | Type | Description |
|---|---|---|---|
| `user_id` | yes | user | User ID. |

| Output | Type | Description |
|---|---|---|
| `job_id` |  | The refresh job ID |
<!-- reference:end action:user.audienceRefresh -->

### `user.feed.invalidate`
Invalidates CDN-cached feeds for the instance.

<!-- reference:begin action:user.feed.invalidate -->
Effect: `write`. Automations a publisher writes: no.

| Input | Required | Type | Description |
|---|---|---|---|
| `channel` | no | text | podcast or rss; omit for all. One of `podcast`, `rss`. |
| `user_id` | no | user | User ID. |
| `distribution_id` | no | expression | Distribution ID. |

| Output | Type | Description |
|---|---|---|
| `invalidated` |  | Whether feeds were invalidated |
<!-- reference:end action:user.feed.invalidate -->

`user_id` and `distribution_id` each narrow the invalidation, to that user's feeds or to that distribution's.

## Messaging

### `sendmail`
Sends an email using a template (by id or name) or a raw body.

<!-- reference:begin action:sendmail -->
Effect: `notify`. Automations a publisher writes: no.

| Input | Required | Type | Description |
|---|---|---|---|
| `to` | no | expression | String, comma-separated string, list, or list of {address, name}. |
| `subject` | no | text | Subject. |
| `template` | no | template | Template name (alias: template_name; or template_id). Also read as `template_name`. |
| `body` | no | text | Raw email body (instead of a template). |
| `data` | no | json | Template Data. Also read as `context`. |
| `user_id` | no | user | User ID. |
| `to_audience` | no | audience | Send to every user in an audience, by audience name. |
| `audience_id` | no | audience | Send to every user in an audience, by audience id. |
| `skip_sender_verification` | no | boolean | Bypass the approved-sender check (admin/system templates). |
| `template_id` | no | text | The template by its id, in place of template. Not offered in the step form. |

| Output | Type | Description |
|---|---|---|
| `count` |  | Number of messages sent |
<!-- reference:end action:sendmail -->

One of `template` (or `template_id`) and `body` is required. `to` may be omitted when `user_id` resolves a recipient. `user_id` also associates the send with that user.

### `sendsms`
Sends a templated or raw SMS (SMS-channel parity with `sendmail`).

<!-- reference:begin action:sendsms -->
Effect: `notify`. Automations a publisher writes: no.

| Input | Required | Type | Description |
|---|---|---|---|
| `template` | no | template | Template name (alias: template_name; or template_id). Also read as `template_name`. |
| `body` | no | text | Raw message body (instead of a template). |
| `user_id` | no | user | Recipient user (resolves the phone number). |
| `context` | no | json | Template Context. Also read as `data`. |
| `template_id` | no | text | The template by its id, in place of template. Not offered in the step form. |

| Output | Type | Description |
|---|---|---|
| `count` |  | Number of messages sent |
<!-- reference:end action:sendsms -->

One of `template` (or `template_id`) and `body` is required.

## Data & Templates

### `audience.view`
Returns an audience's members, suitable for a `foreach` loop. Streams every page (bounded by `max`).

<!-- reference:begin action:audience.view -->
Effect: `read`. Automations a publisher writes: no.

| Input | Required | Type | Description |
|---|---|---|---|
| `audience` | no | audience | Audience slug/name (or use audience_id). |
| `audience_id` | no | audience | Audience ID. |
| `created_after` | no | text | Created After. |
| `limit` | no | number | Page Size. Default `500`. |
| `max` | no | number | Max Members. Default `10000`. |

| Output | Type | Description |
|---|---|---|
| `users` | array | Audience members |
| `users.id` |  | User ID |
| `users.login` |  | Login |
| `users.email` |  | Email |
| `users.name` |  | Display name |
| `count` |  | Number of members returned |
| `truncated` |  | True if capped by max |
<!-- reference:end action:audience.view -->

One of `audience_id` and `audience` is required. `created_after` keeps only the members created after that time.

### `audience.get`
Load an audience and the content categories it gates on. Use this when you need the audience's *definition* rather than its members — most often to tell a third-party platform who may access content (e.g. Spotify Open Access entitlements).

<!-- reference:begin action:audience.get -->
Effect: `read`. Automations a publisher writes: yes.

| Input | Required | Type | Description |
|---|---|---|---|
| `audience_id` | no | audience | One of audience_id or audience is required. |
| `audience` | no | text | Audience Name. |

| Output | Type | Description |
|---|---|---|
| `audience` | object | The audience object |
| `id` | text | Audience ID |
| `categories` | list | Resolved categories ({id, name, slug}) |
| `category_slugs` | list | Category slugs — e.g. Spotify entitlements |
| `category_ids` | list | Category IDs |
<!-- reference:end action:audience.get -->

One of `audience_id` and `audience` (the audience's name) is required.

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
| `name` | no | text | Name or slug. |
| `client_id` | no | text | Client ID. |
| `integration_type` | no | text | e.g. spotify — the instance's integration application of that type. |
| `metadata_keys` | no | list | Dot paths to return under application.metadata (e.g. spotify.open_categories). Omit for none. Credential paths are refused. |

| Output | Type | Description |
|---|---|---|
| `application` | object | The application ({id, name, slug, client_id, integration_type, metadata, audiences}) |
| `application.metadata` | object | Only the requested metadata_keys, nested as in the application |
| `id` | text | Application ID |
| `audiences` | list | The application's audiences ({id, name}) |
| `audience_ids` | list | Audience IDs |
<!-- reference:end action:application.get -->

One of `application_id`, `name`, `client_id` and `integration_type` is required.

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
| `template` | no | template | Pick an existing template (or an expression). Alias: template_name; or template_id. Also read as `template_name`. |
| `data` | no | json | Context passed to the template. Also read as `context`. |
| `body` | no | text | Raw template body (instead of a template). |
| `article_id` | no | text | Render with this article as .article, as a distribution's render does. |
| `audience_id` | no | text | Render as a member of this audience and of every audience ranked below it, with no user data: hasAnyAudience/audiences blocks resolve for them. Can't be combined with user_id. |
| `user_id` | no | user | User ID. |
| `channel` | no | text | Channel. |
| `transmute` | no | boolean | Atomicize the rendered HTML via headless Chrome (inline styles, capture embeds, tokenize links). Needed by channels that post HTML to systems that can't run scripts. |
| `template_id` | no | text | The template by its id, in place of template. In a plugin's run, also the name of one of the plugin's own templates. Not offered in the step form. |

| Output | Type | Description |
|---|---|---|
| `body` |  | The rendered output string |
<!-- reference:end action:template.render -->

One of `template` (or `template_id`) and `body` is required. `article_id` and `audience_id` need Passport 2.3.0; a render as an audience is described under [Rendering as an audience](#rendering-as-an-audience). `transmute` is off by default.

### `instance.cache.flush`
Flushes the instance cache.

<!-- reference:begin action:instance.cache.flush -->
Effect: `write`. Automations a publisher writes: no.

| Input | Required | Type | Description |
|---|---|---|---|
| `prefix` | no | text | Targeted prefix (supports trailing *, e.g. user:*). |
| `all` | no | boolean | Flush All. |

| Output | Type | Description |
|---|---|---|
| `flushed` |  | Prefix flushed (or "all") |
<!-- reference:end action:instance.cache.flush -->

Give `prefix`, or `all: true` to flush the whole instance cache: one of the two is required.

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
| `job_id` | no | expression | Job ID. |
| `hash` | no | text | Look up by dedupe hash instead of ID. |

| Output | Type | Description |
|---|---|---|
| `job` | object | The job object |
| `id` | text | Job ID |
<!-- reference:end action:job.get -->

One of `job_id` and `hash` is required.

### `job.create`
Enqueue a background job of the given type.

<!-- reference:begin action:job.create -->
Effect: `write`. Automations a publisher writes: no.

| Input | Required | Type | Description |
|---|---|---|---|
| `type` | yes | text | Job Type. |
| `params` | no | json | Job-type-specific parameters. |
| `group_id` | no | expression | Group ID. |
| `scheduled_at` | no | text | Scheduled At (RFC3339) |
| `dedupe_window` | no | text | Go duration, e.g. "10m". |
| `interval` | no | text | Recurring interval as a Go duration. |

| Output | Type | Description |
|---|---|---|
| `job` | object | The created job |
| `id` | text | Job ID |
<!-- reference:end action:job.create -->

`group_id` groups the job under an id; `dedupe_window` suppresses duplicates within that window.

## Commerce & Content

### `plan.get`
Load a plan by ID, addon plan ID, or Stripe product.

<!-- reference:begin action:plan.get -->
Effect: `read`. Automations a publisher writes: yes.

| Input | Required | Type | Description |
|---|---|---|---|
| `plan_id` | no | expression | Plan ID. |
| `addon_plan_id` | no | expression | Addon Plan ID. |
| `stripe_product` | no | text | Stripe Product. |

| Output | Type | Description |
|---|---|---|
| `plan` | object | The plan object |
<!-- reference:end action:plan.get -->

One of `plan_id`, `addon_plan_id` and `stripe_product` is required.

### `option.get`
Read an instance option value by name. Protected options are **not** overridden, so protected values are not exposed to a workflow.

<!-- reference:begin action:option.get -->
Effect: `read`. Automations a publisher writes: no.

| Input | Required | Type | Description |
|---|---|---|---|
| `name` | yes | text | Option Name. |

| Output | Type | Description |
|---|---|---|
| `name` |  | The option name |
| `value` |  | The decoded option value |
<!-- reference:end action:option.get -->

### `subscription.get`
Load a subscription by ID, Stripe subscription, or **a user's subscription to a plan** (`user_id` + `plan_id`, most recent match).

<!-- reference:begin action:subscription.get -->
Effect: `read`. Automations a publisher writes: yes.

| Input | Required | Type | Description |
|---|---|---|---|
| `subscription_id` | no | expression | Subscription ID. |
| `user_id` | no | user | With plan_id, returns that user's subscription to the plan. |
| `plan_id` | no | expression | Plan ID. |
| `stripe_subscription` | no | text | Stripe Subscription. |
| `recurring_interval` | no | text | Recurring Interval. |

| Output | Type | Description |
|---|---|---|
| `subscription` | object | The subscription object |
<!-- reference:end action:subscription.get -->

One selector is required: `subscription_id`, `stripe_subscription`, or `user_id` with `plan_id` (the user's subscription to that plan, the most recent match). `recurring_interval` is read with `user_id`, for a lookup without a plan.

### `credit.get`
Load a credit by ID, owner, passcode, or Stripe coupon.

<!-- reference:begin action:credit.get -->
Effect: `read`. Automations a publisher writes: no.

| Input | Required | Type | Description |
|---|---|---|---|
| `credit_id` | no | expression | Credit ID. |
| `owner_id` | no | user | Owner ID. |
| `passcode` | no | text | Passcode. |
| `stripe_coupon` | no | text | Stripe Coupon. |

| Output | Type | Description |
|---|---|---|
| `credit` | object | The credit object |
<!-- reference:end action:credit.get -->

One of `credit_id`, `owner_id`, `passcode` and `stripe_coupon` is required.

### `credit.invite.create`
Create an invite to redeem a credit (e.g. a gift), optionally emailed to a recipient.

<!-- reference:begin action:credit.invite.create -->
Effect: `write`. Automations a publisher writes: no.

| Input | Required | Type | Description |
|---|---|---|---|
| `credit_id` | yes | expression | Credit ID. |
| `user_id` | no | user | User ID. |
| `owner_id` | no | user | Owner ID. |
| `owner_email` | no | text | Owner Email. |
| `to` | no | expression | To (recipient email) |
| `message` | no | text | Message. |
| `auto_accept` | no | boolean | Auto Accept. |
| `passcode` | no | text | Passcode. |

| Output | Type | Description |
|---|---|---|
| `invite` | object | The credit invite object |
| `invite_code` |  | The invite code |
<!-- reference:end action:credit.invite.create -->

`to` is an email address or `{address, name}`. `owner_id` or `owner_email` names the credit's owner; `passcode` protects the invite.

### `feed.item.create`
Publish a feed item for a user, audience, or distribution.

<!-- reference:begin action:feed.item.create -->
Effect: `write`. Automations a publisher writes: yes.

| Input | Required | Type | Description |
|---|---|---|---|
| `channel` | no | text | Channel. One of `podcast`, `rss`. |
| `user_id` | no | user | Publish into this user's personal feed. |
| `audience_id` | no | audience | Publish into an audience feed. |
| `application_id` | no | expression | Application ID. |
| `title` | no | text | Title. |
| `description` | no | text | Description. |
| `content` | no | expression | Item content/body (e.g. rendered from a template). |
| `enclosure_asset_id` | no | asset | Podcast enclosure — pick an uploaded audio/video asset. |
| `application` | no | text | Application whose durable feed token signs a private enclosure's URL (id, name, slug, client id or integration type). Defaults to application_id. |
| `author` | no | text | Author. |
| `expires_in` | no | text | Temporary item lifetime as a duration, e.g. "720h" or "30d". |
| `expires_at` | no | text | Expires At (RFC3339) |
| `link` | no | text | Link. |
| `guid` | no | text | Item id; auto-generated when omitted. |
| `body` | no | json | Item Body (advanced RSS item) |
| `author_email` | no | text | The author's email address. Read only with author. Not offered in the step form. |

| Output | Type | Description |
|---|---|---|
| `feed_item` | object | The created feed item |
| `id` |  | The feed item ID |
<!-- reference:end action:feed.item.create -->

### `distribution.get`
Load a distribution by ID, or the latest published one (optionally filtered by channel).

<!-- reference:begin action:distribution.get -->
Effect: `read`. Automations a publisher writes: yes.

| Input | Required | Type | Description |
|---|---|---|---|
| `distribution_id` | no | expression | Required unless latest is set. |
| `channel` | no | text | Channel. One of `podcast`, `rss`. |
| `latest` | no | boolean | Return the most recently published distribution. |
| `last_published` | no | boolean | Last Published. |

| Output | Type | Description |
|---|---|---|
| `distribution` | object | The distribution object |
<!-- reference:end action:distribution.get -->

`distribution_id` is required unless `latest` is set. `last_published` returns the last published distribution.

### `distribution.render`
Render a distribution's template into its final title and body — the same rendering the built-in channels do at publish time. Use this in a distribution-channel workflow so you hand finished content to the destination instead of re-implementing templating.

<!-- reference:begin action:distribution.render -->
Effect: `read`. Automations a publisher writes: yes.

| Input | Required | Type | Description |
|---|---|---|---|
| `distribution_id` | yes | expression | Usually ${{ trigger.distribution_id }}. |
| `user_id` | no | user | Personalize the render for a recipient (unicast runs). |
| `as_audience` | no | boolean | Render as a member of the distribution's audience and of every audience ranked below it, with no user data: hasAnyAudience/audiences blocks resolve for them. For content produced once per audience, such as narration audio. Can't be combined with user_id. |
| `body` | no | expression | Render this body instead of the distribution's saved body (nothing is saved), e.g. a rewritten copy of it. |

| Output | Type | Description |
|---|---|---|
| `title` | text | The rendered title |
| `body` | text | The rendered body |
<!-- reference:end action:distribution.render -->

With `as_audience` the distribution must have an audience.

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
| `channel` | no | text | Distribution channel (e.g. email, rss, podcast, or a custom channel). |
| `audience_id` | no | audience | Required for built-in channels. |
| `title` | no | text | Title. |
| `body` | no | expression | Content body; required when no article_id is given. |
| `article_id` | no | expression | Publish an existing article instead of an inline body. |
| `template_id` | no | template | Template. |
| `asset_id` | no | asset | Asset (podcast enclosure) |
| `summary` | no | text | Summary. |
| `description` | no | text | Description. |
| `language` | no | text | Language. |
| `status` | no | text | Status. One of `pending`, `scheduled`. |
| `scheduled_at` | no | text | Scheduled At (RFC3339) |
| `settings` | no | json | Channel-specific settings (e.g. {"channel":"email","subject":"…"}). |
| `context` | no | json | Context. |

| Output | Type | Description |
|---|---|---|
| `distribution` | object | The created distribution |
| `id` | text | Distribution ID |
<!-- reference:end action:distribution.create -->

`channel` is required. `audience_id` is required for the built-in channels, and `body` unless `article_id` is given. `scheduled_at` is required by the queue when `status` is `scheduled`.

### `distribution.update`
Update an existing distribution — retitle, reschedule, change status, or soft-delete.

<!-- reference:begin action:distribution.update -->
Effect: `write`. Automations a publisher writes: yes.

| Input | Required | Type | Description |
|---|---|---|---|
| `distribution_id` | no | expression | Distribution ID. |
| `title` | no | text | Title. |
| `body` | no | expression | Body. |
| `summary` | no | text | Summary. |
| `description` | no | text | Description. |
| `language` | no | text | Language. |
| `audience_id` | no | audience | Audience ID. |
| `template_id` | no | template | Template. |
| `asset_id` | no | asset | Asset. |
| `article_id` | no | expression | Article ID. |
| `status` | no | text | Status. One of `pending`, `scheduled`. |
| `scheduled_at` | no | text | Scheduled At (RFC3339) |
| `settings` | no | json | Channel Settings. |
| `context` | no | json | Context. |
| `deleted` | no | boolean | Soft-delete the distribution. |

| Output | Type | Description |
|---|---|---|
| `distribution` | object | The updated distribution |
| `id` | text | Distribution ID |
<!-- reference:end action:distribution.update -->

`distribution_id` is required. `context` **replaces the whole map**: merge the existing keys back in, `${{ merge({"my_id": ...}, steps.load.outputs.distribution.context) }}` (the first argument wins). A context-only update is allowed while the distribution is publishing, so a channel can record ids during its own publish.

### `asset.create`
Create an asset — import from a URL (fetched server-side), store an inline payload string (e.g. generated text/JSON), or store bytes given as base64 text (`payload_base64`).

<!-- reference:begin action:asset.create -->
Effect: `write`. Automations a publisher writes: no.

| Input | Required | Type | Description |
|---|---|---|---|
| `filename` | no | text | Filename. |
| `mime_type` | no | text | e.g. image/png, audio/mpeg, application/json. |
| `url` | no | text | Import the asset from this URL. |
| `payload` | no | expression | Store this string as the asset body (alternative to url). |
| `payload_base64` | no | expression | Store the decoded bytes of this base64 text as the asset body. Not with url or payload. |
| `public` | no | boolean | Public. |
| `audiences` | no | list | Make the asset protected: only members of at least one of these audiences, and staff, may fetch it. Not with public. This is how a variant of a virtual asset (asset.virtual) is made. |
| `description` | no | text | Description. |
| `type` | no | text | Type. |
| `size` | no | number | Size (bytes) |
| `content_duration` | no | text | For audio/video assets. |
| `categories` | no | list | Category IDs. |
| `expires_at` | no | text | Expires At (RFC3339) |
| `local` | no | boolean | Store the asset in the database instead of object storage. |
| `metadata` | no | json | Metadata. |

| Output | Type | Description |
|---|---|---|
| `asset` | object | The created asset |
| `id` | text | Asset ID |
<!-- reference:end action:asset.create -->

One of `url`, `payload` and `payload_base64` is required, and only one. `audiences` with `public: true` fails the step as `invalid`; it is how a variant of a virtual asset ([`asset.virtual`](#assetvirtual)) is made. `size` is worked out for an inline `payload`.

### `asset.update`
Update an asset's metadata (description, filename, visibility, expiry, categories).

<!-- reference:begin action:asset.update -->
Effect: `write`. Automations a publisher writes: no.

| Input | Required | Type | Description |
|---|---|---|---|
| `asset_id` | no | expression | Asset ID. |
| `description` | no | text | Description. |
| `filename` | no | text | Filename. |
| `mime_type` | no | text | MIME Type. |
| `type` | no | text | Type. |
| `url` | no | text | Source URL. |
| `public` | no | boolean | Public. |
| `size` | no | number | Size (bytes) |
| `categories` | no | list | Category IDs. |
| `expires_at` | no | text | Expires At (RFC3339) |
| `metadata` | no | json | Metadata. |

| Output | Type | Description |
|---|---|---|
| `asset` | object | The updated asset |
| `id` | text | Asset ID |
<!-- reference:end action:asset.update -->

`asset_id` is required.

### `asset.get`
Load an asset by ID (or filename), optionally resolving a public URL.

<!-- reference:begin action:asset.get -->
Effect: `read`. Automations a publisher writes: yes.

| Input | Required | Type | Description |
|---|---|---|---|
| `asset_id` | no | asset | Asset ID. |
| `filename` | no | text | Look up by filename instead of ID. |
| `link` | no | boolean | Populate a resolvable public URL on the asset. |
| `application` | no | text | With link: the application (id, name, slug, client id or integration type) whose durable feed token signs a private asset's URL — as its podcast/RSS feed does. Not needed for public assets. |

| Output | Type | Description |
|---|---|---|
| `asset` | object | The asset object |
| `id` | text | Asset ID |
<!-- reference:end action:asset.get -->

One of `asset_id` and `filename` is required. `application` is read with `link`, for a private asset.

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
| `asset_id` | yes | asset | Asset ID. |

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
| `overwrite` | no | boolean | Replace an existing asset with this filename, keeping its id. |
| `delete_sources` | no | boolean | Delete the parts once the joined asset is written. |
| `mime_type` | no | text | Defaults to the first part's. |
| `description` | no | text | Description. |
| `public` | no | boolean | Public. |
| `audiences` | no | list | Make the joined asset protected: only members of at least one of these audiences, and staff, may fetch it. Not with public. An overwrite that names none keeps the asset's. |
| `type` | no | text | Type. |
| `categories` | no | list | Category IDs. |
| `metadata` | no | json | Metadata. |
| `lead_in` | no | text | MP3 only: silence before the first part, in seconds (0.5) or as a duration ("500ms"), at most 10s. Works with a single part too. |
| `max_size` | no | number | Fail if the joined file is larger (default 200 MiB). |

| Output | Type | Description |
|---|---|---|
| `asset` | object | The joined asset |
| `asset_id` | text | The joined asset's ID |
| `size` | number | Size in bytes |
| `parts` | number | Number of parts joined |
| `deleted` | list | IDs of the parts deleted |
<!-- reference:end action:asset.concat -->

One of `asset_ids` and `filenames` is required. `overwrite` is `false` by default. `delete_sources` never deletes the joined asset itself. `description`, `public`, `type`, `categories` and `metadata` are as for `asset.create`. `lead_in` is rounded up to whole frames.

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
a missing asset. Staff and application tokens get the first variant, or the one
for the audience named with `?as_audience=<audience id>` on the address. A
virtual asset that already has the filename is given the variants (they replace
what it had) and keeps its ID, so the step is safe to run twice.

<!-- reference:begin action:asset.virtual -->
Effect: `write`. Automations a publisher writes: no.

| Input | Required | Type | Description |
|---|---|---|---|
| `filename` | yes | text | The virtual asset's filename, which is its address (/assets/<filename>). `name` is accepted as well. Also read as `name`. |
| `variants` | no | json | A list of { asset_id, audience_id }: a protected asset and the audience it is for. One variant per audience; every asset of one content type and protected by its audience. |
| `default` | no | asset | The asset a member of none of the variants' audiences gets. It is checked as any asset is, so a private asset is the usual choice. Without one they are answered as for a missing asset. |
| `description` | no | text | Description. |
| `mime_type` | no | text | Not needed: the content type is the variants'. Given, it must be theirs. |

| Output | Type | Description |
|---|---|---|
| `asset` | object | The virtual asset, with its variants |
| `asset_id` | text | The virtual asset's ID: the same on every run for one filename |
| `url` | text | The virtual asset's address, without a token |
<!-- reference:end action:asset.virtual -->

`variants` or a `default` is required. The `asset` output has `virtual: true` and its `variants`. Each reader fetches `url` with their own token, as a feed's enclosure link does.

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
ID. Effect class `write`; it is not one of the built-ins a publisher's own
automation may use.

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
      audiences: ["${{ vars.paid_audience }}"]     # protected: Paid members and staff only
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
| `article_id` | no | expression | Article ID. |

| Output | Type | Description |
|---|---|---|
| `article` | object | The article object |
| `id` | text | Article ID |
<!-- reference:end action:article.get -->

`article_id` is required.

### `entitlement.get`
Load an entitlement by ID, by `subscription_id`, or by `user_id` + `plan_id` (most recent).

<!-- reference:begin action:entitlement.get -->
Effect: `read`. Automations a publisher writes: no.

| Input | Required | Type | Description |
|---|---|---|---|
| `entitlement_id` | no | expression | Entitlement ID. |
| `subscription_id` | no | expression | Look up the subscription's entitlement. |
| `user_id` | no | user | With plan_id, the user's entitlement to a plan. |
| `plan_id` | no | expression | Plan ID. |

| Output | Type | Description |
|---|---|---|
| `entitlement` | object | The entitlement object |
| `id` | text | Entitlement ID |
<!-- reference:end action:entitlement.get -->

One selector is required: `entitlement_id`, `subscription_id`, or `user_id` with `plan_id`.

### `entitlement.create`
Grant an entitlement, typically tied to a user + plan, or a subscription.

<!-- reference:begin action:entitlement.create -->
Effect: `write`. Automations a publisher writes: no.

| Input | Required | Type | Description |
|---|---|---|---|
| `user_id` | no | user | User ID. |
| `plan_id` | no | expression | Plan ID. |
| `price_id` | no | expression | Price ID. |
| `subscription_id` | no | expression | Subscription ID. |
| `application_id` | no | expression | Application ID. |
| `stripe_invoice` | no | text | Stripe Invoice. |
| `expires_at` | no | text | Expires At (RFC3339) |
| `categories` | no | json | Categories. |
| `metadata` | no | json | Metadata. |

| Output | Type | Description |
|---|---|---|
| `entitlement` | object | The created entitlement |
| `id` | text | Entitlement ID |
<!-- reference:end action:entitlement.create -->

`plan_id` or `price_id` is what the entitlement grants, `subscription_id` the subscription behind it and `application_id` the application that owns it.

### `entitlement.update`
Update an entitlement — activate/deactivate, change expiry, categories, or metadata.

<!-- reference:begin action:entitlement.update -->
Effect: `write`. Automations a publisher writes: no.

| Input | Required | Type | Description |
|---|---|---|---|
| `entitlement_id` | no | expression | Entitlement ID. |
| `active` | no | boolean | Active. |
| `expires_at` | no | text | Expires At (RFC3339) |
| `categories` | no | json | Categories. |
| `metadata` | no | json | Metadata. |

| Output | Type | Description |
|---|---|---|
| `entitlement` | object | The updated entitlement |
| `id` | text | Entitlement ID |
<!-- reference:end action:entitlement.update -->

`entitlement_id` is required.

### `entitlement.delete`
Revoke an entitlement.

<!-- reference:begin action:entitlement.delete -->
Effect: `destructive`. Automations a publisher writes: no.

| Input | Required | Type | Description |
|---|---|---|---|
| `entitlement_id` | no | expression | Entitlement ID. |
| `force` | no | boolean | Remove even a paid entitlement (normally protected). |

| Output | Type | Description |
|---|---|---|
| `deleted` | boolean | Deleted |
| `id` | text | Entitlement ID |
<!-- reference:end action:entitlement.delete -->

`entitlement_id` is required.

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
| `url` | yes | expression | URL. |
| `headers` | no | json | Headers. |
| `query` | no | json | Query Params. |
| `body` | no | json | An object or list is sent as JSON; text is sent as it is (set Content-Type yourself). Ignored for GET/DELETE. Only one of body, form, body_base64 and multipart. |
| `form` | no | json | A map of fields sent as application/x-www-form-urlencoded. A list repeats the field, an object is sent as JSON text, a null value is left out. Not for GET/DELETE. |
| `body_base64` | no | expression | Base64 text; the decoded bytes are sent as the body. Content-Type defaults to application/octet-stream; set it in headers. Not for GET/DELETE. |
| `multipart` | no | json | Sent as multipart/form-data: { fields: {name: value}, files: [{ name, asset_id, filename, content_type }] }. Each file is an asset of this instance, streamed from storage; filename and content_type default to the asset's. Not for GET/DELETE. |
| `timeout` | no | text | Timeout. Default `30s`. |
| `retries` | no | number | Retries. Default `3`. |
| `expect_status` | no | json | List of status codes to treat as success. |
| `response_encoding` | no | text | How outputs.body is read: auto (JSON parsed, anything else as text) or base64 (the raw bytes as base64 text, for a small binary response). An error response is always read as auto. One of `auto`, `base64`. Default `auto`. |
| `max_response_size` | no | number | The largest response read into outputs.body (default 10 MiB); a larger one fails the step and none of it is returned. A response_asset body has its own max_size. Default `10485760`. |
| `response_asset` | no | json | Store a 2xx response body as an asset instead of returning it in outputs.body (for files such as audio or PDFs). Keys: filename (required), mime_type (defaults to the response Content-Type), public, audiences (audience ids that make the asset protected: their members and staff only; not with public), type, description, categories, metadata, overwrite (replace the asset with the same filename, keeping its id), max_size (bytes, default 200 MiB). The body is written only after it has fully arrived. Error responses are returned in outputs.body as usual. |

| Output | Type | Description |
|---|---|---|
| `status` |  | HTTP status code |
| `body` |  | Response body: parsed JSON or text, or base64 text with response_encoding: base64; not set with response_asset |
| `headers` |  | Response headers |
| `ok` |  | True for a 2xx response |
| `asset` | object | With response_asset: the stored asset |
| `asset_id` |  | With response_asset: the stored asset's ID |
| `size` |  | With response_asset: the stored body size in bytes |
<!-- reference:end action:http.get -->

`headers` is a map, such as `{ Authorization: "Bearer ${{ secrets.api_token }}" }`. `timeout` is a Go duration; values longer than the default are honored (`15m`). `retries` is the total number of attempts, made for transport errors and 5xx responses; every attempt that reaches a paid API is billed. `expect_status` lists further status codes treated as success, such as `[404]`, and `ok` is then `true` for them too. With `response_asset`, an `overwrite` keeps the asset's id and link, and one that names no `audiences` keeps the ones the asset has; an MP3's duration is read into the asset's metadata.

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
| `message` | yes | text | Message. |
| `level` | no | text | Defaults to info. A debug message only appears when the run is in debug mode. One of `info`, `warn`, `error`, `debug`. |

| Output | Type | Description |
|---|---|---|
| `message` |  | The logged message |
<!-- reference:end action:log -->

### `sleep`
Pauses the workflow. Accepts a Go duration string; capped at 90s.

<!-- reference:begin action:sleep -->
Effect: `control`. Automations a publisher writes: yes.

| Input | Required | Type | Description |
|---|---|---|---|
| `duration` | yes | text | Duration. Default `5s`. |

| Output | Type | Description |
|---|---|---|
| `slept` |  | Actual duration slept |
<!-- reference:end action:sleep -->

### `set-output`
Records its `with:` inputs as this step's outputs, exposing values downstream.

<!-- reference:begin action:set-output -->
Effect: `control`. Automations a publisher writes: yes.

No named inputs.

No named outputs.
<!-- reference:end action:set-output -->

Every key under `with:` becomes an output of the same name.

### `vars.set`
Writes its `with:` inputs into the shared run `vars` context (readable later as `${{ vars.<key> }}`).

<!-- reference:begin action:vars.set -->
Effect: `control`. Automations a publisher writes: yes.

No named inputs.

No named outputs.
<!-- reference:end action:vars.set -->

Every key under `with:` is written to `vars` and returned as an output of the same name.

### `event.emit`
Emits an atomic event, enabling workflow chaining. Suppressed inside a silent run.

<!-- reference:begin action:event.emit -->
Effect: `write`. Automations a publisher writes: no.

| Input | Required | Type | Description |
|---|---|---|---|
| `name` | yes | text | Event Name. |
| `source` | no | text | Source. Default `workflow`. |
| `body` | no | json | Body. |
| `user_id` | no | user | User ID. |

| Output | Type | Description |
|---|---|---|
| `emitted` |  | Whether the event was emitted |
| `event_id` |  | The emitted event ID |
| `suppressed` |  | True if suppressed in a silent run |
<!-- reference:end action:event.emit -->

### `workflow.run`
Runs another workflow by ID or slug, passing `inputs` as its context. A workflow cannot invoke itself (circular runs are rejected). Inside a plugin's own automation or channel, `automation` names an automation of the same plugin by its key, in place of `workflow`.

**By default it waits** for the child to finish and returns the child's results (`outputs`, `steps`) — so the parent can read them. Turn on **`async`** to fire-and-forget instead; async runs may be scheduled for the future with **`run_at`**.

<!-- reference:begin action:workflow.run -->
Effect: `write`. Automations a publisher writes: no.

| Input | Required | Type | Description |
|---|---|---|---|
| `workflow` | yes | expression | Target workflow ID or slug. |
| `automation` | no | string | In a plugin's own automation or channel, in place of workflow: the key of an automation of the same plugin. |
| `name` | no | string | With automation: which one, by its short name, when the definition was added more than once. |
| `inputs` | no | json | Passed to the child as its inputs (this is how you hand it context). |
| `async` | no | boolean | Run async (don't wait) On = fire-and-forget. Off = wait for the child and read its outputs. |
| `run_at` | no | expression | Run at. Async only. Schedule the child for later: a duration like 24h, 15m, 90s — or a date. Can be an expression. |

| Output | Type | Description |
|---|---|---|
| `triggered` |  | Whether the child run started |
| `async` |  | Whether it ran fire-and-forget |
| `run_id` |  | Child workflow run ID |
| `workflow_id` |  | Child workflow ID |
| `outputs` |  | The child's named outputs (synchronous only) |
| `steps` |  | The child's step results (synchronous only) |
| `reason` |  | Reason if not triggered |
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
| `reason` | no | text | Reason. Default `workflow exited`. |

No named outputs.
<!-- reference:end action:workflow.exit -->

Returns no outputs (the run ends).

### `workflow.fail`
Ends the run as **failed** with `reason` as its error. Unlike an action error,
the step's `on_error:` and `continue-on-error` don't catch it (inside a plugin action
too). For a distribution trigger the publish fails with the reason, so the admin
shows why and the distribution can be published again.

<!-- reference:begin action:workflow.fail -->
Effect: `control`. Automations a publisher writes: yes.

| Input | Required | Type | Description |
|---|---|---|---|
| `reason` | yes | text | Reason. Default `why the run can't continue`. |

No named outputs.
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
| `duration` | no | expression | Duration. How long to wait — e.g. 3d, 72h, 15m, 90s. Can be an expression. |
| `until` | no | expression | Until. Or wait until an exact time (RFC3339). Can be an expression like ${{ trigger.body.ends_at }}. |

| Output | Type | Description |
|---|---|---|
| `waited` |  | False when the time was already in the past (no wait) |
<!-- reference:end action:wait -->

One of `duration` and `until` is required. A duration may use a day suffix (`3d`).

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

The functions an expression may call are not listed on this page. The
function reference is [chapter 8](../guide/08-functions.md): every function
Passport adds, by group, with its arguments, what it returns and the server
that first has it, and the functions of the expression language that remain
available. Its tables are generated from the engine by the same command as
this page's.
