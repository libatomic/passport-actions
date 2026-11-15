# 3. Schemas

A schema is a named, versioned shape of data. Use one when the same shape is
needed in more than one place: an action's output that an automation reads,
an input several actions share, the body of a webhook.

Everything about writing fields is in [chapter 2](02-field-schema.md). This
chapter is about schema *files* and the schemas Passport provides.

## 3.1 A schema file

```yaml
# schemas/subscriber.yaml
name: subscriber
version: 1.1.0
title: Campaign Monitor subscriber
description: One subscriber on a list, as the API returns it.
type: object
required: [EmailAddress, State]
properties:
  EmailAddress: { type: string, format: email, title: Address }
  Name:         { type: string, title: Name }
  State:
    type: string
    title: State
    enum: [Active, Unconfirmed, Unsubscribed, Bounced, Deleted]
  CustomFields:
    type: array
    title: Custom fields
    items:
      type: object
      required: [Key, Value]
      properties:
        Key:   { type: string }
        Value: { type: string }
```

| Key | Required | Meaning |
|---|---|---|
| `name` | yes | Must equal the file name without `_N` and `.yaml` |
| `version` | yes | Semver; the major must match the file ([1.3](01-project-and-manifest.md#13-versions)). A schema's first version is `1.0.0`; there is no major 0 |
| `requires` | no | [1.5](01-project-and-manifest.md#15-requires) |
| everything else | | The schema itself: JSON Schema 2020-12 with `title`, `description`, `help`, and `ui` when the schema is meant to be used as a form field (a list chooser declared once and referenced by every automation, for instance) |

A schema file is a data schema, so all of JSON Schema is allowed in it. If it
is going to be used as a **form** (as an action's `inputs`, for instance), it
must also stay inside the [form subset](02-field-schema.md#23-the-form-subset);
the check reports where it does not, at the place it is used.

Do not write `$schema` or `$id`; the name, plugin and version are the
identity.

## 3.2 Using a schema

```yaml
# whole block
outputs:
  $ref: campaign-monitor/schemas/subscriber@^1

# one property
properties:
  subscriber:
    $ref: campaign-monitor/schemas/subscriber@^1

# items of a list
properties:
  subscribers:
    type: array
    items: { $ref: campaign-monitor/schemas/subscriber@^1 }
```

`$ref` replaces the node it is on. `title`, `description`, `help`, `default`
and `ui` written beside a `$ref` override the referenced schema's own, so the
same shape can be labelled and presented differently where it is used.
Validation keywords (`type`, `pattern`, `enum`, …) beside a `$ref` are an
error: change what is valid in the schema, not at the reference.

```yaml
billing_contact:
  $ref: campaign-monitor/schemas/subscriber@^1
  title: Billing contact
```

A schema may reference other schemas. References are pinned at build, and a
cycle is an error.

## 3.3 Schemas inside an automation or channel

A shape used only within one file can live in that file, under `schemas:`,
and be referenced with `#/schemas/<name>`:

```yaml
# automations/optout-webhook.yaml
version: 1.0.0
name: Remove members who unsubscribe in Campaign Monitor
schemas:
  event:
    type: object
    required: [Type, EmailAddress]
    properties:
      Type:         { type: string, enum: [Deactivate, Subscribe, Update] }
      EmailAddress: { type: string, format: email }
on:
  - webhook: true
    foreach: Events
    schema: { $ref: "#/schemas/event" }
steps: [ … ]
```

A local schema has no version of its own; it is part of the file and changes
with the file's version. It cannot be referenced from another file. When a
second file needs it, move it to `schemas/`.

A schema may also simply be written inline where it is used, with no name at
all.

## 3.4 Event schemas

An event trigger may name the shape of the event's body:

```yaml
on:
  - event: user.subscription.status.active
    schema: { $ref: passport/schemas/user.subscription.status.active@^1 }
```

What that gives you:

- The Studio offers `trigger.body.<field>` in the variable picker and in
  completion, with each field's title and description.
- A dry run builds a realistic sample body from the schema.
- On a dry run and on a sandbox, an event whose body does not match is
  reported. In production it is a warning in the run log.

If you leave `schema` off an event trigger for a built-in event, the server's
own schema for that event at the plugin's required Passport version is used.
State it explicitly when you depend on a field that arrived in a later minor.

## 3.5 The built-in `passport` schemas

Passport's own schemas live in the server and are versioned with it. They are
referenced as `passport/schemas/<name>@<range>` and are never copied into a
package: the server a plugin runs on supplies them.

| Group | Names | In |
|---|---|---|
| Events | one per event type: `user.created`, `user.subscription.status.active`, `distribution.published`, … | [reference/EVENTS.md](../reference/EVENTS.md) |
| Records | `user`, `subscription`, `plan`, `audience`, `article`, `distribution`, `asset`, `template`, `application`, `entitlement` | [reference/SCHEMAS.md](../reference/SCHEMAS.md) |
| Stripe | the Stripe objects Passport relays in its own events | [reference/SCHEMAS.md](../reference/SCHEMAS.md) |

Built-in actions' inputs and outputs are generated from the server's code and
are listed in [reference/BUILTINS.md](../reference/BUILTINS.md).

`passport-plugin reference` prints all of them for the server version the
tool was built from. That output is what the reference folder is generated
from, and what Scout and the Studio read.

## 3.6 What to put in a schema, and what not

- **Do** describe a vendor's response once, as a schema, and give its fields
  titles. Every automation that reads it then gets completion and checking.
- **Do** keep vendor shapes as the vendor names them (`EmailAddress`, not
  `email`). Translate at the edge, in an action's `returns`.
- **Do not** make a schema for a single use; write it inline.
- **Do not** model a whole API. Model the fields you read.
- **Do not** mark a property required unless the vendor guarantees it. A
  data schema that is too strict produces warnings in every run.
