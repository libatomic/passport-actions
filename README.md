# Passport Actions

Pre-built actions and recipes for the [Passport Atomic](https://github.com/libatomic/atomic)
workflow engine.

This repository contains two kinds of reusable components:

- **Actions** (`action.yml`) — GitHub Actions-compatible node scripts bundled via `@vercel/ncc`.
  Referenced in workflows with `uses:`.
- **Recipes** (`recipe.yml`) — Reusable step sequences using built-in Atomic actions (http, user,
  etc.). Referenced in workflows with `includes:`. No compilation needed.

## Available Components

### Webhook Validators (actions)

Validators run **before** a webhook workflow executes. They verify the signature of the incoming
request and reject it (403) if validation fails. Referenced via the `validate` field on a webhook
trigger.

| Action | Description |
|--------|-------------|
| `libatomic/passport-actions/twilio/webhook-validator@v1` | Validates Twilio X-Twilio-Signature (HMAC-SHA1) |
| `libatomic/passport-actions/stripe/webhook-validator@v1` | Validates Stripe-Signature (HMAC-SHA256 with timestamp tolerance) |

#### Usage

```yaml
on:
  - webhook: true
    name: twilio-inbound
    validate: libatomic/passport-actions/twilio/webhook-validator@v1
```

The validator reads secrets from the workflow's secrets store:
- **Twilio**: `TWILIO_AUTH_TOKEN`
- **Stripe**: `STRIPE_WEBHOOK_SECRET`

### Campaign Monitor (recipes)

Subscriber management recipes for the [Campaign Monitor API v3.3](https://www.campaignmonitor.com/api/v3-3/subscribers/).
These use the built-in `http.*` actions — no node runtime overhead.

| Recipe | Description |
|--------|-------------|
| `libatomic/passport-actions/cm/subscriber-add@v1` | Add a subscriber to a list |
| `libatomic/passport-actions/cm/subscriber-get@v1` | Get subscriber details |
| `libatomic/passport-actions/cm/subscriber-update@v1` | Update a subscriber |
| `libatomic/passport-actions/cm/subscriber-unsubscribe@v1` | Unsubscribe from a list |

#### Usage

```yaml
steps:
  - id: add-to-cm
    includes: libatomic/passport-actions/cm/subscriber-add@v1
    with:
      api_key: ${{ secrets.CM_API_KEY }}
      list_id: ${{ secrets.CM_LIST_ID }}
      email: ${{ trigger.body.EmailAddress }}
      name: ${{ trigger.body.Name }}
```

All CM recipes require:
- `api_key` — Your Campaign Monitor API key (store as a secret)
- `list_id` — The target subscriber list ID
- `email` — The subscriber email address

URL parameters (like `{listid}.json?email={email}`) are handled internally by each recipe.

## Actions vs Recipes

| | Actions (`uses:`) | Recipes (`includes:`) |
|---|---|---|
| File | `action.yml` + `dist/index.js` | `recipe.yml` |
| Runtime | Node.js child process | Inline (native Atomic actions) |
| Dependencies | Bundled via `@vercel/ncc` | None (uses built-in `http.*`, `user.*`, etc.) |
| Build step | Required (`npm run build`) | None |
| Best for | Signature validation, complex logic, vendor SDKs | API calls, HTTP integrations, composing built-ins |

## Caching

Action/recipe source is fetched once as a tarball from GitHub and cached on the Passport asset
volume. Subsequent runs (including `foreach` iterations) use the cached tarball — no re-download.

- **Actions**: bundled with `@vercel/ncc`, no `npm install` at runtime
- **Recipes**: pure YAML, parsed at include time — zero overhead beyond the initial fetch

## Building (actions only)

```bash
npm install
npm run build
```

Recipes don't need building — they're YAML files parsed directly by the workflow engine.

## Creating New Components

### Creating a Recipe

1. Create a directory: `<vendor>/<recipe-name>/`
2. Add `recipe.yml`:
   ```yaml
   name: my-recipe
   description: What it does
   inputs:
     api_key:
       required: true
     param:
       default: "value"
   steps:
     - id: call
       action: http.post
       with:
         url: "https://api.example.com/${{ inputs.param }}"
         headers:
           Authorization: "Basic ${{ base64Encode(inputs.api_key + ':x') }}"
         body:
           key: ${{ inputs.param }}
   ```
3. Tag a release: `git tag v1 && git push --tags`

### Creating an Action

1. Create a directory: `<vendor>/<action-name>/`
2. Add `action.yml` with inputs, outputs, and `runs.using: node20`
3. Write `index.js`
4. Run `npm run build` (or add to `build.js`)
5. Tag a release

### Expression Functions

Recipes have access to all Atomic workflow expression functions:

| Function | Description |
|----------|-------------|
| `base64Encode(s)` | Base64-encode a string |
| `base64Decode(s)` | Base64-decode a string |
| `toJSON(v)` | Serialize any value to JSON string |

## License

MIT
