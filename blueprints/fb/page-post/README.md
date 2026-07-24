# Facebook Page Post (Distribution)

Defines a custom **`facebook` distribution channel** that posts to a Facebook
Page feed. Once installed and enabled, "Facebook" appears in an article's **Add
Distribution** menu.

Built on the [`fb/page-post`](../../../recipes/fb/page-post/) recipe.

## What it does

Publishing a distribution to the `facebook` channel runs this workflow once
(broadcast):

| Step | Action | Purpose |
|---|---|---|
| `load` | `distribution.get` | Load the distribution's body |
| `post` | recipe `fb/page-post` | Post to the Page feed |

The distribution's **body** becomes the post message.

## The channel

```yaml
on:
  - distribution:
      channel: facebook
      label: Facebook
      mode: broadcast
      content_type: text
```

Facebook Page posts are UTF-8 plain text, so the channel declares
`content_type: text` — the distribution editor (and the API) reject HTML markup.
There is no length cap. This is a **broadcast** channel: it publishes once and
needs no audience.

## Requirements

**Secret**

| Name | Value |
|---|---|
| `FACEBOOK_PAGE_TOKEN` | A Facebook access token for the Page (see below) |

**Inputs**

| Input | Required | Description |
|---|---|---|
| `page_id` | yes | The Facebook Page id to post to |

**Allowed HTTP hosts**

```
graph.facebook.com
```

## Tokens — the common gotcha

Posting to a Page feed requires a **Page access token**, not a user token. A
user token returns `(#200) requires pages_manage_posts permission` even when the
user administers the Page.

The recipe handles this for you: it first calls
`GET /{page_id}?fields=access_token` to exchange the supplied token for the
Page's own token, then posts with that. So you can store either a user token (with
`pages_manage_posts` + `pages_read_engagement`) or a Page token — the exchange
is a no-op for the latter.

Use a **long-lived** token; short-lived user tokens expire in about an hour and
the workflow will start failing.

## Setup

1. Create a Facebook app and grant it `pages_manage_posts` and
   `pages_read_engagement` for the Page.
2. Generate a long-lived token and store it as `FACEBOOK_PAGE_TOKEN`.
3. Add `graph.facebook.com` to the allowlist.
4. Install the blueprint, set `page_id`, save, and **enable**.
5. On an article: **Add distribution → Facebook**, review the text, publish.

## Customizing

- **Include a link** — the recipe accepts a `link` input; map it to your article
  URL in the `post` step.
- **Strip HTML automatically** — the admin strips HTML when creating a
  distribution for a text channel, so an article body arrives as plain text.
