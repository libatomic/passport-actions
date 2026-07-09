# Facebook — Page Post

Posts a plain-text message to a Facebook Page feed via the Graph API.

## Reference

```
libatomic/passport-actions/recipes/fb/page-post@v1
```

## Inputs

| Input | Required | Default | Description |
|---|---|---|---|
| `page_id` | yes | — | Facebook Page id to post to |
| `message` | yes | — | Plain-text (UTF-8) message body |
| `access_token` | yes | — | Page access token |
| `link` | no | `""` | Optional URL to attach to the post |

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
    includes: libatomic/passport-actions/recipes/fb/page-post@v1
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
