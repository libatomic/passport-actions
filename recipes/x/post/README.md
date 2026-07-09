# X (Twitter) — Post

Creates a post on X via the v2 API (`POST /2/tweets`).

## Reference

```
libatomic/passport-actions/recipes/x/post
```

## Inputs

| Input | Required | Default | Description |
|---|---|---|---|
| `text` | yes | — | Plain-text (UTF-8) post body |
| `access_token` | yes | — | OAuth 2.0 user-context token with `tweet.write` |

## Content constraints

X posts are **UTF-8 plain text**. Standard accounts are limited to **280
characters**; X Premium subscribers can post up to **25,000**. Links count as
23 characters regardless of length (t.co wrapping).

## Auth

Creating posts requires a **user-context** OAuth 2.0 token carrying the
`tweet.write` scope (obtained via the authorization-code + PKCE flow) — an
app-only bearer token is read-only and will be rejected with 403.

## Outputs

The step outputs are available at `steps.<id>.outputs.post.outputs.*` and
contain the API response (`data.id` and `data.text` on success).

## Usage

```yaml
steps:
  - id: post
    includes: libatomic/passport-actions/recipes/x/post
    with:
      text: ${{ steps.load.outputs.distribution.body }}
      access_token: ${{ secrets.X_ACCESS_TOKEN }}
```

## API details

- **Endpoint**: `POST https://api.x.com/2/tweets`
- **Auth**: Bearer (OAuth 2.0 user context, `tweet.write` scope)
- **Expected status**: 201
- `api.x.com` must be on the instance's http allowlist.
