# Campaign Monitor — Get Subscriber

Retrieves a subscriber's details from a Campaign Monitor list by email address.

## Reference

```
libatomic/passport-actions/recipes/cm/subscriber-get@v1
```

## Inputs

| Input | Required | Description |
|---|---|---|
| `api_key` | yes | Campaign Monitor API key |
| `list_id` | yes | Target list ID |
| `email` | yes | Subscriber email address to look up |

## Outputs

The step outputs are available at `steps.<id>.outputs.get.outputs.*` and contain the full Campaign Monitor subscriber object, including:

- `EmailAddress` — the subscriber's email
- `Name` — display name
- `Date` — subscription date
- `State` — `Active`, `Unsubscribed`, `Bounced`, `Deleted`
- `CustomFields` — array of custom field values
- `ReadsEmailWith` — email client info

## Usage

```yaml
steps:
  - id: lookup
    includes: libatomic/passport-actions/recipes/cm/subscriber-get@v1
    with:
      api_key: ${{ secrets.CM_API_KEY }}
      list_id: ${{ secrets.CM_LIST_ID }}
      email: ${{ trigger.body.user.email }}

  - id: log-status
    action: log
    with:
      message: "Subscriber state: ${{ steps.lookup.outputs.get.outputs.body.State }}"
```

## API details

- **Endpoint**: `GET https://api.createsend.com/api/v3.3/subscribers/{list_id}.json?email={email}`
- **Auth**: HTTP Basic (API key as username, `x` as password)
- **Expected status**: 200
