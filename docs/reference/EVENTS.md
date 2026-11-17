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
| `credit.created` | `passport/schemas/credit.created@^1` | no | Emitted when a credit is created. The body is the credit as it was asked for. |
| `credit.deleted` | `passport/schemas/credit.deleted@^1` | no | Emitted when a credit is deleted. The body says which credit. |
| `distribution.created` | `passport/schemas/distribution.created@^1` | yes | Emitted when a distribution is created. |
| `distribution.failed` | `passport/schemas/distribution.failed@^1` | yes | Emitted when a distribution fails. |
| `distribution.feed.invalidated` | `passport/schemas/distribution.feed.invalidated@^1` | no | Emitted when a distribution feed is invalidated. |
| `distribution.published` | `passport/schemas/distribution.published@^1` | yes | Emitted when a distribution is published. |
| `distribution.queued` | `passport/schemas/distribution.queued@^1` | yes | Emitted when distribution queuing is completed, before finalize. |
| `email.sender.verified` | `passport/schemas/email.sender.verified@^1` | no | Emitted when an admin's email sender address is verified. |
| `email.sender.verify` | `passport/schemas/email.sender.verify@^1` | no | Emitted when an admin asks to verify an email sender address. The body is the request. |
| `gift.created` | `passport/schemas/gift.created@^1` | no | Emitted when a gift credit is created. The body is the credit as it was asked for. |
| `gift.invite.created` | `passport/schemas/gift.invite.created@^1` | no | Emitted when a gift invite is created. The body is the invite as it was asked for. |
| `gift.invite.redeemed` | `passport/schemas/gift.invite.redeemed@^1` | no | Emitted when a gift invite is redeemed. The body is the acceptance. |
| `gift.invite.rejected` | `passport/schemas/gift.invite.rejected@^1` | no | Emitted when a gift invite is rejected. The body is the rejection. |
| `job.canceled` | `passport/schemas/job.canceled@^1` | no | Emitted when a job is canceled. |
| `job.completed` | `passport/schemas/job.completed@^1` | no | Emitted when a job completes successfully. |
| `job.failed` | `passport/schemas/job.failed@^1` | no | Emitted when a job fails. |
| `job.started` | `passport/schemas/job.started@^1` | no | Emitted when a job begins dispatching. |
| `team.invite.accepted` | `passport/schemas/team.invite.accepted@^1` | no | Emitted when a team (entitlement) invite is accepted. The body is the acceptance. |
| `team.invite.rejected` | `passport/schemas/team.invite.rejected@^1` | no | Emitted when a team (entitlement) invite is rejected. The body is the rejection. |
| `team.member.added` | `passport/schemas/team.member.added@^1` | no | Placeholder for team member additions. This event type is defined but not currently emitted from application code. |
| `team.member.removed` | `passport/schemas/team.member.removed@^1` | no | Emitted when a team member is removed. |
| `user.added` | `passport/schemas/user.added@^1` | no | Emitted when a user is added to an instance (first role assignment). |
| `user.audience.refresh` | `passport/schemas/user.audience.refresh@^1` | no | Emitted when a user's audience memberships are refreshed. |
| `user.auth.failed` | `passport/schemas/user.auth.failed@^1` | no | Emitted when a user authentication attempt fails. |
| `user.auth.success` | `passport/schemas/user.auth.success@^1` | no | Emitted when a user authenticates successfully. |
| `user.created` | `passport/schemas/user.created@^1` | yes | Emitted when a new user is created. The body is what the user was created with. |
| `user.deleted` | `passport/schemas/user.deleted@^1` | no | Emitted when a user is permanently deleted from the parent instance. The body is the whole user record. |
| `user.email.bounced` | `passport/schemas/user.email.bounced@^1` | no | Emitted when a user's email is returned due to a bounce or complaint. |
| `user.email.opt_in` | `passport/schemas/user.email.opt_in@^1` | no | Emitted when a user opts back in to the email channel (preferences.channels.email.opt_out set to false). |
| `user.email.opt_out` | `passport/schemas/user.email.opt_out@^1` | yes | Emitted when a user opts out of the email channel (preferences.channels.email.opt_out set to true). |
| `user.email.suppressed` | `passport/schemas/user.email.suppressed@^1` | no | Emitted when a user's email is suppressed by the mail provider. |
| `user.email.unsuppressed` | `passport/schemas/user.email.unsuppressed@^1` | no | Emitted when an operator or admin clears the suppression on a user's email address. |
| `user.email.verified` | `passport/schemas/user.email.verified@^1` | no | Emitted when a user's email is confirmed. Contains the member profile and instance context. |
| `user.email.verify` | `passport/schemas/user.email.verify@^1` | no | Email verification request. Sent via the oauth verify flow (with code) or when a user updates their email (without code). |
| `user.entitlement.canceled` | `passport/schemas/user.entitlement.canceled@^1` | no | Emitted when an entitlement is canceled. The body has the same shape as the body of user.entitlement.created. |
| `user.entitlement.created` | `passport/schemas/user.entitlement.created@^1` | no | Emitted when an entitlement is created. The body is the entitlement, without its user, subscription and audiences. |
| `user.entitlement.deleted` | `passport/schemas/user.entitlement.deleted@^1` | no | Emitted when an entitlement is deleted. The body is the whole entitlement. |
| `user.entitlement.failed` | `passport/schemas/user.entitlement.failed@^1` | no | Emitted when an entitlement operation fails. |
| `user.entitlement.updated` | `passport/schemas/user.entitlement.updated@^1` | no | Emitted when an entitlement is updated. The body is the change that was asked for. |
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
| `user.signup.email` | `passport/schemas/user.signup.email@^1` | no | Email signup verification: sent when a person signs up with an email address. |
| `user.signup.sms` | `passport/schemas/user.signup.sms@^1` | no | SMS signup verification: sent when a person signs up with a phone number. |
| `user.sms.opt_in` | `passport/schemas/user.sms.opt_in@^1` | no | Emitted when a user opts back in to the sms channel (preferences.channels.sms.opt_out set to false). |
| `user.sms.opt_out` | `passport/schemas/user.sms.opt_out@^1` | no | Emitted when a user opts out of the sms channel (preferences.channels.sms.opt_out set to true). |
| `user.sms.verified` | `passport/schemas/user.sms.verified@^1` | no | Emitted when a user's phone number is confirmed. Contains the member profile and instance context. |
| `user.sms.verify` | `passport/schemas/user.sms.verify@^1` | no | SMS verification request. Sent via the oauth verify flow (with code) or when a user updates their phone number (without code). |
| `user.subscription.create.failed` | `passport/schemas/user.subscription.create.failed@^1` | no | Emitted when creating a subscription fails. The body is the subscription as it was asked for. |
| `user.subscription.created` | `passport/schemas/user.subscription.created@^1` | no | Emitted when a subscription is created. The body is the subscription as it was asked for, with the new subscription_id. |
| `user.subscription.deleted` | `passport/schemas/user.subscription.deleted@^1` | no | Emitted when a subscription is deleted. The body is the whole subscription. |
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
| `user.subscription.trial.ending` | `passport/schemas/user.subscription.trial.ending@^1` | no | Emitted by the recurring trial-ending job for trialing subscriptions whose trial is about to end (within 3 days by default; the site's policy sets the window and how often the job runs). The trigger for trial-to-paid conversion journeys. |
| `user.subscription.update.failed` | `passport/schemas/user.subscription.update.failed@^1` | no | Emitted when updating a subscription fails. The body is the change that was asked for. |
| `user.subscription.updated` | `passport/schemas/user.subscription.updated@^1` | no | Emitted when a subscription is updated. The body is the change that was asked for. |
| `user.token.revoked` | `passport/schemas/user.token.revoked@^1` | no | Emitted when an access token is revoked. The body is the token's record. |
| `user.updated` | `passport/schemas/user.updated@^1` | no | Emitted when a user is updated. The body is the change that was asked for, with an event_filter for routing. |
<!-- reference:end events -->

## Bodies

The properties of each event's body.

<!-- reference:begin event-bodies -->
#### `application.audience.refresh`

Emitted when an application's audience memberships are refreshed.

Version 1.0.0, referred to as `passport/schemas/application.audience.refresh@^1`. Automations a publisher writes: no.

| Property | Type | Required | Description |
|---|---|---|---|
| `added` | array of string | no |  |
| `existing` | array of string | no |  |
| `removed` | array of string | no |  |

#### `application.feed.built`

Emitted when an application's content feed is built.

Version 1.0.0, referred to as `passport/schemas/application.feed.built@^1`. Automations a publisher writes: no.

| Property | Type | Required | Description |
|---|---|---|---|
| `application_id` | string (`passport.id`) | no |  |
| `instance_id` | string (`passport.id`) | no |  |

#### `credit.created`

Emitted when a credit is created. The body is the credit as it was asked for.

Version 1.0.0, referred to as `passport/schemas/credit.created@^1`. Automations a publisher writes: no.

| Property | Type | Required | Description |
|---|---|---|---|
| `owner_id` | string (`passport.id`) | no |  |
| `owner_email` | string (`email`) | no |  |
| `type` | string | yes |  |
| `name` | string | no |  |
| `description` | string | no |  |
| `plan_id` | string (`passport.id`) | no |  |
| `amount` | integer | no |  |
| `percent_off` | number | no |  |
| `credit_interval` | string | no |  |
| `credit_quantity` | integer | no |  |
| `subscription_id` | string (`passport.id`) | no |  |
| `stripe_payment_intent` | string | no |  |
| `stripe_coupon` | string | no |  |
| `duration` | integer | no |  |
| `term` | string | no |  |
| `status` | string | no |  |
| `expires_at` | string (`date-time`) | no |  |
| `max_redemptions` | integer | no |  |
| `metadata` | object | no |  |
| `entitlement_id` | string (`passport.id`) | no |  |

#### `credit.deleted`

Emitted when a credit is deleted. The body says which credit.

Version 1.0.0, referred to as `passport/schemas/credit.deleted@^1`. Automations a publisher writes: no.

| Property | Type | Required | Description |
|---|---|---|---|
| `owner_id` | string (`passport.id`) | no |  |
| `credit_id` | string (`passport.id`) | yes |  |

#### `distribution.created`

Emitted when a distribution is created.

Version 1.0.0, referred to as `passport/schemas/distribution.created@^1`. Automations a publisher writes: yes.

| Property | Type | Required | Description |
|---|---|---|---|
| `distribution_id` | integer | yes |  |
| `audience_id` |  | no | The audience the distribution is for; empty when it has none |
| `channel` | string | yes |  |

#### `distribution.failed`

Emitted when a distribution fails.

Version 1.0.0, referred to as `passport/schemas/distribution.failed@^1`. Automations a publisher writes: yes.

| Property | Type | Required | Description |
|---|---|---|---|
| `distribution_id` | integer | yes |  |
| `channel` | string | yes |  |

#### `distribution.feed.invalidated`

Emitted when a distribution feed is invalidated.

Version 1.0.0, referred to as `passport/schemas/distribution.feed.invalidated@^1`. Automations a publisher writes: no.

| Property | Type | Required | Description |
|---|---|---|---|
| `instance_id` | string (`passport.id`) | no |  |
| `distribution_id` | string (`passport.id`) | no |  |
| `paths` | array of string | no |  |

#### `distribution.published`

Emitted when a distribution is published.

Version 1.0.0, referred to as `passport/schemas/distribution.published@^1`. Automations a publisher writes: yes.

| Property | Type | Required | Description |
|---|---|---|---|
| `distribution_id` | integer | yes |  |
| `channel` | string | yes |  |

#### `distribution.queued`

Emitted when distribution queuing is completed, before finalize.

Version 1.0.0, referred to as `passport/schemas/distribution.queued@^1`. Automations a publisher writes: yes.

| Property | Type | Required | Description |
|---|---|---|---|
| `distribution_id` | integer | no |  |
| `channel` | string | no |  |

#### `email.sender.verified`

Emitted when an admin's email sender address is verified.

Version 1.0.0, referred to as `passport/schemas/email.sender.verified@^1`. Automations a publisher writes: no.

| Property | Type | Required | Description |
|---|---|---|---|
| `instance_id` | string (`passport.id`) | no |  |
| `address` | string (`email`) | no |  |

#### `email.sender.verify`

Emitted when an admin asks to verify an email sender address. The body is the request.

Version 1.0.0, referred to as `passport/schemas/email.sender.verify@^1`. Automations a publisher writes: no.

| Property | Type | Required | Description |
|---|---|---|---|
| `instance_id` | string (`passport.id`) | yes |  |
| `address` | string (`email`) | no |  |
| `name` | string | no |  |

#### `gift.created`

Emitted when a gift credit is created. The body is the credit as it was asked for.

Version 1.0.0, referred to as `passport/schemas/gift.created@^1`. Automations a publisher writes: no.

| Property | Type | Required | Description |
|---|---|---|---|
| `owner_id` | string (`passport.id`) | no |  |
| `owner_email` | string (`email`) | no |  |
| `type` | string | yes |  |
| `name` | string | no |  |
| `description` | string | no |  |
| `plan_id` | string (`passport.id`) | no |  |
| `amount` | integer | no |  |
| `percent_off` | number | no |  |
| `credit_interval` | string | no |  |
| `credit_quantity` | integer | no |  |
| `subscription_id` | string (`passport.id`) | no |  |
| `stripe_payment_intent` | string | no |  |
| `stripe_coupon` | string | no |  |
| `duration` | integer | no |  |
| `term` | string | no |  |
| `status` | string | no |  |
| `expires_at` | string (`date-time`) | no |  |
| `max_redemptions` | integer | no |  |
| `metadata` | object | no |  |
| `entitlement_id` | string (`passport.id`) | no |  |

#### `gift.invite.created`

Emitted when a gift invite is created. The body is the invite as it was asked for.

Version 1.0.0, referred to as `passport/schemas/gift.invite.created@^1`. Automations a publisher writes: no.

| Property | Type | Required | Description |
|---|---|---|---|
| `credit_id` | string (`passport.id`) | yes |  |
| `owner_id` | string (`passport.id`) | no |  |
| `owner_email` | string (`email`) | no |  |
| `passcode` | string | no |  |
| `user_id` | string (`passport.id`) | no |  |
| `to` | string (`email`) | no | Recipient email address |
| `message` | string | no | Personal message from the sender |
| `send_at` | string (`date-time`) | no |  |
| `auto_accept` | boolean | no |  |

#### `gift.invite.redeemed`

Emitted when a gift invite is redeemed. The body is the acceptance.

Version 1.0.0, referred to as `passport/schemas/gift.invite.redeemed@^1`. Automations a publisher writes: no.

| Property | Type | Required | Description |
|---|---|---|---|
| `user_id` | string (`passport.id`) | no |  |
| `invite_code` | string | no |  |

#### `gift.invite.rejected`

Emitted when a gift invite is rejected. The body is the rejection.

Version 1.0.0, referred to as `passport/schemas/gift.invite.rejected@^1`. Automations a publisher writes: no.

| Property | Type | Required | Description |
|---|---|---|---|
| `invite_code` | string | no |  |
| `status` | string | no |  |

#### `job.canceled`

Emitted when a job is canceled.

Version 1.0.0, referred to as `passport/schemas/job.canceled@^1`. Automations a publisher writes: no.

No listed properties.

#### `job.completed`

Emitted when a job completes successfully.

Version 1.0.0, referred to as `passport/schemas/job.completed@^1`. Automations a publisher writes: no.

No listed properties.

#### `job.failed`

Emitted when a job fails.

Version 1.0.0, referred to as `passport/schemas/job.failed@^1`. Automations a publisher writes: no.

No listed properties.

#### `job.started`

Emitted when a job begins dispatching.

Version 1.0.0, referred to as `passport/schemas/job.started@^1`. Automations a publisher writes: no.

No listed properties.

#### `team.invite.accepted`

Emitted when a team (entitlement) invite is accepted. The body is the acceptance.

Version 1.0.0, referred to as `passport/schemas/team.invite.accepted@^1`. Automations a publisher writes: no.

| Property | Type | Required | Description |
|---|---|---|---|
| `user_id` | string (`passport.id`) | no |  |
| `invite_code` | string | no |  |

#### `team.invite.rejected`

Emitted when a team (entitlement) invite is rejected. The body is the rejection.

Version 1.0.0, referred to as `passport/schemas/team.invite.rejected@^1`. Automations a publisher writes: no.

| Property | Type | Required | Description |
|---|---|---|---|
| `invite_code` | string | no |  |
| `status` | string | no |  |

#### `team.member.added`

Placeholder for team member additions. This event type is defined but not currently emitted from application code.

Version 1.0.0, referred to as `passport/schemas/team.member.added@^1`. Automations a publisher writes: no.

| Property | Type | Required | Description |
|---|---|---|---|
| `team_id` | string (`passport.id`) | no |  |
| `user_id` | string (`passport.id`) | no |  |
| `role` | string | no |  |
| `invited_by` | string (`passport.id`) | no | The user who added this member |

#### `team.member.removed`

Emitted when a team member is removed.

Version 1.0.0, referred to as `passport/schemas/team.member.removed@^1`. Automations a publisher writes: no.

| Property | Type | Required | Description |
|---|---|---|---|
| `team_id` | string (`passport.id`) | no |  |
| `user_id` | string (`passport.id`) | no |  |
| `removed_by` | string (`passport.id`) | no |  |

#### `user.added`

Emitted when a user is added to an instance (first role assignment).

Version 1.0.0, referred to as `passport/schemas/user.added@^1`. Automations a publisher writes: no.

| Property | Type | Required | Description |
|---|---|---|---|
| `roles` | array of string | yes |  |
| `user` | `passport/schemas/user@^1` | yes |  |

#### `user.audience.refresh`

Emitted when a user's audience memberships are refreshed.

Version 1.0.0, referred to as `passport/schemas/user.audience.refresh@^1`. Automations a publisher writes: no.

| Property | Type | Required | Description |
|---|---|---|---|
| `added` | array of string | no | Audience names the user was added to |
| `existing` | array of string | no | Audience names the user already belonged to |
| `removed` | array of string | no | Audience names the user was removed from |

#### `user.auth.failed`

Emitted when a user authentication attempt fails.

Version 1.0.0, referred to as `passport/schemas/user.auth.failed@^1`. Automations a publisher writes: no.

| Property | Type | Required | Description |
|---|---|---|---|
| `login` | string | yes |  |

#### `user.auth.success`

Emitted when a user authenticates successfully.

Version 1.0.0, referred to as `passport/schemas/user.auth.success@^1`. Automations a publisher writes: no.

| Property | Type | Required | Description |
|---|---|---|---|
| `login` | string | yes |  |

#### `user.created`

Emitted when a new user is created. The body is what the user was created with.

Version 1.0.0, referred to as `passport/schemas/user.created@^1`. Automations a publisher writes: yes.

| Property | Type | Required | Description |
|---|---|---|---|
| `instance_id` | string (`passport.id`) | yes |  |
| `login` | string | yes |  |
| `password` | string | no |  |
| `password_expires_at` | string (`date-time`) | no |  |
| `preferences` | object | no |  |
| `profile` | `passport/schemas/openid.profile@^1` | no | OpenID profile |
| `roles` | array of string | no |  |
| `mfa_required` | boolean | no |  |
| `metadata` | object | no |  |
| `stripe_account` | object | no |  |

#### `user.deleted`

Emitted when a user is permanently deleted from the parent instance. The body is the whole user record.

Version 1.0.0, referred to as `passport/schemas/user.deleted@^1`. Automations a publisher writes: no.

No listed properties.

#### `user.email.bounced`

Emitted when a user's email is returned due to a bounce or complaint.

Version 1.0.0, referred to as `passport/schemas/user.email.bounced@^1`. Automations a publisher writes: no.

| Property | Type | Required | Description |
|---|---|---|---|
| `email` | string (`email`) | no |  |
| `type` | string | no |  |
| `reason` | string | no |  |

#### `user.email.opt_in`

Emitted when a user opts back in to the email channel (preferences.channels.email.opt_out set to false).

Version 1.0.0, referred to as `passport/schemas/user.email.opt_in@^1`. Automations a publisher writes: no.

| Property | Type | Required | Description |
|---|---|---|---|
| `channel` | string | yes | The messaging channel |
| `opt_out` | boolean | yes | True when the user is opted out of the channel, false when opted in |

#### `user.email.opt_out`

Emitted when a user opts out of the email channel (preferences.channels.email.opt_out set to true).

Version 1.0.0, referred to as `passport/schemas/user.email.opt_out@^1`. Automations a publisher writes: yes.

| Property | Type | Required | Description |
|---|---|---|---|
| `channel` | string | yes | The messaging channel |
| `opt_out` | boolean | yes | True when the user is opted out of the channel, false when opted in |

#### `user.email.suppressed`

Emitted when a user's email is suppressed by the mail provider.

Version 1.0.0, referred to as `passport/schemas/user.email.suppressed@^1`. Automations a publisher writes: no.

| Property | Type | Required | Description |
|---|---|---|---|
| `email` | string (`email`) | yes |  |
| `type` | string | yes | Suppression type (e.g. bounce, complaint) |
| `reason` | string | no |  |
| `mta` | string | no | Mail transfer agent status |
| `details` | string | no | MTA status code details |

#### `user.email.unsuppressed`

Emitted when an operator or admin clears the suppression on a user's email address.

Version 1.0.0, referred to as `passport/schemas/user.email.unsuppressed@^1`. Automations a publisher writes: no.

| Property | Type | Required | Description |
|---|---|---|---|
| `email` | string (`email`) | yes | The address that was un-suppressed |
| `was` | string | no | The kind of suppression that was cleared (e.g. bounce, complaint); empty when none was recorded |
| `reason` | string | no | The reason recorded with the suppression that was cleared; empty when none was recorded |

#### `user.email.verified`

Emitted when a user's email is confirmed. Contains the member profile and instance context.

Version 1.0.0, referred to as `passport/schemas/user.email.verified@^1`. Automations a publisher writes: no.

| Property | Type | Required | Description |
|---|---|---|---|
| `member` | `passport/schemas/openid.profile@^1` | yes |  |
| `instance` | `passport/schemas/instance@^1` | yes |  |

#### `user.email.verify`

Email verification request. Sent via the oauth verify flow (with code) or when a user updates their email (without code).

Version 1.0.0, referred to as `passport/schemas/user.email.verify@^1`. Automations a publisher writes: no.

| Property | Type | Required | Description |
|---|---|---|---|
| `code` | string | no | OTP verification code (present when sent via the oauth verify flow) |
| `link` | string (`uri`) | yes | Verification URL with embedded access token |
| `token` | string | no | Access token for verification |
| `member` | `passport/schemas/openid.profile@^1` | yes |  |
| `instance` | `passport/schemas/instance@^1` | yes |  |
| `template_options` | object | no | Template rendering options (admin users only) |

#### `user.entitlement.canceled`

Emitted when an entitlement is canceled. The body has the same shape as the body of user.entitlement.created.

Version 1.0.0, referred to as `passport/schemas/user.entitlement.canceled@^1`. Automations a publisher writes: no.

No listed properties.

#### `user.entitlement.created`

Emitted when an entitlement is created. The body is the entitlement, without its user, subscription and audiences.

Version 1.0.0, referred to as `passport/schemas/user.entitlement.created@^1`. Automations a publisher writes: no.

No listed properties.

#### `user.entitlement.deleted`

Emitted when an entitlement is deleted. The body is the whole entitlement.

Version 1.0.0, referred to as `passport/schemas/user.entitlement.deleted@^1`. Automations a publisher writes: no.

No listed properties.

#### `user.entitlement.failed`

Emitted when an entitlement operation fails.

Version 1.0.0, referred to as `passport/schemas/user.entitlement.failed@^1`. Automations a publisher writes: no.

| Property | Type | Required | Description |
|---|---|---|---|
| `entitlement_id` | string (`passport.id`) | no |  |
| `user_id` | string (`passport.id`) | no |  |
| `application_id` | string (`passport.id`) | no |  |

#### `user.entitlement.updated`

Emitted when an entitlement is updated. The body is the change that was asked for.

Version 1.0.0, referred to as `passport/schemas/user.entitlement.updated@^1`. Automations a publisher writes: no.

| Property | Type | Required | Description |
|---|---|---|---|
| `entitlement_id` | string (`passport.id`) | yes |  |
| `active` | boolean | no |  |
| `expires_at` | string (`date-time`) | no |  |
| `metadata` | object | no |  |
| `categories` | array of object | no |  |

#### `user.feed.build`

Emitted when a user's content feed is built.

Version 1.0.0, referred to as `passport/schemas/user.feed.build@^1`. Automations a publisher writes: no.

| Property | Type | Required | Description |
|---|---|---|---|
| `user_id` | string (`passport.id`) | no |  |
| `instance_id` | string (`passport.id`) | no |  |

#### `user.password.email`

Passwordless email login. Contains the OTP code, session link, and requesting client context.

Version 1.0.0, referred to as `passport/schemas/user.password.email@^1`. Automations a publisher writes: no.

| Property | Type | Required | Description |
|---|---|---|---|
| `code` | string | yes | OTP login code |
| `link` | string (`uri`) | yes | Session link URL |
| `token` | string | no | Access token |
| `member` | `passport/schemas/openid.profile@^1` | yes |  |
| `instance` | `passport/schemas/instance@^1` | yes |  |
| `client_id` | string | no | OAuth client ID that initiated the request |
| `client_display_name` | string | no | Display name of the requesting client |
| `client_name` | string | no | Username of the requesting client |
| `mfa` | boolean | no | Whether this is an MFA challenge |
| `template_options` | object | no | Template rendering options (admin users only, email channel) |

#### `user.password.reset.email`

Password reset via email. Contains the reset link and requesting client context but no OTP code.

Version 1.0.0, referred to as `passport/schemas/user.password.reset.email@^1`. Automations a publisher writes: no.

| Property | Type | Required | Description |
|---|---|---|---|
| `link` | string (`uri`) | yes | Password reset session URL |
| `token` | string | no | Access token |
| `member` | `passport/schemas/openid.profile@^1` | yes |  |
| `instance` | `passport/schemas/instance@^1` | yes |  |
| `client_id` | string | no | OAuth client ID that initiated the request |
| `client_display_name` | string | no | Display name of the requesting client |
| `client_name` | string | no | Username of the requesting client |
| `template_options` | object | no | Template rendering options (admin users only, email channel) |

#### `user.password.reset.sms`

Password reset via SMS. Contains the reset link and requesting client context but no OTP code.

Version 1.0.0, referred to as `passport/schemas/user.password.reset.sms@^1`. Automations a publisher writes: no.

| Property | Type | Required | Description |
|---|---|---|---|
| `link` | string (`uri`) | yes | Password reset session URL |
| `token` | string | no | Access token |
| `member` | `passport/schemas/openid.profile@^1` | yes |  |
| `instance` | `passport/schemas/instance@^1` | yes |  |
| `client_id` | string | no | OAuth client ID that initiated the request |
| `client_display_name` | string | no | Display name of the requesting client |
| `client_name` | string | no | Username of the requesting client |
| `template_options` | object | no | Template rendering options (admin users only, email channel) |

#### `user.password.sms`

Passwordless SMS login. Contains the OTP code, session link, and requesting client context.

Version 1.0.0, referred to as `passport/schemas/user.password.sms@^1`. Automations a publisher writes: no.

| Property | Type | Required | Description |
|---|---|---|---|
| `code` | string | yes | OTP login code |
| `link` | string (`uri`) | yes | Session link URL |
| `token` | string | no | Access token |
| `member` | `passport/schemas/openid.profile@^1` | yes |  |
| `instance` | `passport/schemas/instance@^1` | yes |  |
| `client_id` | string | no | OAuth client ID that initiated the request |
| `client_display_name` | string | no | Display name of the requesting client |
| `client_name` | string | no | Username of the requesting client |
| `mfa` | boolean | no | Whether this is an MFA challenge |
| `template_options` | object | no | Template rendering options (admin users only, email channel) |

#### `user.preferences.updated`

Emitted when a user's per-category, per-channel delivery preferences change (e.g. they opt out of a category on email). Whole-channel opt-out is covered by the user.email.opt_out / user.sms.opt_out events instead.

Version 1.0.0, referred to as `passport/schemas/user.preferences.updated@^1`. Automations a publisher writes: no.

| Property | Type | Required | Description |
|---|---|---|---|
| `categories` | array of string (`passport.id`) | yes | IDs of the categories whose delivery preferences changed |
| `delivery` | array of object | no | The updated per-category delivery preferences |

#### `user.profile.updated`

Emitted when a user's OpenID profile is updated. Includes the full updated profile and a GJSON event_filter for routing.

Version 1.0.0, referred to as `passport/schemas/user.profile.updated@^1`. Automations a publisher writes: no.

| Property | Type | Required | Description |
|---|---|---|---|
| `event_filter` | string | no | GJSON path of changed profile fields for event routing |
| `profile` | `passport/schemas/openid.profile@^1` | yes | Full updated OpenID profile |

#### `user.removed`

Emitted when a user is removed from an instance. When triggered by role removal the body includes roles and a nested user object; when triggered by deletion the body is the flat User object.

Version 1.0.0, referred to as `passport/schemas/user.removed@^1`. Automations a publisher writes: no.

| Property | Type | Required | Description |
|---|---|---|---|
| `roles` | array of string | no | Roles that were removed (present when triggered by role removal) |
| `user` | `passport/schemas/user@^1` | no | User object (present when triggered by role removal) |

#### `user.role.added`

Emitted when roles are added to a user who already has existing roles.

Version 1.0.0, referred to as `passport/schemas/user.role.added@^1`. Automations a publisher writes: no.

| Property | Type | Required | Description |
|---|---|---|---|
| `roles` | array of string | yes |  |
| `user` | `passport/schemas/user@^1` | yes |  |

#### `user.role.removed`

Emitted when roles are removed from a user who still has remaining roles.

Version 1.0.0, referred to as `passport/schemas/user.role.removed@^1`. Automations a publisher writes: no.

| Property | Type | Required | Description |
|---|---|---|---|
| `roles` | array of string | yes |  |
| `user` | `passport/schemas/user@^1` | yes |  |

#### `user.signup.email`

Email signup verification: sent when a person signs up with an email address.

Version 1.0.0, referred to as `passport/schemas/user.signup.email@^1`. Automations a publisher writes: no.

| Property | Type | Required | Description |
|---|---|---|---|
| `code` | string | yes | OTP verification code |
| `link` | string (`uri`) | yes | Verification URL with embedded access token |
| `token` | string | no | Access token for verification |
| `member` | `passport/schemas/openid.profile@^1` | yes |  |
| `instance` | `passport/schemas/instance@^1` | yes |  |
| `template_options` | object | no | Template rendering options (admin users only) |

#### `user.signup.sms`

SMS signup verification: sent when a person signs up with a phone number.

Version 1.0.0, referred to as `passport/schemas/user.signup.sms@^1`. Automations a publisher writes: no.

| Property | Type | Required | Description |
|---|---|---|---|
| `code` | string | yes | OTP verification code |
| `link` | string (`uri`) | yes | Verification URL with embedded access token |
| `token` | string | no | Access token for verification |
| `member` | `passport/schemas/openid.profile@^1` | yes |  |
| `instance` | `passport/schemas/instance@^1` | yes |  |
| `template_options` | object | no | Template rendering options (admin users only) |

#### `user.sms.opt_in`

Emitted when a user opts back in to the sms channel (preferences.channels.sms.opt_out set to false).

Version 1.0.0, referred to as `passport/schemas/user.sms.opt_in@^1`. Automations a publisher writes: no.

| Property | Type | Required | Description |
|---|---|---|---|
| `channel` | string | yes | The messaging channel |
| `opt_out` | boolean | yes | True when the user is opted out of the channel, false when opted in |

#### `user.sms.opt_out`

Emitted when a user opts out of the sms channel (preferences.channels.sms.opt_out set to true).

Version 1.0.0, referred to as `passport/schemas/user.sms.opt_out@^1`. Automations a publisher writes: no.

| Property | Type | Required | Description |
|---|---|---|---|
| `channel` | string | yes | The messaging channel |
| `opt_out` | boolean | yes | True when the user is opted out of the channel, false when opted in |

#### `user.sms.verified`

Emitted when a user's phone number is confirmed. Contains the member profile and instance context.

Version 1.0.0, referred to as `passport/schemas/user.sms.verified@^1`. Automations a publisher writes: no.

| Property | Type | Required | Description |
|---|---|---|---|
| `member` | `passport/schemas/openid.profile@^1` | yes |  |
| `instance` | `passport/schemas/instance@^1` | yes |  |

#### `user.sms.verify`

SMS verification request. Sent via the oauth verify flow (with code) or when a user updates their phone number (without code).

Version 1.0.0, referred to as `passport/schemas/user.sms.verify@^1`. Automations a publisher writes: no.

| Property | Type | Required | Description |
|---|---|---|---|
| `code` | string | no | OTP verification code (present when sent via the oauth verify flow) |
| `link` | string (`uri`) | yes | Verification URL with embedded access token |
| `token` | string | no | Access token for verification |
| `member` | `passport/schemas/openid.profile@^1` | yes |  |
| `instance` | `passport/schemas/instance@^1` | yes |  |
| `template_options` | object | no | Template rendering options (admin users only) |

#### `user.subscription.create.failed`

Emitted when creating a subscription fails. The body is the subscription as it was asked for.

Version 1.0.0, referred to as `passport/schemas/user.subscription.create.failed@^1`. Automations a publisher writes: no.

| Property | Type | Required | Description |
|---|---|---|---|
| `user_id` | string (`passport.id`) | no |  |
| `status` | string | no |  |
| `stripe_subscription` | string | no |  |
| `stripe_item` | string | no |  |
| `credit_id` | string (`passport.id`) | no |  |
| `begins_at` | string (`date-time`) | no |  |
| `ends_at` | string (`date-time`) | no |  |
| `cancel_at` | string (`date-time`) | no |  |
| `trial_ends_at` | string (`date-time`) | no |  |
| `price_id` | string (`passport.id`) | no |  |
| `quantity` | integer | no |  |
| `max_quantity` | integer | no |  |
| `metadata` | object | no |  |
| `auto_renew` | boolean | no |  |

#### `user.subscription.created`

Emitted when a subscription is created. The body is the subscription as it was asked for, with the new subscription_id.

Version 1.0.0, referred to as `passport/schemas/user.subscription.created@^1`. Automations a publisher writes: no.

| Property | Type | Required | Description |
|---|---|---|---|
| `user_id` | string (`passport.id`) | no |  |
| `status` | string | no |  |
| `stripe_subscription` | string | no | Stripe subscription ID |
| `stripe_item` | string | no |  |
| `credit_id` | string (`passport.id`) | no |  |
| `begins_at` | string (`date-time`) | no |  |
| `ends_at` | string (`date-time`) | no |  |
| `cancel_at` | string (`date-time`) | no |  |
| `trial_ends_at` | string (`date-time`) | no |  |
| `price_id` | string (`passport.id`) | no |  |
| `quantity` | integer | no |  |
| `max_quantity` | integer | no |  |
| `metadata` | object | no |  |
| `auto_renew` | boolean | no |  |
| `subscription_id` | string (`passport.id`) | no | The created subscription's ID |

#### `user.subscription.deleted`

Emitted when a subscription is deleted. The body is the whole subscription.

Version 1.0.0, referred to as `passport/schemas/user.subscription.deleted@^1`. Automations a publisher writes: no.

No listed properties.

#### `user.subscription.expiring`

Emitted by the recurring subscription-expiring job when an active, non-renewing subscription is approaching its end date (within 7 days for yearly plans and 48 hours for monthly plans by default; both windows are configurable on the instance policy).

Version 1.0.0, referred to as `passport/schemas/user.subscription.expiring@^1`. Automations a publisher writes: no.

| Property | Type | Required | Description |
|---|---|---|---|
| `subscription_id` | string (`passport.id`) | yes | The expiring subscription ID |
| `plan_id` | string (`passport.id`) | no | The subscription's plan ID (may be null) |
| `interval` | string | yes | The subscription's recurring interval |
| `ends_at` | string (`date-time`) | yes | When the subscription expires |

#### `user.subscription.item.updated`

Emitted when a subscription item is updated.

Version 1.0.0, referred to as `passport/schemas/user.subscription.item.updated@^1`. Automations a publisher writes: no.

| Property | Type | Required | Description |
|---|---|---|---|
| `subscription_id` | string (`passport.id`) | no |  |
| `stripe_item` | string | no |  |
| `quantity` | integer | no |  |

#### `user.subscription.status.active`

Emitted when a subscription transitions to active status.

Version 1.0.0, referred to as `passport/schemas/user.subscription.status.active@^1`. Automations a publisher writes: yes. It has the shape of `user.subscription.status`, the schema of a trigger on the wildcard that covers it.

| Property | Type | Required | Description |
|---|---|---|---|
| `prev_status` | string | no | Previous subscription status |
| `status` | string | yes | New subscription status |
| `subscription_id` | string (`passport.id`) | yes | Subscription ID |
| `stripe_subscription` | string | no | Stripe subscription ID (when applicable) |

#### `user.subscription.status.canceled`

Emitted when a subscription transitions to canceled status.

Version 1.0.0, referred to as `passport/schemas/user.subscription.status.canceled@^1`. Automations a publisher writes: yes. It has the shape of `user.subscription.status`, the schema of a trigger on the wildcard that covers it.

| Property | Type | Required | Description |
|---|---|---|---|
| `prev_status` | string | no | Previous subscription status |
| `status` | string | yes | New subscription status |
| `subscription_id` | string (`passport.id`) | yes | Subscription ID |
| `stripe_subscription` | string | no | Stripe subscription ID (when applicable) |

#### `user.subscription.status.inactive`

Emitted when a subscription transitions to inactive status.

Version 1.0.0, referred to as `passport/schemas/user.subscription.status.inactive@^1`. Automations a publisher writes: no. It has the shape of `user.subscription.status`, the schema of a trigger on the wildcard that covers it.

| Property | Type | Required | Description |
|---|---|---|---|
| `prev_status` | string | no | Previous subscription status |
| `status` | string | yes | New subscription status |
| `subscription_id` | string (`passport.id`) | yes | Subscription ID |
| `stripe_subscription` | string | no | Stripe subscription ID (when applicable) |

#### `user.subscription.status.incomplete`

Emitted when a subscription transitions to incomplete status.

Version 1.0.0, referred to as `passport/schemas/user.subscription.status.incomplete@^1`. Automations a publisher writes: no. It has the shape of `user.subscription.status`, the schema of a trigger on the wildcard that covers it.

| Property | Type | Required | Description |
|---|---|---|---|
| `prev_status` | string | no | Previous subscription status |
| `status` | string | yes | New subscription status |
| `subscription_id` | string (`passport.id`) | yes | Subscription ID |
| `stripe_subscription` | string | no | Stripe subscription ID (when applicable) |

#### `user.subscription.status.incomplete_expired`

Emitted when a subscription transitions to incomplete_expired status.

Version 1.0.0, referred to as `passport/schemas/user.subscription.status.incomplete_expired@^1`. Automations a publisher writes: no. It has the shape of `user.subscription.status`, the schema of a trigger on the wildcard that covers it.

| Property | Type | Required | Description |
|---|---|---|---|
| `prev_status` | string | no | Previous subscription status |
| `status` | string | yes | New subscription status |
| `subscription_id` | string (`passport.id`) | yes | Subscription ID |
| `stripe_subscription` | string | no | Stripe subscription ID (when applicable) |

#### `user.subscription.status.past_due`

Emitted when a subscription transitions to past_due status.

Version 1.0.0, referred to as `passport/schemas/user.subscription.status.past_due@^1`. Automations a publisher writes: no. It has the shape of `user.subscription.status`, the schema of a trigger on the wildcard that covers it.

| Property | Type | Required | Description |
|---|---|---|---|
| `prev_status` | string | no | Previous subscription status |
| `status` | string | yes | New subscription status |
| `subscription_id` | string (`passport.id`) | yes | Subscription ID |
| `stripe_subscription` | string | no | Stripe subscription ID (when applicable) |

#### `user.subscription.status.paused`

Emitted when a subscription transitions to paused status.

Version 1.0.0, referred to as `passport/schemas/user.subscription.status.paused@^1`. Automations a publisher writes: no. It has the shape of `user.subscription.status`, the schema of a trigger on the wildcard that covers it.

| Property | Type | Required | Description |
|---|---|---|---|
| `prev_status` | string | no | Previous subscription status |
| `status` | string | yes | New subscription status |
| `subscription_id` | string (`passport.id`) | yes | Subscription ID |
| `stripe_subscription` | string | no | Stripe subscription ID (when applicable) |

#### `user.subscription.status.trialing`

Emitted when a subscription transitions to trialing status.

Version 1.0.0, referred to as `passport/schemas/user.subscription.status.trialing@^1`. Automations a publisher writes: no. It has the shape of `user.subscription.status`, the schema of a trigger on the wildcard that covers it.

| Property | Type | Required | Description |
|---|---|---|---|
| `prev_status` | string | no | Previous subscription status |
| `status` | string | yes | New subscription status |
| `subscription_id` | string (`passport.id`) | yes | Subscription ID |
| `stripe_subscription` | string | no | Stripe subscription ID (when applicable) |

#### `user.subscription.status.unpaid`

Emitted when a subscription transitions to unpaid status.

Version 1.0.0, referred to as `passport/schemas/user.subscription.status.unpaid@^1`. Automations a publisher writes: no. It has the shape of `user.subscription.status`, the schema of a trigger on the wildcard that covers it.

| Property | Type | Required | Description |
|---|---|---|---|
| `prev_status` | string | no | Previous subscription status |
| `status` | string | yes | New subscription status |
| `subscription_id` | string (`passport.id`) | yes | Subscription ID |
| `stripe_subscription` | string | no | Stripe subscription ID (when applicable) |

#### `user.subscription.trial.ending`

Emitted by the recurring trial-ending job for trialing subscriptions whose trial is about to end (within 3 days by default; the site's policy sets the window and how often the job runs). The trigger for trial-to-paid conversion journeys.

Version 1.0.0, referred to as `passport/schemas/user.subscription.trial.ending@^1`. Automations a publisher writes: no.

| Property | Type | Required | Description |
|---|---|---|---|
| `subscription_id` | string (`passport.id`) | yes | The trialing subscription ID |
| `plan_id` | string (`passport.id`) | no | The subscription's plan ID (may be null) |
| `trial_ends_at` | string (`date-time`) | yes | When the trial ends |

#### `user.subscription.update.failed`

Emitted when updating a subscription fails. The body is the change that was asked for.

Version 1.0.0, referred to as `passport/schemas/user.subscription.update.failed@^1`. Automations a publisher writes: no.

| Property | Type | Required | Description |
|---|---|---|---|
| `subscription_id` | string (`passport.id`) | no |  |
| `status` | string | no |  |
| `stripe_subscription` | string | no |  |
| `stripe_item` | string | no |  |
| `credit_id` | string (`passport.id`) | no |  |
| `begins_at` | string (`date-time`) | no |  |
| `ends_at` | string (`date-time`) | no |  |
| `canceled` | boolean | no |  |
| `quantity` | integer | no |  |
| `max_quantity` | integer | no |  |
| `metadata` | object | no |  |
| `auto_renew` | boolean | no |  |
| `trial_ends_at` | string (`date-time`) | no |  |

#### `user.subscription.updated`

Emitted when a subscription is updated. The body is the change that was asked for.

Version 1.0.0, referred to as `passport/schemas/user.subscription.updated@^1`. Automations a publisher writes: no.

| Property | Type | Required | Description |
|---|---|---|---|
| `subscription_id` | string (`passport.id`) | no |  |
| `status` | string | no |  |
| `stripe_subscription` | string | no |  |
| `stripe_item` | string | no |  |
| `credit_id` | string (`passport.id`) | no |  |
| `begins_at` | string (`date-time`) | no |  |
| `ends_at` | string (`date-time`) | no |  |
| `cancel_at` | string (`date-time`) | no |  |
| `trial_ends_at` | string (`date-time`) | no |  |
| `price_id` | string (`passport.id`) | no |  |
| `quantity` | integer | no |  |
| `max_quantity` | integer | no |  |
| `metadata` | object | no |  |
| `auto_renew` | boolean | no |  |

#### `user.token.revoked`

Emitted when an access token is revoked. The body is the token's record.

Version 1.0.0, referred to as `passport/schemas/user.token.revoked@^1`. Automations a publisher writes: no.

| Property | Type | Required | Description |
|---|---|---|---|
| `id` | string (`passport.id`) | no |  |
| `instance_id` | string (`passport.id`) | no |  |
| `created_at` | string (`date-time`) | no |  |
| `updated_at` | string (`date-time`) | no |  |
| `application_id` | string (`passport.id`) | no |  |
| `user_id` | string (`passport.id`) | no |  |
| `expires_at` | string (`date-time`) | no |  |
| `revoked_at` | string (`date-time`) | no |  |
| `redirect_uri` | string | no |  |
| `claims` | object | no |  |
| `type` | string | no |  |
| `last_accessed` | string (`date-time`) | no |  |
| `bearer` | string | no |  |
| `distribution_id` | string (`passport.id`) | no |  |
| `uri` | string | no |  |

#### `user.updated`

Emitted when a user is updated. The body is the change that was asked for, with an event_filter for routing.

Version 1.0.0, referred to as `passport/schemas/user.updated@^1`. Automations a publisher writes: no.

| Property | Type | Required | Description |
|---|---|---|---|
| `instance_id` | string (`passport.id`) | no |  |
| `user_id` | string (`passport.id`) | no |  |
| `login` | string | no |  |
| `password_expires_at` | string (`date-time`) | no |  |
| `preferences` | object | no |  |
| `profile` | `passport/schemas/openid.profile@^1` | no | OpenID profile (partial update) |
| `roles` | object | no | Role add/remove operations |
| `mfa_required` | boolean | no |  |
| `metadata` | object | no |  |
| `event_filter` | string | no | GJSON path of changed fields for event routing |

<!-- reference:end event-bodies -->
