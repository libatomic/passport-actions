# Passport Actions

Pre-built actions and recipes for the [Passport Atomic](https://github.com/libatomic/atomic)
workflow engine.

**New to workflows?** Start with the plain-language [Workflows guide](WORKFLOW.md) — how
triggers, steps, conditions, branches, and loops work (written for admins, not just
developers). The [builtins reference](BUILTINS.md) lists every action, expression function,
and context variable.

This repository contains three kinds of reusable components:

- **Blueprints** (`blueprint.yml`) — Complete workflow definitions ready to import into your
  instance. These replace the legacy template trigger system with full workflow control.
- **Actions** (`action.yml`) — GitHub Actions-compatible node scripts bundled via `@vercel/ncc`.
  Referenced in workflows with `uses:`.
- **Recipes** (`recipe.yml`) — Reusable step sequences using built-in Atomic actions (http, user,
  etc.). Referenced in workflows with `includes:`. No compilation needed.

## Available Components

### Blueprints

Ready-to-use workflow definitions that replace the legacy template trigger system. Import these
directly from the admin UI's Template Library tab or copy the `definition` block into a new
workflow via the API.

#### Authentication

| Blueprint | Replaces Event | Channel |
|-----------|---------------|---------|
| `blueprints/verify-email` | `user.email.verify` | email |
| `blueprints/verify-sms` | `user.sms.verify` | sms |
| `blueprints/password-email` | `user.password.email` | email |
| `blueprints/password-sms` | `user.password.sms` | sms |
| `blueprints/password-reset-email` | `user.password.reset.email` | email |
| `blueprints/password-reset-sms` | `user.password.reset.sms` | sms |
| `blueprints/signup-email` | `user.signup.email` | email |
| `blueprints/signup-sms` | `user.signup.sms` | sms |

#### Onboarding

| Blueprint | Replaces Event | Channel |
|-----------|---------------|---------|
| `blueprints/welcome-on-verify` | `user.email.verified` | email |

#### Engagement

| Blueprint | Replaces Event | Channel |
|-----------|---------------|---------|
| `blueprints/gift-invite` | `gift.invite.created` | email |
| `blueprints/team-invite` | `team.member.added` | email |

#### Billing

| Blueprint | Replaces Event | Channel |
|-----------|---------------|---------|
| `blueprints/entitlement-created` | `user.entitlement.created` | email |
| `blueprints/entitlement-deleted` | `user.entitlement.deleted` | email |
| `blueprints/subscription-created` | `user.subscription.created` | email |
| `blueprints/subscription-canceled` | `user.subscription.status.canceled` | email |
| `blueprints/subscription-status-updated` | `user.subscription.status.*` | email |
| `blueprints/subscription-expiring` | `user.subscription.expiring` | email |

Event names in `on: event:` accept `*` wildcards (e.g. `user.subscription.status.*`),
so a blueprint can cover a whole family of events without being updated when new ones are added.

Entitlement events (`user.entitlement.*`) and subscription events (`user.subscription.*`) are
related but distinct — an entitlement may be granted without a subscription (gift, comp, team seat).

#### Operations

| Blueprint | Replaces Event | Channel |
|-----------|---------------|---------|
| `blueprints/job-failed` | `job.failed` | email |
| `blueprints/job-completed` | `job.completed` (example filters to `audience:build`) | — |

#### Campaign Monitor

Vendor blueprints that sync Passport events to Campaign Monitor lists via the
`recipes/cm/*` recipes. Each needs the `CM_API_KEY` secret and a `list_id` input;
list-add blueprints attach custom fields (instance name, Passport user/subscription/plan
ids, reason, `EndsAt`/`EndsAtPretty`, interval) where relevant.

| Blueprint | Trigger Event | Action |
|-----------|--------------|--------|
| `blueprints/cm/user-email-opt-out` | `user.email.opt_out` | Unsubscribe from a list |
| `blueprints/cm/new-user` | `user.created` | Add to a list |
| `blueprints/cm/new-subscriber` | `user.subscription.created` (paid, plan-backed only) | Add to a list |
| `blueprints/cm/subscription-canceled` | `user.subscription.status.canceled` | Add to a win-back list |
| `blueprints/cm/subscription-expiring` | `user.subscription.expiring` | Add to a list |

#### Usage

Each blueprint contains a `definition` block that is a complete workflow YAML document. The
`inputs` section documents customizable parameters (like which template to render). The `replaces`
field indicates which legacy template trigger event/channel combination it supersedes.

```yaml
# Import via the admin UI "Templates" tab, or via the API:
POST /api/1.0.0/workflows?name=verify-email&enabled=true
Content-Type: application/x-yaml

# paste the definition block from the blueprint
```

### Webhook Validators (actions)

Validators run **before** a webhook workflow executes. They verify the signature of the incoming
request and reject it (403) if validation fails. Referenced via the `validate` field on a webhook
trigger.

| Action | Description |
|--------|-------------|
| `libatomic/passport-actions/actions/twilio/webhook-validator@v1` | Validates Twilio X-Twilio-Signature (HMAC-SHA1) |
| `libatomic/passport-actions/actions/stripe/webhook-validator@v1` | Validates Stripe-Signature (HMAC-SHA256 with timestamp tolerance) |
| `libatomic/passport-actions/actions/aws/cloudfront-invalidation@v1` | Creates a CloudFront cache invalidation |

#### Usage

```yaml
on:
  - webhook: true
    name: twilio-inbound
    validate: libatomic/passport-actions/actions/twilio/webhook-validator@v1
```

The validator reads secrets from the workflow's secrets store:
- **Twilio**: `TWILIO_AUTH_TOKEN`
- **Stripe**: `STRIPE_WEBHOOK_SECRET`

### AWS CloudFront (action)

Cache invalidation action for [CloudFront](https://docs.aws.amazon.com/cloudfront/latest/APIReference/API_CreateInvalidation.html).
Uses AWS Signature Version 4 — no SDK dependency.

| Action | Description |
|--------|-------------|
| `libatomic/passport-actions/actions/aws/cloudfront-invalidation@v1` | Create a cache invalidation for a distribution |

#### Usage

```yaml
steps:
  - id: invalidate
    uses: libatomic/passport-actions/actions/aws/cloudfront-invalidation@v1
    with:
      AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
      AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
      DISTRIBUTION_ID: E1234567890ABC
      PATHS: "/index.html,/images/*"
```

Inputs:
- `AWS_ACCESS_KEY_ID` — AWS access key (store as a secret)
- `AWS_SECRET_ACCESS_KEY` — AWS secret key (store as a secret)
- `AWS_REGION` — AWS region (default: `us-east-1`)
- `DISTRIBUTION_ID` — CloudFront distribution ID
- `PATHS` — Comma-separated invalidation paths (e.g. `/index.html,/images/*`)
- `CALLER_REFERENCE` — Optional unique reference for idempotency (auto-generated if empty)

Outputs: `invalidation_id`, `status`.

### Campaign Monitor (recipes)

Subscriber management recipes for the [Campaign Monitor API v3.3](https://www.campaignmonitor.com/api/v3-3/subscribers/).
These use the built-in `http.*` actions — no node runtime overhead.

| Recipe | Description |
|--------|-------------|
| `libatomic/passport-actions/recipes/cm/subscriber-add@v1` | Add a subscriber to a list |
| `libatomic/passport-actions/recipes/cm/subscriber-get@v1` | Get subscriber details |
| `libatomic/passport-actions/recipes/cm/subscriber-update@v1` | Update a subscriber |
| `libatomic/passport-actions/recipes/cm/subscriber-unsubscribe@v1` | Unsubscribe from a list |

#### Usage

```yaml
steps:
  - id: add-to-cm
    includes: libatomic/passport-actions/recipes/cm/subscriber-add@v1
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

### Stripe (recipes)

Stripe API recipes for customer and subscription management via the
[Stripe REST API](https://docs.stripe.com/api). These use the built-in `http.*` actions with
Bearer token auth — no node runtime overhead.

| Recipe | Description |
|--------|-------------|
| `libatomic/passport-actions/recipes/stripe/customer-get@v1` | Retrieve a customer by ID |
| `libatomic/passport-actions/recipes/stripe/customer-update@v1` | Update a customer |
| `libatomic/passport-actions/recipes/stripe/subscription-get@v1` | Retrieve a subscription by ID |

#### Usage

```yaml
steps:
  - id: customer
    includes: libatomic/passport-actions/recipes/stripe/customer-get@v1
    with:
      api_key: ${{ secrets.STRIPE_SECRET_KEY }}
      customer_id: ${{ trigger.body.data.object.customer }}
```

All Stripe recipes require:
- `api_key` — Your Stripe secret key (store as a secret)
- The resource ID (`customer_id` or `subscription_id`)

Optional: `expand` — A Stripe expand field (e.g. `subscriptions`, `default_source`).

## Actions vs Recipes vs Blueprints

| | Blueprints | Actions (`uses:`) | Recipes (`includes:`) |
|---|---|---|---|
| File | `blueprint.yml` | `action.yml` + `dist/index.js` | `recipe.yml` |
| Purpose | Complete importable workflows | Reusable step logic | Reusable step sequences |
| Runtime | Workflow engine | Node.js child process | Inline (native actions) |
| Used via | Admin UI import / API | `uses:` in a step | `includes:` in a step |
| Best for | Replacing template triggers, starter templates | Signature validation, vendor SDKs | API calls, composing built-ins |

## Actions vs Recipes (detail)

| | Actions (`uses:`) | Recipes (`includes:`) |
|---|---|---|
| File | `action.yml` + `dist/index.js` | `recipe.yml` |
| Runtime | Node.js child process | Inline (native Atomic actions) |
| Dependencies | Bundled via `@vercel/ncc` | None (uses built-in `http.*`, `user.*`, etc.) |
| Build step | Required (`npm run build`) | None |
| Best for | Signature validation, complex logic, vendor SDKs | API calls, HTTP integrations, composing built-ins |

## Migrating from Template Triggers

The legacy template trigger system (`TemplateEvent` records tied to event types) is being
deprecated in favor of workflows. Each blueprint in `blueprints/` is a drop-in replacement for
a specific template trigger event/channel combination.

**Migration steps:**

1. In the admin UI, go to **Workflows** → **Templates** tab
2. Find the blueprint matching your current template trigger (same event type)
3. Click **Use Template** — this pre-fills the YAML editor
4. Customize the `template` input to match your existing template name
5. Save and enable the workflow
6. Disable the corresponding template event trigger
7. Verify the workflow fires correctly on the next event

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

### Creating a Blueprint

1. Create a directory: `blueprints/<blueprint-name>/`
2. Add `blueprint.yml`:
   ```yaml
   name: my-blueprint
   description: |
     What this workflow does.
     Replaces the template trigger for event: some.event
   category: onboarding | authentication | engagement | billing | scheduled | webhook
   replaces:
     event_type: the.event.type
     channel: email | sms
   inputs:
     template:
       description: The template to render
       default: my-template
   definition:
     name: my-workflow
     version: 1
     on:
       - event: the.event.type
     steps:
       - id: load-user
         action: user.get
         with:
           user_id: ${{ trigger.user_id }}
       - id: send
         action: sendmail
         with:
           to: ${{ steps.load-user.outputs.user.profile.email }}
           template: ${{ inputs.template }}
           data:
             user: ${{ steps.load-user.outputs.user }}
   ```
3. The `replaces` field is metadata for the admin UI to indicate which legacy trigger this replaces
4. The `definition` block is the complete workflow YAML that gets imported

### Creating a Recipe

1. Create a directory: `recipes/<vendor>/<recipe-name>/`
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

1. Create a directory: `actions/<vendor>/<action-name>/`
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
