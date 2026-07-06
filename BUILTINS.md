# Workflow Builtins

Built-in **actions** and **expression functions** available to workflows.

- [Builtin Actions](#builtin-actions) — steps you invoke with `action:` (e.g. `sendmail`, `user.get`), with their inputs and outputs.
- [Expression Functions](#expression-functions) — helpers for `${{ }}` expression blocks (strings, math, etc.).

Built-in functions available in workflow expressions. Use these in any `${{ }}` expression block — conditions, switch expressions, and input values.

In the visual editor, the `${{ }}` wrapper is added automatically. Just type the expression directly, e.g. `emailDomain(user.login)`.

## Context Variables

These variables are available in all expressions:

| Variable | Description |
|---|---|
| `trigger.*` | Data from the event/webhook that started the workflow |
| `steps.<id>.outputs.*` | Outputs from a previous step |
| `user.*` | Current user object (when available) |
| `vars.*` | Workflow variables — pre-populated from definition `vars:` and settable at runtime with `vars.set` |
| `inputs.*` | Workflow input parameters |
| `secrets.*` | Instance secrets |
| `instance.*` | Current instance data |
| `loop.index` | Current loop iteration index (inside foreach/while/until) |
| `loop.value` | Current loop item value (inside foreach) |

---

# Builtin Actions

Actions are the steps a workflow runs. Reference one with `action:` and pass parameters under `with:`:

```yaml
steps:
  - id: load-user
    action: user.get
    with:
      user_id: ${{ trigger.user_id }}
  - id: welcome
    action: sendmail
    with:
      to: ${{ steps.load-user.outputs.user.login }}
      template: welcome
      data:
        name: ${{ steps.load-user.outputs.user.profile.name }}
```

Every action returns an outputs map, referenceable downstream as `${{ steps.<id>.outputs.<key> }}`. Only steps that run **before** a given step are in scope.

## User

### `user.get`
Loads a user into the run context (also sets `user.*`). A missing user classifies as `not_found`.

| Input | Required | Description |
|---|---|---|
| `user_id` | one of these | User ID |
| `login` | one of these | Login / email |
| `subject` | one of these | Subject (external ID) |
| `phone` | one of these | Phone number |

| Output | Description |
|---|---|
| `user` | The loaded user object (`user.id`, `user.login`, `user.profile.*`, `user.roles`) |

### `user.create`
Creates a user (also sets `user.*`). A duplicate login classifies as `conflict`.

| Input | Required | Description |
|---|---|---|
| `login` | yes | Login / email |
| `password` | no | Initial password |
| `profile` | no | OIDC profile object |
| `roles` | no | Permissions list |
| `metadata` | no | Arbitrary metadata object |

| Output | Description |
|---|---|
| `user` | The created user object |

### `user.update`
Updates a user (also sets `user.*`). Not-found classifies as `not_found`.

| Input | Required | Description |
|---|---|---|
| `user_id` / `subject` / `login` | one required | User selector |
| `profile` | no | Profile updates |
| `preferences` | no | Channel preferences object |
| `metadata` | no | Metadata object |

| Output | Description |
|---|---|
| `user` | The updated user object |

### `user.audienceRefresh`
Schedules an audience-membership refresh for a user (deduped within a 10-minute window).

| Input | Required | Description |
|---|---|---|
| `user_id` | yes | User to refresh |

| Output | Description |
|---|---|
| `job_id` | The refresh job ID |

### `user.feed.invalidate`
Invalidates CDN-cached feeds for the instance.

| Input | Required | Description |
|---|---|---|
| `channel` | no | `podcast` or `rss` (omit for all channels) |
| `user_id` | no | Limit to a user |
| `distribution_id` | no | Limit to a distribution |

| Output | Description |
|---|---|
| `invalidated` | `true` when feeds were invalidated |

## Messaging

### `sendmail`
Sends an email using a template (by id or name) or a raw body.

| Input | Required | Description |
|---|---|---|
| `to` | yes* | Recipient(s): a string, comma-separated string, list of strings, or list of `{address, name}` |
| `template` | template or body | Template name (alias: `template_name`; or `template_id`) |
| `body` | template or body | Raw email body |
| `subject` | no | Subject line |
| `data` | no | Template context object (alias: `context`) |
| `user_id` | no | Associate the send with a user |

\* When `user_id` resolves a recipient, `to` may be omitted.

| Output | Description |
|---|---|
| `count` | Number of messages sent |

### `sendsms`
Sends a templated or raw SMS (SMS-channel parity with `sendmail`).

| Input | Required | Description |
|---|---|---|
| `template_id` / `template_name` | template or body | Template selector |
| `body` | template or body | Raw message body |
| `user_id` | no | Recipient user |
| `context` | no | Template context object |

| Output | Description |
|---|---|
| `count` | Number of messages sent |

## Data & Templates

### `audience.view`
Returns an audience's members, suitable for a `foreach` loop. Streams every page (bounded by `max`).

| Input | Required | Description |
|---|---|---|
| `audience_id` / `audience` | one required | Audience by ID or slug/name |
| `created_after` | no | Only members created after this timestamp |
| `limit` | no | Page size (default 500) |
| `max` | no | Total cap (default 10000) |

| Output | Description |
|---|---|
| `users` | Array of `{id, login, email, name}` |
| `count` | Number of members returned |
| `truncated` | `true` if capped by `max` |

### `template.render`
Renders a template (by id or name) or a raw body against a context, returning the result as a string.

| Input | Required | Description |
|---|---|---|
| `template_id` / `template_name` | template or body | Template selector |
| `body` | template or body | Raw template body |
| `context` | no | Render context object |
| `user_id` | no | User context |
| `channel` | no | Channel override |

| Output | Description |
|---|---|
| `body` | The rendered output string |

### `instance.cache.flush`
Flushes the instance cache.

| Input | Required | Description |
|---|---|---|
| `prefix` | prefix or all | Targeted prefix (supports trailing `*`, e.g. `user:*`) |
| `all` | prefix or all | `true` to flush the entire instance cache |

| Output | Description |
|---|---|
| `flushed` | The prefix flushed (or `"all"`) |

## Utility & Flow Control

### `log`
Logs a message (the sample action).

| Input | Required | Description |
|---|---|---|
| `message` | yes | Message to log |

| Output | Description |
|---|---|
| `message` | The logged message |

### `sleep`
Pauses the workflow. Accepts a Go duration string; capped at 90s.

| Input | Required | Description |
|---|---|---|
| `duration` | yes | e.g. `5s`, `1m30s`, `500ms` |

| Output | Description |
|---|---|
| `slept` | Actual duration slept |

### `set-output`
Records its `with:` inputs as this step's outputs, exposing values downstream.

| Input | Required | Description |
|---|---|---|
| *(any keys)* | — | Each key becomes an output of the same name |

| Output | Description |
|---|---|
| *(echoes inputs)* | Every input key is returned as an output |

### `vars.set`
Writes its `with:` inputs into the shared run `vars` context (readable later as `${{ vars.<key> }}`).

| Input | Required | Description |
|---|---|---|
| *(any keys)* | — | Each key is written to `vars` and returned as an output |

| Output | Description |
|---|---|
| *(echoes inputs)* | Every input key is returned as an output |

### `event.emit`
Emits an atomic event, enabling workflow chaining. Suppressed inside a silent run.

| Input | Required | Description |
|---|---|---|
| `name` | yes | Event name |
| `source` | no | Event source (default `workflow`) |
| `body` | no | Event body |
| `user_id` | no | Associated user |

| Output | Description |
|---|---|
| `emitted` | Whether the event was emitted |
| `event_id` | The emitted event ID |
| `suppressed` | `true` if suppressed in a silent run |

### `workflow.run`
Triggers another workflow by ID or slug. A workflow cannot invoke itself (circular runs are rejected).

| Input | Required | Description |
|---|---|---|
| `workflow` | yes | Target workflow ID or slug |
| `inputs` | no | Input map passed to the child run |
| `async` | no | Default `true`; synchronous mode waits for completion |

| Output | Description |
|---|---|
| `triggered` | Whether the child run started |
| `run_id` | Child workflow run ID |
| `workflow_id` | Child workflow ID |
| `reason` | Reason if not triggered (e.g. workflow disabled) |

### `workflow.exit`
Terminates the run cleanly — records a success and stops executing further steps.

| Input | Required | Description |
|---|---|---|
| `reason` | no | Reason recorded on the run (default `workflow exited`) |

Returns no outputs (the run ends).

---

# Expression Functions

## Strings

### trim

Remove leading and trailing whitespace.

```
trim(str) → string
```

```yaml
# Example
trim("  hello  ")  # → "hello"
```

### trimPrefix

Remove a prefix from a string. Returns the original string if the prefix is not present.

```
trimPrefix(str, prefix) → string
```

```yaml
# Example
trimPrefix("hello world", "hello ")  # → "world"
```

### trimSuffix

Remove a suffix from a string. Returns the original string if the suffix is not present.

```
trimSuffix(str, suffix) → string
```

```yaml
# Example
trimSuffix("hello.txt", ".txt")  # → "hello"
```

### upper

Convert a string to uppercase.

```
upper(str) → string
```

```yaml
# Example
upper("hello")  # → "HELLO"
```

### lower

Convert a string to lowercase.

```
lower(str) → string
```

```yaml
# Example
lower("HELLO")  # → "hello"
```

### title

Convert a string to title case.

```
title(str) → string
```

```yaml
# Example
title("hello world")  # → "Hello World"
```

### replace

Replace all occurrences of a substring.

```
replace(str, old, new) → string
```

```yaml
# Example
replace("hello world", "world", "there")  # → "hello there"
```

### contains

Check if a string contains a substring.

```
contains(str, substr) → bool
```

```yaml
# Example — use in an if condition
if: ${{ contains(user.profile.bio, "developer") }}
```

### hasPrefix

Check if a string starts with a prefix.

```
hasPrefix(str, prefix) → bool
```

```yaml
# Example — check if login is from a specific domain
if: ${{ hasPrefix(user.login, "admin@") }}
```

### hasSuffix

Check if a string ends with a suffix.

```
hasSuffix(str, suffix) → bool
```

```yaml
# Example — check email domain
if: ${{ hasSuffix(user.login, "@microsoft.com") }}
```

### containsAny

Check if a string contains any of the given substrings. Accepts individual string arguments or an array variable.

```
containsAny(str, values...) → bool
```

```yaml
# Example — match multiple substrings
if: ${{ containsAny(user.login, "@microsoft.com", "@cisco.com") }}

# Example — match against a variable list
if: ${{ containsAny(user.login, vars.ENTERPRISE_DOMAINS) }}
```

### hasPrefixAny

Check if a string starts with any of the given prefixes. Accepts individual string arguments or an array variable.

```
hasPrefixAny(str, values...) → bool
```

```yaml
# Example — match multiple prefixes
if: ${{ hasPrefixAny(url, "https://", "http://") }}
```

### hasSuffixAny

Check if a string ends with any of the given suffixes. Accepts individual string arguments or an array variable.

```
hasSuffixAny(str, values...) → bool
```

```yaml
# Example — match multiple domains
if: ${{ hasSuffixAny(user.login, "@microsoft.com", "@cisco.com") }}

# Example — match against a workflow variable
vars:
  ENTERPRISE_DOMAINS:
    - "@microsoft.com"
    - "@cisco.com"

steps:
  - id: check-enterprise
    if: ${{ hasSuffixAny(user.login, vars.ENTERPRISE_DOMAINS) }}
```

### split

Split a string into a list by a separator.

```
split(str, sep) → list
```

```yaml
# Example
with:
  tags: ${{ split(trigger.body.tags, ",") }}
```

### join

Join a list of strings with a separator.

```
join(list, sep) → string
```

```yaml
# Example
with:
  display: ${{ join(user.roles, ", ") }}
```

### repeat

Repeat a string N times.

```
repeat(str, count) → string
```

### indexOf

Find the position of a substring. Returns -1 if not found.

```
indexOf(str, substr) → int
```

### substr

Extract a portion of a string by start and end position.

```
substr(str, start, end) → string
```

```yaml
# Example
substr("hello world", 0, 5)  # → "hello"
```

### truncate

Truncate a string to a maximum length.

```
truncate(str, maxLen) → string
```

```yaml
# Example
with:
  preview: ${{ truncate(trigger.body.content, 100) }}
```

### camelCase / kebabCase / snakeCase

Convert a string to different naming conventions.

```
camelCase(str) → string
kebabCase(str) → string
snakeCase(str) → string
```

```yaml
# Examples
camelCase("hello world")  # → "helloWorld"
kebabCase("hello world")  # → "hello-world"
snakeCase("hello world")  # → "hello_world"
```

### regexMatch

Test if a string matches a regular expression pattern.

```
regexMatch(pattern, str) → bool
```

```yaml
# Example — validate phone number format
if: ${{ regexMatch("^\\+[0-9]{10,15}$", trigger.body.phone) }}
```

### regexFind

Find the first match of a regex pattern in a string.

```
regexFind(pattern, str) → string
```

```yaml
# Example — extract a number from text
with:
  amount: ${{ regexFind("[0-9]+\\.?[0-9]*", trigger.body.message) }}
```

### regexReplace

Replace all regex matches in a string.

```
regexReplace(pattern, str, replacement) → string
```

```yaml
# Example — strip non-alphanumeric characters
with:
  clean: ${{ regexReplace("[^a-zA-Z0-9]", trigger.body.input, "") }}
```

### emailDomain

Extract the domain part from an email address. Returns lowercase.

```
emailDomain(email) → string
```

```yaml
# Example — route by email provider
expression: ${{ emailDomain(user.login) }}
switch:
  - when: microsoft.com
    steps: [...]
  - when: gmail.com
    steps: [...]
```

### emailLocal

Extract the local part (before @) from an email address.

```
emailLocal(email) → string
```

```yaml
# Example
emailLocal("user@example.com")  # → "user"
```

### quote

Wrap a string in double quotes with proper escaping.

```
quote(str) → string
```

### plural

Return the singular or plural form based on a count.

```
plural(count, singular, plural) → string
```

```yaml
# Example
with:
  message: ${{ plural(len(items), "item", "items") }}
```

### indent

Add leading spaces to each line of a string.

```
indent(spaces, str) → string
```

---

## Math

### add / sub / mul / div

Basic arithmetic operations.

```
add(a, b) → number
sub(a, b) → number
mul(a, b) → number
div(a, b) → number
```

```yaml
# Example
with:
  total: ${{ add(trigger.body.subtotal, trigger.body.tax) }}
```

### mod

Return the remainder of integer division.

```
mod(a, b) → int
```

### max / min

Return the larger or smaller of two numbers.

```
max(a, b) → number
min(a, b) → number
```

### ceil / floor

Round up or down to the nearest integer.

```
ceil(num) → number
floor(num) → number
```

### round

Round to a given number of decimal places.

```
round(num, precision) → number
```

```yaml
# Example
with:
  price: ${{ round(div(trigger.body.amount, 100), 2) }}
```

### abs

Return the absolute value.

```
abs(num) → number
```

---

## Collections

### list

Create a list from arguments.

```
list(items...) → list
```

```yaml
# Example
with:
  recipients: ${{ list("admin@example.com", user.login) }}
```

### first / last

Return the first or last element of a list.

```
first(list) → any
last(list) → any
```

### uniq

Remove duplicate values from a list.

```
uniq(list) → list
```

### flatten

Flatten one level of nested lists.

```
flatten(list) → list
```

### sortAlpha

Sort a list of strings alphabetically.

```
sortAlpha(list) → list
```

### reverse

Reverse the order of a list.

```
reverse(list) → list
```

### slice

Extract a portion of a list by start and optional end index.

```
slice(list, start, end?) → list
```

### compact

Remove empty/nil values from a list.

```
compact(list) → list
```

### len

Return the length of a string, list, or map.

```
len(value) → int
```

```yaml
# Example — check if user has any roles
if: ${{ len(user.roles) > 0 }}
```

### keys / values

Return the keys or values of a map.

```
keys(map) → list
values(map) → list
```

### hasKey

Check if a map contains a specific key.

```
hasKey(map, key) → bool
```

```yaml
# Example
if: ${{ hasKey(trigger.body, "callback_url") }}
```

### dig

Safely traverse nested maps by key path. Returns nil if any key is missing.

```
dig(map, keys...) → any
```

```yaml
# Example — safely access deeply nested data
with:
  city: ${{ dig(trigger.body, "address", "city") }}
```

### merge

Merge multiple maps together. The first map's values take priority on conflict.

```
merge(dst, srcs...) → map
```

---

## Encoding

### base64Encode / base64Decode

Encode or decode base64 strings.

```
base64Encode(str) → string
base64Decode(str) → string
```

### toJSON / fromJSON

Convert between values and JSON strings.

```
toJSON(value) → string
fromJSON(str) → any
```

```yaml
# Example — pass structured data as JSON
with:
  payload: ${{ toJSON(trigger.body) }}
```

### urlEncode / urlDecode

URL-encode or decode strings.

```
urlEncode(str) → string
urlDecode(str) → string
```

---

## Type Conversion

### toString / toInt / toFloat / toBool

Convert values between types.

```
toString(value) → string
toInt(value) → int
toFloat(value) → number
toBool(value) → bool
```

```yaml
# Example
if: ${{ toInt(trigger.body.quantity) > 0 }}
```

---

## Logic

### default

Return the value if it's non-empty, otherwise return a default.

```
default(defaultVal, value) → any
```

```yaml
# Example
with:
  name: ${{ default("Guest", user.profile.name) }}
```

### empty

Check if a value is empty (nil, "", 0, false, empty list, or empty map).

```
empty(value) → bool
```

### coalesce

Return the first non-empty value from a list of arguments.

```
coalesce(values...) → any
```

```yaml
# Example — use first available name
with:
  display: ${{ coalesce(user.profile.display_name, user.profile.name, user.login) }}
```

### ternary

Conditional value selection — like an inline if/else.

```
ternary(condition, trueVal, falseVal) → any
```

```yaml
# Example
with:
  greeting: ${{ ternary(isSubscriber(), "Welcome back!", "Sign up today") }}
```

---

## Date/Time

### now

Return the current UTC time as an RFC3339 string.

```
now() → string
```

### date

Format an RFC3339 date string using a [Go time layout](https://pkg.go.dev/time#pkg-constants).

```
date(layout, value) → string
```

```yaml
# Example
with:
  today: ${{ date("January 2, 2006", now()) }}
```

### unixEpoch

Return the current Unix timestamp in seconds.

```
unixEpoch() → int
```

### duration

Parse a Go-style duration string (e.g. "1h30m", "500ms").

```
duration(str) → string
```

---

## URL

### urlParse

Parse a URL into its components.

```
urlParse(url) → map
```

Returns a map with keys: `scheme`, `host`, `path`, `query`, `fragment`.

```yaml
# Example
with:
  domain: ${{ dig(urlParse(trigger.body.callback_url), "host") }}
```

---

## Instance

These functions require runtime context and are only available during workflow execution (not in static validation).

### publicURL

Build a public URL for the current instance.

```
publicURL(paths...) → string
```

```yaml
# Example
with:
  verify_link: ${{ publicURL("/verify") }}
```

### tokenURL

Generate a signed access token URL for the current user. The URL includes an embedded JWT that grants temporary access.

```
tokenURL(url) → string
```

```yaml
# Example — one-click action link in emails
with:
  confirm_link: ${{ tokenURL(publicURL("/confirm-subscription")) }}
```

### isSubscriber

Check if the current user has an active paid subscription.

```
isSubscriber() → bool
```

```yaml
# Example
if: ${{ isSubscriber() }}
```

### hasAudience

Check if the current user belongs to a named audience.

```
hasAudience(name) → bool
```

```yaml
# Example — gate features by audience
if: ${{ hasAudience("beta-testers") }}
```

---

## Common Patterns

### Route by email domain (switch)

```yaml
- id: route-by-domain
  expression: ${{ emailDomain(user.login) }}
  switch:
    - when: microsoft.com
      steps:
        - id: ms-welcome
          action: sendmail
          with:
            template: welcome-microsoft
    - when: gmail.com
      steps:
        - id: gmail-welcome
          action: sendmail
          with:
            template: welcome-gmail
    - default: true
      steps:
        - id: generic-welcome
          action: sendmail
          with:
            template: welcome-generic
```

### Conditional step execution

```yaml
- id: notify-subscriber
  if: ${{ isSubscriber() }}
  action: sendmail
  with:
    template: subscriber-update
    to: ${{ steps.load-user.outputs.user.profile.email }}
```

### Safe nested data access

```yaml
- id: process-webhook
  action: http.post
  with:
    url: ${{ default("https://fallback.example.com", dig(trigger.body, "config", "callback_url")) }}
    body: ${{ toJSON(trigger.body) }}
```
