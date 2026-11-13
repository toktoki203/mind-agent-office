# MinD Agent Office V3 — Full-screen Pixel RPG + Work handoff

## What exists in this branch
- 7 roles defined in `src/crew-v3.mjs` and 7 per-role skill folders under `skills/`.
- `index.html` is a fullscreen canvas, with room boundaries, workstation furniture, monitor displays, walk/idle procedural sprite animations, interactive characters and an in-world Mission Board. It has no sidebar or fixed site menu.
- Drag/pan the office; mouse wheel zoom; click people or the Mission Board. Dialogs are contextual and may be closed with Escape.
- `src/mission-v3.mjs` routes briefs and preserves deterministic stage dependencies. It does not call AI or generate pretend outputs.
- Stages only finish after the user enters actual results produced by ChatGPT Work or another explicitly approved process. Work handoff prompts can be copied from each stage.

## Mission routing
Nova intake → Ivy research → Momo and/or Lumi and/or Byte → Ada verification → Kai report → Nova final review. All stages have explicit dependencies. Byte only appears when an engineering action is actually needed. Ana's QA checks must use actual evidence, not arbitrary scores.

## Limits / security
- This branch does not implement 'Sign in with ChatGPT' or use the user's account credits as a website inference backend. Those are separate platform capabilities requiring eligible integration.
- No API keys, cookies, hidden model endpoints, background claims or user data sent off-device by this frontend.
- User-created missions remain in localStorage on the current browser only. They are not cross-device and are not designed for confidential work material.
- This is a no-API, manual Work-handoff build; on-screen characters animate independently of actual model execution.

## Follow-on verification
Run `npm test`, `npm run check` and in-browser desktop/mobile smoke tests. Stage output acceptance currently checks presence/length and remains a user acknowledgment; it is not independent AI QA.
