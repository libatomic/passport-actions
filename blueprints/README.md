# Blueprints

A **blueprint** is a ready-made workflow you can install from the admin UI
(Workflows → **Blueprints** tab). Picking one drops a complete, working
definition into the editor — triggers, steps and inputs already wired — which
you then point at your own templates, lists and accounts.

Blueprints are the fastest way to go from "I want X to happen when Y" to a
running workflow, and they double as worked examples of the
[workflow language](../WORKFLOW.md) and the
[builtin actions](../BUILTINS.md).

---

## Contents

- [Installing a blueprint](#installing-a-blueprint)
- [Anatomy of a blueprint](#anatomy-of-a-blueprint)
- [Before you enable it](#before-you-enable-it)
- [Directory](#directory)
  - [Authentication](#authentication) · [Onboarding](#onboarding) · [Engagement](#engagement) · [Billing](#billing) · [Content](#content) · [Operations](#operations) · [Lifecycle journeys](#lifecycle-journeys)
  - [Third-party integrations](#third-party-integrations)
- [Distribution-channel blueprints](#distribution-channel-blueprints)
- [Writing your own](#writing-your-own)

---

## Installing a blueprint

1. **Workflows → New Workflow → Blueprints** and pick one. The library reads
   this folder live from GitHub, so newly published blueprints show up without
   an app release (hit **Refresh** if you just pushed one).
2. The definition loads into the editor. Fill in the blueprint's **inputs**
   (list ids, page ids, sender addresses…) — the editor prompts for each.
3. Create any **secrets** it needs (Workflows → Secrets), using the exact names
   in the blueprint's requirements.
4. **Save**. New workflows are created **disabled** so nothing fires while you
   finish wiring it up.
5. **Run Now** to test (manual runs work even while disabled), check the run
   detail, then **enable** it.

## Anatomy of a blueprint

```yaml
name: New Subscriber (Campaign Monitor)   # shown in the library
icon: https://…/account-star-outline.svg  # library card icon
description: |                            # the library card body
  What it does, what it needs.
category: campaign-monitor                # groups it in the library
inputs:                                   # prompted for on install
  list_id:
    description: Campaign Monitor list ID
    type: string
    required: true
    default: ""
definition:                               # the actual workflow
  name: New Subscriber (Campaign Monitor)
  version: 1
  on:                                     # triggers
    - event:
        name: user.subscription.status.active
        schema:
          ref: libatomic/passport-actions/schemas/atomic/user.subscription.status.active@v1.0.0
  inputs: { … }                           # same inputs, for the definition
  steps:                                  # what it does
    - id: load-user
      action: user.get
      with:
        user_id: ${{ trigger.user_id }}
    - id: add-to-list
      includes: libatomic/passport-actions/recipes/cm/subscriber-add
      with:
        api_key: ${{ secrets.CM_API_KEY }}
```

Two things worth calling out:

- **`inputs` appears twice** — once at the top level (so the library can prompt
  for values) and once inside `definition` (so the workflow can read them as
  `${{ inputs.* }}`). Keep them in sync.
- **`includes:` pulls in a [recipe](../recipes/)** — a packaged, versioned set of
  steps for a third-party API. The blueprint supplies the credentials and maps
  your data into the recipe's inputs; the recipe owns the API details.

## Before you enable it

Most third-party blueprints need three things:

| What | Where |
|---|---|
| **Secrets** — API keys, tokens, passwords | Workflows → **Secrets** (names are listed in each blueprint's README) |
| **Allowed HTTP hosts** — the API hostnames it calls | Workflows → **Settings → Allowed HTTP hosts** (fail-closed; a call to an unlisted host errors) |
| **Inputs** — list ids, page ids, sender addresses | Prompted on install; editable later in the workflow's Inputs panel |

---

## Directory

### Authentication

| Blueprint | Trigger | Purpose |
|---|---|---|
| [`password-email`](password-email/) | `user.password.email` | One-time password / magic link by email |
| [`password-sms`](password-sms/) | `user.password.sms` | One-time password by SMS |
| [`password-reset-email`](password-reset-email/) | `user.password.reset.email` | Password reset link by email |
| [`password-reset-sms`](password-reset-sms/) | `user.password.reset.sms` | Password reset code by SMS |
| [`verify-email`](verify-email/) | `user.email.verify` | Email verification code / magic link |
| [`verify-sms`](verify-sms/) | `user.sms.verify` | Phone verification code |
| [`token-revoke-email`](token-revoke-email/) | `user.token.revoked` | Security notice when a token is revoked |

### Onboarding

| Blueprint | Trigger | Purpose |
|---|---|---|
| [`signup-email`](signup-email/) | `user.signup.email` | Signup confirmation / verification email |
| [`signup-sms`](signup-sms/) | `user.signup.sms` | Signup verification code by SMS |
| [`welcome-on-verify`](welcome-on-verify/) | `user.email.verified` | Welcome email once the address is verified |

### Engagement

| Blueprint | Trigger | Purpose |
|---|---|---|
| [`gift-invite`](gift-invite/) | `gift.invite.created` | Email the gift recipient |
| [`gift-accepted-email`](gift-accepted-email/) | `gift.invite.redeemed` | Tell the purchaser their gift was redeemed |
| [`team-invite`](team-invite/) | `team.member.added` | Invite a new team member |
| [`team-accepted-email`](team-accepted-email/) | `team.invite.redeemed` | Tell the owner an invite was redeemed |

### Billing

| Blueprint | Trigger | Purpose |
|---|---|---|
| [`subscription-created`](subscription-created/) | `user.subscription.created` | New-subscription receipt |
| [`subscription-canceled`](subscription-canceled/) | `user.subscription.status.canceled` | Cancellation notice |
| [`subscription-status-updated`](subscription-status-updated/) | `user.subscription.status.*` | Notify on any status change |
| [`subscription-expiring`](subscription-expiring/) | `user.subscription.expiring` | "Your subscription is ending" email |
| [`subscription-expired-email`](subscription-expired-email/) | `customer.subscription.deleted` | Expired/deleted at Stripe |
| [`subscription-renews-soon-email`](subscription-renews-soon-email/) | `invoice.upcoming` | Upcoming-renewal reminder |
| [`payment-succeeded-email`](payment-succeeded-email/) | `invoice.payment_succeeded` | Payment receipt |
| [`payment-failed-email`](payment-failed-email/) | `charge.failed` | Failed-charge email |
| [`payment-failed-sms`](payment-failed-sms/) | `charge.failed` | Failed-charge text |
| [`payment-requires-validation-email`](payment-requires-validation-email/) | `payment_intent.requires_action` | Prompt for 3-D Secure |
| [`refund-email`](refund-email/) | `charge.refunded` | Refund confirmation email |
| [`refund-sms`](refund-sms/) | `charge.refunded` | Refund confirmation text |
| [`entitlement-created`](entitlement-created/) | `user.entitlement.created` | Access-granted confirmation |
| [`entitlement-deleted`](entitlement-deleted/) | `user.entitlement.deleted` | Access-removed notice |

### Content

| Blueprint | Trigger | Purpose |
|---|---|---|
| [`welcome-podcast`](welcome-podcast/) | `user.subscription.status.active` | Personal welcome episode in the subscriber's feed |
| [`subscription-expiring-podcast`](subscription-expiring-podcast/) | `user.subscription.expiring` | Temporary "ending soon" episode |

### Operations

| Blueprint | Trigger | Purpose |
|---|---|---|
| [`job-completed`](job-completed/) | `job.completed` | React to a background job finishing |
| [`job-failed`](job-failed/) | `job.failed` | Alert an operator when a job fails |
| [`sender-verify-email`](sender-verify-email/) | `email.sender.verify` | Verify a newly added sender address |

### Lifecycle journeys

Multi-step sequences that use durable `wait` steps to span days.

| Blueprint | Purpose |
|---|---|
| [`journeys/onboarding-drip`](journeys/onboarding-drip/) | Welcome → tips → check-in over several days |
| [`journeys/trial-conversion`](journeys/trial-conversion/) | Convert trials before they end |
| [`journeys/win-back`](journeys/win-back/) | Re-engage churned subscribers |
| [`journeys/preference-sync`](journeys/preference-sync/) | Keep your ESP in lockstep with Passport preferences |

### Third-party integrations

Each of these has its own README with setup steps, required secrets and hosts.

| Blueprint | Integrates | Purpose |
|---|---|---|
| [`cm/new-user`](cm/) | Campaign Monitor | Add every new user to a list |
| [`cm/new-subscriber`](cm/) | Campaign Monitor | Add paid subscribers to a list |
| [`cm/subscription-canceled`](cm/) | Campaign Monitor | Remove canceled subscribers |
| [`cm/subscription-expiring`](cm/) | Campaign Monitor | Add soon-to-lapse subscribers |
| [`cm/user-email-opt-out`](cm/) | Campaign Monitor | Honor opt-outs in your ESP |
| [`fb/page-post`](fb/page-post/) | Facebook | **Channel** — publish to a Page feed |
| [`x/post`](x/post/) | X (Twitter) | **Channel** — publish a post |
| [`wp/create-post`](wp/create-post/) | WordPress | **Channel** — publish a post |
| [`spotify/create-episode`](spotify/create-episode/) | Spotify | **Channel** — publish a podcast/video episode |
| [`gh/slack-notify`](gh/) | Slack | Notify a channel when a distribution publishes |
| [`gh/twilio-sms`](gh/) | Twilio | SMS alert on cancellation |
| [`gh/sendgrid-mail`](gh/) | SendGrid | Send mail via SendGrid |
| [`gh/ai-inference`](gh/) | GitHub Models | Generate text with an LLM |

---

## Distribution-channel blueprints

Four of the third-party blueprints (`fb`, `x`, `wp`, `spotify`) are a special
kind: their trigger is a **distribution trigger**, which *defines a new
publishing channel*.

```yaml
on:
  - distribution:
      channel: spotify        # the channel name
      label: Spotify          # shown in the UI
      mode: broadcast         # publish once (vs unicast: once per member)
      base_type: podcast      # reuse the podcast distribution editor
      content_type: html
      requires_audience: true
```

Saving the workflow **registers the channel**: it then appears in an article's
**Add Distribution** menu alongside Email, RSS and Podcast. Publishing to it
runs the workflow, which receives `trigger.distribution_id` and
`trigger.channel` (plus `trigger.user_id` for unicast).

- **`base_type`** makes the Add Distribution editor reuse a built-in channel's
  form — a podcast-shaped channel collects a title, summary and media file
  instead of a plain body box.
- **`requires_audience`** on a broadcast channel means the distribution must
  still pick an audience, even though it publishes once — used when the
  destination gates access by the audience's categories.

See [WORKFLOW.md](../WORKFLOW.md#distribution-triggers--define-a-custom-channel)
for the full contract.

## Writing your own

The quickest path is to copy the closest existing blueprint and edit it.

1. Create `blueprints/<vendor>/<name>/blueprint.yml` (vendor folder for
   third-party; top level for native).
2. Fill in `name`, `icon`, `description`, `category`, `inputs`, and
   `definition`. Declare inputs in **both** places.
3. Put API specifics in a [recipe](../recipes/) and `includes:` it, rather than
   inlining `http.*` steps — recipes are versioned and reusable.
4. Add a `README.md` next to it (third-party blueprints should always have one):
   what it does, when it fires, required secrets and allowed hosts, inputs, and
   how to customize.
5. Push to `master`. The library picks it up on the next refresh.

See the [repo README](../README.md#creating-a-blueprint) for the full authoring
guide, and [BUILTINS.md](../BUILTINS.md) for every action and expression
function available to your steps.
