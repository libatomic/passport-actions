# 8. Functions

Functions are used inside expressions: `"${{ sha256(text) }}"`.

**A pure conversion is a function. Anything that reads or writes outside the
run is an action.** Encoding, hashing, formatting and reshaping data never
need a step.

This is the complete list. A function that is not here does not exist; do
not guess one. The **Since** column says which server first has it: a
function marked 2.3.0 needs `requires: { passport: "^2.3.0" }`, which every
v2 plugin already has.

`passport-plugin reference --functions` prints this list for the server
version the tool was built from.

## 8.1 Text

| Function | Returns | Since |
|---|---|---|
| `trim(s)` | `s` without leading and trailing white space | |
| `trimPrefix(s, prefix)`, `trimSuffix(s, suffix)` | `s` without that prefix / suffix | |
| `upper(s)`, `lower(s)` | Upper / lower case | |
| `title(s)` | **All upper case.** Kept for v1; use `titleCase` | |
| `titleCase(s)` | First letter of each word upper case, the rest left as written. A word starts at the beginning, after white space, or after a hyphen, slash, opening bracket or opening quote: `o'neil mcDonald` to `O'neil McDonald` | 2.3.0 |
| `camelCase(s)`, `kebabCase(s)`, `snakeCase(s)` | Re-cased | |
| `slugify(s)` | Lower case, accents removed (`ß æ œ ø þ ł` and the like become `ss ae oe o th l`), every run of anything else to a single hyphen, trimmed: `"Été 2026!"` to `ete-2026`. Text in a script with no Latin form gives an empty string | 2.3.0 |
| `replace(s, old, new)` | Every `old` replaced | |
| `replaceEach(text, rules, opts)` | Applies a list of replacements in order. Each rule is a map; `opts` names its keys and behaviour: `find`, `replace` (key names, default `find` / `replace`), `literal` (no regex), `word` (whole words only), `ignoreCase` | 2.1.4 |
| `contains(s, sub)`, `hasPrefix(s, p)`, `hasSuffix(s, p)` | Boolean | |
| `containsAny(s, list)`, `hasPrefixAny(s, list)`, `hasSuffixAny(s, list)` | True if any matches | |
| `split(s, sep)` | A list | |
| `join(list, sep)` | Text | |
| `repeat(s, n)` | `s` n times | |
| `indexOf(s, sub)` | Position, or -1 | |
| `substr(s, start, end)` | Bytes from `start` up to `end` | |
| `truncate(s, n)` | At most `n` bytes | |
| `padLeft(s, n, pad)`, `padRight(s, n, pad)` | `s` padded to `n` characters with `pad` (a space when omitted) | 2.3.0 |
| `indent(n, s)` | Each line indented by `n` spaces | |
| `quote(s)` | In double quotes, escaped | |
| `plural(n, singular, plural)` | The right word for `n` | |
| `len(v)` | Bytes of text, or elements of a list or map. **Not characters** | |
| `emailLocal(s)`, `emailDomain(s)` | The part before / after `@` | |
| `isEmail(s)` | Boolean | |

## 8.2 Regular expressions

RE2 syntax. No look-behind.

| Function | Returns | Since |
|---|---|---|
| `regexMatch(pattern, s)` | Boolean | |
| `regexFind(pattern, s)` | The first match, or empty | |
| `regexReplace(pattern, s, replacement)` | Every match replaced; `$1` is the first group, `$$` a literal `$` | |
| `regexQuote(s)` | `s` escaped to be used inside a pattern | 2.1.4 |

Note the order: the pattern comes first.

## 8.3 HTML and long text

| Function | Returns | Since |
|---|---|---|
| `htmlText(html, selectors…)` | Readable text, one paragraph per block, separated by blank lines. Always drops scripts, styles and anything marked `data-text="skip"`; also drops elements matching the CSS selectors given | 2.1.4 |
| `chunkText(text, max)` | A list of pieces, each at most `max` characters, split between paragraphs, then sentences, then words | 2.1.4 |

## 8.4 Encoding

Binary never travels as raw text ([chapter 9](09-files-and-binary.md)). These
are how it is carried.

| Function | Returns | Since |
|---|---|---|
| `base64Encode(s)`, `base64Decode(s)` | Standard base64 | |
| `base64UrlEncode(s)`, `base64UrlDecode(s)` | URL-safe base64, no padding (JWT segments, signed URLs) | 2.3.0 |
| `hexEncode(s)`, `hexDecode(s)` | Lower-case hex | 2.3.0 |
| `urlEncode(s)`, `urlDecode(s)` | Query-string escaping | |
| `formEncode(map)` | `a=1&b=two`, keys sorted, values escaped: an `application/x-www-form-urlencoded` body or a query string. A list value repeats its key; a nil value is written `key=` | 2.3.0 |
| `toJSON(v)` | JSON text | |
| `fromJSON(s)` | The value the JSON text describes | |
| `urlParse(s)` | `{ scheme, host, path, query, fragment }` | |

## 8.5 Hashing and signing

Each returns lower-case hex unless an encoding is given.

| Function | Returns | Since |
|---|---|---|
| `sha256(s)` | SHA-256 digest | 2.1.4 |
| `sha1(s)`, `sha512(s)`, `md5(s)` | That digest. `md5` and `sha1` are for vendors that require them, not for security | 2.3.0 |
| `crc32(s)` | CRC-32 (IEEE) as an integer: `crc32("123456789")` is `3421780262` | 2.3.0 |
| `hmac(algorithm, key, data)` | HMAC with `sha1`, `sha256` or `sha512`, as hex | 2.3.0 |
| `hmac(algorithm, key, data, encoding)` | The same, as `hex`, `base64` or `base64url` (no padding) | 2.3.0 |

```yaml
headers:
  X-Signature: "${{ hmac('sha256', secrets.signing_key, toJSON(inputs.payload), 'base64') }}"
```

## 8.6 Compression

| Function | Returns | Since |
|---|---|---|
| `gzip(text)` | The gzipped text, as base64 | 2.3.0 |
| `gunzip(base64)` | The text inside | 2.3.0 |

Both are limited to 1 MiB (1,048,576 bytes) of uncompressed text and fail
beyond it; `gunzip` stops reading at the limit, so a small value cannot
unpack into a huge one. Larger data goes through an asset.

## 8.7 Numbers

| Function | Returns | Since |
|---|---|---|
| `add(a, b)`, `sub(a, b)`, `mul(a, b)`, `div(a, b)` | Arithmetic (the operators `+ - * /` work too) | |
| `mod(a, b)` | Remainder, integers | |
| `max(a, b)`, `min(a, b)` | | |
| `ceil(n)`, `floor(n)`, `abs(n)` | | |
| `round(n, places)` | Rounded to that many decimal places | |
| `formatNumber(n, places)` | Text with comma thousands separators and that many decimals: `1,234.50`. A value that rounds to zero has no minus sign | 2.3.0 |

## 8.8 Lists and maps

| Function | Returns | Since |
|---|---|---|
| `list(a, b, …)` | A list of the arguments | |
| `first(list)`, `last(list)` | | |
| `slice(list, start)`, `slice(list, start, end)` | Part of a list | |
| `uniq(list)`, `compact(list)` (empty values removed), `flatten(list)`, `reverse(list)`, `sortAlpha(list)` | | |
| `keys(map)`, `values(map)` | | |
| `hasKey(map, key)` | Boolean | |
| `dig(map, key, key, …)` | The value at that path, or nil | |
| `merge(a, b, …)` | One map. **The first argument wins** where keys repeat | |
| `pick(map, keys…)` | Only those keys. The keys may also be given as one list | 2.3.0 |
| `omit(map, keys…)` | Without those keys. The keys may also be given as one list | 2.3.0 |

From the expression language itself, with `#` as the element: `map`,
`filter`, `find`, `findIndex`, `all`, `any`, `none`, `one`, `count`, `sum`,
`mean`, `median`, `sortBy`, `groupBy`, `reduce`, `concat`, `take`, `toPairs`,
`fromPairs`.

## 8.9 Types and fallbacks

| Function | Returns |
|---|---|
| `toString(v)`, `toInt(v)`, `toFloat(v)`, `toBool(v)` | The value as that type |
| `empty(v)` | True for nil, `""`, `0`, `false`, an empty list or map |
| `default(fallback, v)` | `v`, or `fallback` when `v` is empty. **Fallback first** |
| `coalesce(a, b, …)` | The first that is not empty, or nil when all are. An empty list or map counts as empty, so `coalesce(x, list())` is nil when `x` is missing: for "a list, or an empty one" write `x ?? []` |
| `ternary(cond, ifTrue, ifFalse)` | Prefer `cond ? a : b` |

## 8.10 Dates and time

Times are RFC 3339 text (`2026-11-14T15:04:05Z`). Layouts are Go layouts:
the reference time `2006-01-02 15:04:05` written the way you want it.

| Function | Returns | Since |
|---|---|---|
| `now()` | The current time | |
| `unixEpoch()` | Seconds since 1970 | |
| `date(layout, value)` | `value` (a time, RFC 3339 text or Unix seconds) written in `layout` | |
| `dateParse(layout, text)` | The RFC 3339 time (UTC) that `text` in `layout` means. Empty text gives empty text; text that does not fit the layout is an error | 2.3.0 |
| `dateAdd(value, duration)` | `value` moved by `duration` (`"24h"`, `"-90m"`). An empty value gives empty text | 2.3.0 |
| `dateDiff(a, b)` | Whole seconds from `a` to `b` as an integer, negative when `b` is earlier. An error when either is not a time, so a missing value is never read as "no time apart" | 2.3.0 |
| `duration(s)` | A duration in a normal form: `"90m"` to `1h30m0s` | |
| `fromNow(value)` | Words: `in 3 days`, `2 hours ago` | |

## 8.11 Identifiers

| Function | Returns | Since |
|---|---|---|
| `uuid()` | A new random UUID | 2.3.0 |
| `randomString(n)` | `n` random letters and digits, `n` up to 1,024 | 2.3.0 |

Both give a different value each time. On a dry run they are fixed
(`00000000-0000-4000-8000-000000000000`, `aaaa…`) so runs can be compared.

## 8.12 The site and its members

These work on the run's current member, `user` ([7.6](07-steps-and-expressions.md#76-what-a-run-can-read)):
load one with `user.get` first.

| Function | Returns |
|---|---|
| `publicURL(path…)` | An address on the publisher's site: `publicURL("/verify")` |
| `tokenURL(url)` | That address with a signed token that lets the current member in without signing in: `tokenURL(publicURL("/confirm"))` |
| `isSubscriber()` | Whether the current member has an active paid subscription |
| `hasAudience(name)` | Whether the current member is in the audience with that name |

## 8.13 Inside templates

Text rendered by `distribution.render` or `template.render` is a Passport
template, not an expression. It has its own functions (`timeFormat`,
`hasAnyAudience`, `audiences`, `isChannel`, …), documented with templates.
The functions on this page are not available there.
