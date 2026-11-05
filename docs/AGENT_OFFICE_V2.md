# MinD Agent Office V2.0

## Run
Open `index.html` for a self-contained, explicitly-labelled **Demo**. Demo does not access AI or the web. To run live AI: set `OPENAI_API_KEY` and `AGENT_OFFICE_ACCESS_KEY` as **server-only** environment variables in your Vercel project, redeploy and select **AI thật (API)** in the UI. Enter your Office Access Code in the UI. Use a supported OpenAI API model, optionally configured via `OPENAI_MODEL` and `OPENAI_RESEARCH_MODEL`. API usage incurs separate charges.

To run locally, use Node 20+ and `npm start`. Without secrets you can use Demo, but Live AI is disabled.

## Workflow and skillset

- Nova: mission intake, strategy, delegations, dependencies, quality review.
- Ivy: web research, evidence, source verification, gaps. Uses OpenAI Responses API `web_search` in live mode.
- Ada: business analysis, problem statement, pain points, user stories, KPI, acceptance criteria.
- Nova plans 1-3 relevant executors using a validated JSON task assignment.
- Momo: creative, UX, storytelling, brand.
- Byte: technical architecture, code drafts, testing plans.
- Kai: process, operations, SOP, risk.
- Nova reviews final outputs and generates mission report.

UI includes six chibi agents, per-agent skillset, mission inbox, live progress, handoff log, task board, per-stage outputs, source links, report export to MD/JSON.

## Limits

This version is a **browser-driven multi-agent workflow**: the browser must remain open; no durable background job processing or retries. Agent outputs are persisted only to the browser localStorage, which is not suitable for business-confidential materials. Each API step is read-only; no automatic GitHub writes, email sends, website publishing, or modifications to other apps. An Access Code is only a temporary MVP gate, not enterprise authentication. Before broader rollout add SSO, per-user rate limits/quotas, server-side database and job queue, audit logging, human approval for writes and robust prompt-injection protection. An external API call is never considered successful until it responds.

## Validation

Run `npm run check` and `npm test`. There is a Vercel function at `api/agent.js` and an identical route in the local Node server.
