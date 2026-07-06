# Twilio Webhook Validator

Validates incoming Twilio webhook signatures using the `X-Twilio-Signature` header. Use this action as a `validate:` reference on webhook triggers to ensure inbound Twilio payloads are authentic.

## How it works

Twilio signs every webhook request with HMAC-SHA1 using your account's auth token. This action:

1. Parses the form-encoded request body into key-value parameters.
2. Sorts the parameters alphabetically by key.
3. Concatenates the full request URL with each key-value pair.
4. Computes HMAC-SHA1 of the result using your auth token.
5. Compares the computed signature to the `X-Twilio-Signature` header using constant-time comparison.

If the signature matches, the action exits successfully and the webhook proceeds. If it fails, the action exits with an error and the webhook returns 403 Forbidden.

## Reference

```
libatomic/passport-actions/actions/twilio/webhook-validator@v1
```

## Inputs

| Input | Required | Description |
|---|---|---|
| `body` | yes | Raw request body (provided automatically by the webhook trigger) |
| `headers` | yes | Request headers as a JSON object (provided automatically) |
| `url` | yes | Request URL (provided automatically) |
| `TWILIO_AUTH_TOKEN` | yes | Your Twilio auth token — store as a secret |

## Outputs

| Output | Description |
|---|---|
| `valid` | `"true"` if the signature is valid |

## Usage

```yaml
on:
  - webhook: true
    name: twilio-sms
    validate: libatomic/passport-actions/actions/twilio/webhook-validator@v1

steps:
  - id: handle-sms
    action: log
    with:
      message: "SMS from ${{ trigger.body.From }}: ${{ trigger.body.Body }}"
```

### Secrets setup

Store your Twilio auth token as an instance secret:

```sh
atomic-cli secret set TWILIO_AUTH_TOKEN "your-auth-token"
```

The webhook engine automatically passes `${{ secrets.TWILIO_AUTH_TOKEN }}` to the validator.

## Runtime

- **Type**: Node.js action (`node20`)
- **Dependencies**: None (uses only Node.js built-in `crypto` module)
- **Bundle size**: ~4 KB
