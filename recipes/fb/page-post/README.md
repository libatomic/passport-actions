# Facebook — Page Post

Posts a plain-text message to a Facebook Page feed via the Graph API.

## Reference

```
libatomic/passport-actions/recipes/fb/page-post
```

## Inputs

| Input | Required | Default | Description |
|---|---|---|---|
| `page_id` | yes | — | Facebook Page id to post to |
| `message` | yes | — | Plain-text (UTF-8) message body |
| `access_token` | yes | — | Admin **user** OR **page** access token (see Tokens) |
| `link` | no | `""` | Optional URL to attach to the post |

## Tokens — the #1 gotcha

Posting to a page feed requires a **Page access token**, not a User access
token. A user token — even one with `pages_manage_posts` and
`pages_read_engagement` — is rejected with `(#200) … requires both
pages_read_engagement and pages_manage_posts as an admin`.

This recipe handles that: it first calls
`GET /{page_id}?fields=access_token` to exchange the provided token for the
page's own token, then posts with that. So you can pass **either**:

- an **admin user token** (with `pages_show_list`, `pages_read_engagement`,
  `pages_manage_posts`), which gets swapped automatically, or
- a **page token** directly (the swap returns it unchanged).

Use a **long-lived** token — short-lived user tokens expire in ~1 hour, and the
derived page token inherits that lifetime. To get a non-expiring page token:
exchange your short-lived user token for a long-lived one
(`GET /oauth/access_token?grant_type=fb_exchange_token`), then
`GET /me/accounts` and copy the page's `access_token` (page tokens from a
long-lived user token don't expire). Store that as `FACEBOOK_PAGE_TOKEN`.

## Content constraints

Facebook Page feed posts are **UTF-8 plain text** — HTML markup is not rendered
and will appear literally in the post. There is no practical length limit for a
distribution body (the hard API cap is ~63k characters).

## Outputs

The step outputs are available at `steps.<id>.outputs.post.outputs.*` and
contain the Graph API response (`id` of the created post on success).

## Usage

```yaml
steps:
  - id: post
    includes: libatomic/passport-actions/recipes/fb/page-post
    with:
      page_id: ${{ inputs.page_id }}
      message: ${{ steps.load.outputs.distribution.body }}
      access_token: ${{ secrets.FACEBOOK_PAGE_TOKEN }}
```

## API details

- **Endpoint**: `POST https://graph.facebook.com/v20.0/{page_id}/feed`
- **Auth**: Bearer (Page access token)
- **Expected status**: 200
- `graph.facebook.com` must be on the instance's http allowlist.
