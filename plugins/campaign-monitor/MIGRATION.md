# Campaign Monitor: v1 to v2

Converted on 14 November 2026 from `libatomic/passport-actions` `master` at
commit `d55677d`. Nothing in the Campaign Monitor files had changed there
since 24 August 2026.

The v2 engine did not exist when this was written. Nothing here has been
checked by `passport-plugin check`, dry-run or run. Every file parses as YAML
and was linted by script against the key lists and form subset in the
development guide.

## Files

| v1 | v2 |
|---|---|
| `packages/campaign-monitor/package.yml` | `plugin.yaml`, `README.md` |
| `plugins/cm/plugin.yml` (vendor connection) | `plugin.yaml` settings; `actions/lists.get.yaml`; `actions/clients.get.yaml` |
| `recipes/cm/subscriber-add` (1.0.1) | `actions/subscriber.add.yaml` (1.0.1) |
| `recipes/cm/subscriber-update` (1.1.0) | `actions/subscriber.update.yaml` (1.1.0) |
| `recipes/cm/subscriber-delete` (1.0.0) | `actions/subscriber.delete.yaml` (1.0.0) |
| `recipes/cm/subscriber-get` (1.0) | `actions/subscriber.get.yaml` (1.0.0) |
| `recipes/cm/subscriber-unsubscribe` (1.0) | `actions/subscriber.unsubscribe.yaml` (1.0.0) |
| `recipes/cm/webhook-register` (1.1) | `actions/webhook.register.yaml` (1.1.0) |
| `blueprints/cm/new-user` | `automations/new-user.yaml` |
| `blueprints/cm/new-subscriber` | `automations/new-subscriber.yaml` |
| `blueprints/cm/subscription-updated` | `automations/subscription-updated.yaml` |
| `blueprints/cm/subscription-canceled` | `automations/subscription-canceled.yaml` |
| `blueprints/cm/preferences-updated` | `automations/preferences-updated.yaml` |
| `blueprints/cm/user-deleted` | `automations/user-deleted.yaml` |
| `blueprints/cm/user-email-opt-in` | `automations/user-email-opt-in.yaml` |
| `blueprints/cm/user-email-opt-out` | `automations/user-email-opt-out.yaml` |
| `blueprints/cm/optout-webhook` | `automations/optout-webhook.yaml` |
| `blueprints/cm/optout-webhook-register` | `automations/optout-webhook-register.yaml` |
| (the vendor plugin's `test: account_clients_get`) | `automations/ping.yaml` |
| (new) | `schemas/custom-field.yaml`, `schemas/subscriber.yaml`, `schemas/list-id.yaml`, `tests/*.yaml` |

Step ids, step order and every expression that does real work were carried
over unchanged, apart from what is listed below.

## Settings, inputs and "add more than once"

| Automation | Own settings | Per-run inputs | `multiple` |
|---|---|---|---|
| new-user | list, resubscribe*, consent to track* | | yes |
| new-subscriber | list, include trials, resubscribe*, consent to track* | | yes |
| subscription-updated | list | | yes |
| subscription-canceled | list | | yes |
| preferences-updated | list, category opt-out fields | | yes |
| user-deleted | list | | yes |
| user-email-opt-in | list | | yes |
| user-email-opt-out | list | | yes |
| optout-webhook | none | | no |
| optout-webhook-register | none | list, operation, webhook address | a tool: never added, run from Tools |
| ping | none | | not offered |

\* advanced.

`multiple: true` follows v1's "install as many as you need, each targets its
own list". The webhook automation is single because one address can be
registered on any number of lists.

## Decisions that change behaviour or naming

1. **Credentials.** v1 used the workflow secret `CM_API_KEY`, passed into
   every recipe as an `api_key` input. v2 uses the plugin's secret setting
   `api_key`; the actions read `secrets.api_key` themselves and have no
   `api_key` input. A site that moves from v1 must enter the key again in the
   plugin's settings.
2. **Client id is now required.** v1 workflows needed only the key; the
   client id belonged to the optional vendor plugin. It is required here
   because the list chooser (`lists.get`) needs it.
3. **The list chooser.** v1 `data_source: { plugin: cm, method:
   subscriber_lists_get }` became `ui.options` running
   `campaign-monitor/lists.get`, declared once in `schemas/list-id.yaml` and
   referenced by every automation.
4. **Knobs that v1 told you to edit into the workflow are settings**, since a
   publisher cannot edit a plugin's steps. Defaults reproduce v1:
   - `resubscribe` (default on) on new-user and new-subscriber.
   - `consent_to_track` (default "yes") on new-user and new-subscriber.
   - `include_trials` (default on) on new-subscriber, replacing "remove the
     trialing trigger". It is a new first step, `skip-trial`, that exits when
     the event is `user.subscription.status.trialing` and the setting is off.
5. **`webhook.register` input `action` is renamed `operation`**, so a step
   does not read `action: … with: { action: … }`. The automation's input is
   renamed the same way.
6. **`webhook.register` has declared outputs.** v1 callers read the recipe's
   inner steps (`steps.webhook.outputs.register.status == "skipped"`,
   `steps.webhook.outputs.existing.body`). The action now returns `webhooks`,
   `registered` and `unregistered`, and the automation's log steps use those.
7. **`optout-webhook-register` calls the action from one of two steps**
   (`inventory` for "list", `webhook` otherwise) instead of one, so that no
   webhook address is passed when there is none.
8. **The webhook address rule.** v1's `validate:` expression (must start with
   `https://` and contain `/webhook/`, unless the operation is "list") became
   `format: uri` plus a `pattern`; `ui.show_when: { operation: [register,
   unregister] }`, so the address is not asked for when only showing what is
   registered; and a first step, `need-url`, that fails the run with a plain
   reason when an address is needed and missing (a rule across fields is a
   step, guide 2.11 rule 5c).
9. **`resubscribe` is a real boolean.** v1 declared it `type: bool` with
   string defaults and converted with `toBool`. The conversion is gone.
10. **No `default: ""`.** v1 defaulted `new_email`, `url` and `name` to
    `""`. In v2 an empty text box is an absent value (guide 2.11 rule 5b),
    so they are simply optional. The steps test `new_email` and `url` with
    `empty()`, and `subscriber.add` / `.update` send `Name` as `""` when no
    name is given, which is what v1 sent.
10a. **`subscriber.get` returns the subscriber itself**, not a wrapper:
    `outputs` is the `subscriber` schema and `returns` is one expression
    (guide 2.12). A caller reads `steps.<id>.outputs.State`. Nothing in this
    plugin calls it yet.
11. **`preferences-updated` category column** uses `format:
    passport.category` (a category picker; the stored value is the id, as in
    v1). v1's `autofill: "opt_out_{name}"`, which pre-filled the field key
    from the chosen category's name, has no equivalent.
12. **Trigger filter on the webhook** is written
    `${{ trigger.body.Type == "Deactivate" }}`; v1 wrote `body.Type == …`.
13. **Ping checks the client id too.** v1's test call only proved the key. The
    new test also fails, with a reason, when the configured client id is not
    one of the account's clients.
14. **Names and descriptions were rewritten for the publisher.** Keys (file
    names) are the v1 blueprint names.
14a. **`optout-webhook-register` is a tool.** Manual, no settings: it is
    listed under Tools with a Run button and is never added (guide 5.4).
15. **Custom fields.** `package.yml` had a `custom_fields:` block documenting
    which Campaign Monitor fields each workflow writes. The v2 manifest has no
    place for it. The keys stay where they always were, as constants in the
    steps; the documentation moved to `README.md` and to each automation's
    `help`, which the publisher sees when adding it.

## Not carried over

- **Vendor-plugin methods nothing used:** `client_segments_get`,
  `list_custom_fields_get`, and the proxy versions of the subscriber calls.
- **`replaces: { event_type, channel: email }`** on five blueprints
  (new-user, subscription-canceled, preferences-updated, opt-in, opt-out).
  v2 has no such key.
- **`legacy_secrets: [CM_API_KEY]`** and `widgets`.

## What v1 did that v2, as specified, cannot express

1. **Automatic webhook registration, and removal.** Installing the v1 package
   generated the webhook workflow's address, filled it into the register
   workflow and ran it; deleting the webhook workflow ran "unregister" first.
   v2 has nothing that runs when an automation is added or removed, and one
   automation cannot read another's webhook address. The publisher copies the
   address and runs the register tool by hand, both ways.

   An option, not taken here: the guide now gives an automation its own
   address as `automation.webhook_url` (5.3). `optout-webhook` could carry
   the list as a setting and a second, manual trigger, and register itself
   from a step when run by hand, which would remove the copy-and-paste. It
   would still not happen by itself on add, and removal would still be a
   manual run before deleting. That is a restructure for Jon to decide; the
   real fix is a hook that runs on add and on remove.
2. **Pre-filling one column from another** (`autofill`), see 11 above.
3. **Publisher edits to a workflow.** v1 suggested changing the new-user
   trigger to `user.created`, adding a `user.subscription.status.canceled`
   trigger to subscription-canceled for non-Stripe cancellations, and deleting
   unwanted custom-field rows. None of these is offered.
4. **`replaces: { event_type, channel: email }`**, on five blueprints. v2 has
   no such key and it is not known what read it.

## For Jon to review

- Whether the three new settings in decision 4 are wanted, or whether those
  choices should simply be fixed.
- Whether `webhook.register` should be three actions (`webhooks.get`,
  `webhook.register`, `webhook.unregister`). It was kept as one to stay close
  to the recipe.
- `subscription-updated` reads `trigger.body.recurring_interval`, which the
  v1 `user.subscription.updated` schema does not declare. Once event bodies
  are checked against the built-in schemas this will be reported on a
  sandbox. Either the schema is missing the field or the event never carries
  it.
- `subscription-canceled`: add `user.subscription.status.canceled` as a
  second trigger, or as a separate automation, for sites that cancel outside
  Stripe?
- A setup automation that creates or checks the list's custom fields through
  the API would remove the "create them first" step. Not built.
- The actions read the plugin's settings directly, which is right for this
  plugin but means they cannot be included by another plugin as they are.
- The sample bodies in `tests/` were written from the v1 schemas and READMEs,
  not captured from a real site.

## Found by the v2 tool (15 November 2026)

`automations/preferences-updated.yaml` failed its "Member has no category
preferences" test case: the step `opted` read
`coalesce(trigger.body.delivery, list())`, and `coalesce` skips empty values,
so with no preferences it returned nil and `filter` failed on it. It now
reads `trigger.body.delivery ?? []`. **The v1 blueprint
(`blueprints/cm/preferences-updated`) has the same expression and the same
fault**: a member with no delivery preferences fails that run in production
today. For Jon.
