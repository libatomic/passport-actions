# CloudFront Create Invalidation

Creates a CloudFront cache invalidation for the specified distribution and paths. Use this action to purge cached content from CloudFront edge locations when origin content changes.

## How it works

This action calls the [CloudFront CreateInvalidation API](https://docs.aws.amazon.com/cloudfront/latest/APIReference/API_CreateInvalidation.html) directly using AWS Signature Version 4 (SigV4) authentication. It does not require the AWS SDK — authentication is implemented manually for a minimal bundle size.

1. Builds an XML `InvalidationBatch` body with the specified paths.
2. Signs the request using SigV4 with your AWS credentials.
3. Sends a POST to `cloudfront.amazonaws.com`.
4. Parses the XML response to extract the invalidation ID and status.

## Reference

```
libatomic/passport-actions/actions/aws/cloudfront-invalidation@v1
```

## Inputs

| Input | Required | Default | Description |
|---|---|---|---|
| `AWS_ACCESS_KEY_ID` | yes | — | AWS access key ID |
| `AWS_SECRET_ACCESS_KEY` | yes | — | AWS secret access key |
| `AWS_REGION` | no | `us-east-1` | AWS region |
| `DISTRIBUTION_ID` | yes | — | CloudFront distribution ID (e.g. `E1A2B3C4D5E6F7`) |
| `PATHS` | yes | — | Comma-separated list of paths to invalidate |
| `CALLER_REFERENCE` | no | auto-generated | Unique caller reference for idempotency |

### Path format

Paths must start with `/`. Use `*` as a wildcard to invalidate all files under a directory:

- `/index.html` — single file
- `/images/*` — all files under `/images/`
- `/*` — invalidate the entire distribution

## Outputs

| Output | Description |
|---|---|
| `invalidation_id` | The ID of the created invalidation (e.g. `I1A2B3C4D5E6F7`) |
| `status` | The invalidation status: `InProgress` or `Completed` |

## Usage

```yaml
steps:
  - id: invalidate-cdn
    uses: libatomic/passport-actions/actions/aws/cloudfront-invalidation@v1
    with:
      AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
      AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
      DISTRIBUTION_ID: ${{ secrets.CLOUDFRONT_DISTRIBUTION_ID }}
      PATHS: "/index.html,/css/*,/js/*"

  - id: log-result
    action: log
    with:
      message: "Invalidation ${{ steps.invalidate-cdn.outputs.invalidation_id }}: ${{ steps.invalidate-cdn.outputs.status }}"
```

### Secrets setup

Create an IAM user or role with the `cloudfront:CreateInvalidation` permission and store the credentials as instance secrets:

```sh
atomic-cli secret set AWS_ACCESS_KEY_ID "AKIA..."
atomic-cli secret set AWS_SECRET_ACCESS_KEY "..."
atomic-cli secret set CLOUDFRONT_DISTRIBUTION_ID "E1A2B3C4D5E6F7"
```

### Invalidating after a publish event

```yaml
name: invalidate-on-publish
version: 1

on:
  - event: distribution.published

steps:
  - id: invalidate
    uses: libatomic/passport-actions/actions/aws/cloudfront-invalidation@v1
    with:
      AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
      AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
      DISTRIBUTION_ID: ${{ secrets.CLOUDFRONT_DISTRIBUTION_ID }}
      PATHS: "/*"
```

## Runtime

- **Type**: Node.js action (`node20`)
- **Dependencies**: None (uses only Node.js built-in `crypto` and `https` modules)
- **Bundle size**: ~4 KB
- **AWS SDK**: Not required — SigV4 signing is implemented inline
