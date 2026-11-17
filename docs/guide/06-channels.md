# 6. Channels

A channel is a place a distribution can be published to. Passport has
built-in channels (web, email, SMS, RSS, podcast); a plugin adds more: a
Facebook page, a LinkedIn page, Spotify.

A channel is not an automation. Nothing triggers it. It runs when a publisher
publishes, republishes, deletes or previews a distribution on it, or asks for
its status, and it has
three things an automation does not: a `channel` block that says what kind of
channel it is, a form filled in on every distribution, and a fixed set of
requests it must answer.

## 6.1 A channel file

```yaml
# channels/facebook-post.yaml
version: 1.0.0
description: Post an article to a Facebook page.
multiple: true
channel:
  name: facebook-post
  label: Facebook post
  mode: broadcast
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
steps:
  - id: removing
    if: "${{ trigger.action == 'delete' }}"
    then:
      - id: remove
        action: facebook/post.delete
        continue-on-error: true
        with:
          post_id: "${{ distribution.context.post_id }}"
          token: "${{ channel.secrets.page_token }}"
      - id: done
        action: workflow.exit
  - id: post
    action: facebook/post.publish
    with:
      page_id: "${{ channel.settings.page_id }}"
      token: "${{ channel.secrets.page_token }}"
      post_id: "${{ trigger.action == 'republish' ? distribution.context.post_id : '' }}"
      message: "${{ fields.message }}"
      link: "${{ channel.settings.link_back ? fields.link : '' }}"
  - id: record
    action: distribution.update
    with:
      distribution_id: "${{ trigger.distribution_id }}"
      context: "${{ merge({'post_id': steps.post.outputs.post_id, 'channel_link': steps.post.outputs.url}, distribution.context) }}"
```

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
| `steps` | yes | What it does for each request ([6.5](#65-what-a-channel-must-answer)) |
| `vars`, `schemas`, `retention`, `requires` | no | As for an automation |

A channel has no `on:` and no `inputs`.

## 6.2 The `channel` block

| Key | Required | Meaning |
|---|---|---|
| `name` | yes | The definition's name; equals the file name. Not a built-in channel's name |
| `label` | yes | What the definition is called in the plugin's Channels tab. The publisher gives each channel they add its own label |
| `mode` | yes | `broadcast`: publish once. `unicast`: once per audience member, with `trigger.user_id` |
| `content_type` | yes | `text` or `html`: what the distribution's body is |
| `max_body_length` | no | A cap on the body, enforced when the distribution is saved |
| `base_type` | no | `podcast`, `rss`, `email` or `sms`: reuse that built-in channel's editor (a media file for `podcast`, for example) |
| `media` | no | For a channel with `base_type: podcast`: the kinds of media file a distribution may carry, a list of `audio`, `video` or both. The distribution page offers those in its file picker. Leave it out to offer what the built-in podcast channel takes. An error on any other channel |
| `requires_audience` | no | A broadcast channel must still be given an audience, to render for it. Unicast always needs one |
| `application` | no | Offer only this application's audiences |
| `address` | no | For a unicast channel that needs to know who a member is on the destination: a list of `{ name, label, type, required, placeholder }` with `type` one of `text`, `phone`, `email`, `url`. Leave it out when the member's Passport email or phone is enough |
| `connect_url` | no | A "Connect" button in the member app |
| `preview` | no | `true`: the channel answers `preview` ([6.5](#65-what-a-channel-must-answer)) |
| `status` | no | `true`: the channel answers `status` |
| `template` | no | The template menu on the distribution page ([6.8](#68-templates)): `{ required, default }`, or `false` for none |
| `ui` | no | Hints for the body editor ([6.7](#67-body-editor-hints)) |

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
every distribution has (audience, body, schedule).

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
| `distribution` | the distribution record, as in [6.5](#65-what-a-channel-must-answer): `title`, `body`, `summary`, `audience_id`, `asset_id`, `scheduled_at`, … |
| `channel.settings` | this channel's settings (not its secrets) |
| `settings` | the plugin's settings (not its secrets) |

**Choices from the channel's settings.** `ui.options` without an `action`
takes its `items` straight from an expression, as `season` does above: the
list the publisher maintains in the channel's settings becomes the menu on
each distribution.

**In a run**, `fields.<name>` holds the resolved values. The form is
validated when the distribution is saved, and again, with followed values
resolved, at publish; a value that fails then fails the publish with a
message naming the field.

The form can be given a [layout](02-field-schema.md#29-form-layout).

## 6.5 What a channel must answer

One set of steps handles every request. `trigger.action` says which.

| `trigger.action` | When | Must |
|---|---|---|
| `publish` | The distribution is published for the first time | Publish to the destination and record what was made |
| `republish` | It was published before and is published again | Update what exists. Never create a second copy |
| `delete` | The distribution is being deleted | Remove what was published. Runs before the distribution is deleted; if the run fails, the distribution is kept |
| `preview` | The publisher asks for a preview (`channel.preview: true`) | Compute and return `outputs`; **no side effects** |
| `status` | The publisher asks for the status (`channel.status: true`) | Ask the destination and return the status |

What a channel run reads:

| Name | Holds |
|---|---|
| `trigger.action` | One of the five above |
| `trigger.distribution_id` | The distribution. Empty in a preview of a distribution that has not been saved yet |
| `trigger.user_id` | The member, for a unicast channel |
| `trigger.preview.body` | In a preview: the body as it is in the editor, unsaved edits included |
| `trigger.preview.sample` | In a preview started from a paragraph's play button: that paragraph's text. Empty otherwise |
| `trigger.preview.settings` | In a preview: channel settings the editor is trying out and has not saved. You do not read this yourself; `channel.settings` already reflects it for that run |
| `distribution` | The whole distribution record as saved, exactly what `distribution.get` returns as `distribution`: `id`, `_id`, `article_id`, `title`, `body`, `summary`, `description`, `language`, `audience_id`, `template_id`, `asset_id`, `scheduled_at`, `settings`, `context`. In a preview of an unsaved distribution: the record as it stands on screen, with no `id` |
| `article` | The distribution's article, when it has one: `id`, `title`, `slug`, `summary`, `body`, `author`, `image_uri`, `uri`, `published_at`, `metadata` |
| `fields` | The distribution form's values, with followed defaults resolved. In a preview: the form as it is on screen, resolved the same way |
| `channel.name`, `.label`, `.settings`, `.secrets` | This channel. In a preview the editor may pass channel settings that are not saved yet (a pronunciation being tried out); `channel.settings` then holds those for that run only |
| `settings`, `secrets` | The plugin's |

A channel does not need a `distribution.get` step to read its own
distribution; `distribution` and `article` are already there. Use
`distribution.get` only to load a different one.

The usual shape:

1. **`delete`**: remove what was published (`continue-on-error: true` if it
   may already be gone), then `workflow.exit`.
2. **Render** the body with `distribution.render`. `as_audience: true`
   renders once as a member of the distribution's audience and of every
   audience ranked below it in the site's audience rank order (an unranked
   audience: itself alone; see
   [5.7](05-automations.md#57-extensions)).
3. **`preview`**: return what would be sent as `outputs`, then
   `workflow.exit`. Put `if: "${{ trigger.action != 'preview' }}"` on every
   step with a side effect as a backstop.
4. **Publish**, creating on `publish` and updating on `republish`, using the
   id recorded last time.
5. **Record** what was made with `distribution.update`, `context` only.
   `context` replaces the whole map, so merge the existing keys back in:
   `merge({ 'post_id': … }, distribution.context)`. In `merge` the first
   argument wins.
6. **If it cannot publish**, `workflow.fail` with a reason the publisher can
   act on. The distribution is marked failed and shows that reason.

How failure reaches the publisher: for a broadcast channel the run happens
inside the publish, so a failed run is a failed distribution. See
[how the engine runs a channel](../PLUGIN-DEVELOPMENT-GUIDE.md#a-channel).

### Preview

With `channel.preview: true` the admin shows a preview button. It starts a
run with `trigger.action: preview` and waits up to 60 seconds for the run's
`outputs`. A channel has no `outputs` schema or `returns`; it sets these with
`outputs:` on a step ([7.5](07-steps-and-expressions.md#75-named-outputs)):

| Output | Shown as |
|---|---|
| `text` | The text that would be sent, paragraphs separated by blank lines |
| `characters`, `limit` | A count against a limit (`0` for none) |
| `note` | A short line under the preview |
| `audio`, `audio_type` | Base64 audio and its type, played in place |

A preview must not publish, create an asset or record anything.

A publisher can preview before the first save. The run then has no
`trigger.distribution_id`; `distribution` and `article` are still there, and
`distribution.render` given an empty `distribution_id` renders the
distribution on screen, so `distribution_id: "${{ trigger.distribution_id }}"`
works in both cases. Do not call `distribution.get` or `distribution.update`
in a preview: there may be no saved distribution to name. A plugin action
that renders must not mark `distribution_id` required if it is to serve such
a preview. Nothing of an unsaved preview is recorded, not even the run.

### Status

With `channel.status: true` the admin shows "Check status". The run returns:

| Output | Meaning |
|---|---|
| `status` | `success`, `pending`, `failed` or `removed` |
| `status_updated_at` | When the destination last changed it |
| `failures` | A list of messages, when failed |

## 6.6 What the admin understands in `context`

A channel records what it made in the distribution's `context`. These keys
are shown by the admin without it knowing the channel:

| Key | Shown as |
|---|---|
| `channel_link` | "Open on <label>" |
| `asset_id` (with `generated_at`, `characters_billed`) | An inline player or a file link, with those details |
| `channel_status`, `channel_status_updated_at`, `channel_failures`, `channel_status_checked_at` | Status and failures |
| `body_edited` | Set by the admin when the body was edited by hand; "Update distribution" then asks before replacing it |

Anything else you store there is yours. Prefix your own keys with something
of the plugin's to stay clear of future admin keys.

## 6.7 Body editor hints

`channel.ui` puts the distribution's own body in the paragraph editor on the
distribution page. The engine ignores it; the admin reads it.

| Hint | Effect |
|---|---|
| `body_editor: paragraphs` | Edit the body with the [paragraph editor](02-field-schema.md#the-paragraph-editor). Restricted sections are marked for the distribution's audience |
| `preview_label`, `channel_view`, `skip_setting`, `section_line`, `sample`, `term_list`, `tags` | As the keys of `ui.paragraphs` ([2.6](02-field-schema.md#the-paragraph-editor)) |

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

**A channel whose steps call `distribution.render` gets a template menu on
the distribution page**, beside the audience and the schedule. Nothing has
to be declared for it: the build finds the call in the channel's steps,
nested steps included, and in the plugin actions those steps call. A
channel that never renders has no menu.

The menu is saved as the distribution's template (`distribution.template_id`,
the field every distribution already has), and `distribution.render` uses
it with no input of its own:

```yaml
- id: render
  action: distribution.render
  with:
    distribution_id: "${{ trigger.distribution_id }}"
- id: post
  action: facebook/post.publish
  with:
    message: "${{ steps.render.outputs.body }}"
```

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
on any channel. "Calls" counts the channel's own steps,
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
steps:
  - id: script
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

- `publish`, `republish` and `delete` all handled; `preview` and `status` if
  declared.
- `republish` updates; it does not create.
- No side effect can happen in a preview.
- What was made is recorded in `context`, merged with what was there.
- A failure the publisher can fix is a `workflow.fail` with a plain reason.
- Per-channel values are channel settings; per-distribution values are in
  the distribution form; shared credentials are plugin settings.
- `multiple: true` if a publisher could reasonably want two.
- A channel that renders ships a template that suits the destination and
  names it as `channel.template.default`.
