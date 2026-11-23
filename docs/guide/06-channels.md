# 6. Channels

A channel is a place a distribution can be published to. Passport has
built-in channels (web, email, SMS, RSS, podcast); a plugin adds more: a
Facebook page, a LinkedIn page, Spotify.

A channel is not an automation. Nothing triggers it. It runs when a publisher
publishes, updates, deletes or previews a distribution on it, or asks for its
status. It has three things an automation does not: a `channel` block that
says what kind of channel it is, a form filled in on every distribution, and
**flows**.

A flow is the steps for one of those five requests, and the result they hand
back. A channel has up to five: `publish`, `update`, `delete`, `preview` and
`status`. Only `publish` is required. Each flow's result has a fixed shape
that Passport defines and reads; the channel does not declare it.

## 6.1 A channel file

```yaml
# channels/facebook-post.yaml
version: 1.0.0
description: Post an article to a Facebook page.
multiple: true
channel:
  name: facebook-post
  label: Facebook post
  delivery: once
  content_type: text
  max_body_length: 5000
settings:
  type: object
  required: [page_id, page_token]
  properties:
    page_id:    { type: string, title: Page id, pattern: "^[0-9]+$" }
    page_token: { type: string, title: Page access token, secret: true }
    link_back:
      type: boolean
      title: Add a link to the article
      default: true
distribution:
  type: object
  properties:
    message:
      type: string
      title: Post text
      maxLength: 5000
      default: "${{ article.summary }}"
      ui: { widget: textarea, rows: 5 }
    link:
      type: string
      format: uri
      title: Link
      default: "${{ article.uri }}"

publish:
  steps:
    - id: post
      action: facebook/post.publish
      with:
        page_id: "${{ channel.settings.page_id }}"
        token: "${{ channel.secrets.page_token }}"
        message: "${{ fields.message }}"
        link: "${{ channel.settings.link_back ? fields.link : '' }}"
  returns:
    status: published
    id: "${{ steps.post.outputs.post_id }}"
    url: "${{ steps.post.outputs.url }}"

update:
  steps:
    - id: post
      action: facebook/post.publish
      with:
        page_id: "${{ channel.settings.page_id }}"
        token: "${{ channel.secrets.page_token }}"
        post_id: "${{ published.id }}"
        message: "${{ fields.message }}"
        link: "${{ channel.settings.link_back ? fields.link : '' }}"
  returns:
    status: published
    id: "${{ steps.post.outputs.post_id }}"
    url: "${{ steps.post.outputs.url }}"

delete:
  steps:
    - id: remove
      action: facebook/post.delete
      with:
        post_id: "${{ published.id }}"
        token: "${{ channel.secrets.page_token }}"
  returns:
    status: "${{ steps.remove.outputs.found ? 'deleted' : 'not_found' }}"

preview:
  steps:
    - id: text
      action: facebook/post.text
      with:
        message: "${{ fields.message }}"
        link: "${{ channel.settings.link_back ? fields.link : '' }}"
  returns:
    text: "${{ steps.text.outputs.text }}"
    characters: "${{ steps.text.outputs.characters }}"
    limit: 5000

status:
  steps:
    - id: look
      action: facebook/post.get
      with:
        post_id: "${{ published.id }}"
        token: "${{ channel.secrets.page_token }}"
  returns:
    status: "${{ steps.look.outputs.found ? 'published' : 'removed' }}"
    url: "${{ steps.look.outputs.url }}"
    metrics:
      likes: "${{ steps.look.outputs.likes }}"
      shares: "${{ steps.look.outputs.shares }}"
```

The four `facebook/…` actions are plugin actions
([chapter 4](04-actions.md)), one per call to the vendor.
`facebook/post.publish` creates a post, or changes the one named by
`post_id`, and returns `post_id` and `url`; `publish` and `update` both call
it. `facebook/post.delete` and `facebook/post.get` return `found: false` for
a post that is no longer there instead of failing. `facebook/post.text`
returns the text as it will be posted and its length in characters. **Work
that two flows share goes in a plugin action**; a flow cannot call another
flow.

| Key | Required | Meaning |
|---|---|---|
| `version` | yes | Semver ([1.3](01-project-and-manifest.md#13-versions)) |
| `description` | yes | One or two sentences for the plugin's Channels tab |
| `help` | no | Longer guidance for the publisher, Markdown; may link to pages in `docs/` |
| `icon` | no | A file in `assets/`, or an https URL ([1.1](01-project-and-manifest.md#11-a-plugin-project)) |
| `multiple` | no | `true` if a publisher may add it more than once (one per page, say). Default `false` |
| `channel` | yes | What kind of channel it is ([6.2](#62-the-channel-block)) |
| `settings` | no | This channel's own settings, a [form schema](02-field-schema.md), filled in when the publisher adds it. Read as `channel.settings.<name>` and `channel.secrets.<name>` |
| `distribution` | no | The form on the distribution page ([6.4](#64-the-distribution-form)). Read as `fields.<name>` |
| `publish` | yes | The flow that publishes a distribution ([6.5.4](#654-publish)) |
| `update` | no | The flow that changes what was published ([6.5.5](#655-update)). Without it the channel cannot change what it has sent ([6.5.11](#6511-permanence)) |
| `delete` | no | The flow that removes what was published ([6.5.6](#656-delete)). Without it the channel cannot take back what it has sent |
| `preview` | no | The flow that shows what would be sent ([6.5.7](#657-preview)). Its presence puts a preview button on the distribution page |
| `status` | no | The flow that asks the destination what became of it ([6.5.8](#658-status)). Its presence puts "Check status" on the distribution |
| `vars`, `schemas`, `retention`, `requires` | no | As for an automation. `vars` are the starting values in every flow |

A channel has no `on:`, no `inputs`, no `outputs` and no `steps` of its own.
A top-level `steps:` is an error: *a channel's steps are in its flows; put
them under `publish:`*. Everything outside the flows (`channel`, `settings`,
`distribution`, `vars`, `schemas`, `requires`) is the same for every flow.

### A channel that only publishes

A channel that hands each member's copy to a third-party email service has
nothing to update and nothing to take back. It has one flow:

```yaml
# channels/acme-mail.yaml
version: 1.0.0
description: >-
  Send an article to each member by email through Acme Mail. What is sent
  cannot be changed or taken back.
channel:
  name: acme-mail
  label: Acme Mail
  delivery: per_member
  content_type: html
settings:
  type: object
  required: [from]
  properties:
    from: { type: string, format: email, title: From address }
distribution:
  type: object
  properties:
    subject:
      type: string
      title: Subject line
      maxLength: 150
      default: "${{ article.title }}"

publish:
  steps:
    - id: member
      action: user.get
      with:
        user_id: "${{ trigger.user_id }}"
    - id: render
      action: distribution.render
      with:
        distribution_id: "${{ trigger.distribution_id }}"
        user_id: "${{ trigger.user_id }}"
    - id: send
      if: "${{ steps.member.outputs.user.login != '' }}"
      action: acme-mail/message.send
      with:
        from: "${{ channel.settings.from }}"
        to: "${{ steps.member.outputs.user.login }}"
        subject: "${{ fields.subject }}"
        html: "${{ steps.render.outputs.body }}"
  returns:
    status: "${{ steps.send.status == 'ok' ? 'sent' : 'skipped' }}"
    id: "${{ steps.send.outputs?.message_id }}"
    note: "${{ steps.send.status == 'ok' ? nil : 'No email address' }}"
```

`delivery: per_member` makes `publish` run once for each member of the
audience, and its result is that member's
([6.5.9](#659-per-member-channels)). Publishing the distribution again sends
only to members who have not had it; nobody is sent it twice. Nothing sent
can be changed, and deleting the distribution removes Passport's record
only. This is a **permanent** channel
([6.5.11](#6511-permanence)).

## 6.2 The `channel` block

| Key | Required | Meaning |
|---|---|---|
| `name` | yes | The definition's name; equals the file name. Not a built-in channel's name |
| `label` | yes | What the definition is called in the plugin's Channels tab. The publisher gives each channel they add its own label |
| `delivery` | yes | How many times `publish` runs for a distribution. `once`: one time (Spotify, a Facebook or X post, a podcast host). `per_member`: once for each member of the audience, with that member in the run as `trigger.user_id` (a third-party email or SMS service; [6.5.9](#659-per-member-channels)) |
| `audience` | no | Whether a distribution on this channel has an audience. `required`: it must have one. `optional`: it may have one, to render the content as that audience sees it. `none`: the distribution page does not ask for one. Default: `required` when `delivery` is `per_member`, `optional` when it is `once` |
| `content_type` | yes | `text` or `html`: what the distribution's body is |
| `max_body_length` | no | A cap on the body, enforced when the distribution is saved |
| `base_type` | no | `podcast`, `rss`, `email` or `sms`: reuse that built-in channel's editor (a media file for `podcast`, for example) |
| `media` | no | For a channel with `base_type: podcast`: the kinds of media file a distribution may carry, a list of `audio`, `video` or both. The distribution page offers those in its file picker. Leave it out to offer what the built-in podcast channel takes. An error on any other channel |
| `application` | no | Offer only this application's audiences. An error with `audience: none` |
| `address` | no | For a `per_member` channel that needs to know who a member is on the destination: a list of `{ name, label, type, required, placeholder }` with `type` one of `text`, `phone`, `email`, `url`. Leave it out when the member's Passport email or phone is enough. An error with `delivery: once`. To be replaced by the `opt_in` flow ([6.5.13](#6513-members-opting-in-and-out)) |
| `connect_url` | no | A "Connect" button in the member app. To be replaced by the `opt_in` flow ([6.5.13](#6513-members-opting-in-and-out)) |
| `template` | no | The template menu on the distribution page ([6.8](#68-templates)): `{ required, default }`, or `false` for none |
| `ui` | no | Hints for the body editor ([6.7](#67-body-editor-hints)) |

**`delivery` and `audience` are two separate questions.** `delivery` is how
often the channel runs. `audience` is whether Passport is told who the
distribution is for.

| `delivery` | `audience` | For |
|---|---|---|
| `once` | `none` | The destination decides who may see it. Passport pushes it one time and asks for no audience |
| `once` | `optional` (the default) | Pushed one time. With an audience chosen, the channel can render the content as that audience sees it (`distribution.render` with `as_audience: true`); without one, it renders with no audience |
| `once` | `required` | Pushed one time, always rendered for an audience |
| `per_member` | `required` (the default, and the only value allowed) | One run for each member of the audience |

`delivery: per_member` with `audience: optional` or `audience: none` is an
error: there is no one to run for.

**`once` does not mean public.** It means Passport hands the distribution
over one time. Who may then see it is the destination's business. Spotify is
the worked case:

```yaml
channel:
  name: spotify-episode
  label: Spotify episode
  delivery: once
  audience: none
  content_type: text
  base_type: podcast
  media: [audio]
```

The episode is pushed to Spotify once. Whether a listener may play it is
decided by Spotify, from the show's own settings and the listener's
subscription there. Passport is not asked and has no audience to give, so
the distribution page does not show the audience menu.

With `audience: none`, `distribution.audience_id` is always empty, and a
`distribution.render` with `as_audience: true` anywhere in the channel's
flows is an error. With `audience: optional`, test
`distribution.audience_id` before rendering as an audience.

The block has no `mode` and no `requires_audience`; `delivery` and
`audience` replace them, and either old key is an error that says so. It
has no `preview` and no `status` key either. A channel answers previews
because it has a `preview` flow, and status requests because it has a
`status` flow.

## 6.3 Adding a channel

On the plugin's **Channels** tab, the publisher presses **Add** on a
definition, gives the channel a label ("Main page"), fills in its `settings`
form and enables it. From then on it appears under that label in the
distribution page's channel menu.

Each added channel has its own name on the site. For a definition that is
not `multiple`, it is the definition's `name`. For a `multiple` definition it
is always the definition's name plus a short name the publisher chose
(`facebook-post-main`), even when only one has been added, so adding a second
never renames the first.
That name is what a distribution records, and it is `channel.name` in a run.
Use `channel.label` in anything a person reads.

Everything specific to one added channel belongs in its `settings`: which
page, which show, which voice by default. Everything shared by all of a
plugin's channels and automations (the vendor API key, usually) belongs in
the plugin's settings.

## 6.4 The distribution form

`distribution` is a form schema shown on the admin's distribution page when a
publisher creates or edits a distribution on this channel, under the fields
every distribution has (body, schedule, and an audience unless the channel's
`audience` is `none`).

Use it for what must be decided per distribution: a summary, a title for the
vendor, a cover image, whether it is a trailer. Which template renders the
distribution is not a field here: the distribution page has its own template
menu ([6.8](#68-templates)).

```yaml
distribution:
  type: object
  required: [episode_type]
  properties:
    summary:
      type: string
      title: Episode summary
      maxLength: 600
      default: "${{ article.summary }}"
      ui: { widget: textarea, rows: 4 }
    cover:
      type: string
      format: uri
      title: Cover image
      default: "${{ article.image_uri }}"
    episode_type:
      type: string
      title: Episode type
      enum: [full, bonus, trailer]
      default: full
    season:
      type: string
      title: Season
      default: "${{ channel.settings.current_season }}"
      ui:
        options:
          items: "${{ channel.settings.seasons }}"
          value: "${{ item.number }}"
          label: "${{ item.name }}"
```

**Values that follow the article.** A `default` may be an expression. The
field then shows the source's current value, marked as coming from it. Left
alone it keeps following, and is resolved when the distribution publishes;
typed over, it becomes a fixed value
([2.10](02-field-schema.md#210-defaults-that-follow-another-value)).

What the expression may read:

| Name | Fields |
|---|---|
| `article` | `id`, `title`, `slug`, `summary`, `body`, `author`, `image_uri`, `uri`, `published_at`, `metadata` |
| `distribution` | the distribution record, as in [6.5.2](#652-what-a-flow-reads): `title`, `body`, `summary`, `audience_id` (empty on a channel with `audience: none`), `asset_id`, `scheduled_at`, … |
| `channel.settings` | this channel's settings (not its secrets) |
| `settings` | the plugin's settings (not its secrets) |

**Choices from the channel's settings.** `ui.options` without an `action`
takes its `items` straight from an expression, as `season` does above: the
list the publisher maintains in the channel's settings becomes the menu on
each distribution.

**In a run**, `fields.<name>` holds the resolved values, in every flow. The form is
validated when the distribution is saved, and again, with followed values
resolved, at publish; a value that fails then fails the publish with a
message naming the field.

The form can be given a [layout](02-field-schema.md#29-form-layout).

<a id="65-what-a-channel-must-answer"></a>

## 6.5 The flows

Each request a channel answers has its own flow. One request is one run, and
one run is one flow.

| Flow | Runs when | Required |
|---|---|---|
| `publish` | The distribution is published and nothing of it is live at the destination: the first time, after a publish that failed, or after a `status` of `failed` or `removed` | yes |
| `update` | The distribution is published again while what was published is live or pending | no |
| `delete` | A distribution that has been published is being deleted | no |
| `preview` | The publisher asks for a preview | no |
| `status` | The publisher presses "Check status", or Passport follows up a `pending` result | no |

A flow that is not there is a request the channel does not answer. Passport
does not run another flow in its place: without `update`, a second publish
does not run `publish`. What the publisher sees then is in
[6.5.11](#6511-permanence).

### 6.5.1 A flow

```yaml
publish:
  steps:
    - id: post
      action: facebook/post.publish
      with: { … }
  returns:
    status: published
    id: "${{ steps.post.outputs.post_id }}"
    url: "${{ steps.post.outputs.url }}"
```

| Key | Required | Meaning |
|---|---|---|
| `steps` | yes | The flow's steps, at least one ([chapter 7](07-steps-and-expressions.md)) |
| `returns` | yes | The flow's result: one value per key of the result, or a single expression for the whole result |
| `description` | no | What the flow does, for a person reading it: Markdown, up to 2,000 characters, never evaluated (`${{ }}` in it is text). It changes nothing in a run |

A flow has no other keys.

```yaml
update:
  description: >-
    Changes the post that is there. Never makes a second one: when the post
    is gone at Acme it returns `not_found`.
  steps: [ … ]
  returns: { … }
```

Say what a flow is for in its `description`, and what each step is for in
the step's `name` and `description`
([7.1](07-steps-and-expressions.md#71-a-step)).

- **`returns` works as an action's does**
  ([2.12](02-field-schema.md#212-outputs)). It is evaluated after the flow's
  steps. A value is an expression or a plain literal. A key whose expression
  yields nothing is left out.
- **The result's shape is Passport's.** Each flow's result is held to a
  schema in the engine, `passport/schemas/channel.<flow>.result@1`, given in
  the tables below. A channel does not write `outputs` for a flow. A key the
  schema does not have is an error when the plugin is checked. A result that
  does not fit when the flow runs fails the run, in production as on a
  sandbox, with a message naming the key (`returns.status: must be one
  of …`).
- **Passport reads the result and nothing else.** A step's `outputs:`
  ([7.5](07-steps-and-expressions.md#75-named-outputs)) still names values
  for later steps of the flow; they are not part of the result.
- **Each flow has its own steps.** Step ids are unique within a flow, and
  two flows may use the same id. `steps.<id>` holds only the steps of the
  flow that is running.
- **`workflow.exit`** ends the flow's steps early, as a success. `returns`
  is still evaluated, with the steps that did not run yielding nothing.
- **`workflow.fail`** ends the run as failed, with its reason. There is no
  result.
- **`wait`** is not allowed in a flow: a distribution is published in one
  go.

### 6.5.2 What a flow reads

| Name | Holds | In |
|---|---|---|
| `trigger.action` | The flow that is running: `publish`, `update`, `delete`, `preview` or `status`. A plugin action shared by two flows reads it to tell them apart | every flow |
| `trigger.distribution_id` | The distribution. Empty in a preview of a distribution that has not been saved yet | every flow |
| `trigger.user_id` | The member this run is for | `publish` of a `per_member` channel only ([6.5.9](#659-per-member-channels)) |
| `trigger.preview.body` | The body as it is in the editor, unsaved edits included | `preview` only |
| `trigger.preview.sample` | In a preview started from a paragraph's play button: that paragraph's text. Empty otherwise | `preview` only |
| `trigger.preview.settings` | Channel settings the editor is trying out and has not saved. You do not read this yourself; `channel.settings` already reflects it for that run | `preview` only |
| `published` | What Passport kept from the last `publish` or `update` of this distribution that returned a result: `id`, `url`, `data`, `status`, `at`, `note` ([6.5.10](#6510-what-passport-keeps)). Empty until there is one | every flow |
| `distribution` | The whole distribution record as saved, what `distribution.get` returns as `distribution` less `published`, the last status check and the delivery counts, which a flow reads from `published` and the log: `id`, `_id`, `article_id`, `title`, `body`, `summary`, `description`, `language`, `audience_id`, `template_id`, `asset_id`, `scheduled_at`, `settings`, `context`. In a preview of an unsaved distribution: the record as it stands on screen, with no `id` | every flow |
| `article` | The distribution's article, when it has one: `id`, `title`, `slug`, `summary`, `body`, `author`, `image_uri`, `uri`, `published_at`, `metadata` | every flow |
| `fields` | The distribution form's values, with followed defaults resolved. In a preview: the form as it is on screen, resolved the same way | every flow |
| `channel.name`, `.label`, `.settings`, `.secrets` | This channel. In a preview the editor may pass channel settings that are not saved yet (a pronunciation being tried out); `channel.settings` then holds those for that run only | every flow |
| `settings`, `secrets` | The plugin's | every flow |
| `vars` | The channel's `vars:`, as declared, at the start of every flow | every flow |

Reading `trigger.preview` outside the `preview` flow, or `trigger.user_id`
outside the `publish` flow of a `per_member` channel, is an error when the plugin
is checked.

A flow does not need a `distribution.get` step to read its own distribution;
`distribution` and `article` are already there. Use `distribution.get` only
to load a different one.

To render the body, use `distribution.render`. `as_audience: true` renders
once as a member of the distribution's audience and of every audience ranked
below it in the site's audience rank order (an unranked audience: itself
alone; see [5.7](05-automations.md#57-extensions)). It needs the
distribution to have an audience ([6.2](#62-the-channel-block)). In the
`publish` flow of a `per_member` channel, `user_id: "${{ trigger.user_id }}"`
renders that member's own copy instead.

### 6.5.3 What a flow may do

What a flow may do is decided by the
[effect class](04-actions.md#42-built-in-actions) of the actions its steps
run.

| Flow | May run |
|---|---|
| `publish`, `update`, `delete` | Every action the plugin may use |
| `preview`, `status` | Only `control`, `read` and `external` actions. Nothing that is `notify`, `write` or `destructive` |

So a `preview` or a `status` flow cannot send mail, create or change an
asset, or call `distribution.update`. Two more rules for those two flows:

- An `http.*` step may not name a `response_asset`: that creates an asset.
  Take bytes as base64 instead
  ([9.3](09-files-and-binary.md#93-receiving-bytes-without-an-asset)).
- A plugin action they call is held to the same, through every action it
  calls in turn.

The checker refuses a plugin that breaks this, naming the flow, the step and
the action. The engine refuses the step again when the flow runs.

`external` actions are allowed because a preview or a status check usually
has to ask the vendor something. What the call does at the vendor is yours
to keep right: **a `preview` and a `status` flow change nothing a member or
the public can see.**

### 6.5.4 `publish`

**When.** The distribution is published and nothing of it is live at the
destination: it was never published, its last publish failed, or the last
`status` said `failed` or `removed`. For a `delivery: once` channel it runs
one time, inside the publish job. For a `per_member` channel it runs once
for each member ([6.5.9](#659-per-member-channels)).

**Reads.** Everything in [6.5.2](#652-what-a-flow-reads). `published` is
empty on a first publish. On a publish after `failed` or `removed` it still
holds what the last result kept, `data` included.

**May do.** Anything the plugin may.

**Returns** (`passport/schemas/channel.publish.result@1`):

| Key | Type | Required | Meaning |
|---|---|---|---|
| `status` | `published`, `pending` or `failed` | yes | `published`: it is live. `pending`: the destination accepted it and it is not live yet; Passport asks `status` later, if the channel has that flow. `failed`: the destination refused it (below) |
| `id` | string, up to 255 characters | no | The thing's id at the destination. `update`, `delete` and `status` find it by this, as `published.id` |
| `url` | string, `format: uri` | no | Where a person can see it. The admin shows it as the link on the distribution |
| `data` | object | no | Anything the channel needs later. Passport keeps it for this distribution and hands it back as `published.data`. Up to 64 KB as JSON; never a secret, never binary |
| `note` | string, up to 500 characters | with `failed` | A short line the admin shows on the distribution. Required with `failed`: why, in words the publisher can act on |

There are two ways to say a publish did not work, and they are not the same:

- **The destination said no:** return `status: failed` with a `note`, and
  the `id` and `data` of anything the flow already made there (an uploaded
  file, a draft). The distribution is marked failed and shows the note, and
  Passport keeps the result ([6.5.10](#6510-what-passport-keeps)). The next
  publish runs this flow again with `published.id` and `published.data`
  set, so it can reuse or remove what is there and not make a second copy.
- **The channel could not ask** (the request did not get through, a setting
  is wrong, the answer made no sense): use `workflow.fail` with a reason
  the publisher can act on. The distribution is marked failed and shows
  that reason. Nothing is kept.

`failed` is for a `delivery: once` channel. On a `per_member` channel a
failure is one member's ([6.5.9](#659-per-member-channels)); a member's
result is never `failed`, and an `update` there that returns `failed` is
kept and shown without failing the distribution, whose messages are already
on their way.

A result that is always `failed` with no `note` is an error when the plugin
is checked; one that turns out `failed` with no `note` fails the run.

A channel with no `status` flow should return `published`, not `pending`:
nothing would ever move it on. The checker warns about a literal `pending`
in such a channel.

### 6.5.5 `update`

**When.** The distribution is published again and `published.status` is
`published` or `pending`. It runs once, inside the publish.

**Reads.** Everything in [6.5.2](#652-what-a-flow-reads). `published` is
always set. Find the remote thing by `published.id`.

**May do.** Anything the plugin may. It changes what exists. It never makes
a second copy.

**Returns** (`passport/schemas/channel.update.result@1`): the same keys as
`publish`, with the same meanings, `failed` included. `id`, `url` and
`data` may be left out; what is left out stays as Passport has it
([6.5.10](#6510-what-passport-keeps)).

If the thing is no longer at the destination, either create it again and
return its new `id`, or fail with a reason. Do not return `published` for
something that is not there.

### 6.5.6 `delete`

**When.** A distribution with something in `published` is being deleted. It
runs before the distribution is deleted, once. A distribution that was never
published successfully is deleted without a run.

**Reads.** Everything in [6.5.2](#652-what-a-flow-reads). Find the remote
thing by `published.id`.

**May do.** Anything the plugin may.

**Returns** (`passport/schemas/channel.delete.result@1`):

| Key | Type | Required | Meaning |
|---|---|---|---|
| `status` | `deleted`, `not_found` or `kept` | yes | `deleted`: it was removed. `not_found`: it was already gone; this counts as success. `kept`: the destination refused, or cannot remove it |
| `note` | string, up to 500 characters | no | A short line for the publisher. Give one with `kept`: it is what the admin shows |

On `deleted` or `not_found` Passport deletes the distribution. On `kept` it
does not: the admin shows `note` and offers to remove Passport's record
only, as it does for a channel with no `delete` flow
([6.5.11](#6511-permanence)).

Return `not_found` for a thing that is already gone; do not fail. Fail the
run only when the channel could not find out.

### 6.5.7 `preview`

**When.** The publisher presses the preview button on the distribution page,
or a paragraph's play button. The button is there because the flow is. The
admin waits up to 60 seconds for the result.

**Reads.** Everything in [6.5.2](#652-what-a-flow-reads), with
`trigger.preview.*`, and `distribution`, `fields` and `channel.settings` as
they are on screen.

**May do.** Only `control`, `read` and `external` actions
([6.5.3](#653-what-a-flow-may-do)). Nothing is published, no asset is made
and nothing is recorded.

**Returns** (`passport/schemas/channel.preview.result@1`):

| Key | Type | Required | Meaning |
|---|---|---|---|
| `text` | string | one of `text`, `html`, `audio`, `url` | The text that would be sent, paragraphs separated by blank lines |
| `html` | string | one of the four | The HTML that would be sent, shown as a page. Only on a channel whose `content_type` is `html`; an error on a `text` channel |
| `audio` | string, base64 | one of the four | Audio, played in place. Needs `audio_type` |
| `audio_type` | string | with `audio` | The audio's media type, `audio/mpeg` for example |
| `url` | string, `format: uri` | one of the four | A link to a draft at the destination, when the vendor has one. Shown as "Open the draft" |
| `characters` | integer | no | The length of what would be sent |
| `limit` | integer | no | The destination's limit, shown against `characters`. `0` or left out: no limit |
| `note` | string, up to 500 characters | no | A short line under the preview |

At least one of `text`, `html`, `audio` and `url` must be there. More than
one may be.

A publisher can preview before the first save. The run then has no
`trigger.distribution_id`, and `published` is empty; `distribution` and
`article` are still there, and `distribution.render` given an empty
`distribution_id` renders the distribution on screen, so
`distribution_id: "${{ trigger.distribution_id }}"` works in both cases. Do
not call `distribution.get` in a preview: there may be no saved distribution
to name. A plugin action that renders must not mark `distribution_id`
required if it is to serve such a preview. Nothing of an unsaved preview is
recorded, not even the run.

### 6.5.8 `status`

**When.** The publisher presses "Check status" on a published distribution;
the button is there because the flow is. Passport also runs it by itself
after a `publish` or `update` that returned `pending`: after one minute,
then at doubling intervals up to an hour, until the answer is no longer
`pending` or 24 hours have passed. It never runs for a distribution with
nothing in `published`.

**Reads.** Everything in [6.5.2](#652-what-a-flow-reads). Find the remote
thing by `published.id`.

**May do.** Only `control`, `read` and `external` actions
([6.5.3](#653-what-a-flow-may-do)).

**Returns** (`passport/schemas/channel.status.result@1`):

| Key | Type | Required | Meaning |
|---|---|---|---|
| `status` | `published`, `pending`, `failed`, `removed` or `unknown` | yes | `published`: it is live. `pending`: not live yet. `failed`: the destination gave up on it. `removed`: it was there and is gone. `unknown`: the destination could not say; nothing changes |
| `url` | string, `format: uri` | no | Where a person can see it now, if that changed or was not known at publish |
| `note` | string, up to 500 characters | no | A short line: why it failed, how long it may take |
| `checked_at` | string, `format: date-time` | no | When the destination was asked. Defaults to now |
| `metrics` | object of numbers, up to 20 | no | Counts the destination keeps, by name: `plays`, `likes`. Shown as a small table |

A status other than `unknown` becomes `published.status`, and a `url`
replaces `published.url`. After `failed` or `removed`, publishing the
distribution again runs `publish`, not `update`.

A destination that says the thing failed is a `failed` status, not a failed
run. Fail the run only when the channel could not ask.

### 6.5.9 Per-member channels

A channel with `delivery: per_member` sends to each member of the
distribution's audience. Everything above describes a `delivery: once`
channel; this is what differs.

**`publish` runs once per member**, from the message queue, with
`trigger.user_id`. Its result is that member's
(`passport/schemas/channel.publish.member.result@1`):

| Key | Type | Required | Meaning |
|---|---|---|---|
| `status` | `sent` or `skipped` | yes | `sent`: the destination took the message for this member. `skipped`: nothing was sent, and that is not a fault (no address, opted out) |
| `id` | string, up to 255 characters | no | The message's id at the destination |
| `note` | string, up to 500 characters | no | Why it was skipped, or anything worth showing beside the member |

**The delivery log.** Passport keeps one row per member for each
distribution on a `per_member` channel, as it does for its own email and SMS
channels: the member, the result (`sent`, `skipped` or failed), the
message's `id` at the destination, the `note` and the time. It is what the
admin counts (sent, skipped, failed) and lists beside each member.

- **A member is never sent the same distribution twice.** Before `publish`
  runs for a member, Passport looks in the log; a member already marked
  `sent` is passed over without a run. The channel does not have to guard
  against duplicates itself.
- **Publishing again sends only to members not yet sent**: those who joined
  the audience since, and those whose run failed or was `skipped`. Nobody
  who has it gets it again.
- A run that fails is a failure for that member only, and is logged as
  such. A run that times out is retried by the queue.
- `published` on a `per_member` channel holds `status` (`published`) and
  `at`, from the moment the messages are queued. `publish` gives it no `id`,
  `url` or `data`: there is one result per member, in the log, not one for
  the distribution.
- In a `publish` run, `delivery` is this member's row from an earlier
  attempt, if there is one (`delivery.status`, `delivery.id`,
  `delivery.note`, `delivery.at`, `delivery.attempts`). It is empty in a
  dry run unless the test case gives one.

**`update`, `delete` and `status` act on the distribution as a whole.** Each
runs once, without `trigger.user_id`, and returns the same result as on a
`delivery: once` channel. `update`'s `id`, `url` and `data` are kept in
`published` as usual. When a distribution is published again, the members
not yet sent are queued and then `update` runs once, if the channel has it;
it does not wait for those sends to finish. It is for what the
destination holds for the whole distribution (a campaign record, say), not
for messages already delivered. A step in these flows reads the log with
the built-in `distribution.deliveries` when it must act on what was sent,
member by member.

**`preview`** runs once, without `trigger.user_id`: it shows the content as
the audience gets it, not one member's copy. This holds for a preview of an
unsaved distribution too.

Most per-member channels send a message and have neither `update` nor
`delete`. They are permanent.

### 6.5.10 What Passport keeps

Passport stores the result of the last `publish` or `update` that returned
one with the distribution, a `failed` result included. Every later flow reads it as `published`:

| Name | Holds |
|---|---|
| `published.id` | The result's `id` |
| `published.url` | The result's `url`, or a later one from `status` |
| `published.data` | The result's `data`, as returned. `{}` when there is none |
| `published.status` | What Passport last knew: `published`, `pending`, `failed` or `removed`. Set by `publish` and `update`, moved by `status` |
| `published.at` | When that `publish` or `update` ended |
| `published.note` | The result's `note`. An `update` that returns none clears it |

- Before the first successful `publish`, `published` is empty:
  `published.id` is nil and `published.data` is `{}`.
- A `publish` result replaces `published` whole.
- An `update` result replaces `status` and `at`. Its `id`, `url` and `data`
  each replace the stored one when returned, and leave it when left out.
  `data` is replaced whole, never merged: to keep a key, return it again
  (`merge({'etag': …}, published.data)`).
- A run that fails changes nothing in `published`. A result of `failed` is
  a result: it is stored like any other, with `published.status` as
  `failed`.
- `published` is the channel's and Passport's. A channel does not write it
  with a step; `returns` is the only way in.

`distribution.context` is still there and still the channel's to use, with
`distribution.update` in `publish`, `update` or `delete`. Do not use it for
the remote id or the link: `id`, `url` and `data` are for that, and the
admin does not look for a link in `context`
([6.6](#66-what-the-admin-shows)).

### 6.5.11 Permanence

What a channel can undo is said by the flows it has.

| The channel has | A published distribution |
|---|---|
| `update` | Can be published again; the channel changes what it sent |
| no `update` | On a `delivery: once` channel: cannot be published again. The admin does not offer it, and says the channel cannot change what it has sent. On a `per_member` channel: publishing again sends to members not yet sent ([6.5.9](#659-per-member-channels)); what was sent is not changed |
| `delete` | Can be deleted; the channel removes what it sent first |
| no `delete` | Can be deleted in Passport only. The admin says, before it deletes, that what was sent stays at the destination and only Passport's record goes |

A channel with neither `update` nor `delete` is **permanent**: what is sent
is sent. A channel that sends through a third-party email service
is the usual case ([6.1](#a-channel-that-only-publishes)): once a message
has gone out there is nothing to change and nothing to take back, so the
channel has `publish` and no more.

Leave a flow out when the destination cannot do it. Do not write an `update`
that publishes a second copy, or a `delete` that returns `deleted` for
something still there.

A distribution whose publish failed is not published: it can be published
again on any channel, and that runs `publish`.

### 6.5.12 When a flow fails

| Flow | A failed run |
|---|---|
| `publish`, `update` | Fails the distribution's publish. The distribution is marked failed and shows the run's error. `published` is unchanged |
| `delete` | Keeps the distribution. The admin shows the error; the publisher may try again |
| `preview`, `status` | Shows the error where the result would be. Nothing changes |

A `delivery: once` channel runs inside the publish job, so a failed
`publish` or `update` run is a failed distribution. A `per_member` channel's
`publish` runs once per member from the message queue: a failed run is a
failure for that member, counted on the distribution, and does not fail the
distribution. See
[how the engine runs a channel](../PLUGIN-DEVELOPMENT-GUIDE.md#a-channel).

### 6.5.13 Members opting in and out

> **Specified, not built.** These two flows are defined so channels are
> designed with them in mind. Nothing runs them yet.

Some channels need each member to join before anything reaches them: link
their account at the destination, approve access there, or give an address.
A channel says how with two optional flows, `opt_in` and `opt_out`. They
replace `channel.address` and `channel.connect_url`.

They are about **one member and one channel**. They are started from the
member app by the member, or from the admin by an admin on a member's behalf
where the destination allows that. `by` says which:

```yaml
opt_in:
  by: [member]            # member, admin, or both. Default: [member]
  steps: [ … ]
  returns: { … }
  callback:               # optional: runs when the member's browser comes back
    steps: [ … ]
    returns: { … }
opt_out:
  by: [member, admin]
  steps: [ … ]
  returns: { … }
```

**What they read.** `member` is the Passport user (`member.id`, `email`,
`phone`, `profile`). `link` is what Passport holds for this member on this
channel (below); empty before the first opt-in. `trigger.action` is
`opt_in` or `opt_out`, and `trigger.by` is `member` or `admin`.
`channel.callback_url` is this channel's address for the destination to send
the member's browser back to, and `trigger.state` is a value Passport made
for this attempt: it ties the return to this member and channel and expires.
Put it in the destination's `state` parameter. A return without a good
`trigger.state` never reaches a flow.

**`opt_in` result** (`passport/schemas/channel.opt_in.result@1`):

| Key | Required | Meaning |
|---|---|---|
| `status` | yes | `linked`: the member is in, nothing more to do. `redirect`: send the member's browser to `url`; the destination will send it back to `channel.callback_url`, and `callback` finishes the job. `link`: show `url` as a link the member follows; Passport is not told how it ends unless the destination calls a webhook automation of the plugin. `pending`: accepted, and the destination will confirm later |
| `url` | with `redirect`, `link` | Where to send the member |
| `id` | no | Who the member is at the destination |
| `data` | no | Anything the channel needs later for this member. Not for tokens or other secrets |
| `note` | no | A short line shown to the member |

**`opt_in.callback` result:** runs in the request when the member's browser
returns, with the destination's query and form values in `trigger.callback`.
It returns `status` (`linked`, `pending` or `failed`), `id`, `data`, `note`,
and optionally `redirect`: where to send the browser next, when the
destination asks for the member to land on a page of its own. Without
`redirect` the member returns to the member app.

**`opt_out` result** (`passport/schemas/channel.opt_out.result@1`): `status`
(`removed`; `not_found`, which counts as removed; `link`: the member must do
it at the destination, at `url`; `kept`: the destination refused, see
`note`), `url`, `note`.

**The link Passport keeps.** For each member and channel: `status`
(`linked`, `pending`, none), `id`, `data` and `at`. Every channel flow that
runs for a member reads it as `link`; a `per_member` channel with an
`opt_in` flow publishes only to members whose link is `linked`.

**When the destination calls back server to server.** Some destinations
confirm, change or end a link later, with no browser involved. That is a
webhook automation of the same plugin
([5.3](05-automations.md#53-triggers)), which records what it was told with
the built-in `channel.link.set` and reads a member's link with
`channel.link.get`. The same two actions are how an automation keeps the
destination in step afterwards: on a subscription event, read the member's
link and tell the destination what they may now have.

**A worked shape: an account link by OAuth** (the destination knows what
each linked member is entitled to and restricts on its side, so the channel
is `delivery: once`, `audience: none`):

1. `opt_in` returns `redirect` to the destination's authorize page, with
   `trigger.state` as `state` and `channel.callback_url` as the return
   address.
2. The member approves there, and the destination returns the browser to
   `channel.callback_url`.
3. `opt_in.callback` exchanges the code, registers the member with the
   destination under an id Passport made for them, and returns `linked`
   with that `id` and the destination's completion page as `redirect`.
4. An automation on subscription events reads the link and updates the
   member's entitlements at the destination.
5. `opt_out` tells the destination to unlink and returns `removed`; or
   returns `link` to the destination's own page when only the member can
   do it there.

What is **not** settled, and why these are not built yet: where a member's
tokens are kept when a destination needs them after the link is made;
whether an admin may opt a member in when the destination requires the
member's own consent; what the member app shows for `link` and `pending`;
and whether opt-in is per added channel or once for the plugin.

<a id="66-what-the-admin-understands-in-context"></a>

## 6.6 What the admin shows

The admin shows a distribution on a plugin's channel from the results of its
flows. It does not need to know the channel.

| From | Key | Shown as |
|---|---|---|
| `publish`, `update` | `status` | Published, or Pending |
| | `url` | The link on the distribution: "Open on <label>" |
| | `note` | A line under the status |
| | `id` | In the distribution's details |
| `status` | `status`, `checked_at` | The status, and when it was checked |
| | `note` | A line under the status |
| | `url` | Replaces the link |
| | `metrics` | A small table, one row per name |
| `delete` | `note`, with `kept` | The reason, with the offer to remove Passport's record only |
| `preview` | every key | The preview ([6.5.7](#657-preview)) |
| a `per_member` `publish` | `status`, `note` | Counts of sent, skipped and failed; each member's line in the run history |

`data` is never shown.

Two keys of `distribution.context` are still read by the admin:

| Key | Shown as |
|---|---|
| `asset_id` (with `generated_at`, `characters_billed`) | An inline player or a file link, with those details ([9.5](09-files-and-binary.md#95-recording-a-file-on-a-distribution)) |
| `body_edited` | Set by the admin when the body was edited by hand; "Update distribution" then asks before replacing it |

Anything else you store in `context` is yours. Prefix your own keys with
something of the plugin's to stay clear of future admin keys. The keys
`channel_link`, `channel_status`, `channel_status_updated_at`,
`channel_failures` and `channel_status_checked_at` are not read on a v2 channel: the
link is `url`, and the status is the `status` flow's result.

## 6.7 Body editor hints

`channel.ui` puts the distribution's own body in the paragraph editor on the
distribution page. The engine ignores it; the admin reads it.

| Hint | Effect |
|---|---|
| `body_editor: paragraphs` | Edit the body with the [paragraph editor](02-field-schema.md#the-paragraph-editor). Restricted sections are marked for the distribution's audience |
| `preview_label`, `channel_view`, `skip_setting`, `section_line`, `sample`, `term_list`, `tags` | As the keys of `ui.paragraphs` ([2.6](02-field-schema.md#the-paragraph-editor)) |

`sample` and `preview_label` need the channel to have a `preview` flow
([6.5.7](#657-preview)); without one they are an error.

Use this when the channel publishes the body itself, edited. When the
channel needs a second text beside the body, put a `paragraphs` field in its
distribution form instead.

A hint names a **channel setting**. In v1 they named workflow inputs, and v1
`choice` / `choices` are replaced by fields of the distribution form with
`ui.options` ([2.8](02-field-schema.md#28-choices-loaded-from-an-action)),
which lists the default first, marks it, and hides an empty menu.

## 6.8 Templates

Not every channel uses a template. A channel that posts the vendor a few
fields (a title, a link, an audio file) has nothing to render. A channel
that hands the vendor finished text (a post, show notes, a message) renders
the distribution with `distribution.render`, and that render is where a
template comes in.

### The template menu

**A channel whose flows call `distribution.render` gets a template menu on
the distribution page**, beside the audience and the schedule. Nothing has
to be declared for it: the build finds the call in the steps of any of the
channel's flows, nested steps included, and in the plugin actions those
steps call. A channel that never renders has no menu.

The menu is saved as the distribution's template (`distribution.template_id`,
the field every distribution already has), and `distribution.render` uses
it with no input of its own:

```yaml
publish:
  steps:
    - id: render
      action: distribution.render
      with:
        distribution_id: "${{ trigger.distribution_id }}"
    - id: post
      action: facebook/post.publish
      with:
        message: "${{ steps.render.outputs.body }}"
  returns: { … }
```

A channel that renders in `publish` renders the same way in `update` and in
`preview`, so that the three agree. Put the render and what follows it in a
plugin action when it is more than one step.

With no template chosen, `distribution.render` renders the distribution's
own body as the template, as it always has.

`channel.template` changes the menu:

```yaml
channel:
  name: facebook-post
  # …
  template:
    required: true
    default: post
```

| Key | Meaning |
|---|---|
| `required` | `true`: a distribution on this channel cannot be saved without a template. Default `false` |
| `default` | One of this plugin's templates (below), by name. A new distribution on this channel starts with it chosen |

The publisher may choose None on a menu that is not required, even when
it has a default.

`template: false` turns the menu off for a channel that renders but must
not be given a template; `template: {}` is the same as leaving it out. No
other value is allowed. A `{ required, default }` block on a channel that
never calls `distribution.render` is an error; `false` and `{}` are allowed
on any channel. "Calls" counts the steps of every flow of the channel,
nested ones included, and the steps of the plugin actions they call, this
plugin's or a dependency's, followed through actions that call actions; it
does not follow `workflow.run`.

**What the menu lists.** The site's article templates. Those offered for
this channel come first, marked: the plugin's own templates whose `for`
names the channel, and the site's copies of them. The rest follow.

### Templates a plugin ships

A plugin may ship templates in `templates/`, one per file, so a channel
works well the day it is added and the publisher has something to start
from.

```yaml
# templates/post.yaml
name: Facebook post
description: The article's title and summary, then a link to read the rest.
for: [channel/facebook-post]
title: "{{ .article.title }}"
body: |
  {{ .article.title }}

  {{ .article.summary }}
```

| Key | Required | Meaning |
|---|---|---|
| `name` | yes | What the publisher sees in the template menu and the Templates page. A template is referred to by its file name (`post` for `templates/post.yaml`), never by this |
| `description` | no | One sentence, shown with it |
| `for` | yes | The channels and extensions it is offered for: `channel/<name>`, or `automation/<key>` of an automation with `extension:` (any other automation is an error) |
| `title` | no | The title template. Without it the title is the article's |
| `body` | yes | The template, in Passport's template language |

`title` and `body` are Passport template text (`{{ .article.title }}`), not
`${{ }}` expressions. They are rendered by Passport when a distribution or an
extension renders with the template, with the same data and functions as
any template on the site; nothing in them is evaluated by the run.

**On the site.** Installing the plugin adds each of its templates as an
article template owned by the plugin. The publisher sees them on the
Templates page under the plugin's name; they cannot be edited there, only
used or **copied**. A copy is the site's own template, starts offered for
the same channels and extensions, and is never touched by the plugin again.
Upgrading the plugin replaces its templates with the new version's.
Uninstalling removes them; copies stay.

A template is part of the plugin's contract: removing one, or taking a
channel out of its `for`, is a breaking change. When an upgrade removes a
template, distributions waiting to publish with it move to the channel's
`default`, or to none.

### Templates in an extension

An extension renders a record, not a distribution, so it has no template
menu. When the publisher should choose how something is worded (the words
read before and after an article, say), give the extension's inputs a
`format: passport.template` field, and render with `template.render`:

```yaml
inputs:
  type: object
  properties:
    script:
      type: string
      format: passport.template
      title: Script
      default: narration-script        # one of this plugin's templates
run:
  steps:
    - id: script
      name: Render the script for this article
      action: template.render
      with:
        template_id: "${{ inputs.script }}"
        article_id: "${{ article.id }}"
```

A `format: passport.template` field, or a list of them
(`type: array`, `items: { format: passport.template }`), lists the
templates offered for its definition first, as the menu does. Its `default`
may name one of the plugin's own templates by file name, which must be
offered for that definition; the form shows that template chosen.

## 6.9 Checklist

- A `publish` flow. An `update` flow if the destination can change what was
  sent, a `delete` flow if it can take it back. If it can do neither, the
  channel is permanent, and its `description` says so.
- `channel.delivery` says how often `publish` runs, and `channel.audience`
  is `none` when the destination decides who may see it.
- No top-level `steps:`, no `channel.mode`, `channel.requires_audience`,
  `channel.preview` or `channel.status`.
- Every flow ends in `returns`, with the keys of that flow's result and no
  others.
- `publish` and `update` return the `id` and the `url`. Nothing writes them
  to `context`.
- `update` changes what exists, found by `published.id`; it does not create
  a second copy.
- `delete` returns `not_found` for something already gone, and `kept` with
  a `note` when the destination will not remove it.
- `preview` and `status` run only `control`, `read` and `external` actions,
  and change nothing a member or the public can see.
- `pending` is returned only by a channel with a `status` flow.
- Work that two flows share is a plugin action.
- A failure the publisher can fix is a `workflow.fail` with a plain reason.
- Per-channel values are channel settings; per-distribution values are in
  the distribution form; shared credentials are plugin settings.
- `multiple: true` if a publisher could reasonably want two.
- A channel that renders ships a template that suits the destination and
  names it as `channel.template.default`.
