# Campaign Monitor

Keeps a Campaign Monitor list in step with a publisher's Passport members, on
the one-list model: verified members are added, subscription details are kept
as custom fields that segments are built on, per-newsletter opt-outs are kept
as flags, and unsubscribes are carried both ways. Deleted accounts are erased
from the list.

## What the publisher sets up

**Plugin settings** (once):

| Setting | |
|---|---|
| API key | Campaign Monitor, Account settings, API keys. Secret |
| Client ID | The 32-character client id. Decides which lists are offered |

"Test connection" checks that the key is accepted and that the client id
belongs to that account.

**Automations** (each is added from the plugin's Automations tab, given a
list, and enabled):

| Automation | Runs when | Does |
|---|---|---|
| Add verified members to a list | a member verifies their address | Adds them, with site name, Passport id and join date |
| Add new subscribers to a list | a subscription becomes active, or a trial or gift starts | Adds them, with subscription and plan details; clears an earlier expiry |
| Keep renewal details current on a list | a subscription changes | Sets auto-renew, the scheduled cancellation date and the interval |
| Mark ended subscriptions on a list | a subscription ends | Clears the subscription fields and records the end date |
| Keep newsletter opt-outs current on a list | a member changes which newsletters they get by email | Sets one flag per listed category |
| Unsubscribe members who opt out of email | a member opts out of email | Unsubscribes them on the list |
| Resubscribe members who opt back in to email | a member opts back in | Makes them active on the list again |
| Delete erased accounts from a list | an account is permanently deleted | Deletes them from the list |
| Opt members out of email when they unsubscribe in Campaign Monitor | Campaign Monitor calls its webhook | Opts the matching member out of email in Passport |
| Register the unsubscribe webhook on a list | run by hand, from **Tools** | Registers, removes or shows the webhook on a list |

The first eight may be added more than once, one per list. The webhook
automation is added once. "Register the unsubscribe webhook on a list" has
nothing to set up, so it is not added at all: it is listed under **Tools**
on the plugin's Automations tab with a **Run** button.

A usual setup is one list: the first automation adds members; the next three
keep the subscription fields current; opt-out, opt-in and the webhook keep
consent in step both ways; the delete automation handles erasure.

## Custom fields: create them first

**Campaign Monitor silently drops a custom field value when the field is not
defined on the list.** The call still succeeds, so a subscriber appears with
blank fields and nothing looks wrong.

Before enabling an automation, create every field it writes on the list
(Lists & Subscribers, the list, Custom Fields), with exactly these keys. The
key is the personalization tag without the square brackets. Date fields must
be created with the Date type; the automations send dates as `YYYY/MM/DD`.

| Field | Type | Set by | Cleared by | Value |
|---|---|---|---|---|
| `InstanceName` | Text | new-user, new-subscriber | | The site's name |
| `PassportUserID` | Text | new-user, new-subscriber | | The member's Passport id |
| `CreatedAt` | Date | new-user | | Account creation date |
| `PassportSubscriptionID` | Text | new-subscriber | subscription-canceled | The subscription's Passport id |
| `PassportPlanID` | Text | new-subscriber | subscription-canceled | The plan's Passport id |
| `SubscriptionInterval` | Text | new-subscriber, subscription-updated | subscription-canceled | `month` or `year` |
| `AutoRenew` | Text | subscription-updated | subscription-canceled | `true` or `false` |
| `SubscriptionCancelsAt` | Date | subscription-updated | subscription-updated, subscription-canceled | Scheduled cancellation date |
| `SubscriptionExpiredAt` | Date | subscription-canceled | new-subscriber | When the subscription ended |
| the keys you enter, e.g. `opt_out_weekly` | Text | preferences-updated | | `true` when opted out of that category on email, else `false` |

Each automation's help text lists the fields it writes. Treat new-subscriber,
subscription-updated and subscription-canceled as one unit and create all of
their fields together.

Segments then follow from field state, for example: paid is
`[PassportPlanID] is provided`; auto-renew off is `[AutoRenew] equals false`;
win-back is `[SubscriptionExpiredAt] is in the last 90 days`.

## Unsubscribing and deleting

Two different Campaign Monitor operations are used on purpose.

- **Unsubscribe** records consent: the address stays on the list, suppressed,
  until something with fresh consent behind it adds it again. Used when a
  member opts out of email.
- **Delete** removes the membership and the record. Used when an account is
  erased.

A cancelled subscription does neither; it only clears the subscription
fields. Campaign Monitor answers 400 (code 203) when an address is not on the
list; the automations treat that as nothing to do, and the run still
succeeds. The 400 is visible in the run's detail.

Adding an address that unsubscribed before makes it active again
(`resubscribe`), because the add automations run on consent-like signals: a
verified sign-up, a new subscription, an explicit opt-in. The first two have
an advanced setting to turn that off.

## The unsubscribe webhook

Campaign Monitor does not sign what it sends. The token in the webhook
address is the only thing that authorises a request, so the address is a
secret.

Campaign Monitor has no screen for list webhooks. After adding the webhook
automation, copy its address and run "Register the unsubscribe webhook on a
list" (under Tools) once per list. Before removing the webhook automation, run it again
with "Remove the address".

Only `Deactivate` events with state `Unsubscribed` opt a member out. Spam
complaints, hard bounces and deletions arrive as the same event type and are
ignored.

## For developers

| Folder | Holds |
|---|---|
| `actions/` | One action per Campaign Monitor API call: `subscriber.add`, `.update`, `.delete`, `.get`, `.unsubscribe`, `lists.get`, `clients.get`, `webhook.register` |
| `schemas/` | `custom-field` (a field to set or clear), `subscriber` (as the API returns one), `list-id` (the list chooser used by every automation's settings) |
| `automations/` | The ten above, plus `ping` for "Test connection" |
| `tests/` | Test cases per automation |

The actions read the API key and client id from the plugin's settings, so
they are not suitable for use from another plugin as they stand.

Requires Passport 2.3.0 or later and outbound access to
`api.createsend.com`. API reference:
https://www.campaignmonitor.com/api/v3-3/

Converted from v1; see [MIGRATION.md](MIGRATION.md).
