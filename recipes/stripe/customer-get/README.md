# Stripe — Get Customer

Retrieves a Stripe customer by ID using the [Retrieve a Customer](https://docs.stripe.com/api/customers/retrieve) API.

## Reference

```
libatomic/passport-actions/recipes/stripe/customer-get
```

## Inputs

| Input | Required | Default | Description |
|---|---|---|---|
| `api_key` | yes | — | Stripe secret API key |
| `customer_id` | yes | — | Stripe customer ID (`cus_...`) |
| `expand` | no | `""` | Stripe `expand[]` parameter (e.g. `subscriptions`, `default_source`) |

## Outputs

The step outputs are available at `steps.<id>.outputs.get.outputs.*` and contain the full [Stripe Customer object](https://docs.stripe.com/api/customers/object), including:

- `id` — customer ID
- `email` — customer email
- `name` — customer name
- `metadata` — custom metadata
- `subscriptions` — subscription list (if expanded)
- `default_source` — default payment source (if expanded)

## Usage

```yaml
steps:
  - id: customer
    includes: libatomic/passport-actions/recipes/stripe/customer-get
    with:
      api_key: ${{ secrets.STRIPE_SECRET_KEY }}
      customer_id: ${{ trigger.body.data.object.customer }}

  - id: log
    action: log
    with:
      message: "Customer: ${{ steps.customer.outputs.get.outputs.body.email }}"
```

### With expanded subscriptions

```yaml
steps:
  - id: customer
    includes: libatomic/passport-actions/recipes/stripe/customer-get
    with:
      api_key: ${{ secrets.STRIPE_SECRET_KEY }}
      customer_id: ${{ user.metadata.stripe_customer_id }}
      expand: subscriptions
```

## API details

- **Endpoint**: `GET https://api.stripe.com/v1/customers/{customer_id}`
- **Auth**: Bearer token (Stripe secret key)
- **Expected status**: 200
