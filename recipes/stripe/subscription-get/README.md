# Stripe — Get Subscription

Retrieves a Stripe subscription by ID using the [Retrieve a Subscription](https://docs.stripe.com/api/subscriptions/retrieve) API.

## Reference

```
libatomic/passport-actions/recipes/stripe/subscription-get@v1
```

## Inputs

| Input | Required | Default | Description |
|---|---|---|---|
| `api_key` | yes | — | Stripe secret API key |
| `subscription_id` | yes | — | Stripe subscription ID (`sub_...`) |
| `expand` | no | `""` | Stripe `expand[]` parameter (e.g. `customer`, `latest_invoice`, `default_payment_method`) |

## Outputs

The step outputs are available at `steps.<id>.outputs.get.outputs.*` and contain the full [Stripe Subscription object](https://docs.stripe.com/api/subscriptions/object), including:

- `id` — subscription ID
- `status` — `active`, `past_due`, `canceled`, `unpaid`, `trialing`, etc.
- `customer` — customer ID (or full object if expanded)
- `current_period_start` / `current_period_end` — billing period timestamps
- `items` — subscription items (plans/prices)
- `cancel_at_period_end` — whether the subscription cancels at period end

## Usage

```yaml
steps:
  - id: sub
    includes: libatomic/passport-actions/recipes/stripe/subscription-get@v1
    with:
      api_key: ${{ secrets.STRIPE_SECRET_KEY }}
      subscription_id: ${{ trigger.body.data.object.id }}

  - id: check-status
    action: log
    with:
      message: "Subscription ${{ steps.sub.outputs.get.outputs.body.id }} is ${{ steps.sub.outputs.get.outputs.body.status }}"
```

### Handling subscription lifecycle webhooks

```yaml
name: subscription-lifecycle
version: 1

on:
  - webhook: true
    name: stripe
    validate: libatomic/passport-actions/actions/stripe/webhook-validator@v1

steps:
  - id: sub
    includes: libatomic/passport-actions/recipes/stripe/subscription-get@v1
    with:
      api_key: ${{ secrets.STRIPE_SECRET_KEY }}
      subscription_id: ${{ trigger.body.data.object.id }}
      expand: customer

  - id: route-status
    switch:
      - when: ${{ steps.sub.outputs.get.outputs.body.status == "active" }}
        steps:
          - id: activate
            action: log
            with:
              message: "Subscription activated for ${{ steps.sub.outputs.get.outputs.body.customer.email }}"
      - when: ${{ steps.sub.outputs.get.outputs.body.status == "canceled" }}
        steps:
          - id: cancel
            action: sendmail
            with:
              template_name: subscription-canceled
              user_id: ${{ trigger.body.data.object.customer }}
      - default: true
        steps:
          - id: log-other
            action: log
            with:
              message: "Subscription status: ${{ steps.sub.outputs.get.outputs.body.status }}"
```

## API details

- **Endpoint**: `GET https://api.stripe.com/v1/subscriptions/{subscription_id}`
- **Auth**: Bearer token (Stripe secret key)
- **Expected status**: 200
