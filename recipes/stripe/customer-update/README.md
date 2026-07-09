# Stripe — Update Customer

Updates a Stripe customer using the [Update a Customer](https://docs.stripe.com/api/customers/update) API.

## Reference

```
libatomic/passport-actions/recipes/stripe/customer-update
```

## Inputs

| Input | Required | Default | Description |
|---|---|---|---|
| `api_key` | yes | — | Stripe secret API key |
| `customer_id` | yes | — | Stripe customer ID (`cus_...`) |
| `email` | no | `""` | Updated email address |
| `name` | no | `""` | Updated customer name |
| `description` | no | `""` | Updated description |
| `metadata` | no | `""` | Metadata key-value pairs (form-encoded) |

Only non-empty fields are sent to Stripe. Pass only the fields you want to change.

## Usage

```yaml
steps:
  - id: update-stripe
    includes: libatomic/passport-actions/recipes/stripe/customer-update
    with:
      api_key: ${{ secrets.STRIPE_SECRET_KEY }}
      customer_id: ${{ user.metadata.stripe_customer_id }}
      email: ${{ user.profile.email }}
      name: ${{ user.profile.name }}
```

### Syncing user profile changes to Stripe

```yaml
name: sync-profile-to-stripe
version: 1

on:
  - event: user.updated

steps:
  - id: load-user
    action: user.get
    with:
      user_id: ${{ trigger.user_id }}

  - id: sync
    if: ${{ user.metadata.stripe_customer_id != "" }}
    then:
      - id: update-customer
        includes: libatomic/passport-actions/recipes/stripe/customer-update
        with:
          api_key: ${{ secrets.STRIPE_SECRET_KEY }}
          customer_id: ${{ user.metadata.stripe_customer_id }}
          email: ${{ user.profile.email }}
          name: ${{ user.profile.name }}
```

## API details

- **Endpoint**: `POST https://api.stripe.com/v1/customers/{customer_id}`
- **Auth**: Bearer token (Stripe secret key)
- **Content-Type**: `application/x-www-form-urlencoded`
- **Expected status**: 200
