# Plugins

A **plugin** is one vendor connection, installed once per instance, exposing a
closed set of named methods.

It exists because the alternative is what `recipes/cm/*` does today: four
recipes each declaring their own `api_key` input, each rebuilding the same
`Basic ${{ base64Encode(api_key + ':x') }}` header, and each blueprint passing
`secrets.CM_API_KEY` down by hand. The credential is configured once per
workflow rather than once per instance, and nothing in the system knows those
four inputs are the same key.

A plugin holds the connection. Workflows call it by naming a method.

```
plugins/<vendor>/plugin.yml          # component root = v1
plugins/<vendor>/v2/plugin.yml       # breaking major
```

One level shallower than `recipes/<vendor>/<name>/`, because a plugin *is* the
vendor connection — there is no name below it.

Referenced exactly like `uses:` and `includes:`:

```
libatomic/passport-actions/plugins/cm
libatomic/passport-actions/plugins/cm/v2
libatomic/passport-actions/plugins/cm@v1.4.2
```

Versioning is folder-major, same as everything else here (see
[WORKFLOW.md](../WORKFLOW.md)): the component root is v1, a breaking change
gets a new `vN/` folder, granular semver lives in the file's `version:`, and an
unversioned ref follows the default branch.

## What a plugin is not

- **Not a proxy for arbitrary URLs.** Callers name a declared method and supply
  values for its declared parameters. There is no field anywhere in the request
  path that carries a URL, a host, or a raw body.
- **Not a way to hand a credential to a workflow.** The auth expressions are
  evaluated server-side into the outbound request. A plugin's config never
  enters a workflow's expression environment, and `${{ plugins.cm.api_key }}`
  is not a thing that exists.
- **Not a replacement for the existing model.** Recipes that declare their own
  `secret: true` inputs keep working unchanged. Plugins are additive.

## Anatomy

| Key | Meaning |
|-----|---------|
| `name` | The plugin id. Unique per instance; `^[a-z][a-z0-9_-]{0,63}$`. |
| `label`, `icon`, `category`, `description`, `docs_url` | Library presentation. |
| `version` | Semver. Its major must agree with the folder (`v2/` ⇒ `2.x.y`). |
| `base_url` | Fixes scheme, host and path prefix for every request. Must be `https`. |
| `config` | The per-instance installable fields. Same vocabulary as a recipe input. |
| `auth` | How config becomes request auth. One scheme per plugin. |
| `methods` | The complete set of callable operations. |
| `test` | Which method the "Test connection" button calls. |
| `legacy_secrets` | Workflow secret names an earlier generation used for this vendor. |
| `widgets` | **Reserved.** See below. |

### `config`

```yaml
config:
  api_key:
    label: API key
    type: string          # string | integer | bool | list | object
    secret: true          # stored write-only; never returned
    required: true
    order: 1              # render order; ties broken by key
    pattern: "^[0-9a-f]{32}$"   # RE2, checked at install
    enum: [a, b]
    default: ""
    hint: Short help under the field.
    description: Longer explanation.
```

A `secret: true` field is **never sent back out**. A client is told only whether
a value is stored, and submitting the field empty leaves the stored value
alone — the same rule the email provider schemas follow, for the same reason:
rendering the editor must not mean putting an API key in a page.

### `auth`

| `type` | Fields | Applied as |
|--------|--------|-----------|
| `basic` | `username`, `password` | HTTP basic |
| `bearer` | `value` | `Authorization: Bearer <value>` |
| `header` | `header`, `value` | that header, verbatim |
| `query` | `name`, `value` | a query parameter |
| `none` | — | nothing |

Values may be `${{ }}` expressions over `config` plus the pure stdlib
functions. Nothing else is in scope — no `steps`, no `trigger`, no `inputs`, no
`secrets`, no network.

`header` is the escape hatch for anything odd. Campaign Monitor's
`Basic base64Encode(key + ':x')` is still expressible that way; it is simply no
longer necessary.

### `methods`

```yaml
methods:
  subscriber_lists_get:
    label: Subscriber lists
    description: Shown when picking a method.
    verb: GET                       # GET POST PUT PATCH DELETE
    path: /clients/{client_id}/lists.json
    params:
      client_id:
        in: path                    # path | query | body | header
        field: client_id            # vendor-side name; dotted for nested body
        type: string
        required: true
        default: ${{ config.client_id }}
        pattern: "^[0-9a-f]{32}$"
        enum: [a, b]
        max_length: 64
    headers: { Accept: application/json }   # static only
    expect_status: [200]
    result:
      type: array
      item: { value: ListID, label: Name }
```

**Parameters are declared slots, not template holes.** A value the caller
supplies is bound to a declared `param`, type-checked, pattern-checked and
escaped — never interpolated into a URL or a body. A key with no matching
`param` is rejected rather than ignored, because silently dropping a parameter
is how a caller comes to believe it filtered something.

`result` describes the response well enough for the admin UI to offer a method
as an option source without every `data_source` restating it:

```yaml
    result:
      type: array                            # array | object
      items: data.lists                      # dot path to the array, when the
                                             # body is an envelope. Omit when
                                             # the body *is* the array.
      item: { value: ListID, label: Name }   # the keys of one element
```

Declaring `item` is what lets a workflow input write

```yaml
    data_source: { plugin: cm, method: subscriber_lists_get }
```

and get a correctly-labelled dropdown with no expressions at all. An input may
still override either half with a `${{ item.* }}` expression when the default
is wrong for it.

There is no "find the first array-valued key" fallback for `items`. A vendor
adding a second array to its envelope would silently change which list an admin
is choosing from, and that is not a failure anyone would notice.

### `paginate` — parsed, and currently refused

`paginate:` describes walking a paged endpoint:

```yaml
    paginate:
      style: page          # page | cursor | none
      page_param: page
      size_param: pagesize
      size: 1000
      items: ${{ response.Results }}
      total_pages: ${{ response.NumberOfPages }}
      max_pages: 5
```

**Nothing walks pages yet, so a method declaring `paginate:` is rejected at
load time.** Refused rather than ignored on purpose: accepting it would hand
back page one of a list and call it the list, and the option an admin is
looking for would simply be absent with nothing anywhere saying why. Until it
is implemented, ask the vendor for the largest page it will give in one call
via an ordinary `query` param with a `default`.

## `widgets` — reserved

`widgets:` is reserved for a later round in which a plugin declares dashboard
tiles backed by its own methods. The engine parses the key and validates only
that each entry's `method` names a declared method; nothing renders it. Authors
may write them now. Unknown keys inside an entry are dropped on parse, so the
shape can gain fields later without a breaking change.

## Authoring checklist

1. `base_url` is `https` and is the only host the plugin will ever contact.
2. Every `{placeholder}` in a `path` has a matching entry in `params`.
3. Every id-shaped param has a `pattern`. It costs one line and it means a
   malformed id never leaves the process.
4. `test:` names a method needing no parameter without a config-backed default.
5. Credentials are `secret: true`. Nothing else is.
6. `legacy_secrets` lists whatever the pre-plugin recipes used, so a rotation
   does not miss the second copy.
7. Any method meant as an option source declares `result.item`, so a
   `data_source` needs only a plugin and a method name.
8. No method declares `paginate:` — it is refused until the engine implements
   it.
9. Push to `master`. Consumers pick it up within about five minutes; a pinned
   `@vX.Y.Z` ref is cached forever.

There is no CI, no linter and no JSON Schema in this repository. The engine's
parser is the only gate, so an error here surfaces at install time on somebody
else's instance.
