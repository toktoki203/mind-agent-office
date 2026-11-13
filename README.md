# MinD Agent Office V3 — Fullscreen Pixel RPG

**Full viewport = the office game world.** No sidebar or top navigation. Seven interactive characters inhabit the office: Nova (BD), Ivy (Research), Momo (Content), Lumi (Media), Ada (Optimize), Byte (Dev), Kai (Report).

Open `index.html` in a modern browser or run `npm start`. Click a character to inspect their scope and task, or click the pixel **MISSION BOARD** at the top center of the game to submit a brief. Pan by dragging and zoom with the mouse wheel. Work stages are written to browser localStorage.

**No OpenAI API is called by this V3 interface.** Mission routing and character movement are local; no false AI response or simulated output is marked complete. Use each stage's **Copy prompt for ChatGPT Work** action to run the actual task in your authorized ChatGPT Work session, then paste verified results back into the game. ChatGPT account credits cannot be used automatically by a standalone deployed website without an officially supported integration. This prototype does not assume such permission or use cookies/session-token hacks.

- Agent roster and pixel positions: [src/crew-v3.mjs](src/crew-v3.mjs)
- Mission routing and dependency engine: [src/mission-v3.mjs](src/mission-v3.mjs)
- Seven character skills: [skills/](skills/) and [AGENTS.md](AGENTS.md)
- Product / technical scope: [docs/PIXEL_RPG_V3.md](docs/PIXEL_RPG_V3.md)

**Verification:** `npm test` and `npm run check`. Browser smoke verification for desktop/mobile is additionally required. Legacy `api/agent.js` remains in the repository for V2 compatibility but is not invoked by V3.

---

# MinD Agent Office V2.0 ✳

Mission-driven chibi AI Office with **six specialized roles** (Nova CEO, Ivy Research, Ada BA, Momo Creative, Byte Developer, Kai Operations).

**Input a natural-language mission** → Nova intake → Ivy web research → Ada pain points & requirements → Nova plans and delegates → specialist agents produce deliverables → Nova QA and final report.

### Try it immediately

Open `index.html` directly in your browser and choose **Demo mô phỏng**. The demo displays six animated chibi agents, each skillset, real-time workflow statuses, handoff logs, Task Board, stage outputs and Markdown/JSON export. **Demo responses are scripted examples, not AI research.**

### Enable live AI

Set these **server-only environment variables** in Vercel: `OPENAI_API_KEY` and `AGENT_OFFICE_ACCESS_KEY`. Redeploy and choose **AI thật (API)** in the UI, then enter your access code. You can optionally set `OPENAI_MODEL` and `OPENAI_RESEARCH_MODEL` (default `gpt-5-mini`). This mode uses the OpenAI Responses API, with hosted web search for Research and separate API charges.

Local preview: Node.js 20+ → `npm start` → `http://localhost:4173`. Run `npm run check` and `npm test`.

### Current scope

This is an **interactive browser-driven orchestration MVP**, not an always-on autonomous workforce. Your browser must stay open during execution. Agent outputs are saved in your browser only, not an enterprise DB. Agents can research and create deliverables as text, but **cannot commit to GitHub, publish, email, or edit external tools**. Do not put confidential work data in this MVP. The shared access code is not a replacement for authentication. Add secure identity, task queue, database, role/tool permissions, quotas and approval before production use.

See [V2 deployment and workflow documentation](docs/AGENT_OFFICE_V2.md).

---

## Previous V1.1 reference

# MinD Agent Office V1.1 ✳

An interactive **chibi-style AI Office** with five specialist roles, task board, request inbox, role policies, message histories, and an **optional** secure-side OpenAI Responses API endpoint.

**Read the mode labels carefully:** the default **Offline** responses are deterministic checklists derived from agent rules. They are **not AI analysis** and do not research the web or execute tasks. Genuine model replies require a configured Vercel backend, OpenAI API key and an access code. The API offers **text answers only**; Agents cannot send mail, edit GitHub or take other external actions.

## Start the MVP locally

```bash
git clone https://github.com/toktoki203/mind-agent-office.git
cd mind-agent-office
npm start
```

Open **http://localhost:4173**. You need Node.js 20+; there are no runtime dependencies and no `npm install` step. The built-in server serves only the UI assets; it does **not** run the `/api/agent` Vercel Function locally.

## Try the request workflow

1. Click a **chibi Agent** in the office and choose **Gửi yêu cầu**; alternatively use **Yêu cầu Agent** in the left menu.
2. Choose Nova, Ivy, Momo, Byte or Kai. The right column displays the **mission, four-step process, expected output, limits and common policies**.
3. Enter a specific request and select **Gửi yêu cầu** (or Ctrl+Enter). You'll see your message and the **Offline checklist** reply.
4. Follow up in the same conversation; choose another Agent or click a recent conversation to see its history.
5. From a Kanban card click **Yêu cầu** to prefill the request with the task. **Tạo nhiệm vụ** remains separate from actual Agent execution.
6. **Sao chép brief** copies agent rules and request context for manual use in ChatGPT.

### Agent roster

| Agent | Responsibility | Output |
|---|---|---|
| Nova — CEO | Coordination and prioritization | Delegated action plan and approval points |
| Ivy — Research | Research methodology and evidence | Evidence register and research report outline |
| Momo — Creative | Campaign ideas and brand story | Concepts and creative brief |
| Byte — Developer | Architecture and tests | Technical plan and QA checklist |
| Kai — Operations | SOP and execution control | SOP, tracking and handoff checklist |

See [Agent rules](docs/AGENT_RULES.md) for detailed boundaries.

## Deploy to Vercel + enable real AI replies

1. Open [Vercel New Project](https://vercel.com/new), import `toktoki203/mind-agent-office` (private repo must be granted access), select **Framework: Other**, **Root: `./`**; use the checked-in `vercel.json` settings.
2. Deploy to get a preview or production URL. Without any secrets, this deploy is still fully usable in **Offline** mode.
3. To enable AI replies, add **server-side Vercel environment variables** under Project → Settings → Environment Variables:
   - `OPENAI_API_KEY`: your separate OpenAI API key, **never pasted into the web UI** or committed to Git.
   - `AGENT_OFFICE_ACCESS_CODE`: a long, unique secret you choose to restrict MVP access.
   - `OPENAI_MODEL`: optional; default is `gpt-5-mini`.
4. Redeploy. On the web app, go to **Yêu cầu Agent → Chế độ phản hồi → AI thật**, then enter only the `AGENT_OFFICE_ACCESS_CODE` in the request panel. It stays in the browser session; your API key remains server-only.
5. Send a request and confirm it is labeled **Phản hồi AI qua API**. If credentials are missing or incorrect, the app displays an explicit error and retains the unsatisfied request. No reply is fabricated.

**Important:** ChatGPT Business subscription and OpenAI API billing are separate. This access code is merely an MVP guard—not user authentication, enterprise-grade privacy, or a comprehensive rate limiter. Never enter confidential company information here before implementing user accounts, proper authentication, DB isolation, monitoring, consent and audit logs. The serverless function has an in-memory best-effort request cap (8/min per IP per instance) and no external tool permissions. <https://developers.openai.com/api/docs/guides/text>

## ChatGPT sandbox preview

A single HTML file can be generated for embedding on a ChatGPT Page or running offline. The sandbox includes the **Offline** request workflow but **cannot call** Vercel's private API unless hosted on the configured website.

```bash
python scripts/build-standalone.py
```

The standalone artifact is generated for the preview renderer, with no CDN assets, imports or API keys.

## Verification

```bash
npm run check
npm test
```

12 automated Node tests cover task CRUD, role policies, request histories, offline responses, migration from V1.0 storage, and the API's validation/access controls. A browser smoke test also verified the UI on 1365px and 390px layouts.

## Storage and permissions

- All task and conversation content resides in **your browser's localStorage**; if sandbox storage is blocked, it persists only for the current page session. There is no shared database or cross-device sync.
- `AGENT_OFFICE_ACCESS_CODE` is held in `sessionStorage` in the Vercel browser and sent only to `/api/agent`; do not reuse a company password.
- The demo contains illustrative starter tasks, not evidence of real Agent work.
- Do not allow autonomous external actions without explicit human approval, scoped permissions and independent event logging.

[Architecture](docs/ARCHITECTURE.md) · [Agent charter](docs/AGENT_RULES.md)
