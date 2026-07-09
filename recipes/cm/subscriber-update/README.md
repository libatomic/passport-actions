# Campaign Monitor — Update Subscriber

Updates an existing subscriber on a Campaign Monitor list. Can change the subscriber's email address, name, custom fields, and consent preferences.

## Reference

```
libatomic/passport-actions/recipes/cm/subscriber-update
```

## Inputs

| Input | Required | Default | Description |
|---|---|---|---|
| `api_key` | yes | — | Campaign Monitor API key |
| `list_id` | yes | — | Target list ID |
| `email` | yes | — | Current subscriber email address (used to identify the subscriber) |
| `new_email` | no | `""` | New email address (if changing; defaults to current email) |
| `name` | no | `""` | Updated display name |
| `custom_fields` | no | `""` | Custom fields (JSON object) |
| `resubscribe` | no | `"false"` | Reactivate if previously unsubscribed |
| `consent_to_track` | no | `"unchanged"` | GDPR consent: `yes`, `no`, or `unchanged` |

## Usage

```yaml
steps:
  - id: update-cm
    includes: libatomic/passport-actions/recipes/cm/subscriber-update
    with:
      api_key: ${{ secrets.CM_API_KEY }}
      list_id: ${{ secrets.CM_LIST_ID }}
      email: ${{ user.profile.email }}
      name: ${{ user.profile.name }}
```

### Changing a subscriber's email

```yaml
steps:
  - id: update-email
    includes: libatomic/passport-actions/recipes/cm/subscriber-update
    with:
      api_key: ${{ secrets.CM_API_KEY }}
      list_id: ${{ secrets.CM_LIST_ID }}
      email: ${{ trigger.body.old_email }}
      new_email: ${{ trigger.body.new_email }}
```

## API details

- **Endpoint**: `PUT https://api.createsend.com/api/v3.3/subscribers/{list_id}.json?email={email}`
- **Auth**: HTTP Basic (API key as username, `x` as password)
- **Expected status**: 200
