# Stripe Webhook Validator

Validates incoming Stripe webhook signatures using the `Stripe-Signature` header. Use this action as a `validate:` reference on webhook triggers to ensure inbound Stripe payloads are authentic.

## How it works

Stripe signs every webhook event with HMAC-SHA256 using your endpoint's signing secret. This action:

1. Extracts the timestamp (`t=`) and signature(s) (`v1=`) from the `Stripe-Signature` header.
2. Constructs the signed payload: `<timestamp>.<raw body>`.
3. Computes HMAC-SHA256 using your webhook signing secret.
4. Compares the result against each `v1` signature using constant-time comparison (Stripe may include multiple signatures during key rotation).
5. Optionally rejects events older than the configured tolerance (default: 300 seconds).

If the signature matches and the timestamp is within tolerance, the action exits successfully. Otherwise it exits with an error and the webhook returns 403 Forbidden.

## Reference

```
libatomic/passport-actions/actions/stripe/webhook-validator@v1
```

## Inputs

| Input | Required | Default | Description |
|---|---|---|---|
| `body` | yes | — | Raw request body (provided automatically by the webhook trigger) |
| `headers` | yes | — | Request headers as a JSON object (provided automatically) |
| `STRIPE_WEBHOOK_SECRET` | yes | — | Stripe webhook endpoint signing secret (`whsec_...`) — store as a secret |
| `tolerance` | no | `300` | Maximum age of the webhook event in seconds |

## Outputs

| Output | Description |
|---|---|
| `valid` | `"true"` if the signature is valid |

## Usage

```yaml
on:
  - webhook: true
    name: stripe-payments
    validate: libatomic/passport-actions/actions/stripe/webhook-validator@v1

steps:
  - id: handle-payment
    action: log
    with:
      message: "Stripe event: ${{ trigger.body.type }}"
```

### Secrets setup

Find your webhook signing secret in the Stripe Dashboard under Developers > Webhooks > your endpoint > Signing secret. Store it as an instance secret:

```sh
atomic-cli secret set STRIPE_WEBHOOK_SECRET "whsec_..."
```

The webhook engine automatically passes `${{ secrets.STRIPE_WEBHOOK_SECRET }}` to the validator.

## Runtime

- **Type**: Node.js action (`node20`)
- **Dependencies**: None (uses only Node.js built-in `crypto` module)
- **Bundle size**: ~4 KB
