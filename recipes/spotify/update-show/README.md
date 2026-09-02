# Spotify — Update Show

Updates an existing show's metadata via the **Spotify Distribution API**
(`PUT https://distribution.spotify.com/shows/{show_id}`), pinned to
**Api-Version 2026-04-01**.

The update is a **partial write**: every body field is optional and the recipe
sends only the inputs you provide — empty inputs are omitted from the request
entirely. `is_sandbox` is sent as a real boolean.

Primary use case: **flipping a show out of sandbox mode** once testing is done
(`is_sandbox: "false"`), or sandboxing one for development.

## Reference

```
libatomic/passport-actions/recipes/spotify/update-show
```

## Inputs

| Input | Required | Default | Description |
|---|---|---|---|
| `api_version` | no | `2026-04-01` | CalVer `Api-Version` header sent to the API |
| `client_id` | yes | — | Spotify app client id |
| `client_secret` | yes | — | Spotify app client **secret** |
| `show_id` | yes | — | Base-62 show id (from `spotify:show:<id>`) |
| `is_sandbox` | no | `""` | `"true"` / `"false"`; sent as a boolean, omitted when empty |
| `title`, `summary`, `language`, `link`, `image_file_url`, `owner_name`, `owner_email` | no | `""` | Sent only when set |
| `itunes_categories` | no | `[]` | iTunes-compatible category names; omitted when empty |
| `explicit` | no | `""` | `no`, `yes`, or `clean` |
| `show_type` | no | `""` | `episodic` or `serial` |
| `soa_partner_id` | no | `""` | Open Access partner id (exactly 22 characters) |

`owner_name` is also the show's displayed author name on Spotify — update it
to change the author shown in podcast apps.

## Outputs

The full updated show is returned:
`steps.<id>.outputs.show.outputs.body.*`.

## Usage

```yaml
# Take a sandbox show live
- id: go-live
  includes: libatomic/passport-actions/recipes/spotify/update-show
  with:
    client_id: ${{ inputs.spotify_client_id }}
    client_secret: ${{ secrets.SPOTIFY_CLIENT_SECRET }}
    show_id: ${{ inputs.spotify_show_id }}
    is_sandbox: "false"
```

Both `accounts.spotify.com` and `distribution.spotify.com` must be on the
instance's HTTP allowlist. See `recipes/spotify/create-show` for creating a
show (optionally in sandbox mode) in the first place.
