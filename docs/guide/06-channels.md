# 6. Channels

A channel is a place a distribution can be published to. Passport has
built-in channels (web, email, SMS, RSS, podcast); a plugin adds more: a
Facebook page, Spotify, an audio narration.

A channel is not an automation. Nothing triggers it. It runs when a publisher
publishes, republishes, deletes or previews a distribution on it, and it has
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
| `help`, `icon` | no | |
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
| `requires_audience` | no | A broadcast channel must still be given an audience, to render for it. Unicast always needs one |
| `application` | no | Offer only this application's audiences |
| `address` | unicast | What identifies a member on this channel: a list of `{ name, label, type, required, placeholder }` with `type` one of `text`, `phone`, `email`, `url` |
| `connect_url` | no | A "Connect" button in the member app |
| `preview` | no | `true`: the channel answers `preview` ([6.5](#65-what-a-channel-must-answer)) |
| `status` | no | `true`: the channel answers `status` |
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
vendor, which template, which voice, whether it is a trailer.

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
    template:
      type: string
      format: passport.template
      title: Show notes template
    voice:
      type: string
      title: Voice
      default: "${{ channel.settings.voice_id }}"
      ui:
        options:
          items: "${{ channel.settings.voices }}"
          value: "${{ item.voice_id }}"
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
| `distribution` | `id`, `title`, `body`, `summary`, `audience_id`, `asset_id`, `scheduled_at` |
| `channel.settings` | this channel's settings (not its secrets) |
| `settings` | the plugin's settings (not its secrets) |

**Choices from the channel's settings.** `ui.options` without an `action`
takes its `items` straight from an expression, as `voice` does above: the
list the publisher maintains in the channel's settings becomes the menu on
each distribution.

**Templates.** A `format: passport.template` field shows the templates made
for this channel. Render with it:

```yaml
- id: notes
  action: distribution.render
  with:
    distribution_id: "${{ trigger.distribution_id }}"
    template_id: "${{ fields.template }}"
```

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
| `trigger.distribution_id` | The distribution |
| `trigger.user_id` | The member, for a unicast channel |
| `trigger.preview.body` | In a preview: the body as it is in the editor, unsaved edits included |
| `trigger.preview.sample` | In a preview started from a paragraph's play button: that paragraph's text. Empty otherwise |
| `trigger.preview.settings` | In a preview: channel settings the editor is trying out and has not saved. You do not read this yourself; `channel.settings` already reflects it for that run |
| `distribution` | The whole distribution record as saved, exactly what `distribution.get` returns as `distribution`: `id`, `_id`, `article_id`, `title`, `body`, `summary`, `description`, `language`, `audience_id`, `template_id`, `asset_id`, `scheduled_at`, `settings`, `context` |
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
   renders once as a member of the distribution's audience.
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

`channel.ui` adjusts the body editor on the distribution page. The engine
ignores it; the admin reads it. The set is closed.

| Hint | Effect |
|---|---|
| `body_editor: paragraphs` | Edit an HTML body as its paragraphs: change text, switch a paragraph off, see restricted sections as markers with whether the distribution's audience gets them |
| `preview_label: <text>` | The preview button's label |
| `channel_view: <channel>` | Keep the body as that channel shows it: each `{{ if isChannel "<channel>" }}…{{ else }}…{{ end }}` is replaced by its first branch when the body is loaded or copied from the article |
| `skip_setting: <setting>` | The channel setting that holds CSS selectors for parts that are not used; the editor leaves those parts out. The setting is an array of strings |
| `section_line: { setting, label }` | Each restricted section gets an editable replacement line, defaulting to that setting's value. The setting is a string |
| `sample: audio` | A play button per paragraph: a preview run with `trigger.preview.sample` set to the paragraph's text, expecting `audio` (base64) and `audio_type` back |
| `term_list: { setting, find, replace, label }` | Right-click a word to add or edit a row in that list setting (pronunciations, say); saved to the channel's settings. The setting is an array of objects; `find` and `replace` name the two properties of a row. While a row is being edited, its play button runs a preview with the unsaved list |
| `tags: { setting, title, sets }` | A menu of tags an editor can insert into the text. `setting` is a string setting (usually an `enum`); its value picks the set from `sets`, falling back to `sets.default` |

A hint names a **channel setting**. In v1 they named workflow inputs, and v1
`choice` / `choices` are replaced by fields of the distribution form with
`ui.options` ([2.8](02-field-schema.md#28-choices-loaded-from-an-action)),
which lists the default first, marks it, and hides an empty menu.

## 6.8 Checklist

- `publish`, `republish` and `delete` all handled; `preview` and `status` if
  declared.
- `republish` updates; it does not create.
- No side effect can happen in a preview.
- What was made is recorded in `context`, merged with what was there.
- A failure the publisher can fix is a `workflow.fail` with a plain reason.
- Per-channel values are channel settings; per-distribution values are in
  the distribution form; shared credentials are plugin settings.
- `multiple: true` if a publisher could reasonably want two.
