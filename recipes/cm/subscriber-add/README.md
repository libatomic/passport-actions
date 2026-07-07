# Campaign Monitor — Add Subscriber

Adds a subscriber to a Campaign Monitor list. If the subscriber already exists and `resubscribe` is `true` (the default), they are reactivated.

## Reference

```
libatomic/passport-actions/recipes/cm/subscriber-add@v1
```

## Inputs

| Input | Required | Default | Description |
|---|---|---|---|
| `api_key` | yes | — | Campaign Monitor API key |
| `list_id` | yes | — | Target list ID |
| `email` | yes | — | Subscriber email address |
| `name` | no | `""` | Subscriber display name |
| `custom_fields` | no | `[]` | Array of Campaign Monitor `{Key, Value}` custom-field objects |
| `resubscribe` | no | `"true"` | Reactivate if previously unsubscribed |
| `consent_to_track` | no | `"yes"` | GDPR consent: `yes`, `no`, or `unchanged` |

## Outputs

The step outputs are available at `steps.<id>.outputs.add.outputs.*` and contain the Campaign Monitor API response (the subscriber's email address on success).

## Usage

```yaml
steps:
  - id: subscribe
    includes: libatomic/passport-actions/recipes/cm/subscriber-add@v1
    with:
      api_key: ${{ secrets.CM_API_KEY }}
      list_id: ${{ secrets.CM_LIST_ID }}
      email: ${{ trigger.body.user.email }}
      name: ${{ trigger.body.user.name }}
```

### In a foreach loop

```yaml
steps:
  - id: members
    action: audience.view
    with:
      audience: newsletter
      created_after: "-24h"

  - id: sync
    foreach: ${{ steps.members.outputs.users }}
    as: member
    steps:
      - id: add
        includes: libatomic/passport-actions/recipes/cm/subscriber-add@v1
        continue-on-error: true
        with:
          api_key: ${{ secrets.CM_API_KEY }}
          list_id: ${{ secrets.CM_LIST_ID }}
          email: ${{ loop.member.email }}
          name: ${{ loop.member.name }}
```

## API details

- **Endpoint**: `POST https://api.createsend.com/api/v3.3/subscribers/{list_id}.json`
- **Auth**: HTTP Basic (API key as username, `x` as password)
- **Expected status**: 200, 201
