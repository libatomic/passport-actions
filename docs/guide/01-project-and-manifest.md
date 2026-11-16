# 1. Project and manifest

## 1.1 A plugin project

A plugin is a folder with `plugin.yaml` at its root. Every definition is
YAML with the extension `.yaml`. What a file is follows from the folder it is
in; the manifest does not list them.

```
plugins/campaign-monitor/
  plugin.yaml                     the manifest
  automations/new-subscriber.yaml one automation definition per file
  channels/…                      one channel definition per file
  actions/subscriber.add.yaml     one action per file
  schemas/subscriber.yaml         one schema per file
  templates/post.yaml             Passport templates the plugin ships
  assets/icon.svg                 icons and images the plugin shows
  docs/getting-started.md         help pages, shipped with the plugin
  tests/new-subscriber.yaml       test cases; never shipped
  README.md                       shown in the registry
```

A plugin is software other people install and rely on. Everything a
publisher sees of it travels in the project: its name and description, its
icons, its forms and their help text, its help pages and how to reach
support.

**`assets/`** holds SVG and PNG files, each up to 256 KB. An `icon` key
anywhere in the plugin may name one by its path in the project
(`icon: assets/lists.svg`). Icons are drawn square; give an SVG a square
`viewBox` and a PNG at least 128 pixels a side.

**`docs/`** holds help pages in Markdown, one page per file, its first
`# heading` the page's title. They are shipped with the plugin and shown
with it in the admin and the registry. A link from any `help` text or page
to another page is written as its path (`[Choosing a list](docs/lists.md)`).
Write them for the publisher: what to set up at the vendor, what each
automation and channel does, what to do when something fails. Images in a
page come from `assets/`.

**`templates/`** holds Passport templates the plugin ships for its channels
and extensions to use, one per file. Installing the plugin adds them to the
site as templates the publisher can use as they are or copy and change
([6.8](06-channels.md#68-templates)).

A folder with a `plugin.yml` (no `a`) is a v1 or 2.3-format project and is
not covered by this guide.

Names:

| Thing | Rule | Example |
|---|---|---|
| Plugin `id` | lowercase letters, digits and single hyphens, up to 64 characters; unique in the registry; never changes | `campaign-monitor` |
| Automation key, channel name | same rule as an id | `new-subscriber`, `facebook-post` |
| Action and schema name | lowercase letters, digits, hyphens, underscores and dots | `subscriber.add`, `user.email.opt_in` |
| Template name | same rule as an id; equals the file name | `post`, `show-notes` |
| File | the name, plus `_<major>` from major version 2 on, plus `.yaml` | `subscriber.add.yaml`, `subscriber.add_2.yaml` |

## 1.2 `plugin.yaml`

```yaml
format: 2
id: campaign-monitor
name: Campaign Monitor
description: Keep a Campaign Monitor list in step with your Passport subscribers.
icon: assets/icon.svg
category: email
docs_url: https://docs.passport.online/plugins/campaign-monitor
support:
  url: https://help.example.com/campaign-monitor
  email: plugins@example.com
visibility: public
requires:
  passport: "^2.3.0"
allowed_hosts:
  - api.createsend.com
settings:
  type: object
  required: [api_key, client_id]
  properties:
    api_key:   { type: string, title: API key, secret: true }
    client_id: { type: string, title: Client id, pattern: "^[0-9a-f]{32}$" }
test: ping
```

| Key | Required | Meaning |
|---|---|---|
| `format` | yes | `2`. A `plugin.yaml` that does not say so is refused |
| `id` | yes | The plugin's id |
| `name` | yes | Shown in the registry and the admin |
| `description` | yes | One or two sentences: what the publisher gets |
| `icon` | no | A file in `assets/`, or an https URL to an SVG or PNG |
| `category` | no | Registry grouping: `email`, `audio`, `social`, `commerce`, `analytics`, `content`, `other` |
| `docs_url` | no | Documentation kept outside the plugin, if any. Pages in `docs/` are preferred: they ship with the version they describe |
| `support` | no | How a publisher reaches whoever supports the plugin: `url` (https), `email`, or both. Shown on the plugin's page and in the registry |
| `visibility` | no | `public` (default) or `restricted` (offered only to sites an operator grants it to) |
| `requires` | yes | What the plugin needs ([1.5](#15-requires)). `passport` is required |
| `allowed_hosts` | when it calls out | The hosts `http.*` may reach: a host name, or `*.example.com`. No IP addresses. Nothing else is reachable, whatever the site's own allowlist says |
| `settings` | no | The plugin's shared settings, a [form schema](02-field-schema.md) |
| `test` | no | Key of an automation with a manual trigger and no inputs that proves the settings work. The admin runs it for "Test connection" |

Never write these; the registry assigns them at release and a hand-written
value is rejected: `uuid`, `version`.

Unknown keys are an error in every v2 file. A typo is reported, not ignored.

YAML anchors and aliases (`&name`, `*name`) may be used within one file to
avoid repeating a block. They do not reach across files; share across files
with a schema or an action. Plugin Studio keeps them as written. Merge keys
(`<<:`) are not supported; write the block out.

## 1.3 Versions

Two different things carry a version.

**The plugin's release version** is assigned by the back office when a change
is released. The operator chooses "a fix", "something new" or "a breaking
change" and the next number follows. The first release is 1.0.0.

**Each definition's own version** (`version:` in every schema, action,
automation and channel) is written by you, as semver:

| Change | Bump | File |
|---|---|---|
| A fix that changes no contract | patch, `1.2.0` to `1.2.1` | same file |
| Something added that existing users are unaffected by | minor, `1.2.1` to `1.3.0` | same file |
| Anything that breaks an existing user | major, `1.3.0` to `2.0.0` | a **new file**, `<name>_2.yaml`; the old file stays |

One file per major version. The file's `version` must agree with its name:
`subscriber.add_2.yaml` holds `version: 2.x.y`. A definition's first version
is `1.0.0`; there is no major 0.

What counts as breaking:

| Kind | Breaking |
|---|---|
| Schema | removing a property, adding a required one, narrowing a type, format, enum or range |
| Action | a breaking change to its `inputs` or `outputs` schema, or doing something materially different |
| Automation | a breaking change to its `settings` or `inputs`; changing what starts it |
| Channel | a breaking change to its `settings` or `distribution` form; changing `mode` or `content_type` |

Keeping the old major beside the new one is what lets things move at their
own pace: an automation a publisher added from `new-subscriber.yaml` keeps
running on major 1 until they move it to major 2 and fill in whatever
changed. Remove an old major only in a later release, once nothing uses it.

A push for review is refused when a definition's content changed since the
last release and its version did not go up.

## 1.4 References

A definition refers to another by name and version range. References are
resolved when the plugin is built and **pinned** to an exact version in the
released package, so a release never changes underneath a publisher.

The one exception is `passport/…`: the server keeps one file per major and
updates it in place, so a built package refers to Passport's schemas as
`@^<the version it was built against>`, and records the exact version it saw.

| Referring to | Written as | Example |
|---|---|---|
| A built-in action | its name | `action: http.post` |
| A plugin action | `<plugin>/<name>@<range>` | `action: campaign-monitor/subscriber.add@^1` |
| A schema | `<plugin>/schemas/<name>@<range>` | `$ref: campaign-monitor/schemas/subscriber@^1` |
| A built-in schema | `passport/schemas/<name>@<range>` | `$ref: passport/schemas/user.created@^1` |

Inside the same plugin the range may be left off, and the newest major in the
folder is used:

```yaml
- id: add
  action: campaign-monitor/subscriber.add
```

A reference to another plugin, or to `passport`, must carry a range.

## 1.5 `requires`

Any definition may say what it needs. `plugin.yaml` must.

```yaml
requires:
  passport: "^2.3.0"        # the server version
  acme-api: "^1.2.0"        # another plugin, see 1.6
```

| Range | Matches |
|---|---|
| `^2.3.0` | 2.3.0 and up, below 3.0.0 |
| `~2.3.0` | 2.3.0 and up, below 2.4.0 |
| `>=2.3.0, <2.6.0` | both conditions; **a comma means "and"** (npm uses a space; Passport does not) |
| `^2.3.0 \|\| ^3.0.0` | either |
| `2.3.0 - 2.5.0`, `2.3.x` | a span; any patch of 2.3 |

Two differences from npm. A space between conditions is an error here: use
a comma. And below 1.0 the caret still holds only the major: `^0.2.3` admits
`0.9.0`, where npm would stop at `0.3.0`; write `~0.2.3` for that.

The server's version is `passport`. The 2.3-format name for it, `atomic`,
is not accepted in a v2 manifest. `passport` and `atomic` cannot be used as
plugin ids, and a plugin cannot require itself.

A plugin's effective requirement is everything its files require together.
If an action needs a function that arrived in 2.4.0, put
`requires: { passport: "^2.4.0" }` on that action; the build raises the
plugin's requirement for you.

A site on a server that does not satisfy the requirement is not offered that
version of the plugin; it is offered the newest one it can run.

You do not list the built-in actions you use. The build works that out and
records it, and a server that lacks one of them refuses the install.

## 1.6 Depending on another plugin

A plugin may use another plugin's actions and schemas.

```yaml
# plugin.yaml
requires:
  passport: "^2.3.0"
  acme-api: "^1.2.0"
```

```yaml
# automations/sync.yaml
steps:
  - id: add
    action: acme-api/contact.add@^1
    with:
      api_key: "${{ secrets.api_key }}"
      email: "${{ trigger.body.email }}"
```

**Dependencies are included at release.** When the plugin is built, the
actions and schemas it actually uses from `acme-api` (and whatever those use)
are copied into the released package and pinned. The released plugin is
self-contained: the site installs one package, its content hash covers
everything in it, and a later release of `acme-api` changes nothing until
this plugin is released again.

The copies live in the package under `_deps/<plugin>/actions/` and
`_deps/<plugin>/schemas/`. References to them keep their written form,
`<plugin>/<name>@<x.y.z>`, and resolve to the copy. A dependency's own
dependencies are copied the same way.

What follows from that:

- The publisher installs only your plugin. `acme-api` does not appear on
  their site.
- **Settings are not shared.** An included action runs as part of your
  plugin. It reads *your* settings, so a library action should take what it
  needs (credentials, ids) as inputs and not read `settings` at all. The
  check warns when an action used from another plugin reads `settings` or
  `secrets`.
- **Hosts are yours to allow.** If an included action calls
  `api.acme.example`, your `allowed_hosts` must list it. The check tells you
  which are missing.
- Only actions and schemas can be used from another plugin. Automations and
  channels cannot.
- Dependencies may have dependencies, to a depth of 8. A cycle is an error,
  and so is a build that would need two versions of one plugin, or a
  dependency that leads back to the plugin being built.
- A plugin in `requires` that nothing uses is a warning, and is not copied.
- The effective server requirement includes what the copied actions require.

## 1.7 The registry

The registry is the `v2` branch of `libatomic/passport-actions`.

```
plugins/<id>/…                    each plugin's source, as last released
releases/<id>/<version>.json      the built package of each release
index.json                        every plugin and version
docs/                             this guide and the reference
```

`plugins/`, `releases/` and `index.json` are written **only by the back
office, at release**. Never commit to them by hand, and never let Claude or
Scout write them. Work reaches the registry by being pushed for review from
Plugin Studio and released from there or from the back office
([chapter 10](10-testing-review-release.md)).

To work on a plugin that is already released, use "Get from the registry" in
Plugin Studio; it copies the released source into your workspace.
