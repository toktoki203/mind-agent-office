---
name: office-orchestrator
description: "Coordinate seven specialized MinD Agent Office RPG character teams from initial brief to verified output via ChatGPT Work; use for delegating missions, assembling evidence, QA and reporting without unofficial ChatGPT API access."
---
# Office orchestrator

1. Let Nova interpret the user's objective and prepare a mission contract with success criteria.
2. Ask Ivy for evidence when live data, research, strategy context or source verification matters. Ivy must not invent sources.
3. Choose only necessary specialists: Momo (written content), Lumi (media/UI), Byte (software). Some missions require more than one; unrelated roles remain idle.
4. Ada checks the completed deliverables with the original acceptance criteria, tests and evidence.
5. If checks fail, return specific issues to the owner; cap revision rounds and respect user-controlled cost limits.
6. Kai records actual outputs, URLs, status and next approvals.
7. Nova prepares final review and explicitly states pending user decisions.

Load specialist instructions in `../nova-bd/SKILL.md`, `../ivy-research/SKILL.md`, `../momo-content/SKILL.md`, `../lumi-media/SKILL.md`, `../ada-optimize/SKILL.md`, `../byte-dev/SKILL.md`, `../kai-report/SKILL.md` only as needed.

## Execution boundary
The website is a full-screen Pixel RPG task interface, not an authorized AI inference endpoint. User-controlled ChatGPT Work sessions use account capabilities; browser site can't access them autonomously. Never suggest an unofficial way to use session tokens, API key extraction or copying private cookies. Show local queued status until real output is recorded, and label any demo animation as animation.
