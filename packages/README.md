# Integration Packages

A **package** groups related blueprints into a single installable integration.
Where a blueprint creates one workflow, a package installs a set of workflows
that work together — e.g. a vendor integration made of several event triggers,
webhooks, and custom channels.

Packages are browsed and installed from the admin app's Workflows page. Installing
creates one workflow per blueprint, **disabled** — the admin reviews, configures
inputs/secrets, and enables each deliberately. Every created workflow is tagged
with `metadata.package = <package name>` so the set stays identifiable.

## Layout

```
packages/
  <name>/
    package.yml
```

## Manifest format (`package.yml`)

```yaml
name: campaign-monitor            # unique key; stamped on installed workflows
label: Campaign Monitor           # display name
icon: https://…                   # card icon
category: integrations            # optional grouping hint
description: |
  What the package does as a whole, plus any shared prerequisites
  (secrets, allowlisted hosts, inputs).

# Blueprint directories (relative to blueprints/) installed by this package.
blueprints:
  - cm/new-subscriber
  - cm/subscription-canceled
```

## Conventions

- Blueprints referenced by a package live under a vendor directory
  (`blueprints/<vendor>/…`) and remain individually installable.
- List shared prerequisites (secrets like `CM_API_KEY`, http allowlist hosts)
  in the package description — the installer surfaces it before installing.
- A package install must be non-destructive: it only creates workflows, never
  modifies or deletes existing ones.
