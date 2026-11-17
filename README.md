# Passport plugins (v2)

This branch is the Passport plugin registry and the guide to building
plugins. Plugins extend Passport without new server code: each is a folder of
YAML that defines actions, automations and channels on top of the engine's
built-in actions.

| | |
|---|---|
| Build a plugin | [docs/PLUGIN-DEVELOPMENT-GUIDE.md](docs/PLUGIN-DEVELOPMENT-GUIDE.md) |
| The field schema (forms, inputs, outputs) | [docs/guide/02-field-schema.md](docs/guide/02-field-schema.md) |
| Built-in actions, events, schemas (tables generated from the engine by `passport-plugin reference`) | [docs/reference/](docs/reference/) |
| Working here with Claude | [CLAUDE.md](CLAUDE.md) |

## Layout

```
plugins/<id>/                  each plugin's source, as last released
releases/<id>/<version>.json   the built package of each release
index.json                     every plugin and version
docs/                          the guide and reference
```

`plugins/`, `releases/` and `index.json` are written by the Passport back
office when a change is released. Do not commit to them by hand. Build and
test a plugin in Passport Studio, push it for review, and release it from
there.

## Plugins

| Plugin | Provides | State |
|---|---|---|
| [campaign-monitor](plugins/campaign-monitor/) | Automations that keep a Campaign Monitor list in step with subscribers | Converted from v1; not yet released |
| [elevenlabs](plugins/elevenlabs/) | Audio narration of an article, as an extension | Converted from v1; not yet released |

Spotify is converted once its v1 work is merged.

## The other branches

`master` holds the v1 objects (blueprints, recipes, packages, Node actions).
It is frozen: workflows already installed from it keep running, and nothing
new is added there. See the guide's
["What changed from v1"](docs/PLUGIN-DEVELOPMENT-GUIDE.md#what-changed-from-v1-and-why).
