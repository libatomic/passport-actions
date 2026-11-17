# Record schemas

The schemas the server provides besides the events' bodies: the records
those bodies and the built-in actions carry, the OpenID profile, and the
Stripe objects Passport relays in its own events. A plugin refers to one as
`passport/schemas/<name>@^<major>`
([3.5](../guide/03-schemas.md#35-the-built-in-passport-schemas)).

> **The tables are generated from the engine**, from the schemas the server
> carries under the `passport` namespace. Never edit between a
> `reference:begin` and a `reference:end` comment: change the engine and run
> the refresh command at the top of [BUILTINS.md](BUILTINS.md).

A Passport record id (`passport.id`) is short text such as
`Ch3oep6QbWZm8q5XEjgS5`, not a UUID
([2.4](../guide/02-field-schema.md#24-formats)).

## All schemas

<!-- reference:begin schemas -->
| Schema | Reference | Family | Description |
|---|---|---|---|
| `application` | `passport/schemas/application@^1` | record | Atomic application (OAuth client) as serialized in event bodies and API responses. |
| `entitlement` | `passport/schemas/entitlement@^1` | record | Atomic entitlement as serialized in event bodies and API responses. |
| `instance` | `passport/schemas/instance@^1` | record | Atomic instance as serialized in event bodies. Contains the full instance struct including configuration fields. |
| `job` | `passport/schemas/job@^1` | record | Atomic job as serialized in event bodies. |
| `openid.address` | `passport/schemas/openid.address@^1` | openid | OpenID Connect address claim (section 5.1.1 of the connect core 1.0 spec). |
| `openid.profile` | `passport/schemas/openid.profile@^1` | openid | OpenID Connect standard claims profile. Includes embedded email, phone, and address claims flattened at the top level. |
| `stripe.charge.failed` | `passport/schemas/stripe.charge.failed@^1` | stripe | Event body schema for Stripe charge.failed. The Stripe charge object for a failed charge. |
| `stripe.charge.refunded` | `passport/schemas/stripe.charge.refunded@^1` | stripe | Event body schema for Stripe charge.refunded. The Stripe charge object with refund information. |
| `stripe.charge.succeeded` | `passport/schemas/stripe.charge.succeeded@^1` | stripe | Event body schema for Stripe charge.succeeded. The Stripe charge object for a successful charge. |
| `stripe.credit_note.created` | `passport/schemas/stripe.credit_note.created@^1` | stripe | Event body schema for Stripe credit_note.created. The Stripe CreditNote object. |
| `stripe.customer.created` | `passport/schemas/stripe.customer.created@^1` | stripe | Event body schema for Stripe customer.created. The Stripe customer object. |
| `stripe.customer.deleted` | `passport/schemas/stripe.customer.deleted@^1` | stripe | Event body schema for Stripe customer.deleted. The Stripe customer object marked as deleted. |
| `stripe.customer.subscription.created` | `passport/schemas/stripe.customer.subscription.created@^1` | stripe | Event body schema for Stripe customer.subscription.created. The Stripe subscription object. |
| `stripe.customer.subscription.deleted` | `passport/schemas/stripe.customer.subscription.deleted@^1` | stripe | Event body schema for Stripe customer.subscription.deleted. The Stripe subscription object in canceled state. |
| `stripe.customer.subscription.updated` | `passport/schemas/stripe.customer.subscription.updated@^1` | stripe | Event body schema for Stripe customer.subscription.updated. The Stripe subscription object after update. |
| `stripe.customer.updated` | `passport/schemas/stripe.customer.updated@^1` | stripe | Event body schema for Stripe customer.updated. The Stripe customer object after update. |
| `stripe.invoice.created` | `passport/schemas/stripe.invoice.created@^1` | stripe | Event body schema for Stripe invoice.created. The Stripe invoice object. |
| `stripe.invoice.payment_failed` | `passport/schemas/stripe.invoice.payment_failed@^1` | stripe | Event body schema for Stripe invoice.payment_failed. The Stripe invoice object for a failed payment attempt. |
| `stripe.invoice.payment_succeeded` | `passport/schemas/stripe.invoice.payment_succeeded@^1` | stripe | Event body schema for Stripe invoice.payment_succeeded. The Stripe invoice object for a successful payment. |
| `stripe.invoice.upcoming` | `passport/schemas/stripe.invoice.upcoming@^1` | stripe | Event body schema for Stripe invoice.upcoming. The upcoming Stripe invoice object (not yet finalized), fired a few days before renewal. |
| `stripe.invoiceitem.created` | `passport/schemas/stripe.invoiceitem.created@^1` | stripe | Event body schema for Stripe invoiceitem.created. The Stripe InvoiceItem object. |
| `stripe.payment_intent.payment_failed` | `passport/schemas/stripe.payment_intent.payment_failed@^1` | stripe | Event body schema for Stripe payment_intent.payment_failed. The Stripe PaymentIntent object for a failed payment. |
| `stripe.payment_intent.processing` | `passport/schemas/stripe.payment_intent.processing@^1` | stripe | Event body schema for Stripe payment_intent.processing. The Stripe PaymentIntent object in processing state. |
| `stripe.payment_intent.requires_action` | `passport/schemas/stripe.payment_intent.requires_action@^1` | stripe | Event body schema for Stripe payment_intent.requires_action. The Stripe PaymentIntent object requiring customer action. |
| `stripe.payment_intent.succeeded` | `passport/schemas/stripe.payment_intent.succeeded@^1` | stripe | Event body schema for Stripe payment_intent.succeeded. The Stripe PaymentIntent object for a successful payment. |
| `stripe.payment_method.attached` | `passport/schemas/stripe.payment_method.attached@^1` | stripe | Event body schema for Stripe payment_method.attached. The Stripe PaymentMethod object after being attached to a customer. |
| `stripe.payment_method.detached` | `passport/schemas/stripe.payment_method.detached@^1` | stripe | Event body schema for Stripe payment_method.detached. The Stripe PaymentMethod object after being detached from a customer. |
| `stripe.payment_method.updated` | `passport/schemas/stripe.payment_method.updated@^1` | stripe | Event body schema for Stripe payment_method.updated. The Stripe PaymentMethod object after update. |
| `stripe.setup_intent.requires_action` | `passport/schemas/stripe.setup_intent.requires_action@^1` | stripe | Event body schema for Stripe setup_intent.requires_action. The Stripe SetupIntent object requiring customer action. |
| `subscription` | `passport/schemas/subscription@^1` | record | Atomic subscription as serialized in event bodies and API responses. |
| `user` | `passport/schemas/user@^1` | record | Atomic user as serialized in event bodies and API responses. |
| `user.subscription.status` | `passport/schemas/user.subscription.status@^1` | record | Shared body shape for every subscription status-change event (user.subscription.status.*). Use this schema as the reference for wildcard triggers such as `user.subscription.status.*`; each concrete status event (active, past_due, canceled, paused, trialing, unpaid, …) carries this same shape. |
<!-- reference:end schemas -->

## Properties

<!-- reference:begin schema-bodies -->
#### `application`

| Property | Type | Required | Description |
|---|---|---|---|
| `allowed_grants` | array of string | no |  |
| `client_id` | string | no |  |
| `client_secret` | string | no |  |
| `created_at` | string (`date-time`) | no |  |
| `custom_scope` | array of string | no |  |
| `description` | string | no |  |
| `id` | string (`passport.id`) | no |  |
| `instance_id` | string (`passport.id`) | no |  |
| `integration` | string (`byte`) | no |  |
| `integration_type` | string | no |  |
| `metadata` | object | no |  |
| `name` | string | no |  |
| `permissions` | array of string | no |  |
| `redirects` | array of string | no |  |
| `refresh_token_lifetime` | integer | no |  |
| `roles` | array of string | no |  |
| `session_cookie` | string | no |  |
| `session_domain` | string | no |  |
| `session_lifetime` | integer | no |  |
| `settings` | object | no |  |
| `slug` | string | no |  |
| `token_lifetime` | integer | no |  |
| `type` | string | no |  |
| `updated_at` | string (`date-time`) | no |  |

#### `entitlement`

| Property | Type | Required | Description |
|---|---|---|---|
| `active` | boolean | no |  |
| `application_id` | string (`passport.id`) | no |  |
| `categories` | array of object | no |  |
| `created_at` | string (`date-time`) | no |  |
| `expires_at` | string (`date-time`) | no |  |
| `id` | string (`passport.id`) | no |  |
| `instance_id` | string (`passport.id`) | no |  |
| `metadata` | object | no |  |
| `permissions` | array of string | no |  |
| `plan_id` | string (`passport.id`) | no |  |
| `price_id` | string (`passport.id`) | no |  |
| `status` | string | no |  |
| `stripe_invoice` | string | no |  |
| `subscription_id` | string (`passport.id`) | no |  |
| `updated_at` | string (`date-time`) | no |  |
| `user_id` | string (`passport.id`) | no |  |

#### `instance`

| Property | Type | Required | Description |
|---|---|---|---|
| `created_at` | string (`date-time`) | no |  |
| `description` | string | no |  |
| `domains` | array of object | no |  |
| `id` | string (`passport.id`) | no |  |
| `metadata` | object | no |  |
| `name` | string | no | Instance hostname/identifier |
| `origins` | array of string | no |  |
| `parent_id` | string (`passport.id`) | no |  |
| `session_cookie` | string | no |  |
| `session_lifetime` | integer | no |  |
| `title` | string | no |  |
| `token_algorithm` | string | no |  |
| `token_lifetime` | integer | no |  |
| `updated_at` | string (`date-time`) | no |  |

#### `job`

| Property | Type | Required | Description |
|---|---|---|---|
| `application_id` | string (`passport.id`) | no |  |
| `artifact_id` | string (`passport.id`) | no |  |
| `canceled` | boolean | no |  |
| `child_job_id` | string (`passport.id`) | no |  |
| `completed_at` | string (`date-time`) | no |  |
| `created_at` | string (`date-time`) | no |  |
| `group_id` | string (`passport.id`) | no |  |
| `hash` | string | no |  |
| `id` | string (`passport.id`) | no |  |
| `instance_id` | string (`passport.id`) | no |  |
| `interval` | integer | no | Recurring interval in nanoseconds |
| `params` | object | no |  |
| `protected` | boolean | no |  |
| `retry_at` | string (`date-time`) | no |  |
| `silent` | boolean | no |  |
| `state` | object | no |  |
| `type` | string | no |  |

#### `openid.address`

| Property | Type | Required | Description |
|---|---|---|---|
| `country` | string | no |  |
| `formatted` | string | no | Full mailing address formatted for display |
| `locality` | string | no | City or locality |
| `postal_code` | string | no |  |
| `region` | string | no | State, province, prefecture, or region |
| `street_address` | string | no |  |

#### `openid.profile`

| Property | Type | Required | Description |
|---|---|---|---|
| `address` | `passport/schemas/openid.address@^1` | no |  |
| `beta_enabled` | boolean | no |  |
| `birthdate` | string (`date-time`) | no |  |
| `claims` | object | no | Additional custom claims |
| `email` | string (`email`) | no |  |
| `email_risk_score` | integer | no |  |
| `email_soft_bounce_reason` | string | no |  |
| `email_soft_bounce_time` | string | no |  |
| `email_soft_bounce_type` | string | no |  |
| `email_suppress_reason` | string | no |  |
| `email_suppress_type` | string | no |  |
| `email_suppressed` | boolean | no |  |
| `email_verified` | boolean | no |  |
| `family_name` | string | no |  |
| `gender` | string | no |  |
| `given_name` | string | no |  |
| `locale` | string | no | BCP47 language tag (e.g. en-US) |
| `middle_name` | string | no |  |
| `name` | string | no | Full name in displayable form |
| `nickname` | string | no |  |
| `phone_number` | string | no | E.164 format |
| `phone_number_verified` | boolean | no |  |
| `picture` | string (`uri`) | no |  |
| `preferred_username` | string | no |  |
| `profile` | string (`uri`) | no | URL of the user's profile page |
| `sub` | string | no | Subject identifier |
| `updated_at` | integer | no | Unix timestamp of last profile update |
| `website` | string (`uri`) | no |  |
| `zoneinfo` | string | no | Time zone (e.g. America/Los_Angeles) |

#### `stripe.charge.failed`

| Property | Type | Required | Description |
|---|---|---|---|
| `amount` | integer | no |  |
| `currency` | string | no |  |
| `customer` | string | no |  |
| `failure_code` | string | no |  |
| `failure_message` | string | no |  |
| `id` | string | no |  |
| `invoice` | string | no |  |
| `metadata` | object | no |  |
| `payment_method` | string | no |  |
| `status` | string | no |  |

#### `stripe.charge.refunded`

| Property | Type | Required | Description |
|---|---|---|---|
| `amount` | integer | no |  |
| `amount_refunded` | integer | no |  |
| `currency` | string | no |  |
| `customer` | string | no |  |
| `id` | string | no |  |
| `metadata` | object | no |  |
| `refunded` | boolean | no |  |
| `refunds` | object | no |  |

#### `stripe.charge.succeeded`

| Property | Type | Required | Description |
|---|---|---|---|
| `amount` | integer | no |  |
| `currency` | string | no |  |
| `customer` | string | no |  |
| `description` | string | no |  |
| `id` | string | no |  |
| `invoice` | string | no |  |
| `metadata` | object | no |  |
| `payment_method` | string | no |  |
| `receipt_url` | string (`uri`) | no |  |
| `status` | string | no |  |

#### `stripe.credit_note.created`

| Property | Type | Required | Description |
|---|---|---|---|
| `amount` | integer | no |  |
| `currency` | string | no |  |
| `customer` | string | no |  |
| `id` | string | no |  |
| `invoice` | string | no |  |
| `lines` | object | no |  |
| `memo` | string | no |  |
| `metadata` | object | no |  |
| `reason` | string | no |  |
| `status` | string | no |  |
| `type` | string | no |  |

#### `stripe.customer.created`

| Property | Type | Required | Description |
|---|---|---|---|
| `created` | integer | no |  |
| `email` | string (`email`) | no |  |
| `id` | string | no |  |
| `metadata` | object | no |  |
| `name` | string | no |  |
| `phone` | string | no |  |

#### `stripe.customer.deleted`

| Property | Type | Required | Description |
|---|---|---|---|
| `deleted` | boolean | no |  |
| `email` | string (`email`) | no |  |
| `id` | string | no |  |
| `metadata` | object | no |  |

#### `stripe.customer.subscription.created`

| Property | Type | Required | Description |
|---|---|---|---|
| `cancel_at_period_end` | boolean | no |  |
| `current_period_end` | integer | no |  |
| `current_period_start` | integer | no |  |
| `customer` | string | no |  |
| `id` | string | no |  |
| `items` | object | no |  |
| `metadata` | object | no |  |
| `status` | string | no |  |
| `trial_end` | integer | no |  |
| `trial_start` | integer | no |  |

#### `stripe.customer.subscription.deleted`

| Property | Type | Required | Description |
|---|---|---|---|
| `canceled_at` | integer | no |  |
| `customer` | string | no |  |
| `ended_at` | integer | no |  |
| `id` | string | no |  |
| `items` | object | no |  |
| `metadata` | object | no |  |
| `status` | string | no |  |

#### `stripe.customer.subscription.updated`

| Property | Type | Required | Description |
|---|---|---|---|
| `cancel_at_period_end` | boolean | no |  |
| `canceled_at` | integer | no |  |
| `current_period_end` | integer | no |  |
| `current_period_start` | integer | no |  |
| `customer` | string | no |  |
| `id` | string | no |  |
| `items` | object | no |  |
| `metadata` | object | no |  |
| `status` | string | no |  |

#### `stripe.customer.updated`

| Property | Type | Required | Description |
|---|---|---|---|
| `default_source` | string | no |  |
| `email` | string (`email`) | no |  |
| `id` | string | no |  |
| `invoice_settings` | object | no |  |
| `metadata` | object | no |  |
| `name` | string | no |  |
| `phone` | string | no |  |

#### `stripe.invoice.created`

| Property | Type | Required | Description |
|---|---|---|---|
| `amount_due` | integer | no |  |
| `currency` | string | no |  |
| `customer` | string | no |  |
| `due_date` | integer | no |  |
| `id` | string | no |  |
| `lines` | object | no |  |
| `metadata` | object | no |  |
| `period_end` | integer | no |  |
| `period_start` | integer | no |  |
| `status` | string | no |  |
| `subscription` | string | no |  |

#### `stripe.invoice.payment_failed`

| Property | Type | Required | Description |
|---|---|---|---|
| `amount_due` | integer | no | Amount due in cents |
| `attempt_count` | integer | no |  |
| `currency` | string | no |  |
| `customer` | string | no |  |
| `hosted_invoice_url` | string (`uri`) | no |  |
| `id` | string | no |  |
| `metadata` | object | no |  |
| `next_payment_attempt` | integer | no | Unix timestamp of next retry |
| `status` | string | no |  |
| `subscription` | string | no |  |

#### `stripe.invoice.payment_succeeded`

| Property | Type | Required | Description |
|---|---|---|---|
| `amount_paid` | integer | no | Amount paid in cents |
| `currency` | string | no |  |
| `customer` | string | no |  |
| `hosted_invoice_url` | string (`uri`) | no |  |
| `id` | string | no |  |
| `invoice_pdf` | string (`uri`) | no |  |
| `lines` | object | no |  |
| `metadata` | object | no |  |
| `status` | string | no |  |
| `subscription` | string | no |  |

#### `stripe.invoice.upcoming`

| Property | Type | Required | Description |
|---|---|---|---|
| `amount_due` | integer | no |  |
| `currency` | string | no |  |
| `customer` | string | no |  |
| `lines` | object | no |  |
| `metadata` | object | no |  |
| `next_payment_attempt` | integer | no |  |
| `period_end` | integer | no |  |
| `period_start` | integer | no |  |
| `subscription` | string | no |  |

#### `stripe.invoiceitem.created`

| Property | Type | Required | Description |
|---|---|---|---|
| `amount` | integer | no |  |
| `currency` | string | no |  |
| `customer` | string | no |  |
| `description` | string | no |  |
| `id` | string | no |  |
| `invoice` | string | no |  |
| `metadata` | object | no |  |
| `price` | object | no |  |
| `quantity` | integer | no |  |
| `subscription` | string | no |  |

#### `stripe.payment_intent.payment_failed`

| Property | Type | Required | Description |
|---|---|---|---|
| `amount` | integer | no |  |
| `currency` | string | no |  |
| `customer` | string | no |  |
| `id` | string | no |  |
| `last_payment_error` | object | no |  |
| `metadata` | object | no |  |
| `payment_method` | string | no |  |
| `status` | string | no |  |

#### `stripe.payment_intent.processing`

| Property | Type | Required | Description |
|---|---|---|---|
| `amount` | integer | no |  |
| `currency` | string | no |  |
| `customer` | string | no |  |
| `id` | string | no |  |
| `metadata` | object | no |  |
| `payment_method` | string | no |  |
| `payment_method_types` | array of string | no |  |
| `status` | string | no |  |

#### `stripe.payment_intent.requires_action`

| Property | Type | Required | Description |
|---|---|---|---|
| `amount` | integer | no |  |
| `client_secret` | string | no |  |
| `currency` | string | no |  |
| `customer` | string | no |  |
| `id` | string | no |  |
| `metadata` | object | no |  |
| `next_action` | object | no |  |
| `status` | string | no |  |

#### `stripe.payment_intent.succeeded`

| Property | Type | Required | Description |
|---|---|---|---|
| `amount` | integer | no |  |
| `currency` | string | no |  |
| `customer` | string | no |  |
| `description` | string | no |  |
| `id` | string | no |  |
| `invoice` | string | no |  |
| `metadata` | object | no |  |
| `payment_method` | string | no |  |
| `status` | string | no |  |

#### `stripe.payment_method.attached`

| Property | Type | Required | Description |
|---|---|---|---|
| `card` | object | no |  |
| `customer` | string | no |  |
| `id` | string | no |  |
| `metadata` | object | no |  |
| `type` | string | no |  |
| `us_bank_account` | object | no |  |

#### `stripe.payment_method.detached`

| Property | Type | Required | Description |
|---|---|---|---|
| `card` | object | no |  |
| `id` | string | no |  |
| `metadata` | object | no |  |
| `type` | string | no |  |

#### `stripe.payment_method.updated`

| Property | Type | Required | Description |
|---|---|---|---|
| `card` | object | no |  |
| `customer` | string | no |  |
| `id` | string | no |  |
| `metadata` | object | no |  |
| `type` | string | no |  |

#### `stripe.setup_intent.requires_action`

| Property | Type | Required | Description |
|---|---|---|---|
| `client_secret` | string | no |  |
| `customer` | string | no |  |
| `id` | string | no |  |
| `metadata` | object | no |  |
| `next_action` | object | no |  |
| `payment_method` | string | no |  |
| `payment_method_types` | array of string | no |  |
| `status` | string | no |  |

#### `subscription`

| Property | Type | Required | Description |
|---|---|---|---|
| `admin_email` | string (`email`) | no |  |
| `auto_renew` | boolean | no |  |
| `begins_at` | string (`date-time`) | no |  |
| `cancel_at` | string (`date-time`) | no |  |
| `canceled` | boolean | no |  |
| `created_at` | string (`date-time`) | no |  |
| `credit_id` | string (`passport.id`) | no |  |
| `ends_at` | string (`date-time`) | no |  |
| `id` | string (`passport.id`) | no |  |
| `instance_id` | string (`passport.id`) | no |  |
| `last_stripe_sync` | string (`date-time`) | no |  |
| `metadata` | object | no |  |
| `name` | string | no |  |
| `no_entitlement` | boolean | no |  |
| `paused_at` | string (`date-time`) | no |  |
| `plan_id` | string (`passport.id`) | no |  |
| `price_id` | string (`passport.id`) | no |  |
| `quantity` | integer | no |  |
| `recurring_frequency` | integer | no |  |
| `recurring_interval` | string | no |  |
| `status` | string | no |  |
| `stripe_item` | string | no |  |
| `stripe_subscription` | string | no |  |
| `terms` | object | no |  |
| `trial_ends_at` | string (`date-time`) | no |  |
| `type` | string | no |  |
| `updated_at` | string (`date-time`) | no |  |
| `user_id` | string (`passport.id`) | no |  |

#### `user`

| Property | Type | Required | Description |
|---|---|---|---|
| `created_at` | string (`date-time`) | no |  |
| `entitlements` | array of `passport/schemas/entitlement@^1` | no |  |
| `id` | string (`passport.id`) | no |  |
| `instance_id` | string (`passport.id`) | no |  |
| `login` | string | no |  |
| `metadata` | object | no |  |
| `mfa_required` | boolean | no |  |
| `password_expires_at` | string (`date-time`) | no |  |
| `permissions` | array of string | no |  |
| `phone_number` | string | no | E.164 format |
| `preferences` | object | no |  |
| `profile` | `passport/schemas/openid.profile@^1` | no |  |
| `roles` | array of string | no |  |
| `stripe_account` | object | no |  |
| `subject` | string (`passport.id`) | no |  |
| `subscriptions` | array of `passport/schemas/subscription@^1` | no |  |
| `updated_at` | string (`date-time`) | no |  |

#### `user.subscription.status`

| Property | Type | Required | Description |
|---|---|---|---|
| `prev_status` | string | no | Previous subscription status |
| `status` | string | yes | New subscription status |
| `stripe_subscription` | string | no | Stripe subscription ID (when applicable) |
| `subscription_id` | string (`passport.id`) | yes | Subscription ID |

<!-- reference:end schema-bodies -->
