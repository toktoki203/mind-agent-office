# Architecture · MinD Agent Office

## V1.0 (implemented)

```text
Browser
  index.html + src/styles.css
  src/app.mjs         ← UI, event delegation, drag/drop, prompt copy
  src/avatars.mjs     ← original chibi SVG character renderer
  src/domain.mjs      ← validation + task CRUD + audit event functions
  src/data.mjs        ← 5 agent profiles + demo seed
  localStorage        ← per-browser persistence (no sync)
```

### Entities

- `Agent`: id, name, title, group, capabilities, promptRole, avatar style metadata.
- `Task`: id, title, description, agentId, status (`todo` | `progress` | `review` | `done`), priority, createdAt, updatedAt.
- `Activity`: id, at, agentId, label, detail, kind; records local UI actions.
- `Workspace`: schema, tasks[], activities[]; seeded on first load.

**State ownership:** `domain.mjs` owns validation and immutable state updates; the view calls domain actions and persists results. The activity timeline is a local UI action history (not immutable enterprise audit logging).

### Boundaries and limitations

- All 5 Agents are **static professional personas**. They are not models, autonomous workers, or background services.
- All demo tasks and demo activities are **seed data**.
- A copied prompt is a **manual handoff** to ChatGPT, not a completed Agent execution.
- No secret credentials, network mutations, server access, user accounts, multi-device sync, enterprise data isolation, notification delivery, or approval execution exists in V1.0.
- Avoid storing business-sensitive information in `localStorage`; the MVP has no application-level encryption or role permissions.

## V2.0 (proposed, NOT implemented)

```text
Authenticated Web App (role-based access)
            │ HTTPS
       Backend API
            │
    ┌───────┼───────────┬──────────────┐
    │       │           │              │
 Task DB   Agent       Approval      Event / Job
 + Audit   Orchestrator Service      Queue
            │           │              │
      OpenAI API      Human review   Schedulers
            │
         Tools layer: GitHub / Google Workspace / Search
```

### Execution flow (future)

1. User submits a task with expected output, model budget, and assigned Agent.
2. Backend authenticates user and validates tool permissions, scopes, and budgets.
3. Agent orchestrator generates an execution plan with explicit tool grants.
4. Read-only research may run; external writes (email, publishing, merging code, destructive actions) require human approval and an idempotent action token.
5. Server records traces, outputs, status, cost, errors and an immutable approval log.
6. Only after a successful tool response should task status become `done`.

### Recommended implementation order

- V1.1: repo-linked CI + visual QA, export/import JSON and test coverage.
- V2.0: authentication + Postgres backend + audit trail + real-time state updates.
- V2.1: scoped OpenAI Responses API orchestration for one Agent; prompt-injection safeguards, server-only secrets, usage limits.
- V2.2: GitHub/Drive tools with per-action approvals and service-account policy.
- V3.0: cross-agent delegation, queueing, recurring schedules, monitoring and notifications.

### Deployment guardrails

Keep the GitHub repository private; do not commit API keys. Use a server-side secret manager for any future LLM keys. Review CORS, auth, rate limits, input validation, retention and tenancy before letting the platform access private company data.
