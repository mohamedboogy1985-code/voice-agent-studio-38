# OmniAgent AI Command Center — Product and Technical Plan

## 1. Honest architecture boundary

A web app running in a browser tab is sandboxed. It cannot click other windows, open local files without a file picker, run programs, change Windows settings, or drive Excel/Word. Controlling the PC needs a separately installed Windows companion app that the user installs, pairs with their account, and grants specific permissions.

```text
+---------------------------+        secure channel        +-----------------------------+
|  Web Command Center       | <--------------------------> |  Cloud (Lovable Cloud)      |
|  (browser, this app)      |   (auth, tasks, audit sync)  |  auth, task queue, audit,   |
|  voice UI, plans, review  |                              |  AI gateway, pairing codes  |
+---------------------------+                              +-------------+---------------+
                                                                         | outbound WSS only
                                                                         v
                                                           +-----------------------------+
                                                           | Windows Companion (Electron |
                                                           | + local service, signed)    |
                                                           | tool runtime, permissions,  |
                                                           | sandbox, local kill switch  |
                                                           +-----------------------------+
```

### Works in the browser alone
- Voice input/output (Web Speech API or cloud speech), Arabic/English, RTL.
- Orchestrator chat, planning, clarifying questions, progress tracking.
- Research and summaries through server-side web fetch/search (not the user's own browser).
- Creating files to download: .xlsx, .docx, .pptx, .pdf, code (generated in the cloud or in the browser).
- App/workflow generation as specs, code, or cloud automations (scheduled jobs, webhooks).
- Agent configs, version history (Draft/Staging/Production), audit log viewer, approvals queue.

### Needs the Windows companion
- Listing/moving/opening windows, launching apps, reading or writing local files.
- Changing Windows settings (volume, display, Wi-Fi, default apps) through approved APIs.
- Editing documents inside installed Office apps (COM / Office JS add-ins) and code editors.
- Driving the user's real browser (logged-in sessions) via Playwright/CDP on a dedicated profile.
- Saving downloads to disk, quarantine and scanning.
- Offline wake word and lowest-latency voice interruption (optional).

## 2. Agents

| Agent | Role | Runs where |
|---|---|---|
| Orchestrator | Understands the request, asks clarifying questions, splits it into steps, delegates, tracks progress, reports by voice | Cloud + web |
| Desktop Agent | Windows, apps, files, settings | Companion |
| Browser Agent | Research, navigation, data extraction, safe downloads | Cloud (public web) or companion (user's browser) |
| Artifact Agent | Create/edit Excel, Word, PowerPoint, PDF, code | Cloud (new files) or companion (edit inside programs) |
| Builder Agent | New apps and workflow automations | Cloud |

Each agent has a narrow tool list. The orchestrator can only call agent tools; agents cannot call each other directly.

## 3. Secure pairing flow
1. User signs in to the web app, opens "Devices", clicks "Pair a PC".
2. Cloud issues a one-time 8-digit code + QR, valid 5 minutes.
3. Companion (installed from a signed installer) shows the code entry; user enters it.
4. Companion generates a device key pair in Windows Credential Manager / DPAPI; public key is registered to the user's account.
5. Both sides show the device name and a short fingerprint; user confirms on the web.
6. Companion keeps one outbound WebSocket to the cloud (no open inbound ports). Every task message is signed and bound to the device.
7. Revoke from web or companion at any time; tokens rotate automatically.

## 4. Permission model
- Scopes per device, off by default: `windows.read`, `windows.control`, `apps.launch`, `files.read:<folder>`, `files.write:<folder>`, `settings.<area>`, `browser.drive`, `office.edit`, `downloads`, `shell` (advanced, disabled by default).
- File access limited to folders the user adds (e.g. Documents\OmniAgent). System folders always blocked.
- Duration: once, for this task, or always (time-limited).
- Risk levels per tool: Low (read, list), Medium (create, open), High (delete, overwrite, send, purchase, install, settings change, anything external).
- Enforcement happens in the companion, not just the cloud — a compromised cloud cannot exceed local grants.

## 5. Action preview and confirmation
- Every plan is shown as steps before running: tool, target, risk level.
- High-risk steps pause for confirmation: on-screen card with diff/preview (file changes, email text, settings old -> new) and a spoken summary. Voice "yes" is accepted only for Medium; High requires a click or a spoken confirm phrase plus on-screen tap.
- Dry-run mode for whole tasks.
- Deletes go to the Recycle Bin or an undo folder; overwrites keep a backup copy.

## 6. Download sandbox / quarantine
- All downloads land in a quarantine folder with Mark-of-the-Web set.
- Companion runs Microsoft Defender scan (MpCmdRun) and checks hash, file type vs. extension, size limits.
- Executables, scripts, macros and archives with executables are blocked by default; user can release one manually.
- Released files move to the chosen folder; everything is logged.

## 7. Audit log
- Append-only record: who asked, transcript, plan, each tool call, inputs/outputs (sensitive values masked), approvals, result, device.
- Stored locally on the companion and synced to cloud; filter, export CSV/JSON, replay a task timeline.

## 8. Stop, pause, interruption
- Big Stop button always visible on the web; global hotkey (Ctrl+Alt+Esc) and tray icon on the companion; spoken "stop" / "توقف".
- Stop cancels in-flight tool calls locally within ~200 ms; pause holds at the next step boundary.
- Voice barge-in: speaking while the assistant talks halts speech and listens (VAD on audio input).
- Mouse/keyboard takeover detection pauses desktop control automatically.

## 9. Language and RTL
- UI fully switchable English/Arabic with `dir="rtl"`, logical CSS properties, mirrored icons where meaningful.
- Speech recognition and synthesis per language, auto-detect option, mixed Arabic-English commands supported by the model.
- Spoken reports in the language the user used.

## 10. Suggested UI modules
1. Command Center (home): voice orb, live transcript, current plan, progress, Stop/Pause.
2. Tasks: queue, running, history, step timeline.
3. Approvals: pending confirmations with previews.
4. Agents: config, tools, Draft/Staging/Production versions with word-level diff and restore.
5. Devices: pairing, status, permissions per device, revoke.
6. Permissions and Folders: scope editor, allowed folders.
7. Downloads / Quarantine: scan status, release/delete.
8. Artifacts: generated files, preview, download.
9. Workflows: automations built by Builder Agent, schedules, runs.
10. Audit Log: search, filter, export.
11. Knowledge base, Analytics, Settings (languages, voice, hotkeys, provider status).

## 11. Prioritized roadmap

**Phase 0 — finish current web app (1–2 weeks)**
Dashboard, agents, calls, knowledge, analytics, settings, browser demo voice, version history with labels and word diff, Arabic/RTL, provider status panel.

**Phase 1 — Browser-only Command Center MVP (2–3 weeks)**
Lovable Cloud auth and database; orchestrator with clarifying questions and step plans; voice in/out with barge-in; research agent via server-side fetch; artifact agent generating downloadable Excel/Word/PowerPoint/PDF; audit log; Tasks and Approvals pages. Clearly labelled "PC control requires the companion".

**Phase 2 — Windows companion alpha (4–6 weeks)**
Signed Electron app + local service; pairing; permission scopes; Desktop Agent read-only then window/app control; allowed-folder file operations; Stop hotkey; local audit; quarantine downloads.

**Phase 3 — Programs and browser control (4–6 weeks)**
Office editing via COM/Office add-ins, PDF tools, VS Code integration; Browser Agent driving a dedicated browser profile; previews and diffs for edits.

**Phase 4 — Builder and workflows (3–4 weeks)**
Generate small apps and automation workflows, schedules, triggers mixing cloud and desktop steps.

**Phase 5 — Hardening**
Security review, code signing, auto-updates, rate limits, enterprise policies, offline wake word, telemetry opt-in.

## Technical details
- Web: TanStack Start, React, Tailwind, shadcn; server functions for AI calls through Lovable AI Gateway; no keys in browser.
- Cloud tables: devices, device_keys, pairing_codes, permissions, tasks, task_steps, approvals, audit_events, artifacts, agents, agent_versions; RLS per user; roles in a separate table.
- Companion: Electron UI + Node or .NET background service; UI Automation API for windows, PowerShell constrained endpoints for settings, Office COM, Playwright for browser; outbound WSS with signed JSON-RPC messages; local policy engine enforces scopes before any tool runs.
- Tool contract: `{ tool, args, risk, requiresApproval, dryRun }` with JSON-schema validation on both sides.
- Voice: browser Web Speech for demo; cloud speech-to-text/text-to-speech behind server functions for production; streaming for barge-in.

## Open assumptions
- Windows 10/11 only for the companion; macOS out of scope.
- Phase 0 and Phase 1 are built first in this project; the companion is a separate codebase.
