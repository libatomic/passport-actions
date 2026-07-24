# GitHub Action blueprints

These blueprints call **published GitHub Actions** directly from a workflow via
`uses:` — the same actions you'd put in a CI pipeline, running inside the
Passport workflow engine. They're the escape hatch for integrating a service
that has a good Action but no first-party Passport recipe.

| Blueprint | Action | Purpose |
|---|---|---|
| [`slack-notify`](slack-notify/) | `slackapi/slack-github-action@v2` | Post to a Slack channel when a distribution publishes |
| [`twilio-sms`](twilio-sms/) | `twilio-labs/actions-sms@2.0.0` | SMS alert when a subscription is canceled |
| [`sendgrid-mail`](sendgrid-mail/) | `mmichailidis/sendgrid-mail-action@v1.2` | Send mail through SendGrid |
| [`ai-inference`](ai-inference/) | `actions/ai-inference@v2` | Generate text with a GitHub Models LLM |

## How `uses:` steps work

```yaml
- id: notify
  uses: slackapi/slack-github-action@v2
  with:
    method: chat.postMessage
    token: ${{ secrets.SLACK_BOT_TOKEN }}
```

- **Supported runtimes**: JavaScript (`node20`/`node22`/`node24`) and
  `composite` actions. **Docker actions are not supported.**
- **Pin a version** (`@v2`, `@2.0.0`). A bare `owner/repo` resolves to the
  default branch and can change under you.
- The step editor's **Validate** button fetches the action's `action.yml` and
  reports whether its runtime is supported — use it before saving.
- **Private action repos** need a `gh-token` on the step; public ones don't.
- Outputs land on `steps.<id>.outputs.<name>`, matching the action's declared
  outputs.

## Recipes vs GitHub Actions

Prefer a [recipe](../../recipes/) when one exists: recipes are versioned in this
repo, declare typed inputs that render properly in the step editor, and don't
depend on a third party's release habits. Reach for `uses:` when the integration
only exists as an Action, or when you're prototyping.

## Shared requirements

Each blueprint needs its own secret(s) — see its README. GitHub Actions are
fetched from **github.com**, and most of them then call their own vendor API, so
check the individual blueprint for the hosts to allow.
