# Events

Every event the server emits. An automation listens for one with an `event:`
trigger ([5.3](../guide/05-automations.md#53-triggers)) and reads its body as
`trigger.body`. `trigger.user_id` is the member the event
is about, when there is one. Declare the shape on the trigger:

```yaml
on:
  - event: user.created
    schema: { $ref: passport/schemas/user.created@^1 }
```

> **The tables are generated from the engine**, from the schemas the server
> carries under the `passport` namespace. Never edit between a
> `reference:begin` and a `reference:end` comment: change the engine and run
> the refresh command at the top of [BUILTINS.md](BUILTINS.md).

A Passport record id (`passport.id`) is short text such as
`Ch3oep6QbWZm8q5XEjgS5`, not a UUID
([2.4](../guide/02-field-schema.md#24-formats)). A property whose type is a
`passport/schemas/…` reference is described in [SCHEMAS.md](SCHEMAS.md).

## All events

The **Automations** column says whether an automation a publisher writes may
listen for the event. A plugin's automation may listen for any of them.

<!-- reference:begin events -->
| Event | Schema | Automations | Description |
|---|---|---|---|
| `application.audience.refresh` | `passport/schemas/application.audience.refresh@^1` | no | Emitted when an application's audience memberships are refreshed. |
| `application.feed.built` | `passport/schemas/application.feed.built@^1` | no | Emitted when an application's content feed is built. |
| `credit.created` | `passport/schemas/credit.created@^1` | no | Emitted when a credit is created. Body is the serialized CreditCreateInput. |
| `credit.deleted` | `passport/schemas/credit.deleted@^1` | no | Emitted when a credit is deleted. Body is the serialized CreditDeleteInput. |
| `distribution.created` | `passport/schemas/distribution.created@^1` | yes | Emitted when a distribution is created. |
| `distribution.failed` | `passport/schemas/distribution.failed@^1` | yes | Emitted when a distribution fails. |
| `distribution.feed.invalidated` | `passport/schemas/distribution.feed.invalidated@^1` | no | Emitted when a distribution feed is invalidated. |
| `distribution.published` | `passport/schemas/distribution.published@^1` | yes | Emitted when a distribution is published. |
| `distribution.queued` | `passport/schemas/distribution.queued@^1` | yes | Emitted when distribution queuing is completed, before finalize. |
| `email.sender.verified` | `passport/schemas/email.sender.verified@^1` | no | Emitted when an admin's email sender address is verified. |
| `email.sender.verify` | `passport/schemas/email.sender.verify@^1` | no | Emitted when an admin requests to verify an email sender address. Body is the serialized EmailSenderVerifyInput. |
| `gift.created` | `passport/schemas/gift.created@^1` | no | Emitted when a gift credit is created. Body is the serialized CreditCreateInput. |
| `gift.invite.created` | `passport/schemas/gift.invite.created@^1` | no | Emitted when a gift invite is created. Body is the serialized CreditInviteCreateInput. |
| `gift.invite.redeemed` | `passport/schemas/gift.invite.redeemed@^1` | no | Emitted when a gift invite is redeemed. Body is the serialized CreditInviteAcceptInput. |
| `gift.invite.rejected` | `passport/schemas/gift.invite.rejected@^1` | no | Emitted when a gift invite is rejected. Body is the serialized CreditInviteCancelInput. |
| `job.canceled` | `passport/schemas/job.canceled@^1` | no | Emitted when a job is canceled. |
| `job.completed` | `passport/schemas/job.completed@^1` | no | Emitted when a job completes successfully. |
| `job.failed` | `passport/schemas/job.failed@^1` | no | Emitted when a job fails. |
| `job.started` | `passport/schemas/job.started@^1` | no | Emitted when a job begins dispatching. |
| `team.invite.accepted` | `passport/schemas/team.invite.accepted@^1` | no | Emitted when a team (entitlement) invite is accepted. Body is the serialized CreditInviteAcceptInput. |
| `team.invite.rejected` | `passport/schemas/team.invite.rejected@^1` | no | Emitted when a team (entitlement) invite is rejected. Body is the serialized CreditInviteCancelInput. |
| `team.member.added` | `passport/schemas/team.member.added@^1` | no | Placeholder for team member additions. This event type is defined but not currently emitted from application code. |
| `team.member.removed` | `passport/schemas/team.member.removed@^1` | no | Emitted when a team member is removed. |
| `user.added` | `passport/schemas/user.added@^1` | no | Emitted when a user is added to an instance (first role assignment). |
| `user.audience.refresh` | `passport/schemas/user.audience.refresh@^1` | no | Emitted when a user's audience memberships are refreshed. |
| `user.auth.failed` | `passport/schemas/user.auth.failed@^1` | no | Emitted when a user authentication attempt fails. |
| `user.auth.success` | `passport/schemas/user.auth.success@^1` | no | Emitted when a user authenticates successfully. |
| `user.created` | `passport/schemas/user.created@^1` | yes | Emitted when a new user is created. Body is the serialized UserCreateInput struct. |
| `user.deleted` | `passport/schemas/user.deleted@^1` | no | Emitted when a user is permanently deleted from the parent instance. Body is the full serialized User object. |
| `user.email.bounced` | `passport/schemas/user.email.bounced@^1` | no | Emitted when a user's email is returned due to a bounce or complaint. |
| `user.email.opt_in` | `passport/schemas/user.email.opt_in@^1` | no | Emitted when a user opts back in to the email channel (preferences.channels.email.opt_out set to false). |
| `user.email.opt_out` | `passport/schemas/user.email.opt_out@^1` | yes | Emitted when a user opts out of the email channel (preferences.channels.email.opt_out set to true). |
| `user.email.suppressed` | `passport/schemas/user.email.suppressed@^1` | no | Emitted when a user's email is suppressed by the mail provider. |
| `user.email.unsuppressed` | `passport/schemas/user.email.unsuppressed@^1` | no | Emitted when an operator or admin clears the suppression on a user's email address. Written 2026-11-14 from the code that emits it (UserEmailSuppressionStatusDelete); the v1 schema set had no file for this event. |
| `user.email.verified` | `passport/schemas/user.email.verified@^1` | no | Emitted when a user's email is confirmed. Contains the member profile and instance context. |
| `user.email.verify` | `passport/schemas/user.email.verify@^1` | no | Email verification request. Sent via the oauth verify flow (with code) or when a user updates their email (without code). |
| `user.entitlement.canceled` | `passport/schemas/user.entitlement.canceled@^1` | no | Emitted when an entitlement is canceled. Same Entitlement struct as user.entitlement.created. |
| `user.entitlement.created` | `passport/schemas/user.entitlement.created@^1` | no | Emitted when an entitlement is created. Body is the serialized Entitlement struct (excluding user, subscription, audiences). |
| `user.entitlement.deleted` | `passport/schemas/user.entitlement.deleted@^1` | no | Emitted when an entitlement is deleted. Body is the full serialized Entitlement struct. |
| `user.entitlement.failed` | `passport/schemas/user.entitlement.failed@^1` | no | Emitted when an entitlement operation fails. |
| `user.entitlement.updated` | `passport/schemas/user.entitlement.updated@^1` | no | Emitted when an entitlement is updated. Body is the serialized EntitlementUpdateInput. |
| `user.feed.build` | `passport/schemas/user.feed.build@^1` | no | Emitted when a user's content feed is built. |
| `user.password.email` | `passport/schemas/user.password.email@^1` | no | Passwordless email login. Contains the OTP code, session link, and requesting client context. |
| `user.password.reset.email` | `passport/schemas/user.password.reset.email@^1` | no | Password reset via email. Contains the reset link and requesting client context but no OTP code. |
| `user.password.reset.sms` | `passport/schemas/user.password.reset.sms@^1` | no | Password reset via SMS. Contains the reset link and requesting client context but no OTP code. |
| `user.password.sms` | `passport/schemas/user.password.sms@^1` | no | Passwordless SMS login. Contains the OTP code, session link, and requesting client context. |
| `user.preferences.updated` | `passport/schemas/user.preferences.updated@^1` | no | Emitted when a user's per-category, per-channel delivery preferences change (e.g. they opt out of a category on email). Whole-channel opt-out is covered by the user.email.opt_out / user.sms.opt_out events instead. |
| `user.profile.updated` | `passport/schemas/user.profile.updated@^1` | no | Emitted when a user's OpenID profile is updated. Includes the full updated profile and a GJSON event_filter for routing. |
| `user.removed` | `passport/schemas/user.removed@^1` | no | Emitted when a user is removed from an instance. When triggered by role removal the body includes roles and a nested user object; when triggered by deletion the body is the flat User object. |
| `user.role.added` | `passport/schemas/user.role.added@^1` | no | Emitted when roles are added to a user who already has existing roles. |
| `user.role.removed` | `passport/schemas/user.role.removed@^1` | no | Emitted when roles are removed from a user who still has remaining roles. |
| `user.signup.email` | `passport/schemas/user.signup.email@^1` | no | Email signup verification. Sent through the PrincipalNotify path with signup=true. |
| `user.signup.sms` | `passport/schemas/user.signup.sms@^1` | no | SMS signup verification. Sent through the PrincipalNotify path with signup=true. |
| `user.sms.opt_in` | `passport/schemas/user.sms.opt_in@^1` | no | Emitted when a user opts back in to the sms channel (preferences.channels.sms.opt_out set to false). |
| `user.sms.opt_out` | `passport/schemas/user.sms.opt_out@^1` | no | Emitted when a user opts out of the sms channel (preferences.channels.sms.opt_out set to true). |
| `user.sms.verified` | `passport/schemas/user.sms.verified@^1` | no | Emitted when a user's phone number is confirmed. Contains the member profile and instance context. |
| `user.sms.verify` | `passport/schemas/user.sms.verify@^1` | no | SMS verification request. Sent via the oauth verify flow (with code) or when a user updates their phone number (without code). |
| `user.subscription.create.failed` | `passport/schemas/user.subscription.create.failed@^1` | no | Emitted when a subscription creation fails. Body is the serialized SubscriptionCreateInput. |
| `user.subscription.created` | `passport/schemas/user.subscription.created@^1` | no | Emitted when a subscription is created. Body is the serialized SubscriptionCreateInput plus the new subscription_id. |
| `user.subscription.deleted` | `passport/schemas/user.subscription.deleted@^1` | no | Emitted when a subscription is deleted. Body is the full serialized Subscription struct. |
| `user.subscription.expiring` | `passport/schemas/user.subscription.expiring@^1` | no | Emitted by the recurring subscription-expiring job when an active, non-renewing subscription is approaching its end date (within 7 days for yearly plans and 48 hours for monthly plans by default; both windows are configurable on the instance policy). |
| `user.subscription.item.updated` | `passport/schemas/user.subscription.item.updated@^1` | no | Emitted when a subscription item is updated. |
| `user.subscription.status.active` | `passport/schemas/user.subscription.status.active@^1` | yes | Emitted when a subscription transitions to active status. |
| `user.subscription.status.canceled` | `passport/schemas/user.subscription.status.canceled@^1` | yes | Emitted when a subscription transitions to canceled status. |
| `user.subscription.status.inactive` | `passport/schemas/user.subscription.status.inactive@^1` | no | Emitted when a subscription transitions to inactive status. |
| `user.subscription.status.incomplete` | `passport/schemas/user.subscription.status.incomplete@^1` | no | Emitted when a subscription transitions to incomplete status. |
| `user.subscription.status.incomplete_expired` | `passport/schemas/user.subscription.status.incomplete_expired@^1` | no | Emitted when a subscription transitions to incomplete_expired status. |
| `user.subscription.status.past_due` | `passport/schemas/user.subscription.status.past_due@^1` | no | Emitted when a subscription transitions to past_due status. |
| `user.subscription.status.paused` | `passport/schemas/user.subscription.status.paused@^1` | no | Emitted when a subscription transitions to paused status. |
| `user.subscription.status.trialing` | `passport/schemas/user.subscription.status.trialing@^1` | no | Emitted when a subscription transitions to trialing status. |
| `user.subscription.status.unpaid` | `passport/schemas/user.subscription.status.unpaid@^1` | no | Emitted when a subscription transitions to unpaid status. |
| `user.subscription.trial.ending` | `passport/schemas/user.subscription.trial.ending@^1` | no | Emitted by the recurring trial-ending job for trialing subscriptions whose trial is about to end (within 3 days by default; configurable on the instance policy via SubscriptionTrialEndingWindow / SubscriptionTrialEndingJobInterval). The trigger for trial-to-paid conversion journeys. |
| `user.subscription.update.failed` | `passport/schemas/user.subscription.update.failed@^1` | no | Emitted when a subscription update fails. Body is the serialized SubscriptionUpdateInput. |
| `user.subscription.updated` | `passport/schemas/user.subscription.updated@^1` | no | Emitted when a subscription is updated. Body is the serialized SubscriptionUpdateInput. |
| `user.token.revoked` | `passport/schemas/user.token.revoked@^1` | no | Emitted when an access token is revoked. Body is the serialized AccessToken struct. |
| `user.updated` | `passport/schemas/user.updated@^1` | no | Emitted when a user is updated. Body is the serialized UserUpdateInput params plus an event_filter for routing. |
<!-- reference:end events -->

## Bodies

The properties of each event's body.

<!-- reference:begin event-bodies -->
#### `application.audience.refresh`

| Property | Type | Required | Description |
|---|---|---|---|
| `added` | array of string | no |  |
| `existing` | array of string | no |  |
| `removed` | array of string | no |  |

#### `application.feed.built`

| Property | Type | Required | Description |
|---|---|---|---|
| `application_id` | string (`passport.id`) | no |  |
| `instance_id` | string (`passport.id`) | no |  |

#### `credit.created`

| Property | Type | Required | Description |
|---|---|---|---|
| `amount` | integer | no |  |
| `credit_interval` | string | no |  |
| `credit_quantity` | integer | no |  |
| `description` | string | no |  |
| `duration` | integer | no |  |
| `entitlement_id` | string (`passport.id`) | no |  |
| `expires_at` | string (`date-time`) | no |  |
| `max_redemptions` | integer | no |  |
| `metadata` | object | no |  |
| `name` | string | no |  |
| `owner_email` | string (`email`) | no |  |
| `owner_id` | string (`passport.id`) | no |  |
| `percent_off` | number | no |  |
| `plan_id` | string (`passport.id`) | no |  |
| `status` | string | no |  |
| `stripe_coupon` | string | no |  |
| `stripe_payment_intent` | string | no |  |
| `subscription_id` | string (`passport.id`) | no |  |
| `term` | string | no |  |
| `type` | string | yes |  |

#### `credit.deleted`

| Property | Type | Required | Description |
|---|---|---|---|
| `credit_id` | string (`passport.id`) | yes |  |
| `owner_id` | string (`passport.id`) | no |  |

#### `distribution.created`

| Property | Type | Required | Description |
|---|---|---|---|
| `audience_id` |  | no | The audience the distribution is for; empty when it has none |
| `channel` | string | yes |  |
| `distribution_id` | integer | yes |  |

#### `distribution.failed`

| Property | Type | Required | Description |
|---|---|---|---|
| `channel` | string | yes |  |
| `distribution_id` | integer | yes |  |

#### `distribution.feed.invalidated`

| Property | Type | Required | Description |
|---|---|---|---|
| `distribution_id` | string (`passport.id`) | no |  |
| `instance_id` | string (`passport.id`) | no |  |
| `paths` | array of string | no |  |

#### `distribution.published`

| Property | Type | Required | Description |
|---|---|---|---|
| `channel` | string | yes |  |
| `distribution_id` | integer | yes |  |

#### `distribution.queued`

| Property | Type | Required | Description |
|---|---|---|---|
| `channel` | string | no |  |
| `distribution_id` | integer | no |  |

#### `email.sender.verified`

| Property | Type | Required | Description |
|---|---|---|---|
| `address` | string (`email`) | no |  |
| `instance_id` | string (`passport.id`) | no |  |

#### `email.sender.verify`

| Property | Type | Required | Description |
|---|---|---|---|
| `address` | string (`email`) | no |  |
| `instance_id` | string (`passport.id`) | yes |  |
| `name` | string | no |  |

#### `gift.created`

| Property | Type | Required | Description |
|---|---|---|---|
| `amount` | integer | no |  |
| `credit_interval` | string | no |  |
| `credit_quantity` | integer | no |  |
| `description` | string | no |  |
| `duration` | integer | no |  |
| `entitlement_id` | string (`passport.id`) | no |  |
| `expires_at` | string (`date-time`) | no |  |
| `max_redemptions` | integer | no |  |
| `metadata` | object | no |  |
| `name` | string | no |  |
| `owner_email` | string (`email`) | no |  |
| `owner_id` | string (`passport.id`) | no |  |
| `percent_off` | number | no |  |
| `plan_id` | string (`passport.id`) | no |  |
| `status` | string | no |  |
| `stripe_coupon` | string | no |  |
| `stripe_payment_intent` | string | no |  |
| `subscription_id` | string (`passport.id`) | no |  |
| `term` | string | no |  |
| `type` | string | yes |  |

#### `gift.invite.created`

| Property | Type | Required | Description |
|---|---|---|---|
| `auto_accept` | boolean | no |  |
| `credit_id` | string (`passport.id`) | yes |  |
| `message` | string | no | Personal message from the sender |
| `owner_email` | string (`email`) | no |  |
| `owner_id` | string (`passport.id`) | no |  |
| `passcode` | string | no |  |
| `send_at` | string (`date-time`) | no |  |
| `to` | string (`email`) | no | Recipient email address |
| `user_id` | string (`passport.id`) | no |  |

#### `gift.invite.redeemed`

| Property | Type | Required | Description |
|---|---|---|---|
| `invite_code` | string | no |  |
| `user_id` | string (`passport.id`) | no |  |

#### `gift.invite.rejected`

| Property | Type | Required | Description |
|---|---|---|---|
| `invite_code` | string | no |  |
| `status` | string | no |  |

#### `job.canceled`

No listed properties.

#### `job.completed`

No listed properties.

#### `job.failed`

No listed properties.

#### `job.started`

No listed properties.

#### `team.invite.accepted`

| Property | Type | Required | Description |
|---|---|---|---|
| `invite_code` | string | no |  |
| `user_id` | string (`passport.id`) | no |  |

#### `team.invite.rejected`

| Property | Type | Required | Description |
|---|---|---|---|
| `invite_code` | string | no |  |
| `status` | string | no |  |

#### `team.member.added`

| Property | Type | Required | Description |
|---|---|---|---|
| `invited_by` | string (`passport.id`) | no | The user who added this member |
| `role` | string | no |  |
| `team_id` | string (`passport.id`) | no |  |
| `user_id` | string (`passport.id`) | no |  |

#### `team.member.removed`

| Property | Type | Required | Description |
|---|---|---|---|
| `removed_by` | string (`passport.id`) | no |  |
| `team_id` | string (`passport.id`) | no |  |
| `user_id` | string (`passport.id`) | no |  |

#### `user.added`

| Property | Type | Required | Description |
|---|---|---|---|
| `roles` | array of string | yes |  |
| `user` | `passport/schemas/user@^1` | yes |  |

#### `user.audience.refresh`

| Property | Type | Required | Description |
|---|---|---|---|
| `added` | array of string | no | Audience names the user was added to |
| `existing` | array of string | no | Audience names the user already belonged to |
| `removed` | array of string | no | Audience names the user was removed from |

#### `user.auth.failed`

| Property | Type | Required | Description |
|---|---|---|---|
| `login` | string | yes |  |

#### `user.auth.success`

| Property | Type | Required | Description |
|---|---|---|---|
| `login` | string | yes |  |

#### `user.created`

| Property | Type | Required | Description |
|---|---|---|---|
| `instance_id` | string (`passport.id`) | yes |  |
| `login` | string | yes |  |
| `metadata` | object | no |  |
| `mfa_required` | boolean | no |  |
| `password` | string | no |  |
| `password_expires_at` | string (`date-time`) | no |  |
| `preferences` | object | no |  |
| `profile` | `passport/schemas/openid.profile@^1` | no | OpenID profile |
| `roles` | array of string | no |  |
| `stripe_account` | object | no |  |

#### `user.deleted`

No listed properties.

#### `user.email.bounced`

| Property | Type | Required | Description |
|---|---|---|---|
| `email` | string (`email`) | no |  |
| `reason` | string | no |  |
| `type` | string | no |  |

#### `user.email.opt_in`

| Property | Type | Required | Description |
|---|---|---|---|
| `channel` | string | yes | The messaging channel |
| `opt_out` | boolean | yes | True when the user is opted out of the channel, false when opted in |

#### `user.email.opt_out`

| Property | Type | Required | Description |
|---|---|---|---|
| `channel` | string | yes | The messaging channel |
| `opt_out` | boolean | yes | True when the user is opted out of the channel, false when opted in |

#### `user.email.suppressed`

| Property | Type | Required | Description |
|---|---|---|---|
| `details` | string | no | MTA status code details |
| `email` | string (`email`) | yes |  |
| `mta` | string | no | Mail transfer agent status |
| `reason` | string | no |  |
| `type` | string | yes | Suppression type (e.g. bounce, complaint) |

#### `user.email.unsuppressed`

| Property | Type | Required | Description |
|---|---|---|---|
| `email` | string (`email`) | yes | The address that was un-suppressed |
| `reason` | string | no | The reason recorded with the suppression that was cleared; empty when none was recorded |
| `was` | string | no | The kind of suppression that was cleared (e.g. bounce, complaint); empty when none was recorded |

#### `user.email.verified`

| Property | Type | Required | Description |
|---|---|---|---|
| `instance` | `passport/schemas/instance@^1` | yes |  |
| `member` | `passport/schemas/openid.profile@^1` | yes |  |

#### `user.email.verify`

| Property | Type | Required | Description |
|---|---|---|---|
| `code` | string | no | OTP verification code (present when sent via the oauth verify flow) |
| `instance` | `passport/schemas/instance@^1` | yes |  |
| `link` | string (`uri`) | yes | Verification URL with embedded access token |
| `member` | `passport/schemas/openid.profile@^1` | yes |  |
| `template_options` | object | no | Template rendering options (admin users only) |
| `token` | string | no | Access token for verification |

#### `user.entitlement.canceled`

No listed properties.

#### `user.entitlement.created`

No listed properties.

#### `user.entitlement.deleted`

No listed properties.

#### `user.entitlement.failed`

| Property | Type | Required | Description |
|---|---|---|---|
| `application_id` | string (`passport.id`) | no |  |
| `entitlement_id` | string (`passport.id`) | no |  |
| `user_id` | string (`passport.id`) | no |  |

#### `user.entitlement.updated`

| Property | Type | Required | Description |
|---|---|---|---|
| `active` | boolean | no |  |
| `categories` | array of object | no |  |
| `entitlement_id` | string (`passport.id`) | yes |  |
| `expires_at` | string (`date-time`) | no |  |
| `metadata` | object | no |  |

#### `user.feed.build`

| Property | Type | Required | Description |
|---|---|---|---|
| `instance_id` | string (`passport.id`) | no |  |
| `user_id` | string (`passport.id`) | no |  |

#### `user.password.email`

| Property | Type | Required | Description |
|---|---|---|---|
| `client_display_name` | string | no | Display name of the requesting client |
| `client_id` | string | no | OAuth client ID that initiated the request |
| `client_name` | string | no | Username of the requesting client |
| `code` | string | yes | OTP login code |
| `instance` | `passport/schemas/instance@^1` | yes |  |
| `link` | string (`uri`) | yes | Session link URL |
| `member` | `passport/schemas/openid.profile@^1` | yes |  |
| `mfa` | boolean | no | Whether this is an MFA challenge |
| `template_options` | object | no | Template rendering options (admin users only, email channel) |
| `token` | string | no | Access token |

#### `user.password.reset.email`

| Property | Type | Required | Description |
|---|---|---|---|
| `client_display_name` | string | no | Display name of the requesting client |
| `client_id` | string | no | OAuth client ID that initiated the request |
| `client_name` | string | no | Username of the requesting client |
| `instance` | `passport/schemas/instance@^1` | yes |  |
| `link` | string (`uri`) | yes | Password reset session URL |
| `member` | `passport/schemas/openid.profile@^1` | yes |  |
| `template_options` | object | no | Template rendering options (admin users only, email channel) |
| `token` | string | no | Access token |

#### `user.password.reset.sms`

| Property | Type | Required | Description |
|---|---|---|---|
| `client_display_name` | string | no | Display name of the requesting client |
| `client_id` | string | no | OAuth client ID that initiated the request |
| `client_name` | string | no | Username of the requesting client |
| `instance` | `passport/schemas/instance@^1` | yes |  |
| `link` | string (`uri`) | yes | Password reset session URL |
| `member` | `passport/schemas/openid.profile@^1` | yes |  |
| `template_options` | object | no | Template rendering options (admin users only, email channel) |
| `token` | string | no | Access token |

#### `user.password.sms`

| Property | Type | Required | Description |
|---|---|---|---|
| `client_display_name` | string | no | Display name of the requesting client |
| `client_id` | string | no | OAuth client ID that initiated the request |
| `client_name` | string | no | Username of the requesting client |
| `code` | string | yes | OTP login code |
| `instance` | `passport/schemas/instance@^1` | yes |  |
| `link` | string (`uri`) | yes | Session link URL |
| `member` | `passport/schemas/openid.profile@^1` | yes |  |
| `mfa` | boolean | no | Whether this is an MFA challenge |
| `template_options` | object | no | Template rendering options (admin users only, email channel) |
| `token` | string | no | Access token |

#### `user.preferences.updated`

| Property | Type | Required | Description |
|---|---|---|---|
| `categories` | array of string (`passport.id`) | yes | IDs of the categories whose delivery preferences changed |
| `delivery` | array of object | no | The updated per-category delivery preferences |

#### `user.profile.updated`

| Property | Type | Required | Description |
|---|---|---|---|
| `event_filter` | string | no | GJSON path of changed profile fields for event routing |
| `profile` | `passport/schemas/openid.profile@^1` | yes | Full updated OpenID profile |

#### `user.removed`

| Property | Type | Required | Description |
|---|---|---|---|
| `roles` | array of string | no | Roles that were removed (present when triggered by role removal) |
| `user` | `passport/schemas/user@^1` | no | User object (present when triggered by role removal) |

#### `user.role.added`

| Property | Type | Required | Description |
|---|---|---|---|
| `roles` | array of string | yes |  |
| `user` | `passport/schemas/user@^1` | yes |  |

#### `user.role.removed`

| Property | Type | Required | Description |
|---|---|---|---|
| `roles` | array of string | yes |  |
| `user` | `passport/schemas/user@^1` | yes |  |

#### `user.signup.email`

| Property | Type | Required | Description |
|---|---|---|---|
| `code` | string | yes | OTP verification code |
| `instance` | `passport/schemas/instance@^1` | yes |  |
| `link` | string (`uri`) | yes | Verification URL with embedded access token |
| `member` | `passport/schemas/openid.profile@^1` | yes |  |
| `template_options` | object | no | Template rendering options (admin users only) |
| `token` | string | no | Access token for verification |

#### `user.signup.sms`

| Property | Type | Required | Description |
|---|---|---|---|
| `code` | string | yes | OTP verification code |
| `instance` | `passport/schemas/instance@^1` | yes |  |
| `link` | string (`uri`) | yes | Verification URL with embedded access token |
| `member` | `passport/schemas/openid.profile@^1` | yes |  |
| `template_options` | object | no | Template rendering options (admin users only) |
| `token` | string | no | Access token for verification |

#### `user.sms.opt_in`

| Property | Type | Required | Description |
|---|---|---|---|
| `channel` | string | yes | The messaging channel |
| `opt_out` | boolean | yes | True when the user is opted out of the channel, false when opted in |

#### `user.sms.opt_out`

| Property | Type | Required | Description |
|---|---|---|---|
| `channel` | string | yes | The messaging channel |
| `opt_out` | boolean | yes | True when the user is opted out of the channel, false when opted in |

#### `user.sms.verified`

| Property | Type | Required | Description |
|---|---|---|---|
| `instance` | `passport/schemas/instance@^1` | yes |  |
| `member` | `passport/schemas/openid.profile@^1` | yes |  |

#### `user.sms.verify`

| Property | Type | Required | Description |
|---|---|---|---|
| `code` | string | no | OTP verification code (present when sent via the oauth verify flow) |
| `instance` | `passport/schemas/instance@^1` | yes |  |
| `link` | string (`uri`) | yes | Verification URL with embedded access token |
| `member` | `passport/schemas/openid.profile@^1` | yes |  |
| `template_options` | object | no | Template rendering options (admin users only) |
| `token` | string | no | Access token for verification |

#### `user.subscription.create.failed`

| Property | Type | Required | Description |
|---|---|---|---|
| `auto_renew` | boolean | no |  |
| `begins_at` | string (`date-time`) | no |  |
| `cancel_at` | string (`date-time`) | no |  |
| `credit_id` | string (`passport.id`) | no |  |
| `ends_at` | string (`date-time`) | no |  |
| `max_quantity` | integer | no |  |
| `metadata` | object | no |  |
| `price_id` | string (`passport.id`) | no |  |
| `quantity` | integer | no |  |
| `status` | string | no |  |
| `stripe_item` | string | no |  |
| `stripe_subscription` | string | no |  |
| `trial_ends_at` | string (`date-time`) | no |  |
| `user_id` | string (`passport.id`) | no |  |

#### `user.subscription.created`

| Property | Type | Required | Description |
|---|---|---|---|
| `auto_renew` | boolean | no |  |
| `begins_at` | string (`date-time`) | no |  |
| `cancel_at` | string (`date-time`) | no |  |
| `credit_id` | string (`passport.id`) | no |  |
| `ends_at` | string (`date-time`) | no |  |
| `max_quantity` | integer | no |  |
| `metadata` | object | no |  |
| `price_id` | string (`passport.id`) | no |  |
| `quantity` | integer | no |  |
| `status` | string | no |  |
| `stripe_item` | string | no |  |
| `stripe_subscription` | string | no | Stripe subscription ID |
| `subscription_id` | string (`passport.id`) | no | The created subscription's ID |
| `trial_ends_at` | string (`date-time`) | no |  |
| `user_id` | string (`passport.id`) | no |  |

#### `user.subscription.deleted`

No listed properties.

#### `user.subscription.expiring`

| Property | Type | Required | Description |
|---|---|---|---|
| `ends_at` | string (`date-time`) | yes | When the subscription expires |
| `interval` | string | yes | The subscription's recurring interval |
| `plan_id` | string (`passport.id`) | no | The subscription's plan ID (may be null) |
| `subscription_id` | string (`passport.id`) | yes | The expiring subscription ID |

#### `user.subscription.item.updated`

| Property | Type | Required | Description |
|---|---|---|---|
| `quantity` | integer | no |  |
| `stripe_item` | string | no |  |
| `subscription_id` | string (`passport.id`) | no |  |

#### `user.subscription.status.active`

| Property | Type | Required | Description |
|---|---|---|---|
| `prev_status` | string | no | Previous subscription status |
| `status` | string | yes | New subscription status |
| `stripe_subscription` | string | no | Stripe subscription ID (when applicable) |
| `subscription_id` | string (`passport.id`) | yes | Subscription ID |

#### `user.subscription.status.canceled`

| Property | Type | Required | Description |
|---|---|---|---|
| `prev_status` | string | no | Previous subscription status |
| `status` | string | yes | New subscription status |
| `stripe_subscription` | string | no | Stripe subscription ID (when applicable) |
| `subscription_id` | string (`passport.id`) | yes | Subscription ID |

#### `user.subscription.status.inactive`

| Property | Type | Required | Description |
|---|---|---|---|
| `prev_status` | string | no | Previous subscription status |
| `status` | string | yes | New subscription status |
| `stripe_subscription` | string | no | Stripe subscription ID (when applicable) |
| `subscription_id` | string (`passport.id`) | yes | Subscription ID |

#### `user.subscription.status.incomplete`

| Property | Type | Required | Description |
|---|---|---|---|
| `prev_status` | string | no | Previous subscription status |
| `status` | string | yes | New subscription status |
| `stripe_subscription` | string | no | Stripe subscription ID (when applicable) |
| `subscription_id` | string (`passport.id`) | yes | Subscription ID |

#### `user.subscription.status.incomplete_expired`

| Property | Type | Required | Description |
|---|---|---|---|
| `prev_status` | string | no | Previous subscription status |
| `status` | string | yes | New subscription status |
| `stripe_subscription` | string | no | Stripe subscription ID (when applicable) |
| `subscription_id` | string (`passport.id`) | yes | Subscription ID |

#### `user.subscription.status.past_due`

| Property | Type | Required | Description |
|---|---|---|---|
| `prev_status` | string | no | Previous subscription status |
| `status` | string | yes | New subscription status |
| `stripe_subscription` | string | no | Stripe subscription ID (when applicable) |
| `subscription_id` | string (`passport.id`) | yes | Subscription ID |

#### `user.subscription.status.paused`

| Property | Type | Required | Description |
|---|---|---|---|
| `prev_status` | string | no | Previous subscription status |
| `status` | string | yes | New subscription status |
| `stripe_subscription` | string | no | Stripe subscription ID (when applicable) |
| `subscription_id` | string (`passport.id`) | yes | Subscription ID |

#### `user.subscription.status.trialing`

| Property | Type | Required | Description |
|---|---|---|---|
| `prev_status` | string | no | Previous subscription status |
| `status` | string | yes | New subscription status |
| `stripe_subscription` | string | no | Stripe subscription ID (when applicable) |
| `subscription_id` | string (`passport.id`) | yes | Subscription ID |

#### `user.subscription.status.unpaid`

| Property | Type | Required | Description |
|---|---|---|---|
| `prev_status` | string | no | Previous subscription status |
| `status` | string | yes | New subscription status |
| `stripe_subscription` | string | no | Stripe subscription ID (when applicable) |
| `subscription_id` | string (`passport.id`) | yes | Subscription ID |

#### `user.subscription.trial.ending`

| Property | Type | Required | Description |
|---|---|---|---|
| `plan_id` | string (`passport.id`) | no | The subscription's plan ID (may be null) |
| `subscription_id` | string (`passport.id`) | yes | The trialing subscription ID |
| `trial_ends_at` | string (`date-time`) | yes | When the trial ends |

#### `user.subscription.update.failed`

| Property | Type | Required | Description |
|---|---|---|---|
| `auto_renew` | boolean | no |  |
| `begins_at` | string (`date-time`) | no |  |
| `canceled` | boolean | no |  |
| `credit_id` | string (`passport.id`) | no |  |
| `ends_at` | string (`date-time`) | no |  |
| `max_quantity` | integer | no |  |
| `metadata` | object | no |  |
| `quantity` | integer | no |  |
| `status` | string | no |  |
| `stripe_item` | string | no |  |
| `stripe_subscription` | string | no |  |
| `subscription_id` | string (`passport.id`) | no |  |
| `trial_ends_at` | string (`date-time`) | no |  |

#### `user.subscription.updated`

| Property | Type | Required | Description |
|---|---|---|---|
| `auto_renew` | boolean | no |  |
| `begins_at` | string (`date-time`) | no |  |
| `cancel_at` | string (`date-time`) | no |  |
| `credit_id` | string (`passport.id`) | no |  |
| `ends_at` | string (`date-time`) | no |  |
| `max_quantity` | integer | no |  |
| `metadata` | object | no |  |
| `price_id` | string (`passport.id`) | no |  |
| `quantity` | integer | no |  |
| `status` | string | no |  |
| `stripe_item` | string | no |  |
| `stripe_subscription` | string | no |  |
| `subscription_id` | string (`passport.id`) | no |  |
| `trial_ends_at` | string (`date-time`) | no |  |

#### `user.token.revoked`

| Property | Type | Required | Description |
|---|---|---|---|
| `application_id` | string (`passport.id`) | no |  |
| `bearer` | string | no |  |
| `claims` | object | no |  |
| `created_at` | string (`date-time`) | no |  |
| `distribution_id` | string (`passport.id`) | no |  |
| `expires_at` | string (`date-time`) | no |  |
| `id` | string (`passport.id`) | no |  |
| `instance_id` | string (`passport.id`) | no |  |
| `last_accessed` | string (`date-time`) | no |  |
| `redirect_uri` | string | no |  |
| `revoked_at` | string (`date-time`) | no |  |
| `type` | string | no |  |
| `updated_at` | string (`date-time`) | no |  |
| `uri` | string | no |  |
| `user_id` | string (`passport.id`) | no |  |

#### `user.updated`

| Property | Type | Required | Description |
|---|---|---|---|
| `event_filter` | string | no | GJSON path of changed fields for event routing |
| `instance_id` | string (`passport.id`) | no |  |
| `login` | string | no |  |
| `metadata` | object | no |  |
| `mfa_required` | boolean | no |  |
| `password_expires_at` | string (`date-time`) | no |  |
| `preferences` | object | no |  |
| `profile` | `passport/schemas/openid.profile@^1` | no | OpenID profile (partial update) |
| `roles` | object | no | Role add/remove operations |
| `user_id` | string (`passport.id`) | no |  |

<!-- reference:end event-bodies -->
