# WordPress Post (Distribution)

Defines a custom **`wordpress` distribution channel** that creates a post on a
WordPress site via the REST API. Once installed and enabled, "WordPress" appears
in an article's **Add Distribution** menu.

Built on the [`wp/create-post`](../../../recipes/wp/create-post/) recipe.

## What it does

Publishing a distribution to the `wordpress` channel runs this workflow once
(broadcast):

| Step | Action | Purpose |
|---|---|---|
| `load` | `distribution.get` | Load the distribution's title and body |
| `post` | recipe `wp/create-post` | `POST /wp-json/wp/v2/posts` |

| WordPress field | Comes from |
|---|---|
| `title` | `distribution.title` |
| `content` | `distribution.body` |
| `status` | the `status` input |

## The channel

```yaml
on:
  - distribution:
      channel: wordpress
      label: WordPress
      mode: broadcast
      content_type: html
```

WordPress accepts HTML bodies, so the channel is `content_type: html` with no
length cap. This is a **broadcast** channel: it publishes once and needs no
audience.

## Requirements

**Secret**

| Name | Value |
|---|---|
| `WP_APP_PASSWORD` | A WordPress **Application Password** (not the login password) |

**Inputs**

| Input | Required | Default | Description |
|---|---|---|---|
| `site_url` | yes | — | Site base URL, e.g. `https://example.com` (no trailing slash) |
| `username` | yes | — | The user the Application Password belongs to |
| `status` | no | `publish` | `publish`, `draft`, `pending`, or `private` |

**Allowed HTTP hosts** — your WordPress site's hostname, e.g. `example.com`.

## Authentication — Application Passwords

WordPress 5.6+ ships **Application Passwords**. In WP admin go to
**Users → Profile → Application Passwords**, create one (e.g. "Passport"), and
store the generated value as `WP_APP_PASSWORD`. The recipe sends it as HTTP
Basic auth.

Do **not** use the account login password — Basic auth with the login password is
disabled by default. Application Passwords also require the site to be served
over **HTTPS**.

## Setup

1. Create an Application Password in WP admin and store it as `WP_APP_PASSWORD`.
2. Add your site's hostname to the allowlist.
3. Install the blueprint, set `site_url` and `username`, save, and **enable**.
4. On an article: **Add distribution → WordPress**, review, publish.

Set `status: draft` while testing so posts land unpublished.

## Customizing

- **Categories / tags** — the recipe takes `categories` and `tags` as arrays of
  **numeric IDs**, not names. Look them up once via
  `GET /wp-json/wp/v2/categories` and `/tags`, then pass them in the `post` step.
- **Excerpt / slug** — the recipe accepts `excerpt` and `slug`; map them from the
  distribution or a blueprint input.
