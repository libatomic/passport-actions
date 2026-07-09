# WordPress — Create Post

Creates a post on a WordPress site via the REST API
(`POST /wp-json/wp/v2/posts`).

## Reference

```
libatomic/passport-actions/recipes/wp/create-post
```

## Inputs

| Input | Required | Default | Description |
|---|---|---|---|
| `site_url` | yes | — | Site base URL, e.g. `https://example.com` (no trailing slash) |
| `username` | yes | — | WordPress username |
| `app_password` | yes | — | WordPress **Application Password** (not the login password) |
| `title` | yes | — | Post title |
| `content` | yes | — | Post body (HTML supported) |
| `status` | no | `draft` | `publish`, `draft`, `pending`, or `private` |
| `excerpt` | no | `""` | Hand-written excerpt |
| `slug` | no | `""` | URL slug (auto-generated from the title if empty) |
| `categories` | no | `[]` | Array of category **IDs** (integers), e.g. `[3, 7]` |
| `tags` | no | `[]` | Array of tag **IDs** (integers) |

## Auth — Application Passwords

WordPress 5.6+ ships **Application Passwords**: in WP admin go to
**Users → Profile → Application Passwords**, name one (e.g. "Passport"), and
copy the generated value. Store it as the `app_password` secret. The recipe
sends it as HTTP Basic auth (`Authorization: Basic base64(username:app_password)`).

Do **not** use the account login password — Basic auth with the login password
is disabled by default. Application Passwords also require the site to be served
over **HTTPS**.

## Categories & tags

The REST API takes category/tag **IDs**, not names. Look them up once
(`GET /wp-json/wp/v2/categories`, `/tags`) and pass the integer IDs. Leave the
arrays empty to use the site defaults.

## Outputs

The step outputs are available at `steps.<id>.outputs.create.outputs.*` and
contain the created post (`id`, `link`, `status`, …) on success.

## Usage

```yaml
steps:
  - id: post
    includes: libatomic/passport-actions/recipes/wp/create-post
    with:
      site_url: https://example.com
      username: editor
      app_password: ${{ secrets.WP_APP_PASSWORD }}
      title: ${{ steps.load.outputs.distribution.title }}
      content: ${{ steps.load.outputs.distribution.body }}
      status: publish
```

## API details

- **Endpoint**: `POST {site_url}/wp-json/wp/v2/posts`
- **Auth**: HTTP Basic (username + Application Password)
- **Expected status**: 201 (200 on update)
- The site host must be on the instance's HTTP allowlist
  (Workflows → Settings → Allowed HTTP hosts).
- Docs: <https://developer.wordpress.org/rest-api/reference/posts/>
