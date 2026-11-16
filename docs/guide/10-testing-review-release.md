# 10. Testing, review and release

A plugin goes through five stages. The first three are on your own machine.

| Stage | Where | Proves |
|---|---|---|
| Check | Plugin Studio, or `passport-plugin check` | Every file is valid and every reference resolves |
| Dry run | Plugin Studio's Test panel, or `passport-plugin run` | The steps do what you meant, with sample data and no server |
| Sandbox | A Passport desktop sandbox, or a sandbox site on a cluster | It works against a real Passport and the real vendor |
| Review | The back office, by a second operator | Someone else has read it |
| Release | The back office | It is in the registry |

## 10.1 The tool

Plugin Studio runs `passport-plugin` for you. It is the same engine code the
server uses, so what it accepts is what the server accepts.

| Command | Does |
|---|---|
| `passport-plugin check <folder>` | Loads the project and reports every problem, with file and line. Exit code 1 if there are any |
| `passport-plugin build <folder> [--registry owner/name[@branch]]` | Builds the package the way a release does: references pinned, dependencies copied in. A plugin with dependencies needs `--registry` to fetch them |
| `passport-plugin run <folder> --automation <key> [--case <name>]` | Dry-runs an automation with a test case. With dependencies, give `--registry` as for `build` |
| `passport-plugin run <folder> --channel <name> [--case <name>]` | Dry-runs a channel |
| `passport-plugin run <folder> --action <name> [--case <name>]` | Dry-runs one plugin action |
| `passport-plugin info` | The server version the tool was built from |
| `passport-plugin reference [--actions\|--functions\|--events\|--schemas] [--json\|--md]` | The built-ins, with inputs, outputs and effect |
| `passport-plugin spec [--json]` | The JSON Schemas for every v2 file kind and for the field schema |

Add `--json` to `check` and `run` for output a program can read.

`check` reports, among others:

- an unknown key, anywhere;
- a reference that does not resolve, or a version that disagrees with its
  file name;
- a `with:` value that does not fit the action's input schema;
- a form schema that leaves the form subset, an unknown format or `ui` key,
  a layout naming a missing field or a row wider than 12;
- a setting, field or step that is read but not declared, and (as warnings)
  one that is declared but never read;
- an `http.*` address whose host is not in `allowed_hosts`;
- a channel that never tests `trigger.action` for `delete`;
- a form field without a `title` (warning).

## 10.2 Test cases

Test cases live in `tests/`, one file per automation, channel or action,
named after it. They are never shipped.

```yaml
# tests/new-subscriber.yaml
cases:
  - name: New paid subscriber
    settings: { client_id: "0123456789abcdef0123456789abcdef" }
    secrets: { api_key: test }
    automation:
      settings: { list_id: "aaaabbbbccccddddeeeeffff00001111", resubscribe: false }
    trigger:
      type: user.subscription.status.active
      user_id: "user_01"
      body: { status: active, subscription_id: "sub_01", plan_id: "plan_01" }
    samples:
      steps:
        user: { user: { id: "user_01", login: "ana@example.com", profile: { name: "Ana" } } }
      actions:
        http.post: { status: 201, body: "ana@example.com" }
    expect:
      status: success
      steps:
        add: { outputs: { email: "ana@example.com", created: true } }
```

| Key | Meaning |
|---|---|
| `name` | Shown in the Test panel and used by `--case` |
| `settings`, `secrets` | The plugin's, for this case |
| `automation.settings`, `automation.secrets`, `automation.label` | The automation's own (automation tests) |
| `channel.settings`, `channel.secrets`, `channel.name`, `channel.label` | The channel's own (channel tests) |
| `trigger` | What starts the run. For a channel: `{ action, distribution_id, user_id }` |
| `inputs` | For a manual run or an action |
| `fields`, `distribution`, `article` | For a channel: the distribution form's values, the distribution, and the article its followed defaults read |
| `samples.steps.<id>` | The outputs that step returns instead of running. Only the run's own steps, never steps inside a plugin action. A step that runs a plugin action may be sampled this way too; the action's own steps then do not run. For a step inside a loop, give a list: one entry per pass, the last repeated if the loop runs longer |
| `samples.actions.<action>` | The outputs every step running that action returns, unless it has its own sample. Built-in or plugin action; steps inside a plugin action are reached this way (`samples.actions.http.post`). Give a list to answer successive calls differently: one entry per call in the order they happen, the last repeated |
| `expect.status` | `success` or `failed` |
| `expect.reason` | For a failed run: text the failure reason must contain |
| `expect.outputs` | Values the run's outputs must have. Only the keys you list are compared |
| `expect.steps.<id>.outputs`, `expect.steps.<id>.status` | The same for one step; `status` is `ok`, `skipped` or `error` |
| `expect.not_run` | A list of step ids that must not have run (a publish step in a preview, say). A step skipped by its `if:` counts as not run. Steps inside a branch, a loop or a plugin action are named by their own id |

**What runs for real in a dry run:** `set-output`, `vars.set`, `log`,
`transmute`, `workflow.exit`, `workflow.fail`, every expression and function,
every branch and loop, every plugin action's own steps, and schema
validation. **What is sampled:** every other built-in. A step with no sample
fails the case and tells you which sample is missing, so nothing is silently
skipped.

`http.*` is sampled by default. `--live-http` lets it really call the hosts
in `allowed_hosts`, which is useful once, with a real key in `secrets`, to
capture what a vendor actually returns. Keys in test files are never real;
the tool refuses to push a `tests/` file whose `secrets` look like live keys.

In Plugin Studio the **Form** tab shows each form as the publisher will see
it, and the **Test** panel builds a case by filling those forms in: plugin
settings, the automation's or channel's settings, then inputs or the
distribution form against a sample article. A sample trigger body is offered
from the event's schema.

## 10.3 On a sandbox

A dry run proves the logic. A sandbox proves the integration.

- **Passport desktop** runs a whole Passport on your Mac. Plugin Studio finds
  it and installs your draft on it directly.
- **A sandbox site on a cluster**, through the back office, when you need
  something the desktop cannot do (real mail delivery, a public webhook
  address).

A draft installs only on a site marked as a sandbox. From the Studio: choose
the sandbox, **Install draft**, fill in the settings forms as a publisher
would, add the automation or channel, run it and read the run log. Schema
checks are errors on a sandbox, as in a dry run.

Before you push for review, on a sandbox:

1. Fill in every settings form from empty. Is every label and hint enough
   without reading the code?
2. Run every automation at least once from its real trigger.
3. For a channel: publish, republish (nothing duplicated), preview (nothing
   created), delete (nothing left behind).
4. Put a wrong API key in. Is the failure message something a publisher can
   act on?
5. Run "Test connection".

A run on the desktop sandbox is filed against the exact package it tested, so
the reviewer sees what was tried.

## 10.4 Review

**Push for review** in Plugin Studio sends the plugin's files to the back
office. It checks and builds them again, so a project with problems is
refused with the same problems the Studio lists.

- A push goes to a **change**: one piece of work on one plugin. Start one
  with a line saying what it is for, or push again to the one you started.
- Two people can work on one change: one pushes, the other uses **Pull into
  my copy**.
- A push is refused if the plugin was released since you started. Get the
  release, re-apply your work, push again.
- A second operator opens the change, reads each file that differs from the
  last release, opens the files in their own workspace to try them if they
  want, and **approves** or **sends it back** with a note. You cannot approve
  your own change.

What a reviewer looks for:

- Does it do what the change says, and nothing else?
- Every host in `allowed_hosts` is needed and is the vendor's.
- Credentials are `secret: true`, never logged, never put in an output.
- Destructive steps (`asset.delete`, `entitlement.delete`, a vendor delete)
  are reachable only from where they should be.
- A channel cannot publish from a preview, and does not duplicate on
  republish.
- Forms read well to someone who has never seen the vendor's API.
- Versions were bumped honestly: a breaking change is a new major file.

## 10.5 Release

An approved change is released from Plugin Studio's Changes window or from
the back office. The operator says what kind of release it is:

| Choice | Plugin version |
|---|---|
| A fix | 1.2.3 to 1.2.4 |
| Something new | 1.2.3 to 1.3.0 |
| A breaking change | 1.2.3 to 2.0.0 |

The back office builds the package, writes the plugin's source and the built
release to the registry, and adds the version to the index. Nothing else
writes to the registry.

A release is immutable. Publishers on a compatible server see the new
version on the plugin's page and choose when to upgrade. On upgrade, each
automation and channel they added is re-applied from the new version; one
whose saved settings no longer satisfy its form is disabled and flagged until
they fix it. That is why a breaking change to a form is a new major file
beside the old one ([1.3](01-project-and-manifest.md#13-versions)).

A release that turns out to be bad is **withdrawn** in the back office: it
stops being offered, and sites that have it are shown that it was withdrawn.
Fix forward with a new release; versions are never reused.
