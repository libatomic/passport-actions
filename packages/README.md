# Integration Packages

A **package** groups related blueprints into a single installable integration.
Where a blueprint creates one workflow, a package installs a set of workflows
that work together — e.g. a vendor integration made of several event triggers,
webhooks, and custom channels.

Packages are browsed and installed from the admin app's Workflows page through a
guided installer: it prompts for the secrets the blueprints reference, walks each
blueprint (enable? + input values, carried forward between blueprints sharing a
key), and merges detected `http.*` hosts into the instance allowlist. Workflows
the admin enables are live immediately; declined ones install disabled. Every
created workflow is tagged with `metadata.package = <package name>` and
`metadata.blueprint_source = <blueprint path>` so the set stays identifiable.

No manifest change is needed for the installer — required secrets, inputs, and
hosts are all **derived** from the blueprint/recipe YAML (`${{ secrets.NAME }}`
references, the `inputs:` block, literal `http.*` URLs). A future optional
`hosts:` manifest field could pre-declare hosts the client cannot detect
(templated URLs).

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

# Optional: external fields the workflows expect to exist before enabling —
# e.g. custom fields that must be created on the vendor's side (for Campaign
# Monitor, on the list). `set_by` / `cleared_by` reference the blueprints
# above; a trailing `*` in a key denotes an operator-defined family of fields.
custom_fields:
  - key: PassportUserID
    type: Text
    set_by: [cm/new-subscriber]
    description: The user's Passport ID
```

## Conventions

- Blueprints referenced by a package live under a vendor directory
  (`blueprints/<vendor>/…`) and remain individually installable.
- Blueprint paths follow the folder-major convention: the blueprint root is v1;
  a breaking revision lives in a version folder and is referenced as e.g.
  `fb/page-post/v2`.
- List shared prerequisites (secrets like `CM_API_KEY`, http allowlist hosts)
  in the package description — the installer surfaces it before installing.
- A package install must be non-destructive: it creates workflows and never
  deletes existing ones. Re-installing offers an update-in-place of a workflow
  previously installed from the same blueprint, but only with the admin's
  explicit opt-in.
