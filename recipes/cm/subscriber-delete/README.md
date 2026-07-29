# Campaign Monitor — Delete Subscriber

Deletes a subscriber from a Campaign Monitor list entirely.

**Delete vs unsubscribe** — they are different operations with different
consequences:

- **Delete** (this recipe) removes the subscriber's *record and history* from
  the list. Use it when the data should be gone (account erasure).
- **Unsubscribe** ([`cm/subscriber-unsubscribe`](../subscriber-unsubscribe/))
  keeps the record, suppressed, in the list's Unsubscribed pool. Use it for
  genuine opt-outs.

Note that CM treats **both** as inactive states for re-adds: a later
`subscriber-add` only reactivates them when it passes `resubscribe: true`.

## Reference

```
libatomic/passport-actions/recipes/cm/subscriber-delete
```

## Inputs

| Input | Required | Default | Description |
|---|---|---|---|
| `api_key` | yes | — | Campaign Monitor API key |
| `list_id` | yes | — | Target list ID |
| `email` | yes | — | Subscriber email address to delete |

## Usage

```yaml
steps:
  - id: remove-from-cm
    includes: libatomic/passport-actions/recipes/cm/subscriber-delete
    continue-on-error: true      # not-on-list is a harmless 400
    with:
      api_key: ${{ secrets.CM_API_KEY }}
      list_id: ${{ secrets.CM_LIST_ID }}
      email: ${{ user.profile.email }}
```

If the email isn't on the list, CM returns **`400` / code `203`** — mark the
step `continue-on-error: true` when that's expected.

## API details

- **Endpoint**: `DELETE https://api.createsend.com/api/v3.3/subscribers/{list_id}.json?email={email}`
- **Auth**: HTTP Basic (API key as username, `x` as password)
- **Expected status**: 200
