# Event Body Schemas

YAML-formatted JSON Schemas describing the **event body** emitted by each event
type. These schemas define the shape of the object available at `trigger.body.*`
in workflow expressions.

They do **not** describe event metadata (`event` name, `source`) or the trigger
context wrapper (`user_id`) — those are handled by the workflow engine.

## Directory Structure

```
schemas/
  atomic/                    # Atomic core events + shared types
    # Shared types (referenced via $ref)
    user.yaml                # User object (embeds oauth/openid/profile)
    instance.yaml            # Instance object
    application.yaml         # Application (OAuth client)
    subscription.yaml        # Subscription object
    entitlement.yaml         # Entitlement object
    job.yaml                 # Job object
    # User lifecycle
    user.created.yaml        user.deleted.yaml
    user.added.yaml          user.removed.yaml
    user.updated.yaml        user.profile.updated.yaml
    user.preferences.updated.yaml
    user.role.added.yaml     user.role.removed.yaml
    user.account.created.yaml
    # Auth
    user.auth.success.yaml   user.auth.failed.yaml
    user.token.revoked.yaml
    # Notifications (email + sms)
    user.email.verify.yaml   user.sms.verify.yaml
    user.email.verified.yaml user.sms.verified.yaml
    user.signup.email.yaml   user.signup.sms.yaml
    user.password.email.yaml user.password.sms.yaml
    user.password.reset.email.yaml
    user.password.reset.sms.yaml
    user.email.suppressed.yaml
    user.email.bounced.yaml
    email.sender.verify.yaml email.sender.verified.yaml
    # Subscriptions
    user.subscription.created.yaml
    user.subscription.updated.yaml
    user.subscription.deleted.yaml
    user.subscription.expiring.yaml
    user.subscription.create.failed.yaml
    user.subscription.update.failed.yaml
    user.subscription.item.updated.yaml
    user.subscription.status.{active,trialing,...}.yaml
    # Entitlements
    user.entitlement.created.yaml
    user.entitlement.updated.yaml
    user.entitlement.deleted.yaml
    user.entitlement.canceled.yaml
    user.entitlement.failed.yaml
    # Distributions
    distribution.created.yaml
    distribution.published.yaml
    distribution.failed.yaml
    distribution.queued.yaml
    distribution.feed.invalidated.yaml
    # Feeds + Audiences
    user.feed.build.yaml     user.audience.refresh.yaml
    application.feed.built.yaml
    application.audience.refresh.yaml
    # Credits + Gifts + Teams
    credit.created.yaml      credit.deleted.yaml
    gift.created.yaml        gift.invite.created.yaml
    gift.invite.redeemed.yaml gift.invite.rejected.yaml
    team.member.added.yaml   team.member.removed.yaml
    team.invite.accepted.yaml team.invite.rejected.yaml
    # Jobs
    job.started.yaml         job.completed.yaml
    job.failed.yaml          job.canceled.yaml
  oauth/
    openid/                  # OpenID Connect types
      profile.yaml           # Full profile (embeds address)
      address.yaml           # Address claim
  stripe/                    # Stripe webhooks (raw data.object)
    charge.succeeded.yaml    charge.failed.yaml
    charge.refunded.yaml
    customer.created.yaml    customer.updated.yaml
    customer.deleted.yaml
    customer.subscription.created.yaml
    customer.subscription.updated.yaml
    customer.subscription.deleted.yaml
    invoice.created.yaml     invoice.upcoming.yaml
    invoice.payment_succeeded.yaml
    invoice.payment_failed.yaml
    invoiceitem.created.yaml
    payment_intent.succeeded.yaml
    payment_intent.processing.yaml
    payment_intent.requires_action.yaml
    payment_intent.payment_failed.yaml
    payment_method.attached.yaml
    payment_method.updated.yaml
    payment_method.detached.yaml
    setup_intent.requires_action.yaml
    credit_note.created.yaml
```

## Versioning Convention

Each schema file contains a `version` field using semantic versioning (e.g. `"1.0.0"`).

**Reference syntax** (used in workflow definitions):

```yaml
on:
  - event:
      name: user.email.verify
      schema:
        ref: libatomic/passport-actions/schemas/atomic/user.email.verify@v1.0.0
```

- The ref format is: `<org>/<repo>/schemas/<namespace>/<name>@v<semver>`
- The `@v<semver>` suffix maps to the `version` field inside the schema document
- The version in the ref must match the schema's `version` field for validation

**Breaking changes** bump the major version. Additive changes (new optional fields)
bump the minor version. Documentation-only changes bump the patch.

### File naming

The default file (`<name>.yaml`) is always v1.0.x. No versioned filename is needed
until the schema evolves past v1.0:

```
oauth/openid/
  profile.yaml           # v1.0.0 (default — always v1)
  profile@v1.1.yaml      # v1.1.0 (added optional fields)
  profile@v2.yaml        # v2.0.0 (breaking change)
  profile@v2.1.yaml      # v2.1.0
```

The resolver maps a ref to a filename:

| Ref version | File tried first | Fallback |
|---|---|---|
| `@v1.0.0` or unversioned | `profile.yaml` | — |
| `@v1.1.0` | `profile@v1.1.yaml` | `profile.yaml` |
| `@v2.0.0` | `profile@v2.yaml` | `profile.yaml` |
| `@v2.1.0` | `profile@v2.1.yaml` | `profile.yaml` |

The fallback ensures refs resolve even before versioned files are created. The
`version` field inside the file is still validated — a mismatch produces a console
warning.

## Nested `$ref` References

Schemas can reference other schemas using the same versioned ref syntax in a `$ref`
property. This avoids duplicating shared types (like OpenID profile) across every
event schema.

```yaml
# In an event schema:
properties:
  member:
    $ref: libatomic/passport-actions/schemas/oauth/openid/profile@v1.0.0
  instance:
    $ref: libatomic/passport-actions/schemas/atomic/instance@v1.0.0
  profile:
    description: OpenID profile (partial update)
    $ref: libatomic/passport-actions/schemas/oauth/openid/profile@v1.0.0
```

When a property has both `$ref` and `description`, the description overrides the
referenced schema's description (useful for adding context like "partial update").

The schema resolver fetches and caches referenced schemas recursively, with cycle
detection to prevent infinite loops.

## What the Schema Describes

For **atomic events**, the schema describes the full event body as emitted by the
code. Notification events (verify, signup, password) typically include:

- `code` — OTP code (when applicable)
- `link` — action URL with embedded token
- `token` — access token
- `member` — user's OpenID profile (`$ref` to `oauth/openid/profile`)
- `instance` — instance context (`$ref` to `atomic/instance`)
- `template_options` — admin-only template rendering options

For **Stripe events**, the schema describes the raw Stripe `data.object` as it
arrives from the webhook — the actual Stripe API object (Charge, Invoice,
Subscription, etc.) with no atomic-specific wrapping.

## Usage in Workflows

```yaml
name: Welcome Email
on:
  - event:
      name: user.email.verified
      schema:
        ref: libatomic/passport-actions/schemas/atomic/user.email.verified@v1.0.0

steps:
  - id: send-welcome
    action: sendmail
    with:
      to: ${{ trigger.body.member.email }}
      template: welcome
      data:
        name: ${{ trigger.body.member.name }}
```

The admin UI uses these schemas to:
1. Auto-detect which trigger fields a workflow uses (`${{ trigger.* }}` scanning)
2. Generate smart input prompts for manual test runs (only fields actually used)
3. Validate trigger context at runtime
4. Show field documentation and examples in the visual builder
5. Resolve `$ref` references to display nested type documentation
