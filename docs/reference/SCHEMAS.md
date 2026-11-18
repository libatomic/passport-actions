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
| `application` | `passport/schemas/application@^1` | record | A Passport application (an OAuth client), as event bodies and API responses carry it. |
| `channel.delete.result` | `passport/schemas/channel.delete.result@^1` | channel | What a channel's delete flow returns, before the distribution is deleted. |
| `channel.preview.result` | `passport/schemas/channel.preview.result@^1` | channel | What a channel's preview flow returns: what would be sent. At least one of text, html, audio and url is there. |
| `channel.publish.member.result` | `passport/schemas/channel.publish.member.result@^1` | channel | What the publish flow of a per_member channel returns for the member it ran for. Passport keeps it as that member's row of the distribution's delivery log. |
| `channel.publish.result` | `passport/schemas/channel.publish.result@^1` | channel | What a channel's publish flow returns for a distribution published once. Passport keeps it with the distribution and hands it to every later flow as published. |
| `channel.status.result` | `passport/schemas/channel.status.result@^1` | channel | What a channel's status flow returns: what the destination says became of what was published. |
| `channel.update.result` | `passport/schemas/channel.update.result@^1` | channel | What a channel's update flow returns. The keys are those of a publish; an id, url or data left out stays as Passport has it. It is handed to every later flow as published. |
| `entitlement` | `passport/schemas/entitlement@^1` | record | A Passport entitlement, as event bodies and API responses carry it. |
| `extension.distribution.email.member.result` | `passport/schemas/extension.distribution.email.member.result@^1` | extension | What the member flow of a distribution extension on the email channel returns: the keys of this member's message it changed. A key left out is left as it was. |
| `extension.distribution.email.result` | `passport/schemas/extension.distribution.email.result@^1` | extension | What the run flow, or the preview flow, of a distribution extension on the email channel returns: the keys of the email it changed. A key left out is left as it was. |
| `extension.distribution.feed.result` | `passport/schemas/extension.distribution.feed.result@^1` | extension | What the run flow, or the preview flow, of a distribution extension on the podcast or the rss channel returns: the keys of the feed item it changed. A key left out is left as it was. |
| `extension.distribution.sms.result` | `passport/schemas/extension.distribution.sms.result@^1` | extension | What a flow of a distribution extension on the sms channel returns: the message, when it changed it. In the run and preview flows it is the message before member values are filled in; in the member flow it is this member's message as it will be sent. |
| `extension.preview.result` | `passport/schemas/extension.preview.result@^1` | extension | What an extension's preview flow returns: what to play, or the text that would be worked on. At least one of text and audio is there. |
| `instance` | `passport/schemas/instance@^1` | record | A Passport instance (a site), as event bodies carry it, with its configuration. |
| `job` | `passport/schemas/job@^1` | record | A Passport job, as event bodies carry it. |
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
| `subscription` | `passport/schemas/subscription@^1` | record | A Passport subscription, as event bodies and API responses carry it. |
| `user` | `passport/schemas/user@^1` | record | A Passport user, as event bodies and API responses carry it. |
| `user.subscription.status` | `passport/schemas/user.subscription.status@^1` | record | Shared body shape for every subscription status-change event (user.subscription.status.*). Use this schema as the reference for wildcard triggers such as `user.subscription.status.*`; each concrete status event (active, past_due, canceled, paused, trialing, unpaid, …) carries this same shape. |
<!-- reference:end schemas -->

## Properties

<!-- reference:begin schema-bodies -->
#### `application`

A Passport application (an OAuth client), as event bodies and API responses carry it.

Version 1.0.0, referred to as `passport/schemas/application@^1`.

| Property | Type | Required | Description |
|---|---|---|---|
| `id` | string (`passport.id`) | no |  |
| `instance_id` | string (`passport.id`) | no |  |
| `created_at` | string (`date-time`) | no |  |
| `updated_at` | string (`date-time`) | no |  |
| `name` | string | no |  |
| `slug` | string | no |  |
| `description` | string | no |  |
| `type` | string | no |  |
| `client_id` | string | no |  |
| `client_secret` | string | no |  |
| `token_lifetime` | integer | no |  |
| `session_cookie` | string | no |  |
| `refresh_token_lifetime` | integer | no |  |
| `metadata` | object | no |  |
| `settings` | object | no |  |
| `integration_type` | string | no |  |
| `integration` | string (`byte`) | no |  |
| `redirects` | array of string | no |  |
| `allowed_grants` | array of string | no |  |
| `permissions` | array of string | no |  |
| `roles` | array of string | no |  |
| `custom_scope` | array of string | no |  |
| `session_lifetime` | integer | no |  |
| `session_domain` | string | no |  |

#### `channel.delete.result`

What a channel's delete flow returns, before the distribution is deleted.

Version 1.0.0, referred to as `passport/schemas/channel.delete.result@^1`.

| Property | Type | Required | Description |
|---|---|---|---|
| `status` |  | yes | deleted: it was removed. not_found: it was already gone, which counts as success. kept: the destination refused, or cannot remove it; the distribution is then kept. |
| `note` | string | no | A short line for the publisher. Give one with kept. |

#### `channel.preview.result`

What a channel's preview flow returns: what would be sent. At least one of text, html, audio and url is there.

Version 1.0.0, referred to as `passport/schemas/channel.preview.result@^1`.

| Property | Type | Required | Description |
|---|---|---|---|
| `text` | string | no | The text that would be sent, paragraphs separated by blank lines. |
| `html` | string | no | The HTML that would be sent, shown as a page. Only on a channel whose content_type is html. |
| `audio` | string | no | Audio, as base64 text, played in place. Needs audio_type. |
| `audio_type` | string | no | The audio's media type, audio/mpeg for example. |
| `url` | string (`uri`) | no | A link to a draft at the destination, when the vendor has one. |
| `characters` | integer | no | The length of what would be sent. |
| `limit` | integer | no | The destination's limit, shown against characters. 0 or left out: no limit. |
| `note` | string | no | A short line under the preview. |

#### `channel.publish.member.result`

What the publish flow of a per_member channel returns for the member it ran for. Passport keeps it as that member's row of the distribution's delivery log.

Version 1.0.0, referred to as `passport/schemas/channel.publish.member.result@^1`.

| Property | Type | Required | Description |
|---|---|---|---|
| `status` |  | yes | sent: the destination took the message for this member. skipped: nothing was sent, and that is not a fault (no address, opted out). |
| `id` | string | no | The message's id at the destination. |
| `note` | string | no | Why it was skipped, or anything worth showing beside the member. |

#### `channel.publish.result`

What a channel's publish flow returns for a distribution published once. Passport keeps it with the distribution and hands it to every later flow as published.

Version 1.0.0, referred to as `passport/schemas/channel.publish.result@^1`.

| Property | Type | Required | Description |
|---|---|---|---|
| `status` |  | yes | published: it is live. pending: the destination accepted it and it is not live yet; Passport asks the status flow later. A failure is not a status: fail the run. |
| `id` | string | no | The thing's id at the destination. Later flows read it as published.id. |
| `url` | string (`uri`) | no | Where a person can see it. The admin shows it as the link on the distribution. |
| `data` | object | no | Anything the channel needs later, handed back as published.data. Up to 64 KB as JSON; never a secret, never binary. |
| `note` | string | no | A short line the admin shows on the distribution. |

#### `channel.status.result`

What a channel's status flow returns: what the destination says became of what was published.

Version 1.0.0, referred to as `passport/schemas/channel.status.result@^1`.

| Property | Type | Required | Description |
|---|---|---|---|
| `status` |  | yes | published: it is live. pending: not live yet. failed: the destination gave up on it. removed: it was there and is gone. unknown: the destination could not say; nothing changes. |
| `url` | string (`uri`) | no | Where a person can see it now, if that changed or was not known at publish. |
| `note` | string | no | A short line: why it failed, how long it may take. |
| `checked_at` | string (`date-time`) | no | When the destination was asked. Defaults to now. |
| `metrics` | object | no | Counts the destination keeps, by name, up to 20. |

#### `channel.update.result`

What a channel's update flow returns. The keys are those of a publish; an id, url or data left out stays as Passport has it. It is handed to every later flow as published.

Version 1.0.0, referred to as `passport/schemas/channel.update.result@^1`.

| Property | Type | Required | Description |
|---|---|---|---|
| `status` |  | yes | published: it is live. pending: the destination accepted it and it is not live yet; Passport asks the status flow later. A failure is not a status: fail the run. |
| `id` | string | no | The thing's id at the destination. Later flows read it as published.id. |
| `url` | string (`uri`) | no | Where a person can see it. The admin shows it as the link on the distribution. |
| `data` | object | no | Anything the channel needs later, handed back as published.data. Up to 64 KB as JSON; never a secret, never binary. |
| `note` | string | no | A short line the admin shows on the distribution. |

#### `entitlement`

A Passport entitlement, as event bodies and API responses carry it.

Version 1.0.0, referred to as `passport/schemas/entitlement@^1`.

| Property | Type | Required | Description |
|---|---|---|---|
| `id` | string (`passport.id`) | no |  |
| `created_at` | string (`date-time`) | no |  |
| `updated_at` | string (`date-time`) | no |  |
| `instance_id` | string (`passport.id`) | no |  |
| `user_id` | string (`passport.id`) | no |  |
| `application_id` | string (`passport.id`) | no |  |
| `expires_at` | string (`date-time`) | no |  |
| `active` | boolean | no |  |
| `permissions` | array of string | no |  |
| `categories` | array of object | no |  |
| `metadata` | object | no |  |
| `plan_id` | string (`passport.id`) | no |  |
| `price_id` | string (`passport.id`) | no |  |
| `stripe_invoice` | string | no |  |
| `subscription_id` | string (`passport.id`) | no |  |
| `status` | string | no |  |

#### `extension.distribution.email.member.result`

What the member flow of a distribution extension on the email channel returns: the keys of this member's message it changed. A key left out is left as it was.

Version 1.0.0, referred to as `passport/schemas/extension.distribution.email.member.result@^1`.

| Property | Type | Required | Description |
|---|---|---|---|
| `subject` | string | no | This member's subject. |
| `body` | string | no | This member's HTML, before link tracking and the open pixel are added. |
| `text` | string | no | This member's plain text. Left out, it is made again from a changed body. |
| `headers` | object | no | Headers added to this member's message. Passport's own headers cannot be set. |
| `attachments` | array of object | no | Files attached to this member's message, each an asset on the site. 10 MiB in all. |

#### `extension.distribution.email.result`

What the run flow, or the preview flow, of a distribution extension on the email channel returns: the keys of the email it changed. A key left out is left as it was.

Version 1.0.0, referred to as `passport/schemas/extension.distribution.email.result@^1`.

| Property | Type | Required | Description |
|---|---|---|---|
| `subject` | string | no | The subject, before member values are filled in. |
| `body` | string | no | The HTML body, before member values are filled in. The template's member placeholders are left as they are. |
| `headers` | object | no | Headers added to every message. Passport's own headers cannot be set. |
| `attachments` | array of object | no | Files attached to every message, each an asset on the site. 10 MiB in all. |

#### `extension.distribution.feed.result`

What the run flow, or the preview flow, of a distribution extension on the podcast or the rss channel returns: the keys of the feed item it changed. A key left out is left as it was.

Version 1.0.0, referred to as `passport/schemas/extension.distribution.feed.result@^1`.

| Property | Type | Required | Description |
|---|---|---|---|
| `title` | string | no | The item's title. |
| `link` | string | no | The item's link. |
| `description` | string | no | The item's description. |
| `content` | string | no | The item's content, as HTML. |
| `enclosure` | object | no | The item's file. |
| `elements` | array of object | no | Elements added to the item, such as podcast:transcript. |

#### `extension.distribution.sms.result`

What a flow of a distribution extension on the sms channel returns: the message, when it changed it. In the run and preview flows it is the message before member values are filled in; in the member flow it is this member's message as it will be sent.

Version 1.0.0, referred to as `passport/schemas/extension.distribution.sms.result@^1`.

| Property | Type | Required | Description |
|---|---|---|---|
| `body` | string | no | The message, as plain text. It is held to the length Passport allows a text message. |

#### `extension.preview.result`

What an extension's preview flow returns: what to play, or the text that would be worked on. At least one of text and audio is there.

Version 1.0.0, referred to as `passport/schemas/extension.preview.result@^1`.

| Property | Type | Required | Description |
|---|---|---|---|
| `text` | string | no | The text that would be worked on, paragraphs separated by blank lines. |
| `audio` | string | no | Audio, as base64 text, played in place. Needs audio_type. |
| `audio_type` | string | no | The audio's media type, audio/mpeg for example. |
| `characters` | integer | no | The length of the text. |
| `limit` | integer | no | The limit the text is held to, shown against characters. 0 or left out: no limit. |
| `note` | string | no | A short line under the preview. |

#### `instance`

A Passport instance (a site), as event bodies carry it, with its configuration.

Version 1.0.0, referred to as `passport/schemas/instance@^1`.

| Property | Type | Required | Description |
|---|---|---|---|
| `id` | string (`passport.id`) | no |  |
| `name` | string | no | Instance hostname/identifier |
| `title` | string | no |  |
| `description` | string | no |  |
| `created_at` | string (`date-time`) | no |  |
| `updated_at` | string (`date-time`) | no |  |
| `token_lifetime` | integer | no |  |
| `token_algorithm` | string | no |  |
| `session_cookie` | string | no |  |
| `session_lifetime` | integer | no |  |
| `metadata` | object | no |  |
| `parent_id` | string (`passport.id`) | no |  |
| `domains` | array of object | no |  |
| `origins` | array of string | no |  |

#### `job`

A Passport job, as event bodies carry it.

Version 1.0.0, referred to as `passport/schemas/job@^1`.

| Property | Type | Required | Description |
|---|---|---|---|
| `id` | string (`passport.id`) | no |  |
| `instance_id` | string (`passport.id`) | no |  |
| `application_id` | string (`passport.id`) | no |  |
| `created_at` | string (`date-time`) | no |  |
| `completed_at` | string (`date-time`) | no |  |
| `retry_at` | string (`date-time`) | no |  |
| `interval` | integer | no | Recurring interval in nanoseconds |
| `type` | string | no |  |
| `hash` | string | no |  |
| `group_id` | string (`passport.id`) | no |  |
| `params` | object | no |  |
| `state` | object | no |  |
| `artifact_id` | string (`passport.id`) | no |  |
| `protected` | boolean | no |  |
| `child_job_id` | string (`passport.id`) | no |  |
| `silent` | boolean | no |  |
| `canceled` | boolean | no |  |

#### `openid.address`

OpenID Connect address claim (section 5.1.1 of the connect core 1.0 spec).

Version 1.0.0, referred to as `passport/schemas/openid.address@^1`.

| Property | Type | Required | Description |
|---|---|---|---|
| `country` | string | no |  |
| `formatted` | string | no | Full mailing address formatted for display |
| `locality` | string | no | City or locality |
| `postal_code` | string | no |  |
| `region` | string | no | State, province, prefecture, or region |
| `street_address` | string | no |  |

#### `openid.profile`

OpenID Connect standard claims profile. Includes embedded email, phone, and address claims flattened at the top level.

Version 1.0.0, referred to as `passport/schemas/openid.profile@^1`.

| Property | Type | Required | Description |
|---|---|---|---|
| `sub` | string | no | Subject identifier |
| `name` | string | no | Full name in displayable form |
| `given_name` | string | no |  |
| `family_name` | string | no |  |
| `middle_name` | string | no |  |
| `nickname` | string | no |  |
| `preferred_username` | string | no |  |
| `profile` | string (`uri`) | no | URL of the user's profile page |
| `picture` | string (`uri`) | no |  |
| `website` | string (`uri`) | no |  |
| `gender` | string | no |  |
| `birthdate` | string (`date-time`) | no |  |
| `zoneinfo` | string | no | Time zone (e.g. America/Los_Angeles) |
| `locale` | string | no | BCP47 language tag (e.g. en-US) |
| `updated_at` | integer | no | Unix timestamp of last profile update |
| `address` | `passport/schemas/openid.address@^1` | no |  |
| `email` | string (`email`) | no |  |
| `email_verified` | boolean | no |  |
| `email_suppressed` | boolean | no |  |
| `email_suppress_type` | string | no |  |
| `email_suppress_reason` | string | no |  |
| `email_soft_bounce_time` | string | no |  |
| `email_soft_bounce_type` | string | no |  |
| `email_soft_bounce_reason` | string | no |  |
| `email_risk_score` | integer | no |  |
| `phone_number` | string | no | E.164 format |
| `phone_number_verified` | boolean | no |  |
| `beta_enabled` | boolean | no |  |
| `claims` | object | no | Additional custom claims |

#### `stripe.charge.failed`

Event body schema for Stripe charge.failed. The Stripe charge object for a failed charge.

Version 1.0.0, referred to as `passport/schemas/stripe.charge.failed@^1`.

| Property | Type | Required | Description |
|---|---|---|---|
| `id` | string | no |  |
| `customer` | string | no |  |
| `amount` | integer | no |  |
| `currency` | string | no |  |
| `status` | string | no |  |
| `failure_code` | string | no |  |
| `failure_message` | string | no |  |
| `payment_method` | string | no |  |
| `invoice` | string | no |  |
| `metadata` | object | no |  |

#### `stripe.charge.refunded`

Event body schema for Stripe charge.refunded. The Stripe charge object with refund information.

Version 1.0.0, referred to as `passport/schemas/stripe.charge.refunded@^1`.

| Property | Type | Required | Description |
|---|---|---|---|
| `id` | string | no |  |
| `customer` | string | no |  |
| `amount` | integer | no |  |
| `amount_refunded` | integer | no |  |
| `currency` | string | no |  |
| `refunded` | boolean | no |  |
| `refunds` | object | no |  |
| `metadata` | object | no |  |

#### `stripe.charge.succeeded`

Event body schema for Stripe charge.succeeded. The Stripe charge object for a successful charge.

Version 1.0.0, referred to as `passport/schemas/stripe.charge.succeeded@^1`.

| Property | Type | Required | Description |
|---|---|---|---|
| `id` | string | no |  |
| `customer` | string | no |  |
| `amount` | integer | no |  |
| `currency` | string | no |  |
| `status` | string | no |  |
| `payment_method` | string | no |  |
| `receipt_url` | string (`uri`) | no |  |
| `description` | string | no |  |
| `invoice` | string | no |  |
| `metadata` | object | no |  |

#### `stripe.credit_note.created`

Event body schema for Stripe credit_note.created. The Stripe CreditNote object.

Version 1.0.0, referred to as `passport/schemas/stripe.credit_note.created@^1`.

| Property | Type | Required | Description |
|---|---|---|---|
| `id` | string | no |  |
| `customer` | string | no |  |
| `invoice` | string | no |  |
| `amount` | integer | no |  |
| `currency` | string | no |  |
| `status` | string | no |  |
| `type` | string | no |  |
| `reason` | string | no |  |
| `memo` | string | no |  |
| `lines` | object | no |  |
| `metadata` | object | no |  |

#### `stripe.customer.created`

Event body schema for Stripe customer.created. The Stripe customer object.

Version 1.0.0, referred to as `passport/schemas/stripe.customer.created@^1`.

| Property | Type | Required | Description |
|---|---|---|---|
| `id` | string | no |  |
| `email` | string (`email`) | no |  |
| `name` | string | no |  |
| `phone` | string | no |  |
| `metadata` | object | no |  |
| `created` | integer | no |  |

#### `stripe.customer.deleted`

Event body schema for Stripe customer.deleted. The Stripe customer object marked as deleted.

Version 1.0.0, referred to as `passport/schemas/stripe.customer.deleted@^1`.

| Property | Type | Required | Description |
|---|---|---|---|
| `id` | string | no |  |
| `deleted` | boolean | no |  |
| `email` | string (`email`) | no |  |
| `metadata` | object | no |  |

#### `stripe.customer.subscription.created`

Event body schema for Stripe customer.subscription.created. The Stripe subscription object.

Version 1.0.0, referred to as `passport/schemas/stripe.customer.subscription.created@^1`.

| Property | Type | Required | Description |
|---|---|---|---|
| `id` | string | no |  |
| `customer` | string | no |  |
| `status` | string | no |  |
| `current_period_start` | integer | no |  |
| `current_period_end` | integer | no |  |
| `cancel_at_period_end` | boolean | no |  |
| `items` | object | no |  |
| `trial_start` | integer | no |  |
| `trial_end` | integer | no |  |
| `metadata` | object | no |  |

#### `stripe.customer.subscription.deleted`

Event body schema for Stripe customer.subscription.deleted. The Stripe subscription object in canceled state.

Version 1.0.0, referred to as `passport/schemas/stripe.customer.subscription.deleted@^1`.

| Property | Type | Required | Description |
|---|---|---|---|
| `id` | string | no |  |
| `customer` | string | no |  |
| `status` | string | no |  |
| `canceled_at` | integer | no |  |
| `ended_at` | integer | no |  |
| `items` | object | no |  |
| `metadata` | object | no |  |

#### `stripe.customer.subscription.updated`

Event body schema for Stripe customer.subscription.updated. The Stripe subscription object after update.

Version 1.0.0, referred to as `passport/schemas/stripe.customer.subscription.updated@^1`.

| Property | Type | Required | Description |
|---|---|---|---|
| `id` | string | no |  |
| `customer` | string | no |  |
| `status` | string | no |  |
| `current_period_start` | integer | no |  |
| `current_period_end` | integer | no |  |
| `cancel_at_period_end` | boolean | no |  |
| `canceled_at` | integer | no |  |
| `items` | object | no |  |
| `metadata` | object | no |  |

#### `stripe.customer.updated`

Event body schema for Stripe customer.updated. The Stripe customer object after update.

Version 1.0.0, referred to as `passport/schemas/stripe.customer.updated@^1`.

| Property | Type | Required | Description |
|---|---|---|---|
| `id` | string | no |  |
| `email` | string (`email`) | no |  |
| `name` | string | no |  |
| `phone` | string | no |  |
| `default_source` | string | no |  |
| `invoice_settings` | object | no |  |
| `metadata` | object | no |  |

#### `stripe.invoice.created`

Event body schema for Stripe invoice.created. The Stripe invoice object.

Version 1.0.0, referred to as `passport/schemas/stripe.invoice.created@^1`.

| Property | Type | Required | Description |
|---|---|---|---|
| `id` | string | no |  |
| `customer` | string | no |  |
| `subscription` | string | no |  |
| `status` | string | no |  |
| `amount_due` | integer | no |  |
| `currency` | string | no |  |
| `due_date` | integer | no |  |
| `period_start` | integer | no |  |
| `period_end` | integer | no |  |
| `lines` | object | no |  |
| `metadata` | object | no |  |

#### `stripe.invoice.payment_failed`

Event body schema for Stripe invoice.payment_failed. The Stripe invoice object for a failed payment attempt.

Version 1.0.0, referred to as `passport/schemas/stripe.invoice.payment_failed@^1`.

| Property | Type | Required | Description |
|---|---|---|---|
| `id` | string | no |  |
| `customer` | string | no |  |
| `subscription` | string | no |  |
| `amount_due` | integer | no | Amount due in cents |
| `currency` | string | no |  |
| `status` | string | no |  |
| `attempt_count` | integer | no |  |
| `next_payment_attempt` | integer | no | Unix timestamp of next retry |
| `hosted_invoice_url` | string (`uri`) | no |  |
| `metadata` | object | no |  |

#### `stripe.invoice.payment_succeeded`

Event body schema for Stripe invoice.payment_succeeded. The Stripe invoice object for a successful payment.

Version 1.0.0, referred to as `passport/schemas/stripe.invoice.payment_succeeded@^1`.

| Property | Type | Required | Description |
|---|---|---|---|
| `id` | string | no |  |
| `customer` | string | no |  |
| `subscription` | string | no |  |
| `amount_paid` | integer | no | Amount paid in cents |
| `currency` | string | no |  |
| `status` | string | no |  |
| `hosted_invoice_url` | string (`uri`) | no |  |
| `invoice_pdf` | string (`uri`) | no |  |
| `lines` | object | no |  |
| `metadata` | object | no |  |

#### `stripe.invoice.upcoming`

Event body schema for Stripe invoice.upcoming. The upcoming Stripe invoice object (not yet finalized), fired a few days before renewal.

Version 1.0.0, referred to as `passport/schemas/stripe.invoice.upcoming@^1`.

| Property | Type | Required | Description |
|---|---|---|---|
| `customer` | string | no |  |
| `subscription` | string | no |  |
| `amount_due` | integer | no |  |
| `currency` | string | no |  |
| `period_start` | integer | no |  |
| `period_end` | integer | no |  |
| `next_payment_attempt` | integer | no |  |
| `lines` | object | no |  |
| `metadata` | object | no |  |

#### `stripe.invoiceitem.created`

Event body schema for Stripe invoiceitem.created. The Stripe InvoiceItem object.

Version 1.0.0, referred to as `passport/schemas/stripe.invoiceitem.created@^1`.

| Property | Type | Required | Description |
|---|---|---|---|
| `id` | string | no |  |
| `customer` | string | no |  |
| `invoice` | string | no |  |
| `subscription` | string | no |  |
| `amount` | integer | no |  |
| `currency` | string | no |  |
| `description` | string | no |  |
| `price` | object | no |  |
| `quantity` | integer | no |  |
| `metadata` | object | no |  |

#### `stripe.payment_intent.payment_failed`

Event body schema for Stripe payment_intent.payment_failed. The Stripe PaymentIntent object for a failed payment.

Version 1.0.0, referred to as `passport/schemas/stripe.payment_intent.payment_failed@^1`.

| Property | Type | Required | Description |
|---|---|---|---|
| `id` | string | no |  |
| `customer` | string | no |  |
| `amount` | integer | no |  |
| `currency` | string | no |  |
| `status` | string | no |  |
| `payment_method` | string | no |  |
| `last_payment_error` | object | no |  |
| `metadata` | object | no |  |

#### `stripe.payment_intent.processing`

Event body schema for Stripe payment_intent.processing. The Stripe PaymentIntent object in processing state.

Version 1.0.0, referred to as `passport/schemas/stripe.payment_intent.processing@^1`.

| Property | Type | Required | Description |
|---|---|---|---|
| `id` | string | no |  |
| `customer` | string | no |  |
| `amount` | integer | no |  |
| `currency` | string | no |  |
| `status` | string | no |  |
| `payment_method` | string | no |  |
| `payment_method_types` | array of string | no |  |
| `metadata` | object | no |  |

#### `stripe.payment_intent.requires_action`

Event body schema for Stripe payment_intent.requires_action. The Stripe PaymentIntent object requiring customer action.

Version 1.0.0, referred to as `passport/schemas/stripe.payment_intent.requires_action@^1`.

| Property | Type | Required | Description |
|---|---|---|---|
| `id` | string | no |  |
| `customer` | string | no |  |
| `amount` | integer | no |  |
| `currency` | string | no |  |
| `status` | string | no |  |
| `next_action` | object | no |  |
| `client_secret` | string | no |  |
| `metadata` | object | no |  |

#### `stripe.payment_intent.succeeded`

Event body schema for Stripe payment_intent.succeeded. The Stripe PaymentIntent object for a successful payment.

Version 1.0.0, referred to as `passport/schemas/stripe.payment_intent.succeeded@^1`.

| Property | Type | Required | Description |
|---|---|---|---|
| `id` | string | no |  |
| `customer` | string | no |  |
| `amount` | integer | no |  |
| `currency` | string | no |  |
| `status` | string | no |  |
| `payment_method` | string | no |  |
| `invoice` | string | no |  |
| `description` | string | no |  |
| `metadata` | object | no |  |

#### `stripe.payment_method.attached`

Event body schema for Stripe payment_method.attached. The Stripe PaymentMethod object after being attached to a customer.

Version 1.0.0, referred to as `passport/schemas/stripe.payment_method.attached@^1`.

| Property | Type | Required | Description |
|---|---|---|---|
| `id` | string | no |  |
| `customer` | string | no |  |
| `type` | string | no |  |
| `card` | object | no |  |
| `us_bank_account` | object | no |  |
| `metadata` | object | no |  |

#### `stripe.payment_method.detached`

Event body schema for Stripe payment_method.detached. The Stripe PaymentMethod object after being detached from a customer.

Version 1.0.0, referred to as `passport/schemas/stripe.payment_method.detached@^1`.

| Property | Type | Required | Description |
|---|---|---|---|
| `id` | string | no |  |
| `type` | string | no |  |
| `card` | object | no |  |
| `metadata` | object | no |  |

#### `stripe.payment_method.updated`

Event body schema for Stripe payment_method.updated. The Stripe PaymentMethod object after update.

Version 1.0.0, referred to as `passport/schemas/stripe.payment_method.updated@^1`.

| Property | Type | Required | Description |
|---|---|---|---|
| `id` | string | no |  |
| `customer` | string | no |  |
| `type` | string | no |  |
| `card` | object | no |  |
| `metadata` | object | no |  |

#### `stripe.setup_intent.requires_action`

Event body schema for Stripe setup_intent.requires_action. The Stripe SetupIntent object requiring customer action.

Version 1.0.0, referred to as `passport/schemas/stripe.setup_intent.requires_action@^1`.

| Property | Type | Required | Description |
|---|---|---|---|
| `id` | string | no |  |
| `customer` | string | no |  |
| `status` | string | no |  |
| `payment_method` | string | no |  |
| `payment_method_types` | array of string | no |  |
| `next_action` | object | no |  |
| `client_secret` | string | no |  |
| `metadata` | object | no |  |

#### `subscription`

A Passport subscription, as event bodies and API responses carry it.

Version 1.0.0, referred to as `passport/schemas/subscription@^1`.

| Property | Type | Required | Description |
|---|---|---|---|
| `id` | string (`passport.id`) | no |  |
| `created_at` | string (`date-time`) | no |  |
| `updated_at` | string (`date-time`) | no |  |
| `instance_id` | string (`passport.id`) | no |  |
| `user_id` | string (`passport.id`) | no |  |
| `type` | string | no |  |
| `name` | string | no |  |
| `admin_email` | string (`email`) | no |  |
| `begins_at` | string (`date-time`) | no |  |
| `ends_at` | string (`date-time`) | no |  |
| `trial_ends_at` | string (`date-time`) | no |  |
| `paused_at` | string (`date-time`) | no |  |
| `status` | string | no |  |
| `plan_id` | string (`passport.id`) | no |  |
| `price_id` | string (`passport.id`) | no |  |
| `quantity` | integer | no |  |
| `recurring_interval` | string | no |  |
| `recurring_frequency` | integer | no |  |
| `canceled` | boolean | no |  |
| `cancel_at` | string (`date-time`) | no |  |
| `auto_renew` | boolean | no |  |
| `metadata` | object | no |  |
| `no_entitlement` | boolean | no |  |
| `stripe_subscription` | string | no |  |
| `stripe_item` | string | no |  |
| `credit_id` | string (`passport.id`) | no |  |
| `terms` | object | no |  |
| `last_stripe_sync` | string (`date-time`) | no |  |

#### `user`

A Passport user, as event bodies and API responses carry it.

Version 1.0.0, referred to as `passport/schemas/user@^1`.

| Property | Type | Required | Description |
|---|---|---|---|
| `id` | string (`passport.id`) | no |  |
| `instance_id` | string (`passport.id`) | no |  |
| `created_at` | string (`date-time`) | no |  |
| `updated_at` | string (`date-time`) | no |  |
| `login` | string | no |  |
| `password_expires_at` | string (`date-time`) | no |  |
| `preferences` | object | no |  |
| `profile` | `passport/schemas/openid.profile@^1` | no |  |
| `metadata` | object | no |  |
| `phone_number` | string | no | E.164 format |
| `subject` | string (`passport.id`) | no |  |
| `permissions` | array of string | no |  |
| `roles` | array of string | no |  |
| `entitlements` | array of `passport/schemas/entitlement@^1` | no |  |
| `subscriptions` | array of `passport/schemas/subscription@^1` | no |  |
| `stripe_account` | object | no |  |
| `mfa_required` | boolean | no |  |

#### `user.subscription.status`

Shared body shape for every subscription status-change event (user.subscription.status.*). Use this schema as the reference for wildcard triggers such as `user.subscription.status.*`; each concrete status event (active, past_due, canceled, paused, trialing, unpaid, …) carries this same shape.

Version 1.0.0, referred to as `passport/schemas/user.subscription.status@^1`. It is the body a trigger on `user.subscription.status.*` reads.

| Property | Type | Required | Description |
|---|---|---|---|
| `prev_status` | string | no | Previous subscription status |
| `status` | string | yes | New subscription status |
| `subscription_id` | string (`passport.id`) | yes | Subscription ID |
| `stripe_subscription` | string | no | Stripe subscription ID (when applicable) |

<!-- reference:end schema-bodies -->
