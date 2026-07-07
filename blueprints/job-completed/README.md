# Job Completed

React to background jobs finishing. This blueprint triggers on the **`job.completed`**
event, whose body is the completed [Job](../../schemas/atomic/job.yaml). Use it to run
follow-up work when a specific kind of job finishes — rebuild a feed after an audience
build, notify an operator, kick off a downstream sync, and so on.

As shipped it is scoped to **audience builds** as a worked example. Change the trigger
filter to target whatever job type you care about, or remove it to react to every
completed job.

## When it fires

`job.completed` is emitted once for **every** background job that finishes
successfully (failed jobs emit `job.failed` instead). Because that is a high-volume
event, you almost always want to narrow it to a single job type with a trigger filter
— see below.

## The event body (the Job)

The trigger body is the Job document. The most useful fields:

| Field | Type | Notes |
|---|---|---|
| `type` | string | The job type, e.g. `audience:build` — filter on this |
| `id` | uuid | The job id |
| `group_id` | uuid | Correlates related jobs (e.g. all builds in one run) |
| `status` | string | Terminal status |
| `params` | object | The job's input parameters |
| `state` | object | The job's result/state |
| `artifact_id` | uuid | Produced artifact, when the job creates one |
| `created_at` / `completed_at` | date-time | Timing |

Reference these in steps as `${{ trigger.body.<field> }}` (e.g.
`${{ trigger.body.artifact_id }}`).

## Filtering by job type

The trigger uses a **trigger-level `if:` filter**, evaluated against the event body
_before a run is created_ — so no run is spawned for jobs that don't match, keeping the
workflow cheap even though `job.completed` is noisy:

```yaml
on:
  - event:
      name: job.completed
    if: body.type == "audience:build"   # only audience builds
```

Notes:

- The filter runs against the **event body** — reference fields bare (`body.type`),
  not `trigger.body.type`, and **not** `inputs.*` (inputs aren't available at dispatch
  time; the filter runs before the run exists).
- To react to more than one type, combine with `||`:
  `if: body.type == "feed:build" || body.type == "feed:rebuild:all"`.
- Delete the `if:` entirely to react to **every** completed job.

### Common job types

| `body.type` | Job |
|---|---|
| `audience:build` | Rebuild an audience |
| `audience:refresh` | Refresh audience membership |
| `feed:build` / `feed:rebuild:all` | Build / rebuild feeds |
| `feed:expire` | Expire stale feed entries |
| `distribution:publish` | Publish a distribution |
| `distribution:summary` | Distribution summary rollup |
| `subscription:summary` | Subscription analytics rollup |
| `subscription:expiring` | Emit expiring-subscription events |
| `stripe:subscription:sync` | Sync subscriptions from Stripe |
| `user:import` / `user:export` | Bulk user import / export |
| `email:notification` | Batched email notifications |
| `workflow` | A workflow run |

(Run `job.completed` unfiltered once and inspect `body.type` in the run detail to
discover the exact types your instance produces.)

## What it does

The shipped `steps` simply log the completion:

```yaml
steps:
  - id: log-completion
    action: log
    with:
      message: "Job completed: type=${{ trigger.body.type }} id=${{ trigger.body.id }}"
```

Replace or extend this with whatever should happen next — e.g. `sendmail` to alert an
operator, `http.post` to a webhook, or `event.emit` to fan out to other workflows.

## Requirements

- None beyond the event itself. `job.completed` is emitted automatically by the
  platform, so no secrets or inputs are required unless the steps you add need them.

## Customizing

1. Set the trigger `if:` to the job type you care about (or remove it).
2. Read the fields you need off `trigger.body`.
3. Swap the `log` step for your follow-up action(s).
