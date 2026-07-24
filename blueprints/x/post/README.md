# X Post (Distribution)

Defines a custom **`x` distribution channel** that publishes a post to X
(formerly Twitter). Once installed and enabled, "X" appears in an article's
**Add Distribution** menu.

Built on the [`x/post`](../../../recipes/x/post/) recipe.

## What it does

Publishing a distribution to the `x` channel runs this workflow once
(broadcast):

| Step | Action | Purpose |
|---|---|---|
| `load` | `distribution.get` | Load the distribution's body |
| `post` | recipe `x/post` | `POST /2/tweets` |

The distribution's **body** becomes the post text.

## The channel

```yaml
on:
  - distribution:
      channel: x
      label: X
      mode: broadcast
      content_type: text
      max_body_length: 280
```

`content_type: text` rejects HTML markup, and `max_body_length: 280` enforces
the standard character cap **in the distribution editor and the API**, so an
over-long post fails before it reaches X. If your account has X Premium
(25,000 characters), raise or remove `max_body_length` on the trigger.

This is a **broadcast** channel: it publishes once and needs no audience.

## Requirements

**Secret**

| Name | Value |
|---|---|
| `X_ACCESS_TOKEN` | OAuth 2.0 **user-context** access token with the `tweet.write` scope |

**Inputs** — none.

**Allowed HTTP hosts**

```
api.x.com
```

## Tokens

X requires a **user-context** OAuth 2.0 token with `tweet.write`. App-only
bearer tokens **cannot** create posts — that's the most common cause of a 403
here. Tokens are obtained through the X developer portal's OAuth 2.0 flow for
the account that should author the posts.

## Setup

1. In the X developer portal, create an app with **Read and write** permissions.
2. Complete the OAuth 2.0 user-context flow and store the access token as
   `X_ACCESS_TOKEN`.
3. Add `api.x.com` to the allowlist.
4. Install the blueprint, save, and **enable**.
5. On an article: **Add distribution → X**. The editor enforces the 280-character
   limit as you edit; publish when it fits.

## Customizing

- **Longer posts** — edit the trigger's `max_body_length` (or remove it) if your
  account supports it.
- **Threads / media** — not covered by this recipe; add `http.post` steps against
  the v2 API, or extend the recipe.
