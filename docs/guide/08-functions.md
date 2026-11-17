# 8. Functions

Functions are used inside expressions: `"${{ sha256(text) }}"`.

**A pure conversion is a function. Anything that reads or writes outside the
run is an action.** Encoding, hashing, formatting and reshaping data never
need a step.

This is the complete list. A function that is not here does not exist; do
not guess one. The **Since** column says which server first has it: a
function marked 2.3.0 needs `requires: { passport: "^2.3.0" }`, which every
v2 plugin already has. In a signature, `?` marks an argument that may be
left out and `…` one that may be repeated.

The tables are generated from the engine: `passport-plugin reference`
writes them, for the server version the tool was built from, and
`passport-plugin reference --functions` prints the same list as JSON. Do not
edit a table by hand; what the engine's descriptions leave out is in the
notes under each table.

## 8.1 Text

<!-- reference:begin functions:text -->
| Function | Returns | Description | Since |
|---|---|---|---|
| `trim(s)` | text | s without leading and trailing white space. | 2.0.0 |
| `trimPrefix(s, prefix)` | text | s without that prefix, or s as it is when it does not start with it. | 2.0.0 |
| `trimSuffix(s, suffix)` | text | s without that suffix, or s as it is when it does not end with it. | 2.0.0 |
| `upper(s)` | text | s in upper case. | 2.0.0 |
| `lower(s)` | text | s in lower case. | 2.0.0 |
| `title(s)` | text | s in all upper case, as upper gives. Kept for format 1; for a title use titleCase. | 2.0.0 |
| `titleCase(s)` | text | The first letter of each word in upper case, the rest left as written. A word starts at the beginning, after white space, and after an opening bracket, a quotation mark, a dash or a slash. | 2.3.0 |
| `camelCase(s)` | text | s with each word run together and its first letter in upper case, the first word's too: hello world, hello_world and helloWorld all give HelloWorld. | 2.0.0 |
| `kebabCase(s)` | text | s in lower case with a hyphen between words: hello world and helloWorld give hello-world. | 2.0.0 |
| `snakeCase(s)` | text | s in lower case with an underscore between words: hello world and helloWorld give hello_world. | 2.0.0 |
| `slugify(s)` | text | s in lower case with accents removed and every run of anything that is not a letter or digit as one hyphen, trimmed. Text in a script with no Latin form gives empty text. | 2.3.0 |
| `replace(s, old, new)` | text | s with every old replaced by new. | 2.0.0 |
| `replaceEach(text, rules, opts?)` | text | text with a list of replacements applied in order. Each rule is a map; opts names its keys and behaviour: find and replace (the key names, find and replace by default), literal (no regular expression), word (whole words only) and ignoreCase. | 2.1.4 |
| `contains(s, sub)` | boolean | Whether s holds sub. | 2.0.0 |
| `hasPrefix(s, prefix)` | boolean | Whether s starts with prefix. | 2.0.0 |
| `hasSuffix(s, suffix)` | boolean | Whether s ends with suffix. | 2.0.0 |
| `containsAny(s, subs…)` | boolean | Whether s holds any of them. They are given one by one, as lists, or both. | 2.0.0 |
| `hasPrefixAny(s, prefixes…)` | boolean | Whether s starts with any of them. They are given one by one, as lists, or both. | 2.0.0 |
| `hasSuffixAny(s, suffixes…)` | boolean | Whether s ends with any of them. They are given one by one, as lists, or both. | 2.0.0 |
| `split(s, sep)` | list | The pieces of s between each sep. | 2.0.0 |
| `join(list, sep)` | text | The items of list as one text with sep between them. An item that is not text is written as text; nil gives empty text. | 2.0.0 |
| `repeat(s, n)` | text | s n times. | 2.0.0 |
| `indexOf(s, sub)` | integer | The byte position of the first sub in s, or -1. | 2.0.0 |
| `substr(s, start, end)` | text | The bytes of s from start up to, not including, end. | 2.0.0 |
| `truncate(s, n)` | text | At most the first n bytes of s. | 2.0.0 |
| `padLeft(s, n, pad?)` | text | s padded on the left to n characters with pad, a space when left out. | 2.3.0 |
| `padRight(s, n, pad?)` | text | s padded on the right to n characters with pad, a space when left out. | 2.3.0 |
| `indent(n, s)` | text | s with each line indented by n spaces. The count comes first. | 2.0.0 |
| `quote(s)` | text | s in double quotes, escaped. | 2.0.0 |
| `plural(n, singular, plural)` | text | singular when n is 1, plural otherwise. | 2.0.0 |
| `len(v)` | integer | The bytes of a text, or the items of a list or map. Not characters. | 2.0.0 |
| `emailLocal(email)` | text | The part of an email address before the @. | 2.0.0 |
| `emailDomain(email)` | text | The part of an email address after the @. | 2.0.0 |
| `isEmail(s)` | boolean | Whether s is written as an email address. | 2.0.0 |
<!-- reference:end functions:text -->

- `title` gives all upper case (`title("hello world")` is `HELLO WORLD`). It is
  kept for v1; for a title use `titleCase`.
- `titleCase`: `o'neil mcDonald` gives `O'neil McDonald`. An apostrophe inside
  a word does not start a new one, and letters after the first are left as
  written.
- `camelCase` puts the first word's first letter in upper case too:
  `camelCase("hello world")` is `HelloWorld`.
- `slugify`: `ß æ œ ø þ ł` and the like become `ss ae oe o th l`, and
  `"Été 2026!"` gives `ete-2026`.
- `len`, `substr`, `truncate` and `indexOf` count **bytes**, not characters:
  `len("été")` is 5. `padLeft`, `padRight` and `chunkText` count characters.
- `indent` takes the count first: `indent(2, text)`.
- `replaceEach`: without `literal`, `find` is an RE2 pattern and `${1}` in
  `replace` is its first group; with it, `find` is matched as plain text and
  `replace` inserted as it is. `word` puts a word boundary where `find`
  starts or ends with a letter, digit or `_`. Each rule is applied to the
  result of the ones before it; a rule with an empty `find` is skipped, and a
  pattern that is not valid fails the step.

  ```yaml
  text: >-
    ${{ replaceEach(steps.speech.outputs.text, settings.pronunciations ?? [],
    {"find": "term", "replace": "say_as", "literal": true, "word": true}) }}
  ```

## 8.2 Regular expressions

RE2 syntax. No look-behind.

<!-- reference:begin functions:regular-expressions -->
| Function | Returns | Description | Since |
|---|---|---|---|
| `regexMatch(pattern, s)` | boolean | Whether s matches the pattern (RE2 syntax). The pattern comes first. | 2.0.0 |
| `regexFind(pattern, s)` | text | The first match of the pattern in s, or empty text. | 2.0.0 |
| `regexReplace(pattern, s, replacement)` | text | s with every match replaced; $1 is the first group and $$ a literal $. | 2.0.0 |
| `regexQuote(s)` | text | s escaped so that it can be used inside a pattern. | 2.1.4 |
<!-- reference:end functions:regular-expressions -->

Note the order: the pattern comes first.

## 8.3 HTML and long text

<!-- reference:begin functions:html-and-long-text -->
| Function | Returns | Description | Since |
|---|---|---|---|
| `htmlText(html, selectors…)` | text | The readable text of HTML, one paragraph per block, separated by blank lines. Scripts, styles and anything marked data-text="skip" are dropped, as are elements that match the CSS selectors given. | 2.1.4 |
| `chunkText(text, max)` | list | text as a list of pieces, each at most max characters, split between paragraphs, then sentences, then words. | 2.1.4 |
<!-- reference:end functions:html-and-long-text -->

- `htmlText` ends headings and list items with a full stop and reduces a link
  to its text. What it always drops is markup that is not content: `head`,
  `script`, `style`, `noscript`, `template`, `svg`, `canvas`, form controls,
  `iframe`, `object` and `embed`. The selectors may be given as one
  comma-separated string: `htmlText(body, "img, figure, table, pre, .no-audio")`.
- `chunkText` packs paragraphs that fit together into one piece, joined by a
  blank line, so there are as few pieces as the breaks allow; a single word
  longer than `max` is cut. Each piece is trimmed, and empty text gives an
  empty list. `max` counts characters, not bytes as `len` does: leave some
  headroom under a vendor's limit if it may count differently.

## 8.4 Encoding

Binary never travels as raw text ([chapter 9](09-files-and-binary.md)). These
are how it is carried.

<!-- reference:begin functions:encoding -->
| Function | Returns | Description | Since |
|---|---|---|---|
| `base64Encode(s)` | text | s in standard base64. | 2.0.0 |
| `base64Decode(s)` | text | The text that standard base64 holds. | 2.0.0 |
| `base64UrlEncode(s)` | text | s in URL-safe base64 with no padding, as a JWT segment is written. | 2.3.0 |
| `base64UrlDecode(s)` | text | The text that URL-safe base64 holds, with or without padding. | 2.3.0 |
| `hexEncode(s)` | text | s in lower-case hex. | 2.3.0 |
| `hexDecode(s)` | text | The text that hex holds. | 2.3.0 |
| `urlEncode(s)` | text | s escaped for a query string. | 2.0.0 |
| `urlDecode(s)` | text | s with query-string escaping undone. | 2.0.0 |
| `formEncode(map)` | text | A map as a=1&b=two with keys sorted and values escaped: an application/x-www-form-urlencoded body or a query string. A list value repeats its key; a nil value is written key=. | 2.3.0 |
| `toJSON(v)` | text | v as JSON text. | 2.0.0 |
| `fromJSON(s)` | any | The value the JSON text describes. | 2.0.0 |
| `urlParse(url)` | map | The parts of an address: { scheme, host, path, query, fragment }. | 2.0.0 |
<!-- reference:end functions:encoding -->

## 8.5 Hashing and signing

Each returns lower-case hex unless an encoding is given.

<!-- reference:begin functions:hashing-and-signing -->
| Function | Returns | Description | Since |
|---|---|---|---|
| `sha256(s)` | text | The SHA-256 digest of s, as lower-case hex. | 2.1.4 |
| `sha1(s)` | text | The SHA-1 digest of s, as lower-case hex. For vendors that require it, not for security. | 2.3.0 |
| `sha512(s)` | text | The SHA-512 digest of s, as lower-case hex. | 2.3.0 |
| `md5(s)` | text | The MD5 digest of s, as lower-case hex. For vendors that require it, not for security. | 2.3.0 |
| `crc32(s)` | integer | The CRC-32 (IEEE) checksum of s as an integer. | 2.3.0 |
| `hmac(algorithm, key, data, encoding?)` | text | The HMAC of data with sha1, sha256 or sha512, as hex, or as the encoding given: hex, base64 or base64url (no padding). | 2.3.0 |
<!-- reference:end functions:hashing-and-signing -->

`crc32("123456789")` is `3421780262`. `hmac` takes the encoding as an
optional fourth argument:

```yaml
headers:
  X-Signature: "${{ hmac('sha256', secrets.signing_key, toJSON(inputs.payload), 'base64') }}"
```

## 8.6 Compression

<!-- reference:begin functions:compression -->
| Function | Returns | Description | Since |
|---|---|---|---|
| `gzip(text)` | text | text gzipped, as base64. At most 1 MiB of text. | 2.3.0 |
| `gunzip(base64)` | text | The text inside gzipped base64. At most 1 MiB of text comes out. | 2.3.0 |
<!-- reference:end functions:compression -->

Both are limited to 1 MiB (1,048,576 bytes) of uncompressed text and fail
beyond it; `gunzip` stops reading at the limit, so a small value cannot
unpack into a huge one. Larger data goes through an asset.

## 8.7 Numbers

<!-- reference:begin functions:numbers -->
| Function | Returns | Description | Since |
|---|---|---|---|
| `add(a, b)` | number | a + b. | 2.0.0 |
| `sub(a, b)` | number | a - b. | 2.0.0 |
| `mul(a, b)` | number | a * b. | 2.0.0 |
| `div(a, b)` | number | a / b. | 2.0.0 |
| `mod(a, b)` | integer | The remainder of a / b, both integers. | 2.0.0 |
| `max(a, b)` | number | The larger of the two. | 2.0.0 |
| `min(a, b)` | number | The smaller of the two. | 2.0.0 |
| `ceil(n)` | number | n rounded up to a whole number. | 2.0.0 |
| `floor(n)` | number | n rounded down to a whole number. | 2.0.0 |
| `abs(n)` | number | n without its sign. | 2.0.0 |
| `round(n, places)` | number | n rounded to that many decimal places. | 2.0.0 |
| `formatNumber(n, places)` | text | n as text with comma thousands separators and that many decimals: 1,234.50. A value that rounds to zero has no minus sign. | 2.3.0 |
<!-- reference:end functions:numbers -->

The operators `+ - * /` do what `add`, `sub`, `mul` and `div` do.

## 8.8 Lists and maps

<!-- reference:begin functions:lists-and-maps -->
| Function | Returns | Description | Since |
|---|---|---|---|
| `list(items…)` | list | A list of the arguments. | 2.0.0 |
| `first(list)` | any | The first item, or nil for an empty list. | 2.0.0 |
| `last(list)` | any | The last item, or nil for an empty list. | 2.0.0 |
| `slice(list, start, end?)` | list | The items from start up to, not including, end; to the end of the list when end is left out. | 2.0.0 |
| `uniq(list)` | list | The list with each value once, in the order first seen. | 2.0.0 |
| `compact(list)` | list | The list without its empty values. | 2.0.0 |
| `flatten(list)` | list | A list of lists as one list. | 2.0.0 |
| `reverse(list)` | list | The list in the opposite order. | 2.0.0 |
| `sortAlpha(list)` | list | The list as text, sorted alphabetically. | 2.0.0 |
| `keys(map)` | list | The keys of a map. | 2.0.0 |
| `values(map)` | list | The values of a map. | 2.0.0 |
| `hasKey(map, key)` | boolean | Whether the map has that key. | 2.0.0 |
| `dig(map, keys…)` | any | The value at that path of keys, or nil. | 2.0.0 |
| `merge(a, others…)` | map | One map of them all. The first argument wins where keys repeat. | 2.0.0 |
| `pick(map, keys…)` | map | The map with only those keys. The keys may also be given as one list. | 2.3.0 |
| `omit(map, keys…)` | map | The map without those keys. The keys may also be given as one list. | 2.3.0 |
<!-- reference:end functions:lists-and-maps -->

The expression language's own functions that Passport does not replace are
there as well. Those that walk a list (`map`, `filter`, `find`, `all`, `any`,
`none`, `one`, `count`, `sortBy`, `groupBy`, `reduce`, …) take `#` as the
element:

<!-- reference:begin language-functions -->
`all`, `any`, `bitand`, `bitnand`, `bitnot`, `bitor`, `bitshl`, `bitshr`, `bitushr`, `bitxor`, `concat`, `count`, `filter`, `find`, `findIndex`, `findLast`, `findLastIndex`, `float`, `fromBase64`, `fromPairs`, `get`, `groupBy`, `int`, `lastIndexOf`, `map`, `mean`, `median`, `none`, `one`, `reduce`, `sort`, `sortBy`, `splitAfter`, `string`, `sum`, `take`, `timezone`, `toBase64`, `toPairs`, `type`
<!-- reference:end language-functions -->

## 8.9 Types and fallbacks

<!-- reference:begin functions:types-and-fallbacks -->
| Function | Returns | Description | Since |
|---|---|---|---|
| `toString(v)` | text | v as text. | 2.0.0 |
| `toInt(v)` | integer | v as an integer; 0 when it is not one. | 2.0.0 |
| `toFloat(v)` | number | v as a number; 0 when it is not one. | 2.0.0 |
| `toBool(v)` | boolean | v as a boolean; false when it is not one. | 2.0.0 |
| `empty(v)` | boolean | True for nil, empty text, 0, false, and an empty list or map. | 2.0.0 |
| `default(fallback, v)` | any | v, or fallback when v is empty. The fallback comes first. | 2.0.0 |
| `coalesce(values…)` | any | The first that is not empty, or nil when all are. An empty list or map counts as empty. | 2.0.0 |
| `ternary(cond, ifTrue, ifFalse)` | any | ifTrue when cond holds, ifFalse otherwise. The language's cond ? a : b does the same. | 2.0.0 |
<!-- reference:end functions:types-and-fallbacks -->

- `default` takes the **fallback first**: `default("Guest", user.profile.name)`.
- `coalesce` counts an empty list or map as empty, so `coalesce(x, list())`
  is nil when `x` is missing: for "a list, or an empty one" write `x ?? []`.
- Prefer `cond ? a : b` to `ternary`.

## 8.10 Dates and time

Times are RFC 3339 text (`2026-11-14T15:04:05Z`). Layouts are Go layouts:
the reference time `2006-01-02 15:04:05` written the way you want it.

<!-- reference:begin functions:dates-and-time -->
| Function | Returns | Description | Since |
|---|---|---|---|
| `now()` | text | The current time, as RFC 3339 text in UTC. | 2.0.0 |
| `unixEpoch()` | integer | The current time as seconds since 1970. | 2.0.0 |
| `date(layout, value)` | text | value (a time, RFC 3339 text or Unix seconds) written in a Go layout. A missing value gives empty text. | 2.0.0 |
| `dateParse(layout, text)` | text | The RFC 3339 time (UTC) that text written in layout means. Empty text gives empty text; text that does not fit the layout is an error. | 2.3.0 |
| `dateAdd(value, duration)` | text | value moved by a duration such as 24h or -90m, as RFC 3339 text. An empty value gives empty text. | 2.3.0 |
| `dateDiff(a, b)` | integer | Whole seconds from a to b, negative when b is earlier. An error when either is not a time. | 2.3.0 |
| `duration(s)` | text | A duration in its normal form: 90m to 1h30m0s. | 2.0.0 |
| `fromNow(value)` | text | How far value is from now, in words: in 3 days, 2 hours ago. A missing value gives empty text. | 2.0.0 |
<!-- reference:end functions:dates-and-time -->

## 8.11 Identifiers

<!-- reference:begin functions:identifiers -->
| Function | Returns | Description | Since |
|---|---|---|---|
| `uuid()` | text | A new random UUID. On a dry run: 00000000-0000-4000-8000-000000000000. | 2.3.0 |
| `randomString(n)` | text | n random letters and digits, n up to 1,024. On a dry run: the letter a, n times. | 2.3.0 |
<!-- reference:end functions:identifiers -->

Both give a different value each time. On a dry run they are fixed
(`00000000-0000-4000-8000-000000000000`, `aaaa…`) so runs can be compared.

## 8.12 The site and its members

These work on the run's current member, `user` ([7.6](07-steps-and-expressions.md#76-what-a-run-can-read)):
load one with `user.get` first.

<!-- reference:begin functions:the-site-and-its-members -->
| Function | Returns | Description | Since |
|---|---|---|---|
| `publicURL(paths…)` | text | An address on the publisher's site, with the paths joined onto it. Needs a run: it is not there where a form is worked out. | 2.0.0 |
| `tokenURL(url)` | text | That address with a signed token that lets the run's current member in without signing in. Needs a run: it is not there where a form is worked out. | 2.0.0 |
| `isSubscriber()` | boolean | Whether the run's current member has an active paid subscription. Needs a run: it is not there where a form is worked out. | 2.0.0 |
| `hasAudience(name)` | boolean | Whether the run's current member is in the audience with that name. Needs a run: it is not there where a form is worked out. | 2.0.0 |
<!-- reference:end functions:the-site-and-its-members -->

`publicURL("/verify")` is an address on the publisher's site;
`tokenURL(publicURL("/confirm"))` is that address with a token that lets the
current member in.

## 8.13 Inside templates

Text rendered by `distribution.render` or `template.render` is a Passport
template, not an expression. It has its own functions (`timeFormat`,
`hasAnyAudience`, `audiences`, `isChannel`, …), documented with templates.
The functions on this page are not available there.
