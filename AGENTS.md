# AGENTS.md

This repo holds Passport workflow building blocks: blueprints (`blueprints/`),
packages (`packages/`), recipes (`recipes/`), external actions (`actions/`),
webhook validators and event schemas (`schemas/`). They run on the workflow
engine in the `atomic` repo.

Before writing or changing a workflow, blueprint, recipe or package, read:

1. [AUTHORING.md](AUTHORING.md) — every building block (triggers, step kinds,
   actions, expression functions, admin contracts and editor hints), the
   patterns that combine them, the gotchas, and a checklist.
2. [BUILTINS.md](BUILTINS.md) — inputs and outputs of each builtin action, and
   each expression function with examples.
3. `atomic/docs/WORKFLOW.md` (sibling `atomic` repo) — the engine's full
   reference, when AUTHORING.md and BUILTINS.md don't answer it.

Rules:

- Keep integration logic in YAML. Use the generic builtins; if one is missing,
  propose a generic engine addition instead of integration-specific code.
- Keep a blueprint's top-level `inputs` and `definition.inputs` identical.
- Copy an existing blueprint that does something similar (AUTHORING.md lists
  reference implementations) rather than starting from scratch.
- Update the blueprint's README, the package manifest and the root README's
  catalog when you add or change a blueprint.
