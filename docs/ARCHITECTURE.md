# Architecture · MinD Agent Office V1.1

## Working browser prototype

```text
index.html + src/styles.css + src/request-ui.css
                 │
           src/app.mjs    ← Existing office, Kanban, activity, agent drawer
                 │
         src/request-ui.mjs  ← Request inbox, agent conversations, mode selector
                 │
         src/requests.mjs    ← Role policies and immutable request functions
                 │
         src/domain.mjs      ← Task CRUD, localStorage persistence
                 │
         src/data.mjs        ← Chibi character metadata, demo tasks

  Browser localStorage: Workspace { schema:1, tasks[], activities[], requests[] }
```

### Request entity

`AgentRequest { id, agentId, title, status: pending|answered|error, createdAt, updatedAt, error?, messages: Message[] }`

`Message { id, role:user|assistant, content, mode?:offline|ai, at }`

Limits: 80 conversations, 30 messages each, 4,000 characters per user turn; 250 activity entries. V1.0 localStorage remains readable and is upgraded in memory with `requests:[]` to preserve all existing tasks. Data never syncs between browsers.

### Offline vs AI response

- **Offline:** `src/requests.mjs` generates a deterministic 4-step process outline based on the selected Agent's charter. Explicit UI badge says **not AI**; no tool calls.
- **AI:** the Vercel `/api/agent.js` Function requires `OPENAI_API_KEY` and `AGENT_OFFICE_ACCESS_CODE` secrets server-side. It validates, rate-limits (best effort), and calls OpenAI's Responses API with `store:false`. No tools are configured. Bad credentials/unconfigured backend result in a visible error, not a fake reply.

### Security

The shared access code is a private-prototype guard, not authentication. The frontend shows no OpenAI API key. Any deployment with real company data needs SSO, per-user authorization, a DB, retention controls, a robust rate-limit service, access auditing and human approvals before allowing external tool actions.

### Production development milestones

- V1.2: Vercel project and secure credentials, smoke test direct API request.
- V2.0: authentication, database, proper conversation sync and action audit trail.
- V2.1: tool scopes for read-only research, approval gateway for all external writes.
- V3.0: reliable cross-agent orchestration, queues, traceability and usage budgets.
