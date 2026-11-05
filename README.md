# MinD Agent Office V1.0 ✳

A lightweight, responsive **chibi-style virtual AI office** for organizing work across five agent roles. Vietnamese UI, zero runtime dependencies, and no API key needed to try the MVP.

> **Important:** The V1.0 Agents are **role profiles and task coordinators**, not autonomous AI workers. New tasks, board changes, history, and locally saved data work. The **Copy prompt** action creates an agent-specific brief for manually using ChatGPT. No AI provider, GitHub writes, email sends, background jobs, or shared database are configured in this version.

## Quick start

You need [Node.js 20+](https://nodejs.org/).

```bash
git clone https://github.com/toktoki203/mind-agent-office.git
cd mind-agent-office
npm start
```

Open **http://localhost:4173**. No `npm install`, environment variables, or external services required. If port 4173 is occupied, `PORT=4180 npm start` (Windows PowerShell: `$env:PORT=4180; npm start`).

You can also run `python -m http.server 4173` from the project folder, though the Node server is recommended.

### Quick 5-minute walkthrough

1. **Văn phòng:** Click any of the five chibi avatars to open agent profile and scope.
2. **Giao việc:** Choose **Tạo nhiệm vụ**, assign an Agent and set a priority.
3. **Bảng nhiệm vụ:** Drag a task to another column or change its status in the selector. Search and filter by agent.
4. **Prompt:** Click **Prompt** on a task to copy an Agent-specific instruction to paste into ChatGPT.
5. **Nhật ký hoạt động:** Verify create/edit/move/delete events. Refresh the page: data persists in this browser via `localStorage`.
6. **Khôi phục dữ liệu mẫu:** Use the activity page reset action; it replaces your local tasks, so back up anything important first.

## Features

- Chibi office scene: **Nova (CEO)**, **Ivy (Research)**, **Momo (Creative)**, **Byte (Developer)**, **Kai (Operations)**.
- Create/edit/delete tasks; assign/transfer across agents; set priority and 4 Kanban statuses.
- Drag & drop on desktop; status dropdown works on touch devices.
- Task search, agent filter, mini dashboard, activity timeline, prompt-copy workflow.
- Responsive mobile navigation and keyboard-accessible controls.
- HTML/CSS/ES modules; original SVG avatars; no assets from external AI services.
- Sample tasks are **illustrative**, not evidence that the Agents have performed the work.

## Architecture & safety

Read [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). The MVP is static, with `src/data.mjs` defining roles and demo data, `src/domain.mjs` containing pure task/state actions, `src/avatars.mjs` defining editable SVG character art, and `src/app.mjs` handling UI/events and local persistence.

- No user authentication or multi-user collaboration.
- Local browser storage is **not** a secure database; **do not store confidential work data** in this demo.
- No OpenAI API calls, no Google Workspace integrations, no automatic execution.
- Do not commit credentials. The future AI service must run on a secure server with permissions and approval gates.

## Quality checks

```bash
npm run check
npm test
```

A GitHub Actions workflow runs these checks on push/PR.

## Deployment

To share a preview, deploy this repository as a **static website** on a hosting provider that can serve ES modules with correct MIME types. For example, in Vercel choose framework **Other**, leave build command unset, and publish the repository root as the static output. Do not claim there is a live URL until the provider confirms deployment.

---
Built for MinD Agent Office. V1.0 — task management foundation, not an autonomous agent platform yet.
