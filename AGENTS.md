# MinD Agent Office V3 — Instructions for ChatGPT Work / Coding Agents

## Product contract
- The entire viewport is the Pixel RPG office map. No fixed sidebar, top navigation, page switcher or dashboard layout.
- Seven visible animated characters: Nova/BD, Ivy/Research, Momo/Content, Lumi/Media, Ada/Optimize, Byte/Dev, Kai/Report.
- Click/press on people for character skill and mission profile; click the in-map MISSION board for creating and tracking tasks. Contextual popups are permitted.
- Moving pixel characters represent game states, not evidence of ongoing AI inference.
- Do not regress into static avatar cards or an office illustration as the entire UI.

## AI & credits boundary
- Do not call OpenAI API or embed API keys in the website. Do not use browser cookies, bearer tokens, session credentials or any hidden chat protocol to bypass account restrictions.
- A standalone GitHub/Vercel site is not entitled to the user's ChatGPT subscription credits/model access.
- ChatGPT Work can execute prompts through its own authorized environment. Website should generate stage prompts and accept the real resulting content, leaving tasks queued until verified; no fake auto-completion.
- Do not claim background autonomous processing without a real supported orchestration runtime.

## Skills
Use `skills/office-orchestrator/SKILL.md` for routing and `skills/<role>/SKILL.md` for specialist behavior. The source registry lives in `src/crew-v3.mjs`; the immutable planning flow lives in `src/mission-v3.mjs`. Keep them consistent.

## QA
Run `npm test` and `npm run check` before claims of code completion. Verify actual rendered game and touch navigation separately using browser tools. Preserve local storage; don't mislabel sample state as live AI output. Never merge changes solely because a build was created.
