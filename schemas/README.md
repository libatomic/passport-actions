# Event Trigger Schemas

YAML-formatted JSON Schemas describing the **trigger context** available to
workflows when an event fires. These schemas define what fields exist on the
`trigger` object — the data a workflow can access via `${{ trigger.* }}` expressions.

They do **not** describe the event metadata (`event` name, `source`) — those are
already declared in the workflow's `on:` syntax.

## Directory Structure

```
schemas/
  atomic/              # Events emitted by the Atomic core
    user.email.verify.yaml
    user.email.verified.yaml
    ...
  stripe/              # Events from Stripe webhooks
    customer.subscription.created.yaml
    invoice.payment_failed.yaml
    ...
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

- The ref format is: `<org>/<repo>/schemas/<namespace>/<event-name>@v<semver>`
- The `@v<semver>` suffix maps to the `version` field inside the schema document
- On the filesystem, the file is always `<event-name>.yaml` (the `.yaml` extension is
  implied and not included in the ref)
- The version in the ref must match the schema's `version` field for validation

**Breaking changes** bump the major version. Additive changes (new optional fields)
bump the minor version. Documentation-only changes bump the patch.

**Why not git tags?** Git tags are too heavy for individual schema versions — a single
repo may have hundreds of schemas evolving independently. Instead, the version lives
in the schema document itself and the ref resolver reads the file at HEAD and validates
that its `version` field matches the `@v<semver>` in the ref. This is lightweight,
requires no release process, and allows any schema to evolve independently of others
in the same repo.

**Backwards compatibility guarantee:** A workflow pinned to `@v1.0.0` will continue to
work even if the schema at HEAD is bumped to `v1.1.0` (new optional fields added). The
workflow only uses `${{ trigger.* }}` paths it knows about. A major version bump
(`v2.0.0`) signals that required fields were removed or renamed — workflows pinned to
`@v1.x` should be reviewed.

## What the Schema Describes

The schema defines the **trigger context object** — the complete set of fields available
via `${{ trigger.* }}` in workflow steps:

- `user_id` — the subject user (present on virtually all events)
- `body` — the event-specific payload (e.g. verification code, Stripe invoice)
- `member` — user's OpenID profile (when provided by the emitter)
- `instance` — instance context (when provided by the emitter)
- `context` — previous state for update events (Stripe previous_attributes)
- `subscription` — subscription struct (for subscription events)

The `required` array indicates which top-level fields are **always** present. In
practice, `required` can often be derived from the workflow itself — if a step
references `${{ trigger.user_id }}`, that field is implicitly required for the
workflow to execute successfully.

## Usage in Workflows

```yaml
name: Stripe Dunning Email
on:
  - event:
      name: invoice.payment_failed
      schema:
        ref: libatomic/passport-actions/schemas/stripe/invoice.payment_failed@v1.0.0
    source: stripe

steps:
  - id: load-user
    action: user.get
    with:
      id: ${{ trigger.user_id }}

  - id: send-dunning
    action: sendmail
    with:
      to: ${{ steps.load-user.outputs.user.profile.email }}
      data:
        amount_due: ${{ trigger.body.amount_due }}
        invoice_url: ${{ trigger.body.hosted_invoice_url }}
```

The admin UI uses these schemas to:
1. Auto-detect which trigger fields a workflow uses (`${{ trigger.* }}` scanning)
2. Generate smart input prompts for manual test runs (only fields actually used)
3. Validate trigger context at runtime
4. Show field documentation and examples in the visual builder
